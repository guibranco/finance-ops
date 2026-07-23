import { useState } from 'react'
import { usePersistedField, USER_EMAIL_KEY } from '../../hooks/usePersistedField'
import CopyButton from '../CopyButton'
import RulesGrid from '../RulesGrid'

const STATUSES = ['Refunded', 'Collected', 'Rejected']

const SAMPLE_COLLECTION = JSON.stringify({
  BatchId: '00000000-0000-0000-0000-000000000000',
  CollectionId: '356257f5-8dfe-468f-849f-93d9a3d2422f',
  PaymentScheduleItemIds: [
    'eb737109-a04b-4dd3-bd7b-1e6f0f71c1cb',
    'ef3aba95-37a0-49a1-ac84-6e9d2327b9cc',
  ],
  PolicyNumber: 'OUTINT00172379',
  RiskId: 1,
  RiskCode: 'VEH',
  RiskMajorVersion: 1,
  IsRealtime: true,
  IsResubmission: false,
  ResubmissionId: null,
  AmountDue: 108.53,
  DueDate: '2024-08-08',
  ValueDate: '2024-08-08',
  CollectionStatus: 'Created',
  IsLatest: true,
  Sequence: 1,
  PaymentMethod: {
    $type: 'CardPaymentMethodDocument',
    Token: '1854393882611111',
    GatewayReference: 'OUTINT00172379-AUTH-20240808084249',
    MaskedCardNumber: '411111******1111',
    NameOnCard: 'CROOKS',
    CardType: 'VISA CREDIT',
    ExpiryDate: '08/2026',
    PaymentProvider: 'Boipa',
  },
  TransactionReference: 'OUTINT00172379-1-1-VEH-1',
  OriginalTransactionReference: null,
  ProviderDetails: null,
  id: 'Collection-1-1',
  CreatedBy: 'SYSTEM',
  CreatedDate: '2024-08-08T08:43:07.5350326+00:00',
  ModifiedBy: 'SYSTEM',
  ModifiedDate: '2024-08-08T08:43:07.5350326+00:00',
  CollectionFrequency: 'Monthly',
  SourceSystem: 'PolicyAdmin',
  _etag: '"0000a1b2-0000-0000-0000-5f8d3a2e0000"',
  _rid: 'AbCdEfGhIjK=',
  _self: 'dbs/AbCdEf==/colls/AbCdEfGh==/docs/AbCdEfGhIjK=/',
  _attachments: 'attachments/',
  _ts: 1723106587,
}, null, 2)

function removeCosmosFields(obj) {
  const cleaned = { ...obj }
  delete cleaned._etag
  delete cleaned._rid
  delete cleaned._self
  delete cleaned._attachments
  delete cleaned._ts
  return cleaned
}

function renderDiffLines(left, right) {
  const leftLines = JSON.stringify(left, null, 4).split('\n')
  const rightLines = JSON.stringify(right, null, 4).split('\n')
  const max = Math.max(leftLines.length, rightLines.length)
  const leftHtml = []
  const rightHtml = []

  for (let i = 0; i < max; i++) {
    const l = leftLines[i] ?? ''
    const r = rightLines[i] ?? ''
    if (!l && r) {
      leftHtml.push('')
      rightHtml.push({ text: r, cls: 'diff-added' })
    } else if (l && !r) {
      leftHtml.push({ text: l, cls: 'diff-removed' })
      rightHtml.push('')
    } else if (l !== r) {
      leftHtml.push({ text: l, cls: 'diff-changed' })
      rightHtml.push({ text: r, cls: 'diff-changed' })
    } else {
      leftHtml.push(l)
      rightHtml.push(r)
    }
  }
  return { leftHtml, rightHtml }
}

function DiffPane({ lines }) {
  return (
    <div className="diff-pane">
      {lines.map((line, i) => {
        if (!line) return <span key={i}>{'\n'}</span>
        if (typeof line === 'string') return <span key={i}>{line + '\n'}</span>
        return <span key={i} className={line.cls}>{line.text + '\n'}</span>
      })}
    </div>
  )
}

// Try to parse a date string to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    // Format as YYYY-MM-DDTHH:mm in local time
    const pad = n => String(n).padStart(2, '0')
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    )
  } catch {
    return ''
  }
}

export default function UpdateCollectionStatus() {
  const [email, setEmail] = usePersistedField(USER_EMAIL_KEY)
  const [inputJson, setInputJson] = useState('')
  const [newStatus, setNewStatus] = useState('Rejected')
  const [processingDate, setProcessingDate] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [historicDoc, setHistoricDoc] = useState('')
  const [newDoc, setNewDoc] = useState('')
  const [diffLines, setDiffLines] = useState(null)
  const [error, setError] = useState('')

  // When JSON input changes, try to prefill processingDate from ModifiedDate
  function handleJsonChange(val) {
    setInputJson(val)
    setError('')
    try {
      const parsed = JSON.parse(val)
      if (parsed.ModifiedDate) {
        setProcessingDate(toDatetimeLocal(parsed.ModifiedDate))
      }
    } catch {
      // ignore parse errors while typing
    }
  }

  const isDateStatus = newStatus === 'Refunded' || newStatus === 'Collected'
  const isRejected = newStatus === 'Rejected'

  function generate() {
    setError('')
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!inputJson.trim()) {
      setError('Please paste the collection JSON document.')
      return
    }
    if (isDateStatus && !processingDate) {
      setError('Please enter a Processing Date.')
      return
    }
    if (isRejected && !errorCode.trim()) {
      setError('Please enter an Error Code.')
      return
    }
    if (isRejected && !errorMessage.trim()) {
      setError('Please enter an Error Message.')
      return
    }

    try {
      const raw = JSON.parse(inputJson)
      const input = removeCosmosFields(raw)
      const originalId = input.id
      const now = new Date().toISOString()

      // ── Historic item (the old IsLatest=true becomes the archive) ──────
      const historic = JSON.parse(JSON.stringify(input))
      historic.IsLatest = false
      historic.ModifiedBy = email
      historic.ModifiedDate = now
      historic.id = `${originalId}-${input.CollectionStatus}`

      // ── New item (becomes the new latest) ─────────────────────────────
      const fresh = JSON.parse(JSON.stringify(input))
      fresh.IsLatest = true
      fresh.CollectionStatus = newStatus
      fresh.id = originalId
      fresh.CreatedBy = email
      fresh.CreatedDate = now
      fresh.ModifiedBy = email
      fresh.ModifiedDate = now

      if (isDateStatus) {
        const pd = processingDate ? new Date(processingDate).toISOString() : now
        fresh.ProviderDetails = {
          ...(fresh.ProviderDetails || {}),
          ProcessingDate: pd,
          Filename: fresh.ProviderDetails?.Filename ?? null,
          ErrorCode: null,
          ErrorMessage: null,
        }
      } else {
        // Rejected
        fresh.ProviderDetails = {
          ProcessingDate: now,
          Filename: null,
          ErrorCode: errorCode.trim(),
          ErrorMessage: errorMessage.trim(),
        }
      }

      setHistoricDoc(JSON.stringify(historic, null, 4))
      setNewDoc(JSON.stringify(fresh, null, 4))
      setDiffLines(renderDiffLines(historic, fresh))
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
    }
  }

  function loadSample() {
    handleJsonChange(SAMPLE_COLLECTION)
    setHistoricDoc('')
    setNewDoc('')
    setDiffLines(null)
  }

  function handleClear() {
    setInputJson('')
    setHistoricDoc('')
    setNewDoc('')
    setDiffLines(null)
    setError('')
    setProcessingDate('')
    setErrorCode('')
    setErrorMessage('')
  }

  const statusColors = {
    Refunded: 'var(--info)',
    Collected: 'var(--green)',
    Rejected: 'var(--danger)',
  }

  return (
    <div>
      {/* Top row: config + JSON input */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>

        {/* Config sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-title">
              <span className="card-title-dot" />
              Your Email
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.ie"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Used as CreatedBy, ModifiedBy. Persisted.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span className="card-title-dot" />
              New Collection Status
            </div>
            <div className="form-field" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      border: `2px solid ${newStatus === s ? statusColors[s] : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: newStatus === s ? `color-mix(in srgb, ${statusColors[s]} 10%, transparent)` : 'var(--bg)',
                      color: newStatus === s ? statusColors[s] : 'var(--text-muted)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional fields */}
            {isDateStatus && (
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">ProviderDetails.ProcessingDate</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={processingDate}
                  onChange={e => setProcessingDate(e.target.value)}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Pre-filled from ModifiedDate. Editable.
                </p>
              </div>
            )}

            {isRejected && (
              <>
                <div className="form-field">
                  <label className="form-label">ProviderDetails.ErrorCode</label>
                  <input
                    className="form-input"
                    placeholder="e.g. NOT_FOUND"
                    value={errorCode}
                    onChange={e => setErrorCode(e.target.value)}
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">ProviderDetails.ErrorMessage</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Transaction not found in gateway"
                    value={errorMessage}
                    onChange={e => setErrorMessage(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* JSON input + generate */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" />
            Input Collection JSON <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-faint)', fontSize: '0.75rem' }}>(IsLatest = true)</span>
          </div>
          <div className="code-area-wrap">
            <textarea
              className="code-area code-area-tall"
              value={inputJson}
              onChange={e => handleJsonChange(e.target.value)}
              placeholder="Paste the original collection document here..."
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={generate}>Generate Documents →</button>
            <button className="btn btn-ghost" onClick={loadSample}>Load sample</button>
            <button className="btn btn-ghost" onClick={handleClear}>Clear</button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>

      {/* Two outputs */}
      <div className="tool-grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" />
            Historic Item <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-faint)', fontSize: '0.75rem' }}>IsLatest = false · id appended</span>
          </div>
          <div className="code-area-wrap">
            <textarea
              className="code-area code-area-tall"
              value={historicDoc}
              readOnly
              placeholder="Updated original will appear here..."
            />
            <CopyButton text={historicDoc} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span className="card-title-dot green" />
            New Item
            {newStatus && (
              <span style={{
                marginLeft: 8,
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                background: `color-mix(in srgb, ${statusColors[newStatus]} 12%, transparent)`,
                color: statusColors[newStatus],
                border: `1px solid color-mix(in srgb, ${statusColors[newStatus]} 30%, transparent)`,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}>
                {newStatus}
              </span>
            )}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-faint)', fontSize: '0.75rem', marginLeft: 6 }}>IsLatest = true</span>
          </div>
          <div className="code-area-wrap">
            <textarea
              className="code-area code-area-tall"
              value={newDoc}
              readOnly
              placeholder="New processed document will appear here..."
            />
            <CopyButton text={newDoc} />
          </div>
        </div>
      </div>

      {/* Diff viewer */}
      {diffLines && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>
            <span className="card-title-dot" />
            Diff Viewer
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: '0.72rem', fontWeight: 500 }}>
              <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>■ removed/changed</span>
              <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>■ added/changed</span>
            </span>
          </div>
          <div className="diff-grid">
            <DiffPane lines={diffLines.leftHtml} />
            <DiffPane lines={diffLines.rightHtml} />
          </div>
        </div>
      )}

      <RulesGrid
        title="Transformation Rules"
        rules={[
          { label: 'Historic item id', rule: '{originalId}-{currentCollectionStatus}' },
          { label: 'Historic item IsLatest', rule: 'false' },
          { label: 'Historic item ModifiedBy / ModifiedDate', rule: 'Email field / now' },
          { label: 'New item id', rule: 'Same as original id (unchanged)' },
          { label: 'New item IsLatest', rule: 'true' },
          { label: 'New item CreatedBy / CreatedDate', rule: 'Email field / now' },
          { label: 'New item ModifiedBy / ModifiedDate', rule: 'Email field / now' },
          { label: 'Refunded / Collected ProviderDetails', rule: 'ProcessingDate set from input field' },
          { label: 'Rejected ProviderDetails', rule: 'ErrorCode and ErrorMessage from input fields' },
          { label: 'Cosmos fields removed', rule: '_etag · _rid · _self · _attachments · _ts' },
        ]}
      />
    </div>
  )
}
