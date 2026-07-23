import { useState } from 'react'
import CopyButton from '../CopyButton'
import RulesGrid from '../RulesGrid'
import {
  alert,
  alertVariants,
  badge,
  badgeVariants,
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
  toolGrid2,
} from '../../ui'

type Status = 'ready' | 'success' | 'error'
type RequestType = 'raise' | 'failed'

interface PaymentMethod {
  $type?: string
  [key: string]: unknown
}

interface CollectionItemInput {
  CollectionId: string
  PolicyNumber: string
  RiskCode: string
  RiskMajorVersion: number
  ValueDate: string
  RiskId: number
  TransactionReference: string
  CollectionStatus: string
  PaymentScheduleItemIds: string[]
  PaymentMethod?: PaymentMethod
  ProviderDetails?: { ProcessingDate?: string; [key: string]: unknown }
  id?: string
}

interface ShadowLedgerRequest {
  policyNumber: string
  riskCode: string
  riskMajorVersion: number
  valueDate: string | null
  riskId: number
  paymentScheduleId: string
  transactionReference: string
  isDirectDebitPayment: boolean
  collectionItemId: string
  paymentScheduleItemIds: string[]
  transactionDate?: string
  reportedDate?: string | null
}

const SAMPLE_COLLECTION: CollectionItemInput & Record<string, unknown> = {
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
  CollectionStatus: 'Collected',
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
  ProviderDetails: {
    ProcessingDate: '2024-08-08T08:43:07.260869+00:00',
    Filename: null,
    ErrorCode: null,
    ErrorMessage: null,
  },
  id: 'Collection-1-1',
  CreatedBy: 'SYSTEM',
  CreatedDate: '2024-08-08T08:43:07.5350326+00:00',
  ModifiedBy: 'DatabaseUpdater',
  ModifiedDate: '2025-04-01T12:27:05.7976906+00:00',
  CollectionFrequency: 'Monthly',
  SourceSystem: 'PolicyAdmin',
}

function formatDate(dateString?: string | null): string | null {
  if (!dateString) return null
  if (dateString.includes('T')) return dateString.split('T')[0]
  return dateString
}

function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateString}`)
  return d.toISOString()
}

function determineRequestType(collectionStatus: string): RequestType {
  const raiseStatuses = ['created', 'refunded', 'collected']
  const failedStatuses = ['rejected']
  const norm = collectionStatus?.trim().toLowerCase()
  if (raiseStatuses.includes(norm)) return 'raise'
  if (failedStatuses.includes(norm)) return 'failed'
  throw new Error(`Unknown CollectionStatus: "${collectionStatus}". Expected one of: Created, Refunded, Collected, Rejected`)
}

function determineDirectDebitFlag(paymentMethod?: PaymentMethod): boolean {
  if (!paymentMethod || !paymentMethod['$type']) return true
  return paymentMethod['$type'] !== 'CardPaymentMethodDocument'
}

function convertCollectionItem(item: CollectionItemInput): { request: ShadowLedgerRequest; type: RequestType } {
  const required: (keyof CollectionItemInput)[] = ['CollectionId', 'PolicyNumber', 'RiskCode', 'RiskMajorVersion', 'ValueDate', 'RiskId', 'TransactionReference', 'CollectionStatus', 'PaymentScheduleItemIds']
  for (const f of required) {
    if (item[f] === undefined || item[f] === null) throw new Error(`Missing required field: ${f}`)
  }

  const reqType = determineRequestType(item.CollectionStatus)
  const isDD = determineDirectDebitFlag(item.PaymentMethod)
  const processingDate = item.ProviderDetails?.ProcessingDate
  if (!processingDate) throw new Error('Missing ProviderDetails.ProcessingDate field')

  const base: ShadowLedgerRequest = {
    policyNumber: item.PolicyNumber,
    riskCode: item.RiskCode,
    riskMajorVersion: item.RiskMajorVersion,
    valueDate: formatDate(item.ValueDate),
    riskId: item.RiskId,
    paymentScheduleId: item.CollectionId,
    transactionReference: item.TransactionReference,
    isDirectDebitPayment: isDD,
    collectionItemId: item.id || item.CollectionId,
    paymentScheduleItemIds: item.PaymentScheduleItemIds,
  }

  if (reqType === 'raise') {
    base.transactionDate = formatDateTime(processingDate)
  } else {
    base.reportedDate = formatDate(processingDate)
  }

  return { request: base, type: reqType }
}

export default function CollectionItem2ShadowLedger() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('ready')
  const [reqType, setReqType] = useState('')
  const [error, setError] = useState('')

  function handleConvert() {
    setError('')
    setOutput('')
    setReqType('')
    if (!input.trim()) {
      setError('Please enter a Collection Item JSON.')
      setStatus('error')
      return
    }
    try {
      const item = JSON.parse(input) as CollectionItemInput
      const result = convertCollectionItem(item)
      setOutput(JSON.stringify(result.request, null, 2))
      setReqType(result.type.toUpperCase())
      setStatus('success')
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  const statusVariant = badgeVariants[status]
  const statusLabel = { ready: 'Ready', success: 'Converted', error: 'Error' }[status]

  return (
    <div>
      <div className={toolGrid2}>
        {/* Input */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Input Collection Item JSON
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); setStatus('ready') }}
              placeholder="Paste a Collection Item document here..."
            />
          </div>
          <div className={btnRow}>
            <button className={cx(btn, btnPrimary)} onClick={handleConvert}>Convert →</button>
            <button className={cx(btn, btnGhost)} onClick={() => { setInput(JSON.stringify(SAMPLE_COLLECTION, null, 2)); setError(''); setOutput(''); setStatus('ready'); setReqType('') }}>
              Load sample
            </button>
            <button className={cx(btn, btnGhost)} onClick={() => { setInput(''); setOutput(''); setError(''); setStatus('ready'); setReqType('') }}>
              Clear
            </button>
          </div>
          {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
        </div>

        {/* Output */}
        <div className={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className={cx(cardTitle, 'mb-0')}>
              <span className={cardTitleDotGreen} />
              Shadow Ledger Request
            </div>
            <span className={cx(badge, statusVariant)}>{statusLabel}</span>
            {reqType && (
              <span className={cx(badge, reqType === 'RAISE' ? badgeVariants.raise : badgeVariants.failed)}>
                {reqType}
              </span>
            )}
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={output}
              readOnly
              placeholder="Shadow Ledger request will appear here..."
            />
            <CopyButton text={output} />
          </div>
        </div>
      </div>

      <RulesGrid
        title="Mapping Rules"
        style={{ marginTop: 24 }}
        rules={[
          { label: 'Payment Schedule ID', rule: 'CollectionId → paymentScheduleId' },
          { label: 'Direct Debit Flag', rule: 'CardPaymentMethodDocument → false · Other → true' },
          { label: 'Value Date', rule: 'ValueDate → valueDate (date only)' },
          { label: 'Transaction Date (raise)', rule: 'ProviderDetails.ProcessingDate → transactionDate (full ISO)' },
          { label: 'Reported Date (failed)', rule: 'ProviderDetails.ProcessingDate → reportedDate (date only)' },
          { label: 'Request Type', rule: 'Created/Refunded/Collected → RAISE · Rejected → FAILED' },
        ]}
      />
    </div>
  )
}
