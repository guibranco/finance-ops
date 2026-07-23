import { useState, type ChangeEvent } from 'react'
import { Check, Download } from 'lucide-react'
import {
  alert,
  alertVariants,
  btn,
  btnPrimary,
  btnRow,
  btnSecondary,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  cx,
  reconRowVariants,
  reconStatusVariants,
  statTile,
  statTileLabel,
  statTileRow,
  statTileValue,
  statusPill,
  table,
  tableWrap,
  td,
  tdFirst,
  th,
  thFirst,
  theadRow,
  toolGrid2,
} from '../../ui'

const RAW_REQUIRED_HEADERS = ['Dimension', 'Amount', 'GlEntry', 'BatchId']
const JOURNAL_REQUIRED_HEADERS = ['ACCOUNTDISPLAYVALUE', 'ACCOUNTTYPE', 'DEBITAMOUNT', 'CREDITAMOUNT', 'DESCRIPTION']
const TOLERANCE = 0.01

type CsvRow = Record<string, string>
type ReconStatus = 'match' | 'mismatch' | 'raw-only' | 'journal-only'

interface RawSummary {
  byDim: Map<string, { debit: number; credit: number }>
  byComponent: Map<string, { count: number; total: number }>
  byOperation: Map<string, { count: number; total: number }>
  batchIds: Set<string>
  rowCount: number
  totalDebit: number
  totalCredit: number
}

interface JournalSummary {
  byDim: Map<string, { debit: number; credit: number }>
  bank: { account: string; debit: number; credit: number }[]
  batchIds: Set<string>
  rowCount: number
  totalDebit: number
  totalCredit: number
}

interface ReconRow {
  dimension: string
  rawDebit: number
  jrnDebit: number
  debitDiff: number
  rawCredit: number
  jrnCredit: number
  creditDiff: number
  status: ReconStatus
}

interface ReconResult {
  rows: ReconRow[]
  issues: string[]
}

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100 }

// Splits raw CSV text into rows of raw (untrimmed) field arrays, honoring
// RFC4180 quoting (quoted fields may contain commas/quotes/newlines).
function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c !== '"') { field += c; continue }
      if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') pushField()
    else if (c === '\n') pushRow()
    else if (c !== '\r') field += c // \r is ignored; \n handles the line break
  }
  if (field !== '' || row.length > 0) pushRow()
  if (inQuotes) throw new Error('Malformed CSV: unterminated quoted field.')

  return rows
}

function rowToObject(headers: string[], cols: string[]): CsvRow {
  const obj: CsvRow = {}
  headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim() })
  return obj
}

// Small RFC4180-aware CSV parser: handles quoted fields (with embedded commas/quotes).
function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const rows = tokenizeCsv(text).filter(r => !(r.length === 1 && r[0] === ''))
  if (rows.length === 0) return { headers: [], rows: [] }

  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1).map(cols => rowToObject(headers, cols))
  return { headers, rows: dataRows }
}

function buildRawSummary(rows: CsvRow[]): RawSummary {
  const byDim = new Map<string, { debit: number; credit: number }>()
  const byComponent = new Map<string, { count: number; total: number }>()
  const byOperation = new Map<string, { count: number; total: number }>()
  const batchIds = new Set<string>()
  let totalDebit = 0
  let totalCredit = 0

  rows.forEach(r => {
    const dim = r.Dimension
    const amt = Math.abs(Number.parseFloat(r.Amount)) || 0
    const dir = (r.GlEntry || '').toLowerCase()
    if (r.BatchId) batchIds.add(r.BatchId)

    if (r.AmountComponent) {
      const c = byComponent.get(r.AmountComponent) || { count: 0, total: 0 }
      c.count += 1; c.total += amt
      byComponent.set(r.AmountComponent, c)
    }
    if (r.Operation) {
      const o = byOperation.get(r.Operation) || { count: 0, total: 0 }
      o.count += 1; o.total += amt
      byOperation.set(r.Operation, o)
    }

    if (!dim || (dir !== 'debit' && dir !== 'credit')) return
    if (!byDim.has(dim)) byDim.set(dim, { debit: 0, credit: 0 })
    byDim.get(dim)![dir] += amt
    if (dir === 'debit') totalDebit += amt; else totalCredit += amt
  })

  return {
    byDim, byComponent, byOperation, batchIds,
    rowCount: rows.length,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
  }
}

function buildJournalSummary(rows: CsvRow[]): JournalSummary {
  const byDim = new Map<string, { debit: number; credit: number }>()
  const bankByAccount = new Map<string, { debit: number; credit: number }>()
  const batchIds = new Set<string>()
  let totalDebit = 0
  let totalCredit = 0

  rows.forEach(r => {
    const debit = Number.parseFloat(r.DEBITAMOUNT) || 0
    const credit = Number.parseFloat(r.CREDITAMOUNT) || 0
    totalDebit += debit
    totalCredit += credit
    if (r.DESCRIPTION) batchIds.add(r.DESCRIPTION)

    const type = (r.ACCOUNTTYPE || '').toLowerCase()
    if (type === 'ledger') {
      const dim = r.ACCOUNTDISPLAYVALUE
      if (!dim) return
      if (!byDim.has(dim)) byDim.set(dim, { debit: 0, credit: 0 })
      byDim.get(dim)!.debit += debit
      byDim.get(dim)!.credit += credit
    } else if (type === 'bank') {
      const account = r.ACCOUNTDISPLAYVALUE || '(unknown)'
      if (!bankByAccount.has(account)) bankByAccount.set(account, { debit: 0, credit: 0 })
      bankByAccount.get(account)!.debit += debit
      bankByAccount.get(account)!.credit += credit
    }
  })

  const bank = [...bankByAccount.entries()].map(([account, v]) => ({
    account, debit: round2(v.debit), credit: round2(v.credit),
  }))

  return {
    byDim, bank, batchIds,
    rowCount: rows.length,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
  }
}

function reconcile(rawSummary: RawSummary, journalSummary: JournalSummary): ReconResult {
  const dims = new Set([...rawSummary.byDim.keys(), ...journalSummary.byDim.keys()])
  const rows: ReconRow[] = [...dims].sort((a, b) => a.localeCompare(b)).map(dimension => {
    const raw = rawSummary.byDim.get(dimension)
    const jrn = journalSummary.byDim.get(dimension)
    const rawDebit = round2(raw?.debit || 0)
    const rawCredit = round2(raw?.credit || 0)
    const jrnDebit = round2(jrn?.debit || 0)
    const jrnCredit = round2(jrn?.credit || 0)
    const debitDiff = round2(rawDebit - jrnDebit)
    const creditDiff = round2(rawCredit - jrnCredit)

    let status: ReconStatus
    if (!raw) status = 'journal-only'
    else if (!jrn) status = 'raw-only'
    else if (Math.abs(debitDiff) > TOLERANCE || Math.abs(creditDiff) > TOLERANCE) status = 'mismatch'
    else status = 'match'

    return { dimension, rawDebit, jrnDebit, debitDiff, rawCredit, jrnCredit, creditDiff, status }
  })

  const issues: string[] = []

  rows.filter(r => r.status === 'mismatch').forEach(r => {
    issues.push(`Dimension "${r.dimension}" totals differ — raw debit ${r.rawDebit} vs journal ${r.jrnDebit} (Δ${r.debitDiff}), raw credit ${r.rawCredit} vs journal ${r.jrnCredit} (Δ${r.creditDiff})`)
  })

  const rawImbalance = round2(rawSummary.totalDebit - rawSummary.totalCredit)
  if (Math.abs(rawImbalance) > TOLERANCE) {
    issues.push(`Raw file does not balance: total debit ${rawSummary.totalDebit} vs total credit ${rawSummary.totalCredit} (Δ${rawImbalance})`)
  }

  const journalImbalance = round2(journalSummary.totalDebit - journalSummary.totalCredit)
  if (Math.abs(journalImbalance) > TOLERANCE) {
    issues.push(`Journal file does not balance: total debit ${journalSummary.totalDebit} vs total credit ${journalSummary.totalCredit} (Δ${journalImbalance})`)
  }

  if (rawSummary.batchIds.size > 1) {
    issues.push(`Raw file contains multiple batch ids: ${[...rawSummary.batchIds].join(', ')}`)
  }
  if (journalSummary.batchIds.size > 1) {
    issues.push(`Journal file contains multiple batch ids: ${[...journalSummary.batchIds].join(', ')}`)
  }
  if (rawSummary.batchIds.size === 1 && journalSummary.batchIds.size === 1) {
    const [rawBatch] = rawSummary.batchIds
    const [jrnBatch] = journalSummary.batchIds
    if (rawBatch !== jrnBatch) {
      issues.push(`Batch id mismatch: raw file is "${rawBatch}", journal file is "${jrnBatch}"`)
    }
  }

  return { rows, issues }
}

function downloadCsv(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className={statTile}>
      <div className={statTileLabel}>{label}</div>
      <div className={statTileValue}>{value}</div>
    </div>
  )
}

const STATUS_LABEL: Record<ReconStatus, string> = {
  match: 'Match',
  mismatch: 'Mismatch',
  'raw-only': 'Raw only',
  'journal-only': 'Journal only',
}

export default function ShadowLedgerReconciliation() {
  const [rawFileName, setRawFileName] = useState('')
  const [rawSummary, setRawSummary] = useState<RawSummary | null>(null)
  const [rawError, setRawError] = useState('')

  const [journalFileName, setJournalFileName] = useState('')
  const [journalSummary, setJournalSummary] = useState<JournalSummary | null>(null)
  const [journalError, setJournalError] = useState('')

  const [result, setResult] = useState<ReconResult | null>(null)
  const [downloaded, setDownloaded] = useState(false)

  async function handleFile<S>(
    file: File | undefined,
    requiredHeaders: string[],
    buildSummary: (rows: CsvRow[]) => S,
    setFileName: (v: string) => void,
    setSummary: (v: S | null) => void,
    setError: (v: string) => void,
  ) {
    setResult(null)
    if (!file) return
    setFileName(file.name)
    setError('')
    try {
      const text = await file.text()
      const { headers, rows } = parseCsv(text)
      const missing = requiredHeaders.filter(h => !headers.includes(h))
      if (missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}`)
      setSummary(buildSummary(rows))
    } catch (err) {
      setSummary(null)
      setError((err as Error).message || 'Could not read file.')
    }
  }

  function handleRawFile(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0], RAW_REQUIRED_HEADERS, buildRawSummary, setRawFileName, setRawSummary, setRawError)
  }

  function handleJournalFile(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0], JOURNAL_REQUIRED_HEADERS, buildJournalSummary, setJournalFileName, setJournalSummary, setJournalError)
  }

  function runReconcile() {
    if (!rawSummary || !journalSummary) return
    setResult(reconcile(rawSummary, journalSummary))
  }

  function handleDownload() {
    if (!result) return
    const header = 'Dimension,RawDebit,JournalDebit,DebitDiff,RawCredit,JournalCredit,CreditDiff,Status'
    const lines = result.rows.map(r =>
      `"${r.dimension}",${r.rawDebit},${r.jrnDebit},${r.debitDiff},${r.rawCredit},${r.jrnCredit},${r.creditDiff},${STATUS_LABEL[r.status]}`
    )
    downloadCsv('gl-reconciliation.csv', [header, ...lines].join('\n'))
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={toolGrid2}>
        <div data-testid="card" className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> Collection Items Export (Raw CSV)
          </div>
          <input type="file" accept=".csv" onChange={handleRawFile} />
          {rawFileName && <p className="text-[0.78rem] text-text-muted mt-2">{rawFileName}</p>}
          {rawSummary && (
            <p className="text-[0.78rem] text-text-muted mt-1 font-mono">
              {rawSummary.rowCount.toLocaleString()} rows · {rawSummary.byDim.size} dimensions · batch {[...rawSummary.batchIds].join(', ') || 'n/a'}
            </p>
          )}
          {rawError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{rawError}</div>}
        </div>

        <div data-testid="card" className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDotGreen} /> D365 GL Journal Export
          </div>
          <input type="file" accept=".csv" onChange={handleJournalFile} />
          {journalFileName && <p className="text-[0.78rem] text-text-muted mt-2">{journalFileName}</p>}
          {journalSummary && (
            <p className="text-[0.78rem] text-text-muted mt-1 font-mono">
              {journalSummary.rowCount.toLocaleString()} rows · {journalSummary.byDim.size} dimensions · batch {[...journalSummary.batchIds].join(', ') || 'n/a'}
            </p>
          )}
          {journalError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{journalError}</div>}
        </div>
      </div>

      <div className={btnRow}>
        <button
          type="button"
          className={cx(btn, btnPrimary)}
          onClick={runReconcile}
          disabled={!rawSummary || !journalSummary}
        >
          Reconcile →
        </button>
      </div>

      {result && rawSummary && journalSummary && (
        <>
          <div className={card}>
            <div className={cardTitle}>
              <span className={result.issues.length === 0 ? cardTitleDotGreen : cardTitleDot} /> Reconciliation Result
            </div>
            {result.issues.length === 0 ? (
              <div className={cx(alert, alertVariants.success)}>✓ All checks passed — no discrepancies found.</div>
            ) : (
              <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>
                <strong>{result.issues.length} issue{result.issues.length === 1 ? '' : 's'} found:</strong>
                <ul className="mt-1 pl-[18px]">
                  {result.issues.map(issue => <li className="my-0.5" key={issue}>{issue}</li>)}
                </ul>
              </div>
            )}

            <div className={statTileRow}>
              <StatTile label="Raw rows" value={rawSummary.rowCount.toLocaleString()} />
              <StatTile label="Raw total debit" value={rawSummary.totalDebit.toLocaleString()} />
              <StatTile label="Raw total credit" value={rawSummary.totalCredit.toLocaleString()} />
              <StatTile label="Journal rows" value={journalSummary.rowCount.toLocaleString()} />
              <StatTile label="Journal total debit" value={journalSummary.totalDebit.toLocaleString()} />
              <StatTile label="Journal total credit" value={journalSummary.totalCredit.toLocaleString()} />
            </div>
          </div>

          {(rawSummary.byComponent.size > 0 || rawSummary.byOperation.size > 0) && (
            <div className={toolGrid2}>
              {rawSummary.byComponent.size > 0 && (
                <div className={card}>
                  <div className={cardTitle}>
                    <span className={cardTitleDot} /> Raw Breakdown by Amount Component
                  </div>
                  <div className={tableWrap}>
                    <table className={table}>
                      <thead>
                        <tr className={theadRow}><th className={thFirst}>Component</th><th className={th}>Count</th><th className={th}>Total</th></tr>
                      </thead>
                      <tbody>
                        {[...rawSummary.byComponent.entries()].map(([name, v]) => (
                          <tr key={name}>
                            <td className={tdFirst}>{name}</td>
                            <td className={td}>{v.count}</td>
                            <td className={td}>{round2(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {rawSummary.byOperation.size > 0 && (
                <div className={card}>
                  <div className={cardTitle}>
                    <span className={cardTitleDot} /> Raw Breakdown by Operation
                  </div>
                  <div className={tableWrap}>
                    <table className={table}>
                      <thead>
                        <tr className={theadRow}><th className={thFirst}>Operation</th><th className={th}>Count</th><th className={th}>Total</th></tr>
                      </thead>
                      <tbody>
                        {[...rawSummary.byOperation.entries()].map(([name, v]) => (
                          <tr key={name}>
                            <td className={tdFirst}>{name}</td>
                            <td className={td}>{v.count}</td>
                            <td className={td}>{round2(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {journalSummary.bank.length > 0 && (
            <div className={card}>
              <div className={cardTitle}>
                <span className={cardTitleDot} /> Journal Bank Lines
              </div>
              <div className={tableWrap}>
                <table className={table}>
                  <thead>
                    <tr className={theadRow}><th className={thFirst}>Account</th><th className={th}>Debit</th><th className={th}>Credit</th></tr>
                  </thead>
                  <tbody>
                    {journalSummary.bank.map(b => (
                      <tr key={b.account}>
                        <td className={tdFirst}>{b.account}</td>
                        <td className={td}>{b.debit}</td>
                        <td className={td}>{b.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Dimension Comparison
            </div>
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr className={theadRow}>
                    <th className={thFirst}>Dimension</th>
                    <th className={th}>Raw Debit</th>
                    <th className={th}>Journal Debit</th>
                    <th className={th}>Δ Debit</th>
                    <th className={th}>Raw Credit</th>
                    <th className={th}>Journal Credit</th>
                    <th className={th}>Δ Credit</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map(r => (
                    <tr key={r.dimension} className={reconRowVariants[r.status]}>
                      <td className={tdFirst}>{r.dimension}</td>
                      <td className={td}>{r.rawDebit}</td>
                      <td className={td}>{r.jrnDebit}</td>
                      <td className={td}>{r.debitDiff}</td>
                      <td className={td}>{r.rawCredit}</td>
                      <td className={td}>{r.jrnCredit}</td>
                      <td className={td}>{r.creditDiff}</td>
                      <td className={td}><span className={cx(statusPill, reconStatusVariants[r.status])}>{STATUS_LABEL[r.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={btnRow}>
              <button type="button" className={cx(btn, btnSecondary)} onClick={handleDownload}>
                {downloaded ? <Check size={14} /> : <Download size={14} />}
                {downloaded ? 'Downloaded' : 'Download comparison as CSV'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
