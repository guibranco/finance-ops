import { describe, it, expect } from 'vitest'
import {
  addDays,
  addMonths,
  isIsoDate,
  shiftSchedule,
  validateSchedule,
  type PaymentScheduleDocument,
  type ScheduleItem,
} from '../../src/lib/scheduleDates'

function item(id: string, start: string, end: string, extra: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    Id: id,
    CollectionType: 'Full',
    PeriodStartDate: start,
    PeriodEndDate: end,
    DueDate: '2026-07-24',
    AmountDue: 10,
    OriginalItem: null,
    TaxesAndLevies: { LVY: 0.3 },
    ...extra,
  }
}

// Mirrors the OUTINT00298552 monthly schedule: 2-month deposit, SMD fee, monthly
// items, and the 19 Nov MTA pro-rata adjustments.
function monthlySchedule(): PaymentScheduleDocument {
  return {
    InceptionDate: '2026-07-24',
    CoverStartDate: '2026-07-24',
    CoverEndDate: '2027-07-23',
    CollectionDay: 18,
    Token: 'tok',
    Hash: 'hash',
    ScheduleItems: [
      item('deposit', '2026-07-24', '2026-09-23'),
      item('smd', '2026-07-24', '2026-09-23', { AdminFees: { SMD: { AmountDue: 1, TaxAmount: 0 } } }),
      item('oct', '2026-10-24', '2026-11-23', { DueDate: '2026-09-18' }),
      item('mta-partial', '2026-11-19', '2026-11-23', {
        CollectionType: 'ProRata',
        DueDate: '2026-11-19',
        AmountDue: -0.46,
        OriginalItem: item('orig', '2026-10-24', '2026-11-23', { DueDate: '2026-09-18' }),
      }),
      item('last', '2027-06-24', '2027-07-23', { DueDate: '2027-05-18' }),
    ],
    ModifiedBy: 'old@test.ie',
    ModifiedDate: '2026-11-19T14:40:16Z',
  }
}

describe('date helpers', () => {
  it('validates ISO dates including month length', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2028-02-29')).toBe(true)
    expect(isIsoDate('2026-13-01')).toBe(false)
    expect(isIsoDate('2026-07-24T00:00:00Z')).toBe(false)
    expect(isIsoDate(20260724)).toBe(false)
  })

  it('adds months from the anchor, clamping to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-01-31', 2)).toBe('2026-03-31')
    expect(addMonths('2026-07-18', 12)).toBe('2027-07-18')
    expect(addMonths('2026-03-15', -3)).toBe('2025-12-15')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('validateSchedule', () => {
  it('accepts a well-formed schedule', () => {
    expect(validateSchedule(monthlySchedule())).toEqual([])
  })

  it('rejects non-objects', () => {
    expect(validateSchedule(null)).toHaveLength(1)
    expect(validateSchedule([])).toHaveLength(1)
  })

  it('reports missing cover dates and bad items', () => {
    const errors = validateSchedule({ CoverStartDate: 'x', ScheduleItems: [{ PeriodStartDate: '2026-01-01' }, null] })
    expect(errors).toEqual([
      expect.stringContaining('CoverStartDate'),
      expect.stringContaining('CoverEndDate'),
      expect.stringContaining('ScheduleItems[0]'),
      expect.stringContaining('ScheduleItems[1]'),
    ])
  })

  it('reports a missing ScheduleItems array', () => {
    expect(validateSchedule({ CoverStartDate: '2026-01-01', CoverEndDate: '2026-12-31' })).toEqual([
      'ScheduleItems must be an array.',
    ])
  })
})

describe('shiftSchedule', () => {
  it('moves cover start, cover end and inception', () => {
    const r = shiftSchedule(monthlySchedule(), '2026-07-18')
    expect(r.schedule.CoverStartDate).toBe('2026-07-18')
    expect(r.schedule.CoverEndDate).toBe('2027-07-17')
    expect(r.schedule.InceptionDate).toBe('2026-07-18')
    expect(r.inception).toEqual({ from: '2026-07-24', to: '2026-07-18', kind: 'boundary' })
  })

  it('re-anchors boundary periods, including the 2-month deposit', () => {
    const items = shiftSchedule(monthlySchedule(), '2026-07-18').schedule.ScheduleItems
    expect([items[0].PeriodStartDate, items[0].PeriodEndDate]).toEqual(['2026-07-18', '2026-09-17'])
    expect([items[1].PeriodStartDate, items[1].PeriodEndDate]).toEqual(['2026-07-18', '2026-09-17'])
    expect([items[2].PeriodStartDate, items[2].PeriodEndDate]).toEqual(['2026-10-18', '2026-11-17'])
    expect([items[4].PeriodStartDate, items[4].PeriodEndDate]).toEqual(['2027-06-18', '2027-07-17'])
  })

  it('keeps the day offset of a mid-period pro-rata start and warns', () => {
    const r = shiftSchedule(monthlySchedule(), '2026-07-18')
    const mta = r.schedule.ScheduleItems[3]
    expect([mta.PeriodStartDate, mta.PeriodEndDate]).toEqual(['2026-11-13', '2026-11-17'])
    expect(mta.AmountDue).toBe(-0.46)
    expect(r.items[3].periodStart.kind).toBe('mid-period')
    expect(r.warnings.some(w => w.includes('mta-partial') && w.includes('2026-11-13'))).toBe(true)
  })

  it('re-anchors OriginalItem periods', () => {
    const r = shiftSchedule(monthlySchedule(), '2026-07-18')
    const orig = r.schedule.ScheduleItems[3].OriginalItem!
    expect([orig.PeriodStartDate, orig.PeriodEndDate]).toEqual(['2026-10-18', '2026-11-17'])
    expect(r.items[3].originalItem?.periodStart.to).toBe('2026-10-18')
  })

  it('never changes DueDate, amounts, CollectionDay, Token or Hash', () => {
    const source = monthlySchedule()
    const r = shiftSchedule(source, '2026-07-18')
    r.schedule.ScheduleItems.forEach((it, i) => {
      expect(it.DueDate).toBe(source.ScheduleItems[i].DueDate)
      expect(it.AmountDue).toBe(source.ScheduleItems[i].AmountDue)
    })
    expect(r.schedule.CollectionDay).toBe(18)
    expect(r.schedule.Token).toBe('tok')
    expect(r.schedule.Hash).toBe('hash')
  })

  it('does not mutate the input and does not share nested objects', () => {
    const source = monthlySchedule()
    const snapshot = JSON.stringify(source)
    const r = shiftSchedule(source, '2026-07-18')
    expect(JSON.stringify(source)).toBe(snapshot)
    expect(r.schedule.ScheduleItems[0].TaxesAndLevies).not.toBe(source.ScheduleItems[0].TaxesAndLevies)
  })

  it('sets ModifiedBy and ModifiedDate only when given', () => {
    expect(shiftSchedule(monthlySchedule(), '2026-07-18').schedule.ModifiedBy).toBe('old@test.ie')
    const r = shiftSchedule(monthlySchedule(), '2026-07-18', { modifiedBy: 'me@test.ie', nowIso: '2026-11-19T15:00:00.000Z' })
    expect(r.schedule.ModifiedBy).toBe('me@test.ie')
    expect(r.schedule.ModifiedDate).toBe('2026-11-19T15:00:00.000Z')
  })

  it('supports moving the start later, across a month', () => {
    const r = shiftSchedule(monthlySchedule(), '2026-08-02')
    expect(r.schedule.CoverEndDate).toBe('2027-08-01')
    expect(r.schedule.ScheduleItems[0].PeriodEndDate).toBe('2026-10-01')
    expect(r.schedule.ScheduleItems[2].PeriodStartDate).toBe('2026-11-02')
  })

  it('clamps month-end anchors', () => {
    const doc: PaymentScheduleDocument = {
      CoverStartDate: '2026-01-15',
      CoverEndDate: '2027-01-14',
      ScheduleItems: [item('jan', '2026-01-15', '2026-02-14'), item('feb', '2026-02-15', '2026-03-14')],
    }
    const r = shiftSchedule(doc, '2026-01-31')
    expect(r.schedule.CoverEndDate).toBe('2027-01-30')
    expect([r.schedule.ScheduleItems[0].PeriodStartDate, r.schedule.ScheduleItems[0].PeriodEndDate]).toEqual(['2026-01-31', '2026-02-27'])
    expect([r.schedule.ScheduleItems[1].PeriodStartDate, r.schedule.ScheduleItems[1].PeriodEndDate]).toEqual(['2026-02-28', '2026-03-30'])
  })

  it('clamps a mid-period offset that no longer fits a shorter period', () => {
    const doc: PaymentScheduleDocument = {
      CoverStartDate: '2026-01-01',
      CoverEndDate: '2026-12-31',
      ScheduleItems: [item('mta', '2026-01-31', '2026-01-31', { CollectionType: 'ProRata' })],
    }
    const r = shiftSchedule(doc, '2026-02-01')
    expect(r.schedule.ScheduleItems[0].PeriodStartDate).toBe('2026-02-28')
  })

  it('leaves dates outside the cover range unchanged and warns', () => {
    const doc = monthlySchedule()
    doc.ScheduleItems[1].PeriodStartDate = '2026-07-10'
    const r = shiftSchedule(doc, '2026-07-18')
    expect(r.schedule.ScheduleItems[1].PeriodStartDate).toBe('2026-07-10')
    expect(r.items[1].periodStart.kind).toBe('outside-cover')
    expect(r.warnings.some(w => w.includes('outside the old cover dates'))).toBe(true)
  })

  it('keeps a renewal InceptionDate and warns', () => {
    const doc = monthlySchedule()
    doc.InceptionDate = '2024-07-24'
    const r = shiftSchedule(doc, '2026-07-18')
    expect(r.schedule.InceptionDate).toBe('2024-07-24')
    expect(r.inception).toBeNull()
    expect(r.warnings.some(w => w.includes('InceptionDate'))).toBe(true)
  })

  it('warns when the cover end is not a whole number of months', () => {
    const doc = monthlySchedule()
    doc.CoverEndDate = '2027-07-20'
    const r = shiftSchedule(doc, '2026-07-18')
    expect(r.coverEnd.kind).toBe('mid-period')
    expect(r.warnings.some(w => w.includes('CoverEndDate'))).toBe(true)
  })

  it('works for annual schedules', () => {
    const doc: PaymentScheduleDocument = {
      CoverStartDate: '2025-11-03',
      CoverEndDate: '2026-11-02',
      ScheduleItems: [item('annual', '2025-11-03', '2026-11-02')],
    }
    const r = shiftSchedule(doc, '2025-11-10')
    expect(r.schedule.CoverEndDate).toBe('2026-11-09')
    expect(r.schedule.ScheduleItems[0].PeriodEndDate).toBe('2026-11-09')
  })
})
