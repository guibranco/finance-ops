// Pure helpers for moving a Policy Admin payment schedule to a new cover start
// date. Every period boundary is re-anchored on the new start date using month
// arithmetic (so a monthly schedule anchored on the 24th becomes one anchored on
// the 18th), mid-period dates (pro-rata MTA starts) keep their day offset inside
// their period, and DueDate is never touched — it is driven by CollectionDay.

export interface ScheduleItem {
  Id: string
  CollectionType: string
  PeriodStartDate: string
  PeriodEndDate: string
  DueDate: string
  AmountDue: number
  OriginalItem: ScheduleItem | null
  [key: string]: unknown
}

export interface PaymentScheduleDocument {
  InceptionDate?: string
  CoverStartDate: string
  CoverEndDate: string
  ScheduleItems: ScheduleItem[]
  ModifiedBy?: string
  ModifiedDate?: string
  [key: string]: unknown
}

export type DateKind = 'boundary' | 'mid-period' | 'outside-cover'

export interface DateChange {
  from: string
  to: string
  kind: DateKind
}

export interface ItemChange {
  index: number
  id: string
  collectionType: string
  dueDate: string
  amountDue: number
  periodStart: DateChange
  periodEnd: DateChange
  originalItem: { periodStart: DateChange; periodEnd: DateChange } | null
}

export interface ShiftResult {
  schedule: PaymentScheduleDocument
  coverStart: DateChange
  coverEnd: DateChange
  inception: DateChange | null
  items: ItemChange[]
  warnings: string[]
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000

interface Ymd { y: number; m: number; d: number }

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_RE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m)
}

function parse(value: string): Ymd {
  const [y, m, d] = value.split('-').map(Number)
  return { y, m, d }
}

function format({ y, m, d }: Ymd): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

function toEpochDay(value: string): number {
  const { y, m, d } = parse(value)
  return Date.UTC(y, m - 1, d) / MS_PER_DAY
}

function fromEpochDay(day: number): string {
  const dt = new Date(day * MS_PER_DAY)
  return format({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() })
}

export function addDays(value: string, days: number): string {
  return fromEpochDay(toEpochDay(value) + days)
}

// Adds whole months to an anchor date, clamping to the month's last day. Always
// computed from the original anchor so a 31st anchor gives 28 Feb then 31 Mar.
export function addMonths(anchor: string, months: number): string {
  const { y, m, d } = parse(anchor)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return format({ y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) })
}

// Index k of the period [anchor + k months, anchor + (k+1) months) containing date.
function periodIndex(anchor: string, date: string): number {
  const a = parse(anchor)
  const t = parse(date)
  let k = (t.y - a.y) * 12 + (t.m - a.m)
  if (addMonths(anchor, k) > date) k--
  return k
}

interface Anchors { oldStart: string; oldEnd: string; newStart: string }

// Re-anchors a period start date (or any date that marks the start of a span).
function mapStartDate(date: string, a: Anchors): DateChange {
  if (date < a.oldStart || date > a.oldEnd) return { from: date, to: date, kind: 'outside-cover' }
  const k = periodIndex(a.oldStart, date)
  const oldBoundary = addMonths(a.oldStart, k)
  const newBoundary = addMonths(a.newStart, k)
  if (date === oldBoundary) return { from: date, to: newBoundary, kind: 'boundary' }
  const offset = toEpochDay(date) - toEpochDay(oldBoundary)
  const lastDayOfNewPeriod = addDays(addMonths(a.newStart, k + 1), -1)
  const shifted = addDays(newBoundary, offset)
  return { from: date, to: shifted > lastDayOfNewPeriod ? lastDayOfNewPeriod : shifted, kind: 'mid-period' }
}

// Re-anchors a period end date (inclusive). An end that sits on the day before
// a boundary snaps to the day before the matching new boundary.
function mapEndDate(date: string, a: Anchors): DateChange {
  if (date < a.oldStart || date > a.oldEnd) return { from: date, to: date, kind: 'outside-cover' }
  const next = addDays(date, 1)
  const k = periodIndex(a.oldStart, next)
  if (next === addMonths(a.oldStart, k)) {
    return { from: date, to: addDays(addMonths(a.newStart, k), -1), kind: 'boundary' }
  }
  return mapStartDate(date, a)
}

interface ShiftedItem {
  item: ScheduleItem
  start: DateChange
  end: DateChange
  original: ItemChange['originalItem']
  warnings: string[]
}

// Re-anchors one item and, recursively, its OriginalItem chain. Warnings carry
// the item's path (e.g. "Item 7 (id) → OriginalItem") so nested mid-period or
// out-of-range dates are flagged as clearly as top-level ones.
function shiftItem(item: ScheduleItem, a: Anchors, label: string): ShiftedItem {
  const start = mapStartDate(item.PeriodStartDate, a)
  const end = mapEndDate(item.PeriodEndDate, a)
  const warnings: string[] = []
  if (start.kind === 'mid-period') {
    warnings.push(`${label}: mid-period start ${start.from} moved to ${start.to} keeping its day offset; amounts were not recalculated.`)
  }
  if (start.kind === 'outside-cover' || end.kind === 'outside-cover') {
    warnings.push(`${label}: period ${item.PeriodStartDate} → ${item.PeriodEndDate} falls outside the old cover dates; out-of-range dates were left unchanged.`)
  }
  let original: ItemChange['originalItem'] = null
  let originalItem = item.OriginalItem
  if (originalItem && isIsoDate(originalItem.PeriodStartDate) && isIsoDate(originalItem.PeriodEndDate)) {
    const shifted = shiftItem(originalItem, a, `${label} → OriginalItem`)
    originalItem = shifted.item
    original = { periodStart: shifted.start, periodEnd: shifted.end }
    warnings.push(...shifted.warnings)
  }
  return {
    item: { ...item, PeriodStartDate: start.to, PeriodEndDate: end.to, OriginalItem: originalItem },
    start,
    end,
    original,
    warnings,
  }
}

// Validates the loaded document has what the shift needs; returns error messages.
export function validateSchedule(doc: unknown): string[] {
  const errors: string[] = []
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return ['The document must be a JSON object.']
  const d = doc as Record<string, unknown>
  if (!isIsoDate(d.CoverStartDate)) errors.push('CoverStartDate is missing or not a YYYY-MM-DD date.')
  if (!isIsoDate(d.CoverEndDate)) errors.push('CoverEndDate is missing or not a YYYY-MM-DD date.')
  if (!Array.isArray(d.ScheduleItems)) {
    errors.push('ScheduleItems must be an array.')
  } else {
    d.ScheduleItems.forEach((raw, i) => {
      const item = raw as Record<string, unknown> | null
      if (!item || typeof item !== 'object') {
        errors.push(`ScheduleItems[${i}] must be an object.`)
        return
      }
      if (!isIsoDate(item.PeriodStartDate) || !isIsoDate(item.PeriodEndDate)) {
        errors.push(`ScheduleItems[${i}] has an invalid PeriodStartDate or PeriodEndDate.`)
      }
      if (typeof item.AmountDue !== 'number' || !Number.isFinite(item.AmountDue)) {
        errors.push(`ScheduleItems[${i}].AmountDue must be a number.`)
      }
      for (const field of ['Id', 'CollectionType', 'DueDate'] as const) {
        if (typeof item[field] !== 'string') errors.push(`ScheduleItems[${i}].${field} must be a string.`)
      }
    })
  }
  return errors
}

export interface ShiftOptions {
  modifiedBy?: string
  nowIso?: string
}

export function shiftSchedule(source: PaymentScheduleDocument, newCoverStart: string, options: ShiftOptions = {}): ShiftResult {
  const a: Anchors = { oldStart: source.CoverStartDate, oldEnd: source.CoverEndDate, newStart: newCoverStart }
  const warnings: string[] = []
  const schedule: PaymentScheduleDocument = structuredClone(source)

  const coverStart: DateChange = { from: a.oldStart, to: newCoverStart, kind: 'boundary' }
  const coverEnd = mapEndDate(a.oldEnd, a)
  if (coverEnd.kind !== 'boundary') {
    warnings.push(`CoverEndDate ${a.oldEnd} is not a whole number of months after CoverStartDate; it was moved by its day offset.`)
  }
  schedule.CoverStartDate = coverStart.to
  schedule.CoverEndDate = coverEnd.to

  let inception: DateChange | null = null
  if (typeof source.InceptionDate === 'string') {
    if (source.InceptionDate === a.oldStart) {
      inception = { from: source.InceptionDate, to: newCoverStart, kind: 'boundary' }
      schedule.InceptionDate = newCoverStart
    } else {
      warnings.push(`InceptionDate ${source.InceptionDate} differs from CoverStartDate (likely a renewal), so it was left unchanged.`)
    }
  }

  const items: ItemChange[] = source.ScheduleItems.map((item, index) => {
    // Shift the cloned item so the output never shares nested objects with the input.
    const shifted = shiftItem(schedule.ScheduleItems[index], a, `Item ${index + 1} (${item.Id})`)
    schedule.ScheduleItems[index] = shifted.item
    warnings.push(...shifted.warnings)
    return {
      index,
      id: item.Id,
      collectionType: item.CollectionType,
      dueDate: item.DueDate,
      amountDue: item.AmountDue,
      periodStart: shifted.start,
      periodEnd: shifted.end,
      originalItem: shifted.original,
    }
  })

  if (options.modifiedBy) schedule.ModifiedBy = options.modifiedBy
  if (options.nowIso) schedule.ModifiedDate = options.nowIso

  return { schedule, coverStart, coverEnd, inception, items, warnings }
}
