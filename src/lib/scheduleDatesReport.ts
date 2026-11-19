// Builds the exportable image report for the Move Schedule Dates tool: the same
// cover-date tiles, warnings and item table shown in its Changes card.
import type { ReportCell, ReportImageInput } from './reportImage'
import type { PaymentScheduleDocument, ShiftResult } from './scheduleDates'

export function describeText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '—'
}

export function countMovedItems(result: ShiftResult): number {
  return result.items.filter(i => i.periodStart.from !== i.periodStart.to || i.periodEnd.from !== i.periodEnd.to).length
}

const REPORT_COLUMNS = [
  { label: '#' },
  { label: 'Type' },
  { label: 'Amount', numeric: true },
  { label: 'Due (kept)' },
  { label: 'Start before' },
  { label: 'Start after' },
  { label: 'End before' },
  { label: 'End after' },
  { label: 'Start kind' },
]

/** The Changes card (tiles, warnings and the item table) as an exportable image report. */
export function buildScheduleDatesReport(source: PaymentScheduleDocument, result: ShiftResult): ReportImageInput {
  const stats = [
    { label: `Cover start (was ${result.coverStart.from})`, value: result.coverStart.to },
    { label: `Cover end (was ${result.coverEnd.from})`, value: result.coverEnd.to },
    result.inception
      ? { label: `Inception (was ${result.inception.from})`, value: result.inception.to }
      : { label: 'Inception', value: 'unchanged' },
    { label: 'Items moved', value: `${countMovedItems(result)} / ${result.items.length}` },
  ]
  const rows: ReportCell[][] = result.items.map(item => [
    { text: String(item.index + 1) },
    { text: item.collectionType },
    { text: `€${item.amountDue.toFixed(2)}`, tone: item.amountDue < 0 ? 'negative' : undefined },
    { text: item.dueDate },
    { text: item.periodStart.from },
    { text: item.periodStart.to },
    { text: item.periodEnd.from },
    { text: item.periodEnd.to },
    { text: item.periodStart.kind, tone: item.periodStart.kind === 'boundary' ? undefined : 'negative' },
  ])
  return {
    title: `Move Schedule Dates · ${describeText(source.PolicyNumber)}`,
    subtitle: `${describeText(source.CollectionFrequency)} schedule · cover start ${result.coverStart.from} → ${result.coverStart.to} · DueDate and CollectionDay unchanged`,
    stats,
    notices: result.warnings.length
      ? [{ tone: 'warning', title: 'Review before saving:', lines: result.warnings }]
      : [],
    tableTitle: `Schedule items (${result.items.length})`,
    columns: REPORT_COLUMNS,
    rows,
  }
}

export function reportFileName(source: PaymentScheduleDocument): string {
  const policy = describeText(source.PolicyNumber).replaceAll(/[^A-Za-z0-9_-]/g, '')
  return policy ? `schedule-dates-${policy}` : 'schedule-dates'
}
