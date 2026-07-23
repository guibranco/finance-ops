import { useState } from 'react'
import { usePersistedField, USER_EMAIL_KEY } from '../../hooks/usePersistedField'
import CopyButton from '../CopyButton'
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
  divider,
  formField,
  formInput,
  formLabel,
  formSelect,
  itemAmount,
  itemId,
  itemInfo,
  scheduleItemCheck,
  scheduleItemCheckbox,
  scheduleItemsList,
  toolGrid2,
} from '../../ui'

type ProrataBasis = 'percent' | 'amount'
type ProrataAmountType = 'net' | 'gross'
type RefundType = 'full' | 'prorated'

interface ScheduleItem {
  Id: string
  CollectionType: string
  PeriodStartDate: string
  PeriodEndDate: string
  AdjustmentDate: string
  DueDate: string
  AmountDue: number
  NetAmount: number
  TaxesAndLevies: Record<string, number>
  AdminFees: Record<string, unknown>
  OriginalItem: unknown
  CollectionItemCreatedDate: string | null
}

interface PaymentSchedule {
  PolicyNumber: string
  RiskId: number
  RiskCode: string
  RiskMajorVersion: number
  PaymentScheduleId: string
  CollectionFrequency: string
  ScheduleItems: ScheduleItem[]
  ModifiedBy: string
  ModifiedDate: string
  [key: string]: unknown
}

const SAMPLE_SCHEDULE: PaymentSchedule = {
  $type: 'Stratos.Core.PolicyAdmin.CosmosDB.Documents.PaymentSchedules.PaymentScheduleCoreDocument, Stratos.Core.CosmosDB',
  PolicyNumber: 'OUTSTG00135448',
  RiskId: 1,
  RiskCode: 'HME',
  RiskMajorVersion: 1,
  PaymentScheduleId: '9481aa91-19d1-4017-8645-9883d596b662',
  IsLatest: false,
  CollectionFrequency: 'Annual',
  InceptionDate: '2025-11-03',
  CoverStartDate: '2025-11-03',
  CoverEndDate: '2026-11-02',
  ScheduleItems: [
    {
      Id: '6b7700a8-f0bf-4c52-990f-d7619567603c',
      CollectionType: 'Full',
      PeriodStartDate: '2025-11-03',
      PeriodEndDate: '2026-11-02',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2025-10-16',
      AmountDue: 408.28,
      NetAmount: 388.83,
      TaxesAndLevies: { LVY: 11.67, ICF: 7.78 },
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: '2025-10-16T00:35:32.8437466+00:00',
    },
    {
      Id: 'b4aebeee-e383-4825-9fa6-5cb1b78ee03f',
      CollectionType: 'Full',
      PeriodStartDate: '2025-10-16',
      PeriodEndDate: '2026-11-02',
      AdjustmentDate: '2025-10-16T00:35:31.3346075+00:00',
      DueDate: '2025-10-16',
      AmountDue: 1,
      NetAmount: 1,
      TaxesAndLevies: { SMD: 0 },
      AdminFees: { SMD: { AmountDue: 1, TaxAmount: 0 } },
      OriginalItem: null,
      CollectionItemCreatedDate: '2025-10-16T00:35:32.8437466+00:00',
    },
  ],
  ModifiedBy: 'qatest_policyadmin1@outsurance.ie',
  ModifiedDate: '2025-10-16T00:36:24.5055599+00:00',
  id: 'Risk-1*1.0-Schedule',
}

function deepClone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)) as T }

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100 }

// Negates every numeric leaf, scaled by ratio (1 = full refund, <1 = pro-rated).
function scaleAndNegateValues(obj: Record<string, unknown>, ratio: number): void {
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (typeof value === 'number') obj[key] = -round2(Math.abs(value) * ratio)
    else if (typeof value === 'object' && value !== null) scaleAndNegateValues(value as Record<string, unknown>, ratio)
  })
}

function toOffsetISOString(date: Date | string): string { return new Date(date).toISOString() }

function prorataBase(item: ScheduleItem, prorataAmountType: ProrataAmountType): number {
  return prorataAmountType === 'gross' ? item.AmountDue : item.NetAmount
}

interface RatioFnArgs {
  refundType: RefundType
  prorataBasis: ProrataBasis
  prorataAmountType: ProrataAmountType
  prorataValue: string
  selectedItems: number[]
  loadedSchedule: PaymentSchedule
}

// Validates the pro-rata inputs and returns a ratio function to apply per selected
// item, or an error message. Keeping this outside generateRefund (and returning a
// pure function instead of closing over component state) keeps both small.
function computeRefundRatioFn({ refundType, prorataBasis, prorataAmountType, prorataValue, selectedItems, loadedSchedule }: RatioFnArgs):
  { ratioFn: ((item: ScheduleItem) => number) | null; error: string | null } {
  if (refundType !== 'prorated') return { ratioFn: () => 1, error: null }

  const val = Number.parseFloat(prorataValue)
  if (!prorataValue || Number.isNaN(val) || val <= 0) {
    return { ratioFn: null, error: 'Enter a valid pro-rata percentage or amount.' }
  }
  if (prorataBasis === 'percent' && val > 100) {
    return { ratioFn: null, error: 'Pro-rata percentage cannot exceed 100%.' }
  }
  if (prorataBasis === 'amount' && selectedItems.length > 1) {
    return { ratioFn: null, error: 'Pro-rata by direct amount only supports a single selected item.' }
  }
  if (prorataBasis === 'percent') {
    const ratio = val / 100
    return { ratioFn: () => ratio, error: null }
  }

  const original = loadedSchedule.ScheduleItems[selectedItems[0]]
  const base = prorataBase(original, prorataAmountType)
  if (!base) {
    const baseLabel = prorataAmountType === 'gross' ? 'an AmountDue' : 'a NetAmount'
    return { ratioFn: null, error: `Selected item has ${baseLabel} of 0; cannot derive a ratio from a direct amount.` }
  }
  return { ratioFn: item => val / prorataBase(item, prorataAmountType), error: null }
}

interface BuildRefundedScheduleArgs {
  loadedSchedule: PaymentSchedule
  selectedItems: number[]
  ratioFn: (item: ScheduleItem) => number
  modBy: string
  nowIso: string
  today: string
  isoCreated: string | null
}

function buildRefundedSchedule({ loadedSchedule, selectedItems, ratioFn, modBy, nowIso, today, isoCreated }: BuildRefundedScheduleArgs) {
  const schedule = deepClone(loadedSchedule)
  schedule.ModifiedBy = modBy
  schedule.ModifiedDate = nowIso

  const generatedRefundItems: ScheduleItem[] = []
  let totalRefundAmount = 0

  selectedItems.forEach(index => {
    const original = loadedSchedule.ScheduleItems[index]
    const refundItem = deepClone(original)
    refundItem.Id = crypto.randomUUID()
    refundItem.AdjustmentDate = nowIso
    refundItem.DueDate = today
    scaleAndNegateValues(refundItem as unknown as Record<string, unknown>, ratioFn(original))
    refundItem.OriginalItem = deepClone(original)
    refundItem.CollectionItemCreatedDate = isoCreated || null
    totalRefundAmount += refundItem.AmountDue
    generatedRefundItems.push(refundItem)
    schedule.ScheduleItems.push(refundItem)
  })

  return { schedule, generatedRefundItems, totalRefundAmount }
}

interface BuildCollectionDocumentsArgs {
  schedule: PaymentSchedule
  generatedRefundItems: ScheduleItem[]
  totalRefundAmount: number
  modBy: string
  nowIso: string
  today: string
}

function buildCollectionDocuments({ schedule, generatedRefundItems, totalRefundAmount, modBy, nowIso, today }: BuildCollectionDocumentsArgs) {
  const baseCollection = {
    BatchId: '00000000-0000-0000-0000-000000000000',
    CollectionId: schedule.PaymentScheduleId,
    PaymentScheduleItemIds: generatedRefundItems.map(x => x.Id),
    PolicyNumber: schedule.PolicyNumber,
    RiskId: schedule.RiskId,
    RiskCode: schedule.RiskCode,
    RiskMajorVersion: schedule.RiskMajorVersion,
    RerateBatchItemId: null,
    IsRenewal: false,
    IsRealtime: false,
    IsResubmission: false,
    ResubmissionId: null,
    AmountDue: totalRefundAmount,
    Fee: null,
    DueDate: today,
    ValueDate: today,
    CollectionFrequency: schedule.CollectionFrequency,
    Sequence: 1,
    PaymentMethod: null,
    TransactionReference: `${schedule.PolicyNumber}-${schedule.RiskId}-${schedule.RiskMajorVersion}-${schedule.RiskCode}-0`,
    OriginalTransactionReference: null,
    SourceSystem: 'PolicyAdmin',
    CreatedBy: modBy,
    CreatedDate: nowIso,
    ModifiedBy: modBy,
    ModifiedDate: nowIso,
  }

  // Collection item ids follow `Collection-{RiskId}-{Sequence}`; the historic
  // (non-latest) record gets a status suffix, mirroring UpdateCollectionStatus.tsx.
  const baseId = `Collection-${schedule.RiskId}-${baseCollection.Sequence}`

  const createdOutput = JSON.stringify({
    ...deepClone(baseCollection),
    CollectionStatus: 'Created',
    IsLatest: false,
    ProviderDetails: null,
    id: `${baseId}-Created`,
  }, null, 4)

  const refundedOutput = JSON.stringify({
    ...deepClone(baseCollection),
    CollectionStatus: 'Refunded',
    IsLatest: true,
    id: baseId,
  }, null, 4)

  return { createdOutput, refundedOutput }
}

export default function PaymentSchedule2Refund() {
  const [inputJson, setInputJson] = useState('')
  const [loadedSchedule, setLoadedSchedule] = useState<PaymentSchedule | null>(null)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [modifiedBy, setModifiedBy] = usePersistedField(USER_EMAIL_KEY)
  const [collectionCreatedDate, setCollectionCreatedDate] = useState('')
  const [refundType, setRefundType] = useState<RefundType>('full')
  const [prorataBasis, setProrataBasis] = useState<ProrataBasis>('percent')
  const [prorataAmountType, setProrataAmountType] = useState<ProrataAmountType>('net')
  const [prorataValue, setProrataValue] = useState('')
  const [scheduleOutput, setScheduleOutput] = useState('')
  const [createdOutput, setCreatedOutput] = useState('')
  const [refundedOutput, setRefundedOutput] = useState('')
  const [loadError, setLoadError] = useState('')
  const [genError, setGenError] = useState('')

  function loadSchedule() {
    setLoadError('')
    try {
      const parsed = JSON.parse(inputJson) as PaymentSchedule
      setLoadedSchedule(parsed)
      setSelectedItems([])
      setScheduleOutput(''); setCreatedOutput(''); setRefundedOutput('')
    } catch (e) {
      setLoadError('Invalid JSON: ' + (e as Error).message)
    }
  }

  function loadSample() {
    const str = JSON.stringify(SAMPLE_SCHEDULE, null, 2)
    setInputJson(str)
    setLoadedSchedule(deepClone(SAMPLE_SCHEDULE))
    setSelectedItems([])
    setScheduleOutput(''); setCreatedOutput(''); setRefundedOutput('')
    setLoadError('')
  }

  function toggleItem(index: number) {
    setSelectedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  function generateRefund() {
    setGenError('')
    if (!loadedSchedule) { setGenError('Load a schedule first.'); return }
    if (!modifiedBy) { setGenError('Modified By is required.'); return }
    if (selectedItems.length === 0) { setGenError('Select at least one schedule item.'); return }

    const { ratioFn, error } = computeRefundRatioFn({
      refundType, prorataBasis, prorataAmountType, prorataValue, selectedItems, loadedSchedule,
    })
    if (error || !ratioFn) { setGenError(error ?? 'Unable to compute refund ratio.'); return }

    const now = new Date()
    const nowIso = toOffsetISOString(now)
    const today = now.toISOString().split('T')[0]
    const isoCreated = collectionCreatedDate ? toOffsetISOString(collectionCreatedDate) : null

    const { schedule, generatedRefundItems, totalRefundAmount } = buildRefundedSchedule({
      loadedSchedule, selectedItems, ratioFn, modBy: modifiedBy, nowIso, today, isoCreated,
    })
    setScheduleOutput(JSON.stringify(schedule, null, 4))

    if (isoCreated) {
      const { createdOutput, refundedOutput } = buildCollectionDocuments({
        schedule, generatedRefundItems, totalRefundAmount, modBy: modifiedBy, nowIso, today,
      })
      setCreatedOutput(createdOutput)
      setRefundedOutput(refundedOutput)
    } else {
      setCreatedOutput('')
      setRefundedOutput('')
    }
  }

  const amountTypeShort = prorataAmountType === 'gross' ? 'Gross' : 'Net'
  const amountTypeBasisDescription = prorataAmountType === 'gross'
    ? 'AmountDue (gross = NetAmount + TaxesAndLevies)'
    : 'NetAmount'

  return (
    <div className="flex flex-col gap-5">
      {/* Top row: Input + Config */}
      <div className={toolGrid2}>
        {/* Schedule input */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> Input Payment Schedule JSON
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, 'min-h-[280px]')}
              value={inputJson}
              onChange={e => { setInputJson(e.target.value); setLoadError('') }}
              placeholder="Paste the PaymentSchedule document here..."
            />
          </div>
          <div className={btnRow}>
            <button type="button" className={cx(btn, btnPrimary)} onClick={loadSchedule}>Load Schedule</button>
            <button type="button" className={cx(btn, btnGhost)} onClick={loadSample}>Load sample</button>
            <button type="button" className={cx(btn, btnGhost)} onClick={() => { setInputJson(''); setLoadedSchedule(null); setSelectedItems([]); setScheduleOutput(''); setCreatedOutput(''); setRefundedOutput(''); setLoadError(''); setGenError(''); setRefundType('full'); setProrataBasis('percent'); setProrataAmountType('net'); setProrataValue('') }}>
              Clear
            </button>
          </div>
          {loadError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{loadError}</div>}
        </div>

        {/* Config + Schedule items */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> Refund Configuration
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="ps-modified-by">Modified By (persisted)</label>
            <input
              id="ps-modified-by"
              className={formInput}
              placeholder="email@company.ie"
              value={modifiedBy}
              onChange={e => setModifiedBy(e.target.value)}
            />
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="ps-collection-created-date">Collection Created Date (optional)</label>
            <div className="flex gap-2">
              <input
                id="ps-collection-created-date"
                type="datetime-local"
                step="1"
                className={formInput}
                value={collectionCreatedDate}
                onChange={e => setCollectionCreatedDate(e.target.value)}
              />
              <button
                type="button"
                className={cx(btn, btnGhost)}
                onClick={() => setCollectionCreatedDate('')}
                disabled={!collectionCreatedDate}
              >
                Clear date
              </button>
            </div>
            <p className="text-[0.73rem] text-text-muted mt-[5px]">
              When set, generates Created &amp; Refunded collection documents.
            </p>
          </div>

          <div className={divider} />

          <div className={cx(cardTitle, 'mb-[10px]')}>
            <span className={cardTitleDot} /> Refund Type
          </div>
          <div className={cx(formField, 'flex gap-4')}>
            <label className="flex items-center gap-1.5 text-[0.82rem] cursor-pointer">
              <input
                type="radio"
                name="refundType"
                checked={refundType === 'full'}
                onChange={() => setRefundType('full')}
              /> Full
            </label>
            <label className="flex items-center gap-1.5 text-[0.82rem] cursor-pointer">
              <input
                type="radio"
                name="refundType"
                checked={refundType === 'prorated'}
                onChange={() => setRefundType('prorated')}
              /> Pro-rated
            </label>
          </div>

          {refundType === 'prorated' && (
            <>
              <div className={formField}>
                <label className={formLabel} htmlFor="ps-prorata-basis">Pro-rata Basis</label>
                <select
                  id="ps-prorata-basis"
                  className={formSelect}
                  value={prorataBasis}
                  onChange={e => setProrataBasis(e.target.value as ProrataBasis)}
                >
                  <option value="percent">Percentage</option>
                  <option value="amount">Direct Amount</option>
                </select>
              </div>
              {prorataBasis === 'amount' && (
                <div className={formField}>
                  <label className={formLabel} htmlFor="ps-prorata-amount-type">Amount Type</label>
                  <select
                    id="ps-prorata-amount-type"
                    className={formSelect}
                    value={prorataAmountType}
                    onChange={e => setProrataAmountType(e.target.value as ProrataAmountType)}
                  >
                    <option value="net">Net Amount</option>
                    <option value="gross">Gross Amount (AmountDue)</option>
                  </select>
                </div>
              )}
              <div className={formField}>
                <label className={formLabel} htmlFor="ps-prorata-value">
                  {prorataBasis === 'percent' ? 'Pro-rata %' : `Pro-rata ${amountTypeShort} Amount`}
                </label>
                <input
                  id="ps-prorata-value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={prorataBasis === 'percent' ? 100 : undefined}
                  className={formInput}
                  placeholder={prorataBasis === 'percent' ? 'e.g. 10' : 'e.g. 100.00'}
                  value={prorataValue}
                  onChange={e => setProrataValue(e.target.value)}
                />
                <p className="text-[0.73rem] text-text-muted mt-[5px]">
                  {prorataBasis === 'percent'
                    ? 'Applied uniformly to AmountDue, TaxesAndLevies and AdminFees for every selected item.'
                    : `Ratio is derived from this item's ${amountTypeBasisDescription} and applied to every component. Only one item can be selected.`}
                </p>
              </div>
            </>
          )}

          <div className={divider} />

          <div className={cx(cardTitle, 'mb-[10px]')}>
            <span className={cardTitleDotGreen} /> Select Schedule Items to Refund
          </div>

          {!loadedSchedule ? (
            <p className="text-text-faint text-[0.82rem] font-mono py-3">
              Load a schedule to see items here.
            </p>
          ) : (
            <div data-testid="schedule-items-list" className={scheduleItemsList}>
              {loadedSchedule.ScheduleItems.map((item, i) => (
                <label key={item.Id} className={scheduleItemCheck}>
                  <input
                    type="checkbox"
                    className={scheduleItemCheckbox}
                    checked={selectedItems.includes(i)}
                    onChange={() => toggleItem(i)}
                  />
                  <div className={itemInfo}>
                    <div className={itemId}>{item.Id}</div>
                    <div>
                      <span className={itemAmount}>€{item.AmountDue}</span>
                      {' · Due: '}{item.DueDate}
                      {' · '}{item.PeriodStartDate} → {item.PeriodEndDate}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className={btnRow}>
            <button
              type="button"
              className={cx(btn, btnPrimary)}
              onClick={generateRefund}
              disabled={!loadedSchedule || !modifiedBy || selectedItems.length === 0}
            >
              Generate Refund →
            </button>
          </div>
          {genError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{genError}</div>}
        </div>
      </div>

      {/* Output: Schedule */}
      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDotGreen} /> Updated Schedule Output
        </div>
        <div className={codeAreaWrap}>
          <textarea
            className={cx(codeArea, codeAreaTall)}
            value={scheduleOutput}
            readOnly
            placeholder="Updated schedule with refund items will appear here..."
          />
        </div>
        {scheduleOutput && (
          <div className="mt-2.5">
            <CopyButton text={scheduleOutput} style={{ position: 'static', marginTop: 10 }} />
          </div>
        )}
      </div>

      {/* Created + Refunded collection docs */}
      {(createdOutput || refundedOutput) && (
        <div className={toolGrid2}>
          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Created Collection Document
            </div>
            <div className={codeAreaWrap}>
              <textarea
                className={cx(codeArea, codeAreaTall)}
                value={createdOutput}
                readOnly
                placeholder="Created collection document..."
              />
            </div>
            {createdOutput && (
              <div className="mt-2.5">
                <CopyButton text={createdOutput} style={{ position: 'static', marginTop: 10 }} />
              </div>
            )}
          </div>

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDotGreen} /> Refunded Collection Document
            </div>
            <div className={codeAreaWrap}>
              <textarea
                className={cx(codeArea, codeAreaTall)}
                value={refundedOutput}
                readOnly
                placeholder="Refunded collection document..."
              />
            </div>
            {refundedOutput && (
              <div className="mt-2.5">
                <CopyButton text={refundedOutput} style={{ position: 'static', marginTop: 10 }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
