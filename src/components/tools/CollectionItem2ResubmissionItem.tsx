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
  formField,
  formInput,
  formLabel,
  toolGrid2,
} from '../../ui'

interface CollectionInput {
  CollectionId: string
  PaymentScheduleItemIds: string[]
  PolicyNumber: string
  RiskId: number
  RiskMajorVersion: number
  RiskCode: string
  TransactionReference: string
  AmountDue: number
  Fee: number | null
  DueDate: string
}

const SAMPLE_INPUT = JSON.stringify({
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
  AmountDue: 108.53,
  Fee: null,
  DueDate: '2024-08-08',
  CollectionStatus: 'Rejected',
  TransactionReference: 'OUTINT00172379-1-1-VEH-1',
  id: 'Collection-1-1',
}, null, 2)

function toIsoWithOffset(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  return (
    date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds()) + '.' +
    String(date.getMilliseconds()).padStart(3, '0') +
    sign +
    pad(Math.floor(absOffset / 60)) + ':' +
    pad(absOffset % 60)
  )
}

function dateOnly(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function CollectionItem2ResubmissionItem() {
  const [input, setInput] = useState('')
  const [email, setEmail] = usePersistedField(USER_EMAIL_KEY)
  const [sequence, setSequence] = useState('1')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  function convert() {
    setError('')
    setOutput('')
    if (!input.trim()) {
      setError('Please paste a collection JSON document.')
      return
    }
    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }
    const seq = parseInt(sequence, 10)
    if (!sequence.trim() || isNaN(seq) || seq < 1) {
      setError('Please enter a valid sequence number (≥ 1).')
      return
    }
    try {
      const data = JSON.parse(input) as CollectionInput
      const now = new Date()
      const result = {
        Sequence: seq,
        CollectionId: data.CollectionId,
        PaymentScheduleItemIds: data.PaymentScheduleItemIds,
        PolicyNumber: data.PolicyNumber,
        RiskId: data.RiskId,
        RiskMajorVersion: data.RiskMajorVersion,
        RiskCode: data.RiskCode,
        TransactionReference: data.TransactionReference,
        IsOriginalPaymentDirectDebit: false,
        OriginalAmountDue: data.AmountDue,
        Fee: data.Fee ?? null,
        OriginalDueDate: data.DueDate,
        ResubmissionDueDate: dateOnly(now),
        IsProcessed: false,
        IsVoided: false,
        VoidedDate: '0001-01-01T00:00:00+00:00',
        id: `Resubmission-${data.RiskId}-${seq}`,
        CreatedBy: email,
        CreatedDate: toIsoWithOffset(now),
        ModifiedBy: email,
        ModifiedDate: toIsoWithOffset(now),
      }
      setOutput(JSON.stringify(result, null, 4))
    } catch (e) {
      setError('Invalid JSON: ' + (e as Error).message)
    }
  }

  return (
    <div>
      <div className={toolGrid2}>
        {/* Input */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Input Collection JSON
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
            <div className={formField} style={{ marginBottom: 0 }}>
              <label className={formLabel}>Email (CreatedBy / ModifiedBy)</label>
              <input
                className={formInput}
                type="email"
                placeholder="you@company.ie"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className={formField} style={{ marginBottom: 0 }}>
              <label className={formLabel}>Sequence</label>
              <input
                className={formInput}
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={sequence}
                onChange={e => setSequence(e.target.value)}
                style={{ width: 90 }}
              />
            </div>
          </div>

          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste the rejected collection JSON here..."
            />
          </div>
          <div className={btnRow}>
            <button className={cx(btn, btnPrimary)} onClick={convert}>Convert →</button>
            <button className={cx(btn, btnGhost)} onClick={() => { setInput(SAMPLE_INPUT); setError(''); setOutput('') }}>
              Load sample
            </button>
            <button className={cx(btn, btnGhost)} onClick={() => { setInput(''); setOutput(''); setError('') }}>
              Clear
            </button>
          </div>
          {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
        </div>

        {/* Output */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDotGreen} />
            Resubmission Document
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={output}
              readOnly
              placeholder="Resubmission JSON will appear here..."
            />
            <CopyButton text={output} />
          </div>
        </div>
      </div>

      <RulesGrid
        title="Field Mapping Rules"
        style={{ marginTop: 24 }}
        rules={[
          { label: 'Sequence', rule: 'From the Sequence input field' },
          { label: 'Document ID', rule: 'Resubmission-{RiskId}-{Sequence}' },
          { label: 'CreatedBy / ModifiedBy', rule: 'From the Email input field (persisted)' },
          { label: 'Dates', rule: 'CreatedDate & ModifiedDate set to now' },
          { label: 'ResubmissionDueDate', rule: "Today's date (YYYY-MM-DD)" },
          { label: 'IsOriginalPaymentDirectDebit', rule: 'Always false' },
          { label: 'IsProcessed / IsVoided', rule: 'Always false' },
        ]}
      />
    </div>
  )
}
