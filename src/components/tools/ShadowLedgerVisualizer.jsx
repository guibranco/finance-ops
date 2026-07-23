import { useMemo, useState } from 'react'

const SAMPLE_PAYLOAD = {
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

const LABEL_OVERRIDES = {
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

function humanize(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
}

function labelFor(key) {
  return LABEL_OVERRIDES[key] || humanize(key)
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }

// Accepts either { entries: [...], isTruncated } or a bare array of entries.
function parseEntriesPayload(text) {
  const data = JSON.parse(text)
  let entries
  let isTruncated = false
  if (Array.isArray(data)) {
    entries = data
  } else if (data && Array.isArray(data.entries)) {
    entries = data.entries
    isTruncated = Boolean(data.isTruncated)
  } else {
    throw new Error('Expected a JSON object with an "entries" array, or a bare array of entries.')
  }
  if (entries.length === 0) throw new Error('No entries found in the provided JSON.')
  return { entries, isTruncated }
}

function collectColumns(entries) {
  const seen = new Set()
  const cols = []
  entries.forEach(e => {
    Object.keys(e).forEach(k => {
      if (!seen.has(k)) { seen.add(k); cols.push(k) }
    })
  })
  return cols
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'amount') { const n = Number(value); return Number.isNaN(n) ? String(value) : n.toFixed(2) }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'string' && /Date$/.test(key) && value.includes('T')) {
    return key === 'createdDate' ? value.replace(/\.\d+/, '').replace(/[+-]\d{2}:\d{2}$/, '') : value.split('T')[0]
  }
  return String(value)
}

function compareValues(a, b) {
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function buildStats(entries) {
  const policies = new Set()
  const batches = new Set()
  let net = 0, debit = 0, credit = 0
  entries.forEach(e => {
    if (e.policyNumber) policies.add(e.policyNumber)
    if (e.batchId) batches.add(e.batchId)
    const amt = Number(e.amount) || 0
    net += amt
    const dir = (e.glEntry || '').toLowerCase()
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

function buildDimensionBalance(entries) {
  const byDim = new Map()
  entries.forEach(e => {
    const dim = e.dimension
    const dir = (e.glEntry || '').toLowerCase()
    if (!dim || (dir !== 'debit' && dir !== 'credit')) return
    if (!byDim.has(dim)) byDim.set(dim, { debit: 0, credit: 0 })
    byDim.get(dim)[dir] += Math.abs(Number(e.amount) || 0)
  })
  return [...byDim.entries()]
    .map(([dimension, v]) => {
      const debit = round2(v.debit), credit = round2(v.credit)
      return { dimension, debit, credit, diff: round2(debit - credit), balanced: Math.abs(debit - credit) <= 0.01 }
    })
    .sort((a, b) => a.dimension.localeCompare(b.dimension))
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

export default function ShadowLedgerVisualizer() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [search, setSearch] = useState('')
  const [glEntryFilter, setGlEntryFilter] = useState('all')
  const [operationFilter, setOperationFilter] = useState('all')
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [downloaded, setDownloaded] = useState(false)

  const allColumns = useMemo(() => (result ? collectColumns(result.entries) : []), [result])
  const visibleKeys = useMemo(
    () => (showAllColumns ? allColumns : DEFAULT_KEYS.filter(k => allColumns.includes(k))),
    [showAllColumns, allColumns]
  )
  const operations = useMemo(
    () => (result ? [...new Set(result.entries.map(e => e.operation).filter(Boolean))].sort() : []),
    [result]
  )

  const filteredEntries = useMemo(() => {
    if (!result) return []
    const term = search.trim().toLowerCase()
    return result.entries.filter(e => {
      if (glEntryFilter !== 'all' && (e.glEntry || '').toLowerCase() !== glEntryFilter) return false
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
      setError(e.message)
    }
  }

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleDownload() {
    if (!sortedEntries.length) return
    const header = visibleKeys.map(k => `"${labelFor(k)}"`).join(',')
    const lines = sortedEntries.map(e => visibleKeys.map(k => {
      const v = e[k]
      const s = v === null || v === undefined ? '' : String(v)
      return `"${s.replace(/"/g, '""')}"`
    }).join(','))
    downloadCsv('shadow-ledger-entries.csv', [header, ...lines].join('\n'))
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-title">
          <span className="card-title-dot" /> Shadow Ledger Entries JSON
        </div>
        <div className="code-area-wrap">
          <textarea
            className="code-area code-area-tall"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder="Paste a Shadow Ledger entries JSON payload here..."
          />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleVisualize}>Visualize →</button>
          <button className="btn btn-ghost" onClick={() => { setInput(JSON.stringify(SAMPLE_PAYLOAD, null, 2)); setError(''); setResult(null) }}>
            Load sample
          </button>
          <button className="btn btn-ghost" onClick={() => { setInput(''); setError(''); setResult(null) }}>
            Clear
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {result && stats && (
        <>
          {result.isTruncated && (
            <div className="alert alert-warning">
              ⚠ This result set is truncated — not all matching entries were returned by the source query.
            </div>
          )}

          <div className="card">
            <div className="card-title">
              <span className={`card-title-dot ${unbalancedDims.length === 0 ? 'green' : ''}`} /> Summary
            </div>
            <div className="stat-tile-row">
              <StatTile label="Entries" value={stats.count.toLocaleString()} />
              <StatTile label="Net amount" value={stats.net.toLocaleString()} />
              <StatTile label="Total debit" value={stats.debit.toLocaleString()} />
              <StatTile label="Total credit" value={stats.credit.toLocaleString()} />
              <StatTile label="Policies" value={stats.policies.toLocaleString()} />
              <StatTile label="Batches" value={stats.batches.toLocaleString()} />
            </div>
            {unbalancedDims.length > 0 ? (
              <div className="alert alert-error">
                <strong>{unbalancedDims.length} dimension{unbalancedDims.length === 1 ? '' : 's'} out of balance:</strong>
                <ul>
                  {unbalancedDims.map(d => (
                    <li key={d.dimension}>{d.dimension} — debit {d.debit} vs credit {d.credit} (Δ{d.diff})</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="alert alert-success">✓ Debit and credit totals balance for every dimension.</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span className="card-title-dot" /> Entries ({sortedEntries.length.toLocaleString()} of {result.entries.length.toLocaleString()})
            </div>

            <div className="viz-toolbar">
              <input
                type="text"
                className="form-input"
                placeholder="Search entries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="form-input" value={glEntryFilter} onChange={e => setGlEntryFilter(e.target.value)}>
                <option value="all">All GL entries</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
              <select className="form-input" value={operationFilter} onChange={e => setOperationFilter(e.target.value)}>
                <option value="all">All operations</option>
                {operations.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showAllColumns} onChange={e => setShowAllColumns(e.target.checked)} />
                Show all columns
              </label>
            </div>

            <div className="viz-table-wrap">
              <table className="viz-table">
                <thead>
                  <tr>
                    {visibleKeys.map(key => (
                      <th key={key} className={key === 'amount' ? 'num' : ''} onClick={() => handleSort(key)}>
                        {labelFor(key)}
                        {sortKey === key && <span className="viz-sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((e, idx) => (
                    <tr key={e.id ?? idx}>
                      {visibleKeys.map(key => {
                        if (key === 'glEntry') {
                          const dir = (e.glEntry || '').toLowerCase()
                          return (
                            <td key={key}>
                              {dir === 'debit' || dir === 'credit'
                                ? <span className={`entry-glentry entry-glentry-${dir}`}>{e.glEntry}</span>
                                : formatValue(key, e[key])}
                            </td>
                          )
                        }
                        if (key === 'amount') {
                          const n = Number(e.amount) || 0
                          return <td key={key} className={`num ${n < 0 ? 'amt-neg' : 'amt-pos'}`}>{formatValue(key, e[key])}</td>
                        }
                        return <td key={key}>{formatValue(key, e[key])}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="btn-row">
              <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                {downloaded ? '✓ Downloaded' : '⬇ Download visible columns as CSV'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
