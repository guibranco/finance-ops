import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Download } from 'lucide-react'
import {
  alert,
  alertVariants,
  amtNeg,
  amtPos,
  btn,
  btnGhost,
  btnPrimary,
  btnRow,
  btnSecondary,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  codeArea,
  codeAreaTall,
  codeAreaWrap,
  cx,
  entryGlEntryVariants,
  formInput,
  formSelect,
  statTile,
  statTileLabel,
  statTileRow,
  statTileValue,
  vizRowHover,
  vizSortArrow,
  vizTable,
  vizTableWrap,
  vizTd,
  vizTdNum,
  vizTh,
  vizThNum,
  vizTheadRow,
  vizToolbar,
  vizToolbarInput,
} from '../../ui'

interface ShadowLedgerEntry {
  id?: number | string
  policyNumber?: string
  amount?: number
  glEntry?: string
  operation?: string
  [key: string]: unknown
}

interface EntriesPayload {
  entries: ShadowLedgerEntry[]
  isTruncated: boolean
}

interface DimensionBalance {
  dimension: string
  debit: number
  credit: number
  diff: number
  balanced: boolean
}

interface Stats {
  count: number
  net: number
  debit: number
  credit: number
  policies: number
  batches: number
}

const SAMPLE_PAYLOAD: EntriesPayload = {
  entries: [
    { id: 1269403, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: -6.93, categoryCode: '', amountComponent: 'Premium', glChartCode: '133206', dimension: '133206-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Credit', operation: 'Refund', createdDate: '2026-06-16T22:03:30.3961529+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1269404, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: -5.82, categoryCode: '', amountComponent: 'PremiumNet', glChartCode: '410101', dimension: '410101-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Debit', operation: 'Refund', createdDate: '2026-06-16T22:03:30.3961629+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1269405, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: -0.18, categoryCode: 'LVY', amountComponent: 'TaxOrLevy', glChartCode: '310916', dimension: '310916-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Debit', operation: 'Refund', createdDate: '2026-06-16T22:03:30.3961689+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1269406, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: -0.93, categoryCode: 'ICF', amountComponent: 'TaxOrLevy', glChartCode: '310916', dimension: '310916-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Debit', operation: 'Refund', createdDate: '2026-06-16T22:03:30.39617+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1270538, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: 6.93, categoryCode: '', amountComponent: 'Premium', glChartCode: '133206', dimension: '133206-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Debit', operation: 'RefundWriteOff', createdDate: '2026-06-16T22:04:54.8347902+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1270539, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: 5.82, categoryCode: '', amountComponent: 'PremiumNet', glChartCode: '410101', dimension: '410101-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Credit', operation: 'RefundWriteOff', createdDate: '2026-06-16T22:04:54.8347989+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1270540, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: 0.18, categoryCode: 'LVY', amountComponent: 'TaxOrLevy', glChartCode: '310916', dimension: '310916-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Credit', operation: 'RefundWriteOff', createdDate: '2026-06-16T22:04:54.8348053+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
    { id: 1270541, policyNumber: 'OUT00275391', riskId: 1, riskCode: 'VEH', valueDate: '2026-06-16T00:00:00', transactionDate: '2026-06-16T00:00:00', amount: 0.93, categoryCode: 'ICF', amountComponent: 'TaxOrLevy', glChartCode: '310916', dimension: '310916-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---', glEntry: 'Credit', operation: 'RefundWriteOff', createdDate: '2026-06-16T22:04:54.8348065+00:00', batchId: 'BATCH-DEBTORS-021FD-20260617-010023-2101', transactionReference: 'OUT00275391-1-3-VEH-3', paymentMethod: 'Card', providerFilename: null, salesSource: 'CCU', costCentreL1: 'STI', costCentreL2: '000', costCentreL3: 'F', product: 'MOT', productGroup: 'PER', reportingSegment: 'PES', salesChannel: 'CAL', distributionChannel: 'DIR', companyCode: '2101', collectionItemId: 'Collection-1-3', riskMajorVersion: 3, paymentScheduleId: '948dfaab-e5b5-4b7c-8c52-e0a035cf14e6', paymentScheduleItemId: '8baaad39-7d3b-42b0-9478-7aec6fa0ead2' },
  ],
  isTruncated: false,
}

const DEFAULT_KEYS = [
  'id', 'policyNumber', 'transactionReference', 'riskCode', 'amountComponent', 'categoryCode',
  'glEntry', 'amount', 'operation', 'valueDate', 'glChartCode', 'dimension', 'batchId', 'collectionItemId',
]

const LABEL_OVERRIDES: Record<string, string> = {
  id: 'ID',
  policyNumber: 'Policy Number',
  riskId: 'Risk ID',
  riskCode: 'Risk Code',
  valueDate: 'Value Date',
  transactionDate: 'Transaction Date',
  amount: 'Amount',
  categoryCode: 'Category',
  amountComponent: 'Component',
  glChartCode: 'GL Chart Code',
  dimension: 'Dimension',
  glEntry: 'GL Entry',
  operation: 'Operation',
  createdDate: 'Created Date',
  batchId: 'Batch ID',
  transactionReference: 'Transaction Ref',
  paymentMethod: 'Payment Method',
  providerFilename: 'Provider Filename',
  salesSource: 'Sales Source',
  costCentreL1: 'Cost Centre L1',
  costCentreL2: 'Cost Centre L2',
  costCentreL3: 'Cost Centre L3',
  product: 'Product',
  productGroup: 'Product Group',
  reportingSegment: 'Reporting Segment',
  salesChannel: 'Sales Channel',
  distributionChannel: 'Distribution Channel',
  companyCode: 'Company Code',
  collectionItemId: 'Collection Item ID',
  riskMajorVersion: 'Risk Version',
  paymentScheduleId: 'Payment Schedule ID',
  paymentScheduleItemId: 'Schedule Item ID',
}

function humanize(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
}

function labelFor(key: string): string {
  return LABEL_OVERRIDES[key] || humanize(key)
}

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100 }

// Accepts either { entries: [...], isTruncated } or a bare array of entries.
function parseEntriesPayload(text: string): EntriesPayload {
  const data = JSON.parse(text) as unknown
  let entries: ShadowLedgerEntry[]
  let isTruncated = false
  if (Array.isArray(data)) {
    entries = data as ShadowLedgerEntry[]
  } else if (data && Array.isArray((data as { entries?: unknown }).entries)) {
    const obj = data as { entries: ShadowLedgerEntry[]; isTruncated?: boolean }
    entries = obj.entries
    isTruncated = Boolean(obj.isTruncated)
  } else {
    throw new Error('Expected a JSON object with an "entries" array, or a bare array of entries.')
  }
  if (entries.length === 0) throw new Error('No entries found in the provided JSON.')
  return { entries, isTruncated }
}

function collectColumns(entries: ShadowLedgerEntry[]): string[] {
  const seen = new Set<string>()
  const cols: string[] = []
  entries.forEach(e => {
    Object.keys(e).forEach(k => {
      if (!seen.has(k)) { seen.add(k); cols.push(k) }
    })
  })
  return cols
}

function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'amount') { const n = Number(value); return Number.isNaN(n) ? toSafeString(value) : n.toFixed(2) }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'string' && /Date$/.test(key) && value.includes('T')) {
    return key === 'createdDate' ? value.replace(/\.\d+/, '').replace(/[+-]\d{2}:\d{2}$/, '') : value.split('T')[0]
  }
  return toSafeString(value)
}

function compareValues(a: unknown, b: unknown): number {
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return toSafeString(a).localeCompare(toSafeString(b))
}

function buildStats(entries: ShadowLedgerEntry[]): Stats {
  const policies = new Set<string>()
  const batches = new Set<string>()
  let net = 0, debit = 0, credit = 0
  entries.forEach(e => {
    if (e.policyNumber) policies.add(toSafeString(e.policyNumber))
    if (e.batchId) batches.add(toSafeString(e.batchId))
    const amt = Number(e.amount) || 0
    net += amt
    const dir = (e.glEntry || '').toString().toLowerCase()
    if (dir === 'debit') debit += Math.abs(amt)
    else if (dir === 'credit') credit += Math.abs(amt)
  })
  return {
    count: entries.length,
    net: round2(net),
    debit: round2(debit),
    credit: round2(credit),
    policies: policies.size,
    batches: batches.size,
  }
}

function buildDimensionBalance(entries: ShadowLedgerEntry[]): DimensionBalance[] {
  const byDim = new Map<string, { debit: number; credit: number }>()
  entries.forEach(e => {
    const dim = e.dimension as string | undefined
    const dir = (e.glEntry || '').toString().toLowerCase()
    if (!dim || (dir !== 'debit' && dir !== 'credit')) return
    if (!byDim.has(dim)) byDim.set(dim, { debit: 0, credit: 0 })
    byDim.get(dim)![dir] += Math.abs(Number(e.amount) || 0)
  })
  return [...byDim.entries()]
    .map(([dimension, v]) => {
      const debit = round2(v.debit), credit = round2(v.credit)
      return { dimension, debit, credit, diff: round2(debit - credit), balanced: Math.abs(debit - credit) <= 0.01 }
    })
    .sort((a, b) => a.dimension.localeCompare(b.dimension))
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

export default function ShadowLedgerVisualizer() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<EntriesPayload | null>(null)

  const [search, setSearch] = useState('')
  const [glEntryFilter, setGlEntryFilter] = useState('all')
  const [operationFilter, setOperationFilter] = useState('all')
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [downloaded, setDownloaded] = useState(false)

  const allColumns = useMemo(() => (result ? collectColumns(result.entries) : []), [result])
  const visibleKeys = useMemo(
    () => (showAllColumns ? allColumns : DEFAULT_KEYS.filter(k => allColumns.includes(k))),
    [showAllColumns, allColumns]
  )
  const operations = useMemo(
    () => (result ? [...new Set(result.entries.map(e => e.operation).filter(Boolean))].sort() as string[] : []),
    [result]
  )

  const filteredEntries = useMemo(() => {
    if (!result) return []
    const term = search.trim().toLowerCase()
    return result.entries.filter(e => {
      if (glEntryFilter !== 'all' && (e.glEntry || '').toString().toLowerCase() !== glEntryFilter) return false
      if (operationFilter !== 'all' && e.operation !== operationFilter) return false
      if (term && !JSON.stringify(e).toLowerCase().includes(term)) return false
      return true
    })
  }, [result, search, glEntryFilter, operationFilter])

  const sortedEntries = useMemo(() => {
    const rows = [...filteredEntries]
    rows.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey])
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [filteredEntries, sortKey, sortDir])

  const stats = useMemo(() => (result ? buildStats(result.entries) : null), [result])
  const dimensionBalance = useMemo(() => (result ? buildDimensionBalance(result.entries) : []), [result])
  const unbalancedDims = dimensionBalance.filter(d => !d.balanced)

  function handleVisualize() {
    setError('')
    setResult(null)
    if (!input.trim()) { setError('Please enter Shadow Ledger entries JSON.'); return }
    try {
      const parsed = parseEntriesPayload(input)
      setResult(parsed)
      setSearch(''); setGlEntryFilter('all'); setOperationFilter('all'); setSortKey('id'); setSortDir('asc')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleDownload() {
    if (!sortedEntries.length) return
    const header = visibleKeys.map(k => `"${labelFor(k)}"`).join(',')
    const lines = sortedEntries.map(e => visibleKeys.map(k => {
      const s = toSafeString(e[k])
      return `"${s.replace(/"/g, '""')}"`
    }).join(','))
    downloadCsv('shadow-ledger-entries.csv', [header, ...lines].join('\n'))
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDot} /> Shadow Ledger Entries JSON
        </div>
        <div className={codeAreaWrap}>
          <textarea
            className={cx(codeArea, codeAreaTall)}
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="Paste a Shadow Ledger entries JSON payload here..."
          />
        </div>
        <div className={btnRow}>
          <button className={cx(btn, btnPrimary)} onClick={handleVisualize}>Visualize →</button>
          <button className={cx(btn, btnGhost)} onClick={() => { setInput(JSON.stringify(SAMPLE_PAYLOAD, null, 2)); setError(''); setResult(null) }}>
            Load sample
          </button>
          <button className={cx(btn, btnGhost)} onClick={() => { setInput(''); setError(''); setResult(null) }}>
            Clear
          </button>
        </div>
        {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
      </div>

      {result && stats && (
        <>
          {result.isTruncated && (
            <div className={cx(alert, alertVariants.warning, 'flex items-center gap-2')}>
              <AlertTriangle size={14} /> This result set is truncated — not all matching entries were returned by the source query.
            </div>
          )}

          <div className={card}>
            <div className={cardTitle}>
              <span className={unbalancedDims.length === 0 ? cardTitleDotGreen : cardTitleDot} /> Summary
            </div>
            <div className={statTileRow}>
              <StatTile label="Entries" value={stats.count.toLocaleString()} />
              <StatTile label="Net amount" value={stats.net.toLocaleString()} />
              <StatTile label="Total debit" value={stats.debit.toLocaleString()} />
              <StatTile label="Total credit" value={stats.credit.toLocaleString()} />
              <StatTile label="Policies" value={stats.policies.toLocaleString()} />
              <StatTile label="Batches" value={stats.batches.toLocaleString()} />
            </div>
            {unbalancedDims.length > 0 ? (
              <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>
                <strong>{unbalancedDims.length} dimension{unbalancedDims.length === 1 ? '' : 's'} out of balance:</strong>
                <ul className="mt-1 pl-[18px]">
                  {unbalancedDims.map(d => (
                    <li className="my-0.5" key={d.dimension}>{d.dimension} — debit {d.debit} vs credit {d.credit} (Δ{d.diff})</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={cx(alert, alertVariants.success)}>✓ Debit and credit totals balance for every dimension.</div>
            )}
          </div>

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Entries ({sortedEntries.length.toLocaleString()} of {result.entries.length.toLocaleString()})
            </div>

            <div className={vizToolbar}>
              <input
                type="text"
                className={formInput}
                placeholder="Search entries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className={cx(formSelect, vizToolbarInput)} value={glEntryFilter} onChange={e => setGlEntryFilter(e.target.value)}>
                <option value="all">All GL entries</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
              <select className={cx(formSelect, vizToolbarInput)} value={operationFilter} onChange={e => setOperationFilter(e.target.value)}>
                <option value="all">All operations</option>
                {operations.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-[0.8rem] text-text-muted cursor-pointer">
                <input type="checkbox" checked={showAllColumns} onChange={e => setShowAllColumns(e.target.checked)} />
                Show all columns
              </label>
            </div>

            <div className={vizTableWrap}>
              <table className={vizTable}>
                <thead>
                  <tr className={vizTheadRow}>
                    {visibleKeys.map(key => (
                      <th key={key} className={key === 'amount' ? vizThNum : vizTh} onClick={() => handleSort(key)}>
                        {labelFor(key)}
                        {sortKey === key && <span className={vizSortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e, idx) => (
                    <tr key={String(e.id ?? idx)} className={vizRowHover}>
                      {visibleKeys.map(key => {
                        if (key === 'glEntry') {
                          const dir = (e.glEntry || '').toString().toLowerCase()
                          return (
                            <td key={key} className={vizTd}>
                              {dir === 'debit' || dir === 'credit'
                                ? <span className={entryGlEntryVariants[dir]}>{String(e.glEntry)}</span>
                                : formatValue(key, e[key])}
                            </td>
                          )
                        }
                        if (key === 'amount') {
                          const n = Number(e.amount) || 0
                          return <td key={key} className={cx(vizTdNum, n < 0 ? amtNeg : amtPos)}>{formatValue(key, e[key])}</td>
                        }
                        return <td key={key} className={vizTd}>{formatValue(key, e[key])}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={btnRow}>
              <button type="button" className={cx(btn, btnSecondary)} onClick={handleDownload}>
                {downloaded ? <Check size={14} /> : <Download size={14} />}
                {downloaded ? 'Downloaded' : 'Download visible columns as CSV'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
