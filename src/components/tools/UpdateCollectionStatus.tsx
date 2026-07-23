import { useState } from 'react'
import { usePersistedField, USER_EMAIL_KEY } from '../../hooks/usePersistedField'
import CopyButton from '../CopyButton'
import RulesGrid from '../RulesGrid'
import {
  alert,
  alertVariants,
  btn,
  btnGhost,
  btnPrimary,
  btnRow,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  codeArea,
  codeAreaTall,
  codeAreaWrap,
  cx,
  diffAdded,
  diffChanged,
  diffGrid,
  diffPane,
  diffRemoved,
  formField,
  formInput,
  formLabel,
  toolGrid2,
} from '../../ui'

type Status = 'Refunded' | 'Collected' | 'Rejected'

const STATUSES: Status[] = ['Refunded', 'Collected', 'Rejected']

const statusButtonBase = 'flex-1 px-1 py-2 border-2 rounded-sm font-ui text-[0.78rem] font-bold cursor-pointer transition-all'
const statusButtonInactive = 'border-border bg-bg text-text-muted'
const statusButtonActiveVariants: Record<Status, string> = {
  Refunded: 'border-info bg-info/10 text-info',
  Collected: 'border-green bg-green/10 text-green',
  Rejected: 'border-danger bg-danger/10 text-danger',
}
const newItemBadgeVariants: Record<Status, string> = {
  Refunded: 'bg-info/12 text-info border border-info/30',
  Collected: 'bg-green/12 text-green border border-green/30',
  Rejected: 'bg-danger/12 text-danger border border-danger/30',
}

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

function removeCosmosFields(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...obj }
  delete cleaned._etag
  delete cleaned._rid
  delete cleaned._self
  delete cleaned._attachments
  delete cleaned._ts
  return cleaned
}

type DiffSegment = string | { text: string; cls: string }

function renderDiffLines(left: unknown, right: unknown): { leftHtml: DiffSegment[]; rightHtml: DiffSegment[] } {
  const leftLines = JSON.stringify(left, null, 4).split('\n')
  const rightLines = JSON.stringify(right, null, 4).split('\n')
  const max = Math.max(leftLines.length, rightLines.length)
  const leftHtml: DiffSegment[] = []
  const rightHtml: DiffSegment[] = []

  for (let i = 0; i < max; i++) {
    const l = leftLines[i] ?? ''
    const r = rightLines[i] ?? ''
    if (!l && r) {
      leftHtml.push('')
      rightHtml.push({ text: r, cls: diffAdded })
    } else if (l && !r) {
      leftHtml.push({ text: l, cls: diffRemoved })
      rightHtml.push('')
    } else if (l !== r) {
      leftHtml.push({ text: l, cls: diffChanged })
      rightHtml.push({ text: r, cls: diffChanged })
    } else {
      leftHtml.push(l)
      rightHtml.push(r)
    }
  }
  return { leftHtml, rightHtml }
}

function DiffPane({ lines }: { lines: DiffSegment[] }) {
  return (
    <div className={diffPane}>
      {lines.map((line, i) => {
        if (!line) return <span key={i}>{'\n'}</span>
        if (typeof line === 'string') return <span key={i}>{line + '\n'}</span>
        return <span key={i} className={line.cls}>{line.text + '\n'}</span>
      })}
    </div>
  )
}

// Try to parse a date string to datetime-local format (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(isoString?: string): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    // Format as YYYY-MM-DDTHH:mm in local time
    const pad = (n: number) => String(n).padStart(2, '0')
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
  const [newStatus, setNewStatus] = useState<Status>('Rejected')
  const [processingDate, setProcessingDate] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [historicDoc, setHistoricDoc] = useState('')
  const [newDoc, setNewDoc] = useState('')
  const [diffLines, setDiffLines] = useState<{ leftHtml: DiffSegment[]; rightHtml: DiffSegment[] } | null>(null)
  const [error, setError] = useState('')

  // When JSON input changes, try to prefill processingDate from ModifiedDate
  function handleJsonChange(val: string) {
    setInputJson(val)
    setError('')
    try {
      const parsed = JSON.parse(val) as Record<string, unknown>
      if (typeof parsed.ModifiedDate === 'string') {
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
      const raw = JSON.parse(inputJson) as Record<string, unknown>
      const input = removeCosmosFields(raw)
      const originalId = input.id
      const now = new Date().toISOString()

      // ── Historic item (the old IsLatest=true becomes the archive) ──────
      const historic = JSON.parse(JSON.stringify(input)) as Record<string, unknown>
      historic.IsLatest = false
      historic.ModifiedBy = email
      historic.ModifiedDate = now
      historic.id = `${originalId as string}-${input.CollectionStatus as string}`

      // ── New item (becomes the new latest) ─────────────────────────────
      const fresh = JSON.parse(JSON.stringify(input)) as Record<string, unknown>
      fresh.IsLatest = true
      fresh.CollectionStatus = newStatus
      fresh.id = originalId
      fresh.CreatedBy = email
      fresh.CreatedDate = now
      fresh.ModifiedBy = email
      fresh.ModifiedDate = now

      if (isDateStatus) {
        const pd = processingDate ? new Date(processingDate).toISOString() : now
        const existingProviderDetails = (fresh.ProviderDetails as Record<string, unknown> | null | undefined) || {}
        fresh.ProviderDetails = {
          ...existingProviderDetails,
          ProcessingDate: pd,
          Filename: existingProviderDetails.Filename ?? null,
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
      setError('Invalid JSON: ' + (e as Error).message)
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

  return (
    <div>
      {/* Top row: config + JSON input */}
      <div className="grid grid-cols-[320px_1fr] gap-5 mb-5 items-start max-tool:grid-cols-1">

        {/* Config sidebar */}
        <div className="flex flex-col gap-3.5">
          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} />
              Your Email
            </div>
            <div className={formField} style={{ marginBottom: 0 }}>
              <input
                type="email"
                className={formInput}
                placeholder="you@company.ie"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className="text-[0.72rem] text-text-muted mt-1.5">
                Used as CreatedBy, ModifiedBy. Persisted.
              </p>
            </div>
          </div>

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} />
              New Collection Status
            </div>
            <div className={formField} style={{ marginBottom: 14 }}>
              <div className="flex gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={cx(statusButtonBase, newStatus === s ? statusButtonActiveVariants[s] : statusButtonInactive)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional fields */}
            {isDateStatus && (
              <div className={formField} style={{ marginBottom: 0 }}>
                <label className={formLabel}>ProviderDetails.ProcessingDate</label>
                <input
                  type="datetime-local"
                  className={formInput}
                  value={processingDate}
                  onChange={e => setProcessingDate(e.target.value)}
                />
                <p className="text-[0.72rem] text-text-muted mt-1.5">
                  Pre-filled from ModifiedDate. Editable.
                </p>
              </div>
            )}

            {isRejected && (
              <>
                <div className={formField}>
                  <label className={formLabel}>ProviderDetails.ErrorCode</label>
                  <input
                    className={formInput}
                    placeholder="e.g. NOT_FOUND"
                    value={errorCode}
                    onChange={e => setErrorCode(e.target.value)}
                  />
                </div>
                <div className={formField} style={{ marginBottom: 0 }}>
                  <label className={formLabel}>ProviderDetails.ErrorMessage</label>
                  <input
                    className={formInput}
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
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Input Collection JSON <span className="font-normal normal-case tracking-normal text-text-faint text-[0.75rem]">(IsLatest = true)</span>
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={inputJson}
              onChange={e => handleJsonChange(e.target.value)}
              placeholder="Paste the original collection document here..."
            />
          </div>
          <div className={btnRow}>
            <button className={cx(btn, btnPrimary)} onClick={generate}>Generate Documents →</button>
            <button className={cx(btn, btnGhost)} onClick={loadSample}>Load sample</button>
            <button className={cx(btn, btnGhost)} onClick={handleClear}>Clear</button>
          </div>
          {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
        </div>
      </div>

      {/* Two outputs */}
      <div className={cx(toolGrid2, 'mb-5')}>
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Historic Item <span className="font-normal normal-case tracking-normal text-text-faint text-[0.75rem]">IsLatest = false · id appended</span>
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={historicDoc}
              readOnly
              placeholder="Updated original will appear here..."
            />
            <CopyButton text={historicDoc} />
          </div>
        </div>

        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDotGreen} />
            New Item
            {newStatus && (
              <span className={cx('ml-2 px-2 py-0.5 rounded-full text-[0.7rem] font-bold font-mono tracking-[0.04em]', newItemBadgeVariants[newStatus])}>
                {newStatus}
              </span>
            )}
            <span className="font-normal normal-case tracking-normal text-text-faint text-[0.75rem] ml-1.5">IsLatest = true</span>
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
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
        <div className={cx(card, 'mb-5')}>
          <div className={cx(cardTitle, 'mb-3.5')}>
            <span className={cardTitleDot} />
            Diff Viewer
            <span className="ml-auto flex gap-3 text-[0.72rem] font-medium">
              <span className="text-danger font-mono">■ removed/changed</span>
              <span className="text-green font-mono">■ added/changed</span>
            </span>
          </div>
          <div className={diffGrid}>
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
