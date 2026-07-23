import { useState } from 'react'

const RAW_REQUIRED_HEADERS = ['Dimension', 'Amount', 'GlEntry', 'BatchId']
const JOURNAL_REQUIRED_HEADERS = ['ACCOUNTDISPLAYVALUE', 'ACCOUNTTYPE', 'DEBITAMOUNT', 'CREDITAMOUNT', 'DESCRIPTION']
const TOLERANCE = 0.01

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }

// Splits raw CSV text into rows of raw (untrimmed) field arrays, honoring
// RFC4180 quoting (quoted fields may contain commas/quotes/newlines).
function tokenizeCsv(text) {
  const rows = []
  let row = []
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

function rowToObject(headers, cols) {
  const obj = {}
  headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim() })
  return obj
}

// Small RFC4180-aware CSV parser: handles quoted fields (with embedded commas/quotes).
function parseCsv(text) {
  const rows = tokenizeCsv(text).filter(r => !(r.length === 1 && r[0] === ''))
  if (rows.length === 0) return { headers: [], rows: [] }

  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1).map(cols => rowToObject(headers, cols))
  return { headers, rows: dataRows }
}

function buildRawSummary(rows) {
  const byDim = new Map()
  const byComponent = new Map()
  const byOperation = new Map()
  const batchIds = new Set()
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
    byDim.get(dim)[dir] += amt
    if (dir === 'debit') totalDebit += amt; else totalCredit += amt
  })

  return {
    byDim, byComponent, byOperation, batchIds,
    rowCount: rows.length,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
  }
}

function buildJournalSummary(rows) {
  const byDim = new Map()
  const bankByAccount = new Map()
  const batchIds = new Set()
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
      byDim.get(dim).debit += debit
      byDim.get(dim).credit += credit
    } else if (type === 'bank') {
      const account = r.ACCOUNTDISPLAYVALUE || '(unknown)'
      if (!bankByAccount.has(account)) bankByAccount.set(account, { debit: 0, credit: 0 })
      bankByAccount.get(account).debit += debit
      bankByAccount.get(account).credit += credit
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

function reconcile(rawSummary, journalSummary) {
  const dims = new Set([...rawSummary.byDim.keys(), ...journalSummary.byDim.keys()])
  const rows = [...dims].sort((a, b) => a.localeCompare(b)).map(dimension => {
    const raw = rawSummary.byDim.get(dimension)
    const jrn = journalSummary.byDim.get(dimension)
    const rawDebit = round2(raw?.debit || 0)
    const rawCredit = round2(raw?.credit || 0)
    const jrnDebit = round2(jrn?.debit || 0)
    const jrnCredit = round2(jrn?.credit || 0)
    const debitDiff = round2(rawDebit - jrnDebit)
    const creditDiff = round2(rawCredit - jrnCredit)

    let status
    if (!raw) status = 'journal-only'
    else if (!jrn) status = 'raw-only'
    else if (Math.abs(debitDiff) > TOLERANCE || Math.abs(creditDiff) > TOLERANCE) status = 'mismatch'
    else status = 'match'

    return { dimension, rawDebit, jrnDebit, debitDiff, rawCredit, jrnCredit, creditDiff, status }
  })

  const issues = []

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

function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile-label">{label}</div>
      <div className="stat-tile-value">{value}</div>
    </div>
  )
}

const STATUS_LABEL = {
  match: 'Match',
  mismatch: 'Mismatch',
  'raw-only': 'Raw only',
  'journal-only': 'Journal only',
}

export default function ShadowLedgerReconciliation() {
  const [rawFileName, setRawFileName] = useState('')
  const [rawSummary, setRawSummary] = useState(null)
  const [rawError, setRawError] = useState('')

  const [journalFileName, setJournalFileName] = useState('')
  const [journalSummary, setJournalSummary] = useState(null)
  const [journalError, setJournalError] = useState('')

  const [result, setResult] = useState(null)
  const [downloaded, setDownloaded] = useState(false)

  async function handleFile(file, requiredHeaders, buildSummary, setFileName, setSummary, setError) {
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
      setError(err.message || 'Could not read file.')
    }
  }

  function handleRawFile(e) {
    handleFile(e.target.files[0], RAW_REQUIRED_HEADERS, buildRawSummary, setRawFileName, setRawSummary, setRawError)
  }

  function handleJournalFile(e) {
    handleFile(e.target.files[0], JOURNAL_REQUIRED_HEADERS, buildJournalSummary, setJournalFileName, setJournalSummary, setJournalError)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="tool-grid-2">
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" /> Collection Items Export (Raw CSV)
          </div>
          <input type="file" accept=".csv" onChange={handleRawFile} />
          {rawFileName && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>{rawFileName}</p>}
          {rawSummary && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {rawSummary.rowCount.toLocaleString()} rows · {rawSummary.byDim.size} dimensions · batch {[...rawSummary.batchIds].join(', ') || 'n/a'}
            </p>
          )}
          {rawError && <div className="alert alert-error">{rawError}</div>}
        </div>

        <div className="card">
          <div className="card-title">
            <span className="card-title-dot green" /> D365 GL Journal Export
          </div>
          <input type="file" accept=".csv" onChange={handleJournalFile} />
          {journalFileName && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>{journalFileName}</p>}
          {journalSummary && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {journalSummary.rowCount.toLocaleString()} rows · {journalSummary.byDim.size} dimensions · batch {[...journalSummary.batchIds].join(', ') || 'n/a'}
            </p>
          )}
          {journalError && <div className="alert alert-error">{journalError}</div>}
        </div>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={runReconcile}
          disabled={!rawSummary || !journalSummary}
        >
          Reconcile →
        </button>
      </div>

      {result && (
        <>
          <div className="card">
            <div className="card-title">
              <span className={`card-title-dot ${result.issues.length === 0 ? 'green' : ''}`} /> Reconciliation Result
            </div>
            {result.issues.length === 0 ? (
              <div className="alert alert-success">✓ All checks passed — no discrepancies found.</div>
            ) : (
              <div className="alert alert-error">
                <strong>{result.issues.length} issue{result.issues.length === 1 ? '' : 's'} found:</strong>
                <ul>
                  {result.issues.map(issue => <li key={issue}>{issue}</li>)}
                </ul>
              </div>
            )}

            <div className="stat-tile-row">
              <StatTile label="Raw rows" value={rawSummary.rowCount.toLocaleString()} />
              <StatTile label="Raw total debit" value={rawSummary.totalDebit.toLocaleString()} />
              <StatTile label="Raw total credit" value={rawSummary.totalCredit.toLocaleString()} />
              <StatTile label="Journal rows" value={journalSummary.rowCount.toLocaleString()} />
              <StatTile label="Journal total debit" value={journalSummary.totalDebit.toLocaleString()} />
              <StatTile label="Journal total credit" value={journalSummary.totalCredit.toLocaleString()} />
            </div>
          </div>

          {(rawSummary.byComponent.size > 0 || rawSummary.byOperation.size > 0) && (
            <div className="tool-grid-2">
              {rawSummary.byComponent.size > 0 && (
                <div className="card">
                  <div className="card-title">
                    <span className="card-title-dot" /> Raw Breakdown by Amount Component
                  </div>
                  <div className="recon-table-wrap">
                    <table className="recon-table">
                      <thead>
                        <tr><th>Component</th><th>Count</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {[...rawSummary.byComponent.entries()].map(([name, v]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>{v.count}</td>
                            <td>{round2(v.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {rawSummary.byOperation.size > 0 && (
                <div className="card">
                  <div className="card-title">
                    <span className="card-title-dot" /> Raw Breakdown by Operation
                  </div>
                  <div className="recon-table-wrap">
                    <table className="recon-table">
                      <thead>
                        <tr><th>Operation</th><th>Count</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {[...rawSummary.byOperation.entries()].map(([name, v]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>{v.count}</td>
                            <td>{round2(v.total)}</td>
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
            <div className="card">
              <div className="card-title">
                <span className="card-title-dot" /> Journal Bank Lines
              </div>
              <div className="recon-table-wrap">
                <table className="recon-table">
                  <thead>
                    <tr><th>Account</th><th>Debit</th><th>Credit</th></tr>
                  </thead>
                  <tbody>
                    {journalSummary.bank.map(b => (
                      <tr key={b.account}>
                        <td>{b.account}</td>
                        <td>{b.debit}</td>
                        <td>{b.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title">
              <span className="card-title-dot" /> Dimension Comparison
            </div>
            <div className="recon-table-wrap">
              <table className="recon-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Raw Debit</th>
                    <th>Journal Debit</th>
                    <th>Δ Debit</th>
                    <th>Raw Credit</th>
                    <th>Journal Credit</th>
                    <th>Δ Credit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map(r => (
                    <tr key={r.dimension} className={`recon-row-${r.status}`}>
                      <td>{r.dimension}</td>
                      <td>{r.rawDebit}</td>
                      <td>{r.jrnDebit}</td>
                      <td>{r.debitDiff}</td>
                      <td>{r.rawCredit}</td>
                      <td>{r.jrnCredit}</td>
                      <td>{r.creditDiff}</td>
                      <td><span className={`recon-status recon-status-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                {downloaded ? '✓ Downloaded' : '⬇ Download comparison as CSV'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
