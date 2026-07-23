import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CollectionItem2ResubmissionItem from '../../src/components/tools/CollectionItem2ResubmissionItem.jsx'

const VALID_INPUT = JSON.stringify({
  BatchId: '00000000-0000-0000-0000-000000000000',
  CollectionId: 'coll-abc-123',
  PaymentScheduleItemIds: ['item-1', 'item-2'],
  PolicyNumber: 'OUTINT00172379',
  RiskId: 2,
  RiskCode: 'VEH',
  RiskMajorVersion: 1,
  AmountDue: 108.53,
  Fee: null,
  DueDate: '2024-08-08',
  CollectionStatus: 'Rejected',
  TransactionReference: 'OUTINT00172379-1-1-VEH-1',
  id: 'Collection-1-1',
})

const fillAndConvert = (jsonValue = VALID_INPUT, email = 'user@test.ie', sequence = '1') => {
  fireEvent.change(screen.getByPlaceholderText(/rejected collection json here/i), {
    target: { value: jsonValue },
  })
  fireEvent.change(screen.getByPlaceholderText('you@company.ie'), {
    target: { value: email },
  })
  const seqInput = screen.getByRole('spinbutton')
  fireEvent.change(seqInput, { target: { value: sequence } })
  fireEvent.click(screen.getByText('Convert →'))
}

describe('CollectionItem2ResubmissionItem', () => {
  // ── Rendering ──────────────────────────────────────────────────────────
  it('renders the email input', () => {
    render(<CollectionItem2ResubmissionItem />)
    expect(screen.getByPlaceholderText('you@company.ie')).toBeInTheDocument()
  })

  it('renders the sequence input defaulting to 1', () => {
    render(<CollectionItem2ResubmissionItem />)
    expect(screen.getByRole('spinbutton')).toHaveValue(1)
  })

  it('renders the JSON textarea', () => {
    render(<CollectionItem2ResubmissionItem />)
    expect(screen.getByPlaceholderText(/rejected collection json here/i)).toBeInTheDocument()
  })

  it('renders the output textarea in read-only state', () => {
    render(<CollectionItem2ResubmissionItem />)
    expect(screen.getByPlaceholderText(/resubmission json will appear/i)).toHaveAttribute('readonly')
  })

  // ── Validation errors ──────────────────────────────────────────────────
  it('shows error when JSON input is empty', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/paste a collection json/i)).toBeInTheDocument()
  })

  it('shows error when email is empty', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.change(screen.getByPlaceholderText(/rejected collection json here/i), {
      target: { value: VALID_INPUT },
    })
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/enter an email/i)).toBeInTheDocument()
  })

  it('shows error when sequence is 0', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.change(screen.getByPlaceholderText(/rejected collection json here/i), {
      target: { value: VALID_INPUT },
    })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), {
      target: { value: 'user@test.ie' },
    })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } })
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/valid sequence/i)).toBeInTheDocument()
  })

  it('shows error when sequence is non-numeric', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.change(screen.getByPlaceholderText(/rejected collection json here/i), {
      target: { value: VALID_INPUT },
    })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), {
      target: { value: 'user@test.ie' },
    })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/valid sequence/i)).toBeInTheDocument()
  })

  it('shows error for malformed JSON', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.change(screen.getByPlaceholderText(/rejected collection json here/i), {
      target: { value: 'not { json' },
    })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), {
      target: { value: 'user@test.ie' },
    })
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })

  // ── Successful conversion ──────────────────────────────────────────────
  it('produces output with correct Sequence from input', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert(VALID_INPUT, 'user@test.ie', '1')
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.Sequence).toBe(1)
  })

  it('sets id as Resubmission-{RiskId}-{Sequence}', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert(VALID_INPUT, 'user@test.ie', '3')
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.id).toBe('Resubmission-2-3')
    expect(result.Sequence).toBe(3)
  })

  it('sets CreatedBy and ModifiedBy from the email field', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert(VALID_INPUT, 'ops@company.ie', '1')
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.CreatedBy).toBe('ops@company.ie')
    expect(result.ModifiedBy).toBe('ops@company.ie')
  })

  it('always sets IsProcessed and IsVoided to false', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.IsProcessed).toBe(false)
    expect(result.IsVoided).toBe(false)
  })

  it('sets IsOriginalPaymentDirectDebit to false', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.IsOriginalPaymentDirectDebit).toBe(false)
  })

  it('maps CollectionId, PaymentScheduleItemIds, PolicyNumber, RiskId, RiskCode, RiskMajorVersion', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.CollectionId).toBe('coll-abc-123')
    expect(result.PaymentScheduleItemIds).toEqual(['item-1', 'item-2'])
    expect(result.PolicyNumber).toBe('OUTINT00172379')
    expect(result.RiskId).toBe(2)
    expect(result.RiskCode).toBe('VEH')
    expect(result.RiskMajorVersion).toBe(1)
  })

  it('maps OriginalAmountDue and OriginalDueDate from source', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.OriginalAmountDue).toBe(108.53)
    expect(result.OriginalDueDate).toBe('2024-08-08')
  })

  it('sets VoidedDate to the zero-time sentinel', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.VoidedDate).toBe('0001-01-01T00:00:00+00:00')
  })

  it('sets ResubmissionDueDate to today (YYYY-MM-DD)', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.ResubmissionDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('CreatedDate and ModifiedDate are ISO-8601 strings', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const result = JSON.parse(screen.getByPlaceholderText(/resubmission json will appear/i).value)
    expect(result.CreatedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.ModifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  // ── localStorage ───────────────────────────────────────────────────────
  it('persists email to localStorage on change', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), {
      target: { value: 'persist@test.ie' },
    })
    expect(localStorage.getItem('ft_user_email')).toBe('persist@test.ie')
  })

  it('restores email from localStorage on mount', () => {
    localStorage.setItem('ft_user_email', 'saved@test.ie')
    render(<CollectionItem2ResubmissionItem />)
    expect(screen.getByPlaceholderText('you@company.ie')).toHaveValue('saved@test.ie')
  })

  // ── Sample + Clear ─────────────────────────────────────────────────────
  it('populates textarea with sample data on Load sample click', () => {
    render(<CollectionItem2ResubmissionItem />)
    fireEvent.click(screen.getByText('Load sample'))
    const ta = screen.getByPlaceholderText(/rejected collection json here/i)
    expect(ta.value).toContain('OUTINT00172379')
  })

  it('clears the JSON input and output on Clear click', () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByPlaceholderText(/rejected collection json here/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/resubmission json will appear/i)).toHaveValue('')
  })

  // ── Copy button ────────────────────────────────────────────────────────
  it('shows Copy button after successful conversion and writes to clipboard', async () => {
    render(<CollectionItem2ResubmissionItem />)
    fillAndConvert()
    const copyBtn = screen.getByText('Copy')
    fireEvent.click(copyBtn)
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"Sequence"')
      )
    )
  })
})
