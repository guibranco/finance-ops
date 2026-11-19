import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ShiftScheduleDates from '../../src/components/tools/ShiftScheduleDates.tsx'

const SCHEDULE = {
  PolicyNumber: 'OUTSTG00000001',
  CollectionFrequency: 'Monthly',
  InceptionDate: '2026-07-24',
  CoverStartDate: '2026-07-24',
  CoverEndDate: '2027-07-23',
  ScheduleItems: [
    {
      Id: 'item-a', CollectionType: 'Full', PeriodStartDate: '2026-07-24', PeriodEndDate: '2026-09-23',
      DueDate: '2026-07-24', AmountDue: 73.19, OriginalItem: null,
    },
    {
      Id: 'item-b', CollectionType: 'ProRata', PeriodStartDate: '2026-11-19', PeriodEndDate: '2026-11-23',
      DueDate: '2026-11-19', AmountDue: -0.46, OriginalItem: null,
    },
  ],
  ModifiedBy: 'old@test.ie',
}

const input = () => screen.getByPlaceholderText(/paymentschedule cosmos document/i)
const newStart = () => screen.getByLabelText<HTMLInputElement>('New Cover Start')
const recalcBtn = () => screen.getByRole('button', { name: /recalculate periods/i })
const output = () => screen.getByPlaceholderText<HTMLTextAreaElement>(/re-anchored periods/i)

function load(schedule: unknown = SCHEDULE) {
  fireEvent.change(input(), { target: { value: JSON.stringify(schedule) } })
  fireEvent.click(screen.getByText('Load Schedule'))
}

function fillEmail(value = 'me@test.ie') {
  fireEvent.change(screen.getByPlaceholderText('email@company.ie'), { target: { value } })
}

describe('ShiftScheduleDates', () => {
  beforeEach(() => localStorage.clear())

  it('disables the date input and button before a schedule is loaded', () => {
    render(<ShiftScheduleDates />)
    expect(newStart()).toBeDisabled()
    expect(recalcBtn()).toBeDisabled()
  })

  it('shows an error for invalid JSON', () => {
    render(<ShiftScheduleDates />)
    fireEvent.change(input(), { target: { value: '{ bad' } })
    fireEvent.click(screen.getByText('Load Schedule'))
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/invalid json/i)
  })

  it('shows validation errors for a document without cover dates', () => {
    render(<ShiftScheduleDates />)
    load({ ScheduleItems: [] })
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/CoverStartDate/)
  })

  it('prefills the new start with the current cover start after loading', () => {
    render(<ShiftScheduleDates />)
    load()
    expect(newStart()).toHaveValue('2026-07-24')
    expect(screen.getByLabelText('Current Cover Start')).toHaveValue('2026-07-24')
  })

  it('keeps the button disabled while the date is unchanged or the email is empty', () => {
    render(<ShiftScheduleDates />)
    load()
    fillEmail()
    expect(recalcBtn()).toBeDisabled()
    fireEvent.change(newStart(), { target: { value: '2026-07-18' } })
    fillEmail('')
    expect(recalcBtn()).toBeDisabled()
  })

  it('recalculates periods, shows the changes and the output', () => {
    render(<ShiftScheduleDates />)
    load()
    fillEmail()
    fireEvent.change(newStart(), { target: { value: '2026-07-18' } })
    fireEvent.click(recalcBtn())

    const out = JSON.parse(output().value)
    expect(out.CoverStartDate).toBe('2026-07-18')
    expect(out.CoverEndDate).toBe('2027-07-17')
    expect(out.InceptionDate).toBe('2026-07-18')
    expect(out.ScheduleItems[0].PeriodEndDate).toBe('2026-09-17')
    expect(out.ScheduleItems[0].DueDate).toBe('2026-07-24')
    expect(out.ScheduleItems[1].PeriodStartDate).toBe('2026-11-13')
    expect(out.ModifiedBy).toBe('me@test.ie')

    const tableEl = screen.getByTestId('changes-table')
    expect(within(tableEl).getByText('2026-09-17')).toBeInTheDocument()
    expect(within(tableEl).getByText('mid-period')).toBeInTheDocument()
    expect(screen.getByTestId('items-moved')).toHaveTextContent('2 / 2')
    expect(screen.getByTestId('alert-warning')).toHaveTextContent(/item-b/)
    expect(screen.getByTestId('diff-after')).toHaveTextContent('"CoverStartDate": "2026-07-18"')
    expect(screen.getByTestId('diff-before')).toHaveTextContent('"CoverStartDate": "2026-07-24"')
  })

  it('copies the output to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<ShiftScheduleDates />)
    load()
    fillEmail()
    fireEvent.change(newStart(), { target: { value: '2026-07-18' } })
    fireEvent.click(recalcBtn())
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(output().value))
  })

  it('loads the built-in sample', () => {
    render(<ShiftScheduleDates />)
    fireEvent.click(screen.getByText('Load sample'))
    expect(newStart()).toHaveValue('2026-07-24')
    expect(screen.getByText(/5 items/)).toBeInTheDocument()
  })

  it('clears everything', () => {
    render(<ShiftScheduleDates />)
    fireEvent.click(screen.getByText('Load sample'))
    fireEvent.click(screen.getByText('Clear'))
    expect(input()).toHaveValue('')
    expect(newStart()).toBeDisabled()
  })

  it('resets the result when a new schedule is loaded', () => {
    render(<ShiftScheduleDates />)
    load()
    fillEmail()
    fireEvent.change(newStart(), { target: { value: '2026-07-18' } })
    fireEvent.click(recalcBtn())
    expect(output().value).not.toBe('')
    load()
    expect(output().value).toBe('')
    expect(screen.queryByTestId('changes-table')).not.toBeInTheDocument()
  })
})
