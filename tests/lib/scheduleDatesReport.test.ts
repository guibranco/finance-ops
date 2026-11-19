import { describe, it, expect } from 'vitest'
import { buildReportSvg } from '../../src/lib/reportImage'
import { shiftSchedule, type PaymentScheduleDocument } from '../../src/lib/scheduleDates'
import { buildScheduleDatesReport, describeText, reportFileName } from '../../src/lib/scheduleDatesReport'

function schedule(overrides: Partial<PaymentScheduleDocument> = {}): PaymentScheduleDocument {
  return {
    PolicyNumber: 'OUTINT00298552',
    CollectionFrequency: 'Monthly',
    InceptionDate: '2026-07-24',
    CoverStartDate: '2026-07-24',
    CoverEndDate: '2027-07-23',
    ScheduleItems: [
      { Id: 'a', CollectionType: 'Full', PeriodStartDate: '2026-07-24', PeriodEndDate: '2026-09-23', DueDate: '2026-07-24', AmountDue: 73.19, OriginalItem: null },
      { Id: 'b', CollectionType: 'ProRata', PeriodStartDate: '2026-11-19', PeriodEndDate: '2026-11-23', DueDate: '2026-11-19', AmountDue: -0.46, OriginalItem: null },
    ],
    ...overrides,
  }
}

describe('buildScheduleDatesReport', () => {
  it('summarises the cover-date changes as tiles', () => {
    const doc = schedule()
    const report = buildScheduleDatesReport(doc, shiftSchedule(doc, '2026-07-18'))
    expect(report.title).toBe('Move Schedule Dates · OUTINT00298552')
    expect(report.subtitle).toContain('2026-07-24 → 2026-07-18')
    expect(report.stats).toEqual([
      { label: 'Cover start (was 2026-07-24)', value: '2026-07-18' },
      { label: 'Cover end (was 2027-07-23)', value: '2027-07-17' },
      { label: 'Inception (was 2026-07-24)', value: '2026-07-18' },
      { label: 'Items moved', value: '2 / 2' },
    ])
  })

  it('lists every item with before/after periods and toned amounts', () => {
    const doc = schedule()
    const report = buildScheduleDatesReport(doc, shiftSchedule(doc, '2026-07-18'))
    expect(report.columns.map(c => c.label)).toEqual([
      '#', 'Type', 'Amount', 'Due (kept)', 'Start before', 'Start after', 'End before', 'End after', 'Start kind',
    ])
    expect(report.rows[0].map(c => c.text)).toEqual([
      '1', 'Full', '€73.19', '2026-07-24', '2026-07-24', '2026-07-18', '2026-09-23', '2026-09-17', 'boundary',
    ])
    expect(report.rows[1][2]).toEqual({ text: '€-0.46', tone: 'negative' })
    expect(report.rows[1][8]).toEqual({ text: 'mid-period', tone: 'negative' })
    expect(report.rows[0][2].tone).toBeUndefined()
  })

  it('includes warnings as a notice, and none when there are no warnings', () => {
    const doc = schedule()
    const withWarnings = buildScheduleDatesReport(doc, shiftSchedule(doc, '2026-07-18'))
    expect(withWarnings.notices).toEqual([
      { tone: 'warning', title: 'Review before saving:', lines: [expect.stringContaining('Item 2 (b)')] },
    ])
    const clean = schedule({ ScheduleItems: [schedule().ScheduleItems[0]] })
    expect(buildScheduleDatesReport(clean, shiftSchedule(clean, '2026-07-18')).notices).toEqual([])
  })

  it('shows an unchanged inception for renewals', () => {
    const doc = schedule({ InceptionDate: '2024-07-24' })
    const report = buildScheduleDatesReport(doc, shiftSchedule(doc, '2026-07-18'))
    expect(report.stats[2]).toEqual({ label: 'Inception', value: 'unchanged' })
  })

  it('renders to an SVG containing the table', () => {
    const doc = schedule()
    const { svg } = buildReportSvg(buildScheduleDatesReport(doc, shiftSchedule(doc, '2026-07-18')))
    expect(svg).toMatch(/^<svg /)
    expect(svg).toContain('Schedule items (2)')
    expect(svg).toContain('2026-09-17')
  })
})

describe('report helpers', () => {
  it('describes only strings and numbers', () => {
    expect(describeText('x')).toBe('x')
    expect(describeText(4)).toBe('4')
    expect(describeText({})).toBe('—')
    expect(describeText(undefined)).toBe('—')
  })

  it('builds a safe file name from the policy number', () => {
    expect(reportFileName(schedule())).toBe('schedule-dates-OUTINT00298552')
    expect(reportFileName(schedule({ PolicyNumber: 'A/B C:1' }))).toBe('schedule-dates-ABC1')
    expect(reportFileName(schedule({ PolicyNumber: undefined }))).toBe('schedule-dates')
    expect(reportFileName(schedule({ PolicyNumber: '///' }))).toBe('schedule-dates')
  })
})
