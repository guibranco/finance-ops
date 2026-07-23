import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import PaymentSchedule2Refund from '../../src/components/tools/PaymentSchedule2Refund.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
const SCHEDULE = {
  PolicyNumber: 'OUTSTG00135448',
  RiskId: 1,
  RiskCode: 'HME',
  RiskMajorVersion: 1,
  PaymentScheduleId: '9481aa91-19d1-4017-8645-9883d596b662',
  CollectionFrequency: 'Annual',
  ModifiedBy: 'system@test.ie',
  id: 'Risk-1*1.0-Schedule',
  ScheduleItems: [
    {
      Id: 'item-id-aaa',
      CollectionType: 'Full',
      PeriodStartDate: '2025-11-03',
      PeriodEndDate: '2026-11-02',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2025-10-16',
      AmountDue: 200.00,
      NetAmount: 190.00,
      TaxesAndLevies: { LVY: 10.00 },
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: '2025-10-16T00:35:32.000Z',
    },
    {
      Id: 'item-id-bbb',
      CollectionType: 'Partial',
      PeriodStartDate: '2026-01-01',
      PeriodEndDate: '2026-06-30',
      AdjustmentDate: '0001-01-01T00:00:00+00:00',
      DueDate: '2025-12-01',
      AmountDue: 50.00,
      NetAmount: 50.00,
      TaxesAndLevies: {},
      AdminFees: {},
      OriginalItem: null,
      CollectionItemCreatedDate: '2025-10-16T00:35:32.000Z',
    },
  ],
}

const loadSchedule = (schedule = SCHEDULE) => {
  fireEvent.change(screen.getByPlaceholderText(/paymentschedule document/i), {
    target: { value: JSON.stringify(schedule) },
  })
  fireEvent.click(screen.getByText('Load Schedule'))
}

const getScheduleOutput = () =>
  JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/updated schedule with refund items/i).value)

const fillModifiedBy = (value = 'refunder@test.ie') => {
  fireEvent.change(screen.getByPlaceholderText('email@company.ie'), {
    target: { value },
  })
}

describe('PaymentSchedule2Refund', () => {
  // ── Rendering ──────────────────────────────────────────────────────────
  it('renders the schedule input textarea', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByPlaceholderText(/paymentschedule document/i)).toBeInTheDocument()
  })

  it('renders the modifiedBy and collectionCreatedDate inputs', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByPlaceholderText('email@company.ie')).toBeInTheDocument()
    expect(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!).toBeInTheDocument()
  })

  it('disables the collection date Clear button when the date is empty', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByText('Clear date')).toBeDisabled()
  })

  it('clears the collection created date on Clear button click', () => {
    render(<PaymentSchedule2Refund />)
    const dateInput = document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!
    fireEvent.change(dateInput, { target: { value: '2024-09-01T10:00' } })
    expect(dateInput).toHaveValue('2024-09-01T10:00')

    const clearBtn = screen.getByText('Clear date')
    expect(clearBtn).not.toBeDisabled()
    fireEvent.click(clearBtn)

    expect(dateInput).toHaveValue('')
    expect(clearBtn).toBeDisabled()
  })

  it('shows a placeholder message before a schedule is loaded', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByText(/load a schedule to see items/i)).toBeInTheDocument()
  })

  it('disables Generate Refund when no schedule is loaded', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByText(/generate refund/i)).toBeDisabled()
  })

  // ── Schedule loading ───────────────────────────────────────────────────
  it('shows checkboxes for each ScheduleItem after loading', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('displays item UUIDs in the checkbox labels', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    const list = document.querySelector<HTMLElement>('[data-testid="schedule-items-list"]')!
    expect(within(list).getByText('item-id-aaa')).toBeInTheDocument()
    expect(within(list).getByText('item-id-bbb')).toBeInTheDocument()
  })

  it('shows an error for invalid JSON on Load Schedule click', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(screen.getByPlaceholderText(/paymentschedule document/i), {
      target: { value: '{ bad json }' },
    })
    fireEvent.click(screen.getByText('Load Schedule'))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })

  it('loads the built-in sample on Load sample click', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.click(screen.getByText('Load sample'))
    // Sample schedule has 2 items
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  // ── Refund generation errors ───────────────────────────────────────────
  it('shows error when trying to generate without selecting any items', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    // Button is still disabled until an item is selected
    expect(screen.getByText(/generate refund/i)).toBeDisabled()
  })

  // ── Modified By requirement ─────────────────────────────────────────────
  it('keeps Generate Refund disabled when modifiedBy is empty, even after selecting an item', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByText(/generate refund/i)).toBeDisabled()
  })

  // ── Successful refund generation ───────────────────────────────────────
  it('enables Generate Refund after selecting an item and setting modifiedBy', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    expect(screen.getByText(/generate refund/i)).not.toBeDisabled()
  })

  it('appends the refund item to ScheduleItems with negated AmountDue', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // select first item (AmountDue: 200)
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))

    const output = getScheduleOutput()
    expect(output.ScheduleItems).toHaveLength(3)                   // original 2 + 1 refund
    const refundItem = output.ScheduleItems[2]
    expect(refundItem.AmountDue).toBe(-200)
  })

  it('negates NetAmount in the refund item', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.NetAmount).toBe(-190)
  })

  it('negates nested numeric values (TaxesAndLevies) in the refund item', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.TaxesAndLevies.LVY).toBe(-10)
  })

  it('assigns a new UUID to the refund item Id', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.Id).not.toBe('item-id-aaa')
    expect(refundItem.Id).toMatch(/^00000000-0000-0000-0000-/)
  })

  it('sets DueDate of the refund item to today', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    const today = new Date().toISOString().split('T')[0]
    expect(refundItem.DueDate).toBe(today)
  })

  it('sets OriginalItem on the refund item with the same (non-negated) signage as the original', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.OriginalItem).not.toBeNull()
    expect(refundItem.OriginalItem.AmountDue).toBe(200)
    expect(refundItem.OriginalItem.NetAmount).toBe(190)
    expect(refundItem.OriginalItem.TaxesAndLevies.LVY).toBe(10)
  })

  it('sets CollectionItemCreatedDate to null on the refund item when no collection date is provided', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.CollectionItemCreatedDate).toBeNull()
  })

  it('generates refund items for multiple selected items', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    expect(getScheduleOutput().ScheduleItems).toHaveLength(4)
  })

  it('updates ModifiedBy on the schedule using the provided email', () => {
    render(<PaymentSchedule2Refund />)
    fillModifiedBy('refunder@test.ie')
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getByText(/generate refund/i))
    expect(getScheduleOutput().ModifiedBy).toBe('refunder@test.ie')
  })

  // ── Pro-rated refunds ────────────────────────────────────────────────────
  it('defaults to Full refund type with pro-rata fields hidden', () => {
    render(<PaymentSchedule2Refund />)
    expect(screen.getByLabelText('Full')).toBeChecked()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('shows pro-rata basis and value fields when Pro-rated is selected', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(document.querySelector<HTMLInputElement>('input[type="number"]')!).toBeInTheDocument()
  })

  it('computes a pro-rata refund from a percentage, scaling every component by the same ratio', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // item-id-aaa: AmountDue 200, NetAmount 190, LVY 10
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="number"]')!, { target: { value: '10' } })
    fireEvent.click(screen.getByText(/generate refund/i))

    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.AmountDue).toBe(-20)
    expect(refundItem.NetAmount).toBe(-19)
    expect(refundItem.TaxesAndLevies.LVY).toBe(-1)
    expect(refundItem.OriginalItem.AmountDue).toBe(200) // original stays untouched
  })

  it('computes a pro-rata refund from a direct net amount using the item NetAmount as the base', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // NetAmount 190
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'amount' } })
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="number"]')!, { target: { value: '19' } }) // 10% of 190
    fireEvent.click(screen.getByText(/generate refund/i))

    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.AmountDue).toBe(-20)
    expect(refundItem.NetAmount).toBe(-19)
    expect(refundItem.TaxesAndLevies.LVY).toBe(-1)
  })

  it('computes a pro-rata refund from a direct gross amount using the item AmountDue as the base', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // AmountDue 200
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'amount' } }) // Pro-rata Basis
    fireEvent.change(screen.getByDisplayValue('Net Amount'), { target: { value: 'gross' } }) // Amount Type
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="number"]')!, { target: { value: '20' } }) // 10% of 200 gross
    fireEvent.click(screen.getByText(/generate refund/i))

    const refundItem = getScheduleOutput().ScheduleItems[2]
    expect(refundItem.AmountDue).toBe(-20)
    expect(refundItem.NetAmount).toBe(-19)
    expect(refundItem.TaxesAndLevies.LVY).toBe(-1)
  })

  it('blocks pro-rata by direct amount when more than one item is selected', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'amount' } })
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="number"]')!, { target: { value: '19' } })
    fireEvent.click(screen.getByText(/generate refund/i))

    expect(screen.getByText(/only supports a single selected item/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/updated schedule with refund items/i)).toHaveValue('')
  })

  it('shows an error when the pro-rata value is missing', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.click(screen.getByText(/generate refund/i))
    expect(screen.getByText(/enter a valid pro-rata/i)).toBeInTheDocument()
  })

  it('rejects a pro-rata percentage over 100 instead of amplifying the refund', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // AmountDue 200
    fillModifiedBy()
    fireEvent.click(screen.getByLabelText('Pro-rated'))
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="number"]')!, { target: { value: '150' } })
    fireEvent.click(screen.getByText(/generate refund/i))

    expect(screen.getByText(/cannot exceed 100%/i)).toBeInTheDocument()
    expect(getScheduleOutput).toThrow() // no output was generated
  })

  // ── Collection documents (when date is set) ────────────────────────────
  it('does NOT show Created/Refunded outputs when no date is provided', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    expect(screen.queryByPlaceholderText(/created collection document/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/refunded collection document/i)).not.toBeInTheDocument()
  })

  it('generates Created and Refunded collection documents when date is provided', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!, {
      target: { value: '2024-09-01T10:00' },
    })
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    expect(screen.getByPlaceholderText(/created collection document/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/refunded collection document/i)).toBeInTheDocument()
  })

  it('Created collection document has CollectionStatus="Created" and IsLatest=false', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!, {
      target: { value: '2024-09-01T10:00' },
    })
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const created = JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/created collection document/i).value)
    expect(created.CollectionStatus).toBe('Created')
    expect(created.IsLatest).toBe(false)
  })

  it('gives Created/Refunded collection documents ids matching the Collection-{RiskId}-{Sequence} pattern, not a GUID', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!, {
      target: { value: '2024-09-01T10:00' },
    })
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const created = JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/created collection document/i).value)
    const refunded = JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/refunded collection document/i).value)
    // RiskId 1, Sequence 1 in the fixture schedule
    expect(refunded.id).toBe('Collection-1-1')
    expect(created.id).toBe('Collection-1-1-Created')
  })

  it('Refunded collection document has CollectionStatus="Refunded" and IsLatest=true', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!, {
      target: { value: '2024-09-01T10:00' },
    })
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const refunded = JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/refunded collection document/i).value)
    expect(refunded.CollectionStatus).toBe('Refunded')
    expect(refunded.IsLatest).toBe(true)
  })

  it('collection documents carry negative total AmountDue', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!, {
      target: { value: '2024-09-01T10:00' },
    })
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0]) // AmountDue 200 → -200
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    const created = JSON.parse(screen.getByPlaceholderText<HTMLTextAreaElement>(/created collection document/i).value)
    expect(created.AmountDue).toBe(-200)
  })

  // ── localStorage ───────────────────────────────────────────────────────
  it('persists modifiedBy email to localStorage', () => {
    render(<PaymentSchedule2Refund />)
    fireEvent.change(screen.getByPlaceholderText('email@company.ie'), {
      target: { value: 'store@test.ie' },
    })
    expect(localStorage.getItem('ft_user_email')).toBe('store@test.ie')
  })

  it('restores modifiedBy from localStorage on mount', () => {
    localStorage.setItem('ft_user_email', 'restored@test.ie')
    render(<PaymentSchedule2Refund />)
    expect(screen.getByPlaceholderText('email@company.ie')).toHaveValue('restored@test.ie')
  })

  // ── Clear ──────────────────────────────────────────────────────────────
  it('clears all state on Clear click', () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByPlaceholderText(/paymentschedule document/i)).toHaveValue('')
    expect(screen.getByText(/load a schedule to see items/i)).toBeInTheDocument()
  })

  // ── Copy buttons ───────────────────────────────────────────────────────
  it('schedule copy button writes to clipboard', async () => {
    render(<PaymentSchedule2Refund />)
    loadSchedule()
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fillModifiedBy()
    fireEvent.click(screen.getByText(/generate refund/i))
    // The first Copy button belongs to the schedule output
    fireEvent.click(screen.getAllByText('Copy')[0])
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"ScheduleItems"')
      )
    )
  })
})
