import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { usePersistedField, USER_EMAIL_KEY } from '../../hooks/usePersistedField'
import CopyButton from '../CopyButton'
import RulesGrid from '../RulesGrid'
import ReportImageActions from '../ReportImageActions'
import { buildScheduleDatesReport, countMovedItems, describeText, reportFileName } from '../../lib/scheduleDatesReport'
import {
  isIsoDate,
  shiftSchedule,
  validateSchedule,
  type DateChange,
  type PaymentScheduleDocument,
  type ShiftResult,
} from '../../lib/scheduleDates'
import {
  alert,
  alertList,
  alertListItem,
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
  diffChanged,
  diffGrid,
  diffPane,
  formField,
  formInput,
  formLabel,
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

const SAMPLE_SCHEDULE: PaymentScheduleDocument = {
  $type: 'Stratos.Core.PolicyAdmin.CosmosDB.Documents.PaymentSchedules.PaymentScheduleCoreDocument, Stratos.Core.CosmosDB',
  PolicyNumber: 'OUTSTG00298552',
  RiskId: 1,
  RiskCode: 'VEH',
  RiskMajorVersion: 4,
  PaymentScheduleId: '6327746e-d302-413a-9503-7c479063554b',
  IsLatest: true,
  CollectionFrequency: 'Monthly',
  CollectionDay: 18,
  InceptionDate: '2026-07-24',
  CoverStartDate: '2026-07-24',
  CoverEndDate: '2027-07-23',
  ScheduleItems: [
    {
      Id: '8a18bf93-8e85-467e-9df4-fe5511cbf8fe',
      CollectionType: 'Full',
      PeriodStartDate: '2026-07-24',
      PeriodEndDate: '2026-09-23',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2026-07-24',
      AmountDue: 73.19,
      NetAmount: 70.4,
      TaxesAndLevies: { LVY: 2.07, ICF: 0.72 },
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: '2026-07-24T01:14:25.9538426+00:00',
    },
    {
      Id: 'c1b5391a-4761-409d-97a5-7db92ecd5efa',
      CollectionType: 'Full',
      PeriodStartDate: '2026-07-24',
      PeriodEndDate: '2026-09-23',
      AdjustmentDate: '2026-07-24T01:14:21.0545026+00:00',
      DueDate: '2026-07-24',
      AmountDue: 1,
      NetAmount: 1,
      TaxesAndLevies: { SMD: 0 },
      AdminFees: { SMD: { AmountDue: 1, TaxAmount: 0 } },
      OriginalItem: null,
      CollectionItemCreatedDate: '2026-07-24T01:14:25.9538426+00:00',
    },
    {
      Id: 'dedf7ca5-8aa9-4378-8203-ee7d463cae2c',
      CollectionType: 'Full',
      PeriodStartDate: '2026-10-24',
      PeriodEndDate: '2026-11-23',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2026-09-18',
      AmountDue: 36.6,
      NetAmount: 35.19,
      TaxesAndLevies: { LVY: 1.06, ICF: 0.35 },
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: '2026-09-18T22:00:47.6551846+00:00',
    },
    {
      Id: '16a23b1f-de7e-4c5c-a0e1-71ba0455675c',
      CollectionType: 'ProRata',
      PeriodStartDate: '2026-11-19',
      PeriodEndDate: '2026-11-23',
      AdjustmentDate: '2026-11-19T14:40:15.5748814+00:00',
      DueDate: '2026-11-19',
      AmountDue: -0.46,
      NetAmount: -0.44,
      TaxesAndLevies: { LVY: -0.02, ICF: 0 },
      AdminFees: {},
      OriginalItem: {
        Id: '0a9603cf-b75f-47be-b369-b96303878a8f',
        CollectionType: 'Full',
        PeriodStartDate: '2026-10-24',
        PeriodEndDate: '2026-11-23',
        AdjustmentDate: '0001-01-01T00:00:00+00:00',
        DueDate: '2026-09-18',
        AmountDue: 33.76,
        NetAmount: 32.46,
        TaxesAndLevies: { LVY: 0.98, ICF: 0.32 },
        AdminFees: {},
        OriginalItem: null,
        CollectionItemCreatedDate: null,
      },
      CollectionItemCreatedDate: null,
    },
    {
      Id: '7bbe6c66-c966-464e-b110-616c5b87293b',
      CollectionType: 'Full',
      PeriodStartDate: '2027-06-24',
      PeriodEndDate: '2027-07-23',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2027-05-18',
      AmountDue: 33.76,
      NetAmount: 32.46,
      TaxesAndLevies: { LVY: 0.98, ICF: 0.32 },
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: null,
    },
  ],
  ModifiedBy: 'qatest_policyadmin1@outsurance.ie',
  ModifiedDate: '2026-11-19T14:40:16.4764736+00:00',
  id: 'Risk-1*4.0-Schedule',
}

type DiffSegment = string | { text: string; cls: string }

// The shift never adds or removes keys, so a line-by-line comparison of the
// pretty-printed documents lines up exactly and highlights every changed value.
function diffLines(before: unknown, after: unknown): { left: DiffSegment[]; right: DiffSegment[] } {
  const l = JSON.stringify(before, null, 4).split('\n')
  const r = JSON.stringify(after, null, 4).split('\n')
  const left: DiffSegment[] = []
  const right: DiffSegment[] = []
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    const a = l[i] ?? ''
    const b = r[i] ?? ''
    if (a === b) { left.push(a); right.push(b) } else {
      left.push({ text: a, cls: diffChanged })
      right.push({ text: b, cls: diffChanged })
    }
  }
  return { left, right }
}

function DiffPane({ lines, testId }: { lines: DiffSegment[]; testId: string }) {
  return (
    <div className={diffPane} data-testid={testId}>
      {lines.map((line, i) =>
        typeof line === 'string'
          ? <span key={i}>{line + '\n'}</span>
          : <span key={i} className={line.cls}>{line.text + '\n'}</span>,
      )}
    </div>
  )
}

const changedCell = 'bg-[rgba(234,179,8,0.14)] font-semibold'
const pillVariants = {
  boundary: `${statusPill} text-green bg-green-dim border border-green-border`,
  'mid-period': `${statusPill} text-warning bg-warning-dim border border-warning-border`,
  'outside-cover': `${statusPill} text-danger bg-danger-dim border border-[rgba(192,57,43,0.2)]`,
} as const

function DateCell({ change, first }: { change: DateChange; first?: boolean }) {
  const moved = change.from !== change.to
  return (
    <>
      <td className={first ? tdFirst : td}>{change.from}</td>
      <td className={cx(td, moved && changedCell)}>{change.to}</td>
    </>
  )
}

function ChangeTile({ label, change }: { label: string; change: DateChange | null }) {
  return (
    <div className={statTile}>
      <div className={statTileLabel}>{label}</div>
      <div className={cx(statTileValue, 'flex items-center gap-2 flex-wrap')}>
        {change ? (
          <>
            <span className="text-text-muted line-through decoration-1">{change.from}</span>
            <ArrowRight size={14} />
            <span>{change.to}</span>
          </>
        ) : <span className="text-text-muted">unchanged</span>}
      </div>
    </div>
  )
}

export default function ShiftScheduleDates() {
  const [inputJson, setInputJson] = useState('')
  const [loaded, setLoaded] = useState<PaymentScheduleDocument | null>(null)
  const [newCoverStart, setNewCoverStart] = useState('')
  const [modifiedBy, setModifiedBy] = usePersistedField(USER_EMAIL_KEY)
  const [result, setResult] = useState<ShiftResult | null>(null)
  const [output, setOutput] = useState('')
  const [loadError, setLoadError] = useState('')
  const [genError, setGenError] = useState('')

  function applyLoaded(doc: PaymentScheduleDocument) {
    setLoaded(doc)
    setNewCoverStart(doc.CoverStartDate)
    resetResult()
  }

  function resetResult() {
    setResult(null)
    setOutput('')
    setGenError('')
  }

  function loadSchedule() {
    setLoadError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(inputJson)
    } catch (e) {
      setLoaded(null)
      resetResult()
      setLoadError('Invalid JSON: ' + (e as Error).message)
      return
    }
    const errors = validateSchedule(parsed)
    if (errors.length) {
      setLoaded(null)
      resetResult()
      setLoadError(errors.join(' '))
      return
    }
    applyLoaded(parsed as PaymentScheduleDocument)
  }

  function loadSample() {
    setInputJson(JSON.stringify(SAMPLE_SCHEDULE, null, 2))
    setLoadError('')
    applyLoaded(structuredClone(SAMPLE_SCHEDULE))
  }

  function clearAll() {
    setInputJson('')
    setLoaded(null)
    setNewCoverStart('')
    setResult(null)
    setOutput('')
    setLoadError('')
    setGenError('')
  }

  function recalculate() {
    setGenError('')
    if (!loaded) { setGenError('Load a schedule first.'); return }
    if (!isIsoDate(newCoverStart)) { setGenError('Enter a valid new cover start date.'); return }
    if (newCoverStart === loaded.CoverStartDate) { setGenError('The new cover start date is the same as the current one.'); return }
    if (!modifiedBy) { setGenError('Modified By is required.'); return }

    const shifted = shiftSchedule(loaded, newCoverStart, { modifiedBy, nowIso: new Date().toISOString() })
    setResult(shifted)
    setOutput(JSON.stringify(shifted.schedule, null, 4))
  }

  const canRecalculate = !!loaded && isIsoDate(newCoverStart) && newCoverStart !== loaded.CoverStartDate && !!modifiedBy
  const diff = result && loaded ? diffLines(loaded, result.schedule) : null
  const movedItems = result ? countMovedItems(result) : 0

  return (
    <div className="flex flex-col gap-5">
      <div className={toolGrid2}>
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> Input Payment Schedule JSON
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, 'min-h-[280px]')}
              value={inputJson}
              onChange={e => { setInputJson(e.target.value); setLoadError('') }}
              placeholder="Paste the PaymentSchedule Cosmos document here..."
            />
          </div>
          <div className={btnRow}>
            <button type="button" className={cx(btn, btnPrimary)} onClick={loadSchedule}>Load Schedule</button>
            <button type="button" className={cx(btn, btnGhost)} onClick={loadSample}>Load sample</button>
            <button type="button" className={cx(btn, btnGhost)} onClick={clearAll}>Clear</button>
          </div>
          {loadError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{loadError}</div>}
        </div>

        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> New Cover Dates
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="sd-modified-by">Modified By (persisted)</label>
            <input
              id="sd-modified-by"
              className={formInput}
              placeholder="email@company.ie"
              value={modifiedBy}
              onChange={e => setModifiedBy(e.target.value)}
            />
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="sd-current-start">Current Cover Start</label>
            <input id="sd-current-start" className={formInput} value={loaded?.CoverStartDate ?? ''} readOnly placeholder="Load a schedule" />
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="sd-new-start">New Cover Start</label>
            <input
              id="sd-new-start"
              type="date"
              className={formInput}
              value={newCoverStart}
              disabled={!loaded}
              onChange={e => { setNewCoverStart(e.target.value); setGenError('') }}
            />
            <p className="text-[0.73rem] text-text-muted mt-[5px]">
              Every period is re-anchored on this date and CoverEndDate follows. DueDate and CollectionDay are not changed.
            </p>
          </div>
          {loaded && (
            <p className="text-[0.78rem] text-text-muted font-mono">
              {describeText(loaded.PolicyNumber)} · {describeText(loaded.CollectionFrequency)} · {loaded.ScheduleItems.length} items · {loaded.CoverStartDate} → {loaded.CoverEndDate}
            </p>
          )}
          <div className={btnRow}>
            <button type="button" className={cx(btn, btnPrimary)} onClick={recalculate} disabled={!canRecalculate}>
              Recalculate Periods →
            </button>
          </div>
          {genError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{genError}</div>}
        </div>
      </div>

      {result && (
        <div className={card}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className={cardTitle}>
              <span className={cardTitleDotGreen} /> Changes
            </div>
            {loaded && (
              <ReportImageActions
                getReport={() => buildScheduleDatesReport(loaded, result)}
                fileBaseName={reportFileName(loaded)}
                exportLabel="Export changes as image"
                copyTitle="Copy the cover-date changes and item table as a PNG image, ready to paste into Teams, Jira or Confluence"
              />
            )}
          </div>
          <div className={statTileRow}>
            <ChangeTile label="Cover Start" change={result.coverStart} />
            <ChangeTile label="Cover End" change={result.coverEnd} />
            <ChangeTile label="Inception" change={result.inception} />
            <div className={statTile}>
              <div className={statTileLabel}>Items moved</div>
              <div className={statTileValue} data-testid="items-moved">{movedItems} / {result.items.length}</div>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div data-testid="alert-warning" className={cx(alert, alertVariants.warning)}>
              Review before saving:
              <ul className={alertList}>
                {result.warnings.map(w => <li key={w} className={alertListItem}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className={tableWrap}>
            <table className={table} data-testid="changes-table">
              <thead>
                <tr className={theadRow}>
                  <th className={thFirst}>#</th>
                  <th className={th}>Type</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Due (kept)</th>
                  <th className={th}>Start before</th>
                  <th className={th}>Start after</th>
                  <th className={th}>End before</th>
                  <th className={th}>End after</th>
                  <th className={th}>Start kind</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map(item => (
                  <tr key={item.index} title={item.id}>
                    <td className={tdFirst}>{item.index + 1}</td>
                    <td className={td}>{item.collectionType}</td>
                    <td className={td}>€{item.amountDue.toFixed(2)}</td>
                    <td className={td}>{item.dueDate}</td>
                    <DateCell change={item.periodStart} />
                    <DateCell change={item.periodEnd} />
                    <td className={td}><span className={pillVariants[item.periodStart.kind]}>{item.periodStart.kind}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {diff && (
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} /> Document Diff
          </div>
          <div className={diffGrid}>
            <div>
              <div className="text-[0.72rem] font-bold text-text-muted uppercase mb-1.5">Before</div>
              <DiffPane lines={diff.left} testId="diff-before" />
            </div>
            <div>
              <div className="text-[0.72rem] font-bold text-text-muted uppercase mb-1.5">After</div>
              <DiffPane lines={diff.right} testId="diff-after" />
            </div>
          </div>
        </div>
      )}

      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDotGreen} /> Updated Schedule Output
        </div>
        <div className={codeAreaWrap}>
          <textarea
            className={cx(codeArea, codeAreaTall)}
            value={output}
            readOnly
            placeholder="Updated schedule with re-anchored periods will appear here..."
          />
        </div>
        {output && (
          <div className="mt-2.5">
            <CopyButton text={output} style={{ position: 'static', marginTop: 10 }} />
          </div>
        )}
      </div>

      <RulesGrid
        title="Recalculation Rules"
        rules={[
          { label: 'CoverStartDate', rule: 'Set to the new cover start date' },
          { label: 'CoverEndDate', rule: 'Re-anchored: new start + same number of months − 1 day' },
          { label: 'InceptionDate', rule: 'Moved only when it equals the old CoverStartDate (renewals keep theirs)' },
          { label: 'Period boundaries', rule: 'Start = new start + k months; End = next boundary − 1 day (month-end clamped)' },
          { label: 'Mid-period starts (MTA pro-rata)', rule: 'Keep their day offset inside the period; amounts are not recalculated' },
          { label: 'OriginalItem', rule: 'Its PeriodStartDate / PeriodEndDate are re-anchored the same way' },
          { label: 'Unchanged', rule: 'DueDate · CollectionDay · AdjustmentDate · amounts · Token · Hash · Cosmos fields' },
          { label: 'ModifiedBy / ModifiedDate', rule: 'Email field / now' },
        ]}
      />
    </div>
  )
}
