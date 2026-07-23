import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CollectionItem2ShadowLedger from '../../src/components/tools/CollectionItem2ShadowLedger.jsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
const BASE_ITEM = {
  CollectionId: 'coll-id-123',
  PolicyNumber: 'OUTINT00001',
  RiskCode: 'HME',
  RiskMajorVersion: 2,
  ValueDate: '2024-09-01',
  RiskId: 3,
  TransactionReference: 'REF-001',
  CollectionStatus: 'Collected',
  PaymentScheduleItemIds: ['psi-1'],
  ProviderDetails: { ProcessingDate: '2024-09-01T10:00:00.000Z' },
  PaymentMethod: {
    $type: 'CardPaymentMethodDocument',
    Token: 'tok',
  },
  id: 'Collection-3-1',
}

const makeItem = (overrides) => JSON.stringify({ ...BASE_ITEM, ...overrides })

const convertItem = (item) => {
  fireEvent.change(screen.getByPlaceholderText(/collection item document/i), {
    target: { value: typeof item === 'string' ? item : JSON.stringify(item) },
  })
  fireEvent.click(screen.getByText('Convert →'))
}

const getOutputJson = () =>
  JSON.parse(screen.getByPlaceholderText(/shadow ledger request will appear/i).value)

describe('CollectionItem2ShadowLedger', () => {
  // ── Rendering ──────────────────────────────────────────────────────────
  it('renders input and output textareas', () => {
    render(<CollectionItem2ShadowLedger />)
    expect(screen.getByPlaceholderText(/collection item document/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/shadow ledger request will appear/i)).toBeInTheDocument()
  })

  it('shows Ready badge on initial render', () => {
    render(<CollectionItem2ShadowLedger />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  // ── Validation errors ──────────────────────────────────────────────────
  it('shows error when input is empty', () => {
    render(<CollectionItem2ShadowLedger />)
    fireEvent.click(screen.getByText('Convert →'))
    expect(screen.getByText(/enter a collection item json/i)).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('shows error for malformed JSON', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem('{ bad json }')
    // The native JSON parse error is surfaced; verify an error alert is rendered
    expect(document.querySelector('.alert-error')).not.toBeNull()
    expect(screen.getByText('Error')).toBeInTheDocument() // badge
  })

  it('shows error when a required field is missing', () => {
    render(<CollectionItem2ShadowLedger />)
    const { CollectionId: _omit, ...noCollectionId } = BASE_ITEM
    convertItem(noCollectionId)
    expect(screen.getByText(/missing required field: CollectionId/i)).toBeInTheDocument()
  })

  it('shows error when ProviderDetails.ProcessingDate is absent', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ ProviderDetails: {} }))
    expect(screen.getByText(/missing providerdetails\.processingdate/i)).toBeInTheDocument()
  })

  it('shows error for an unknown CollectionStatus', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Pending' }))
    expect(screen.getByText(/unknown collectionstatus/i)).toBeInTheDocument()
  })

  // ── Request type detection ─────────────────────────────────────────────
  it.each([['Collected'], ['Created'], ['Refunded']])(
    'maps CollectionStatus "%s" to RAISE request type',
    (status) => {
      render(<CollectionItem2ShadowLedger />)
      convertItem(makeItem({ CollectionStatus: status }))
      expect(screen.getByText('RAISE')).toBeInTheDocument()
      expect(screen.getByText('Converted')).toBeInTheDocument()
    }
  )

  it('maps CollectionStatus "Rejected" to FAILED request type', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Rejected' }))
    expect(screen.getByText('FAILED')).toBeInTheDocument()
  })

  // ── Direct debit flag ──────────────────────────────────────────────────
  it('sets isDirectDebitPayment=false for CardPaymentMethodDocument', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected' }))
    expect(getOutputJson().isDirectDebitPayment).toBe(false)
  })

  it('sets isDirectDebitPayment=true for a non-card payment method', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(
      makeItem({
        CollectionStatus: 'Collected',
        PaymentMethod: { $type: 'DirectDebitPaymentMethodDocument' },
      })
    )
    expect(getOutputJson().isDirectDebitPayment).toBe(true)
  })

  it('sets isDirectDebitPayment=true when PaymentMethod is null', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected', PaymentMethod: null }))
    expect(getOutputJson().isDirectDebitPayment).toBe(true)
  })

  // ── Field mapping ──────────────────────────────────────────────────────
  it('maps core fields correctly for a raise request', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected' }))
    const out = getOutputJson()
    expect(out.policyNumber).toBe('OUTINT00001')
    expect(out.riskCode).toBe('HME')
    expect(out.riskMajorVersion).toBe(2)
    expect(out.riskId).toBe(3)
    expect(out.paymentScheduleId).toBe('coll-id-123')
    expect(out.transactionReference).toBe('REF-001')
    expect(out.paymentScheduleItemIds).toEqual(['psi-1'])
    expect(out.collectionItemId).toBe('Collection-3-1')
  })

  it('includes transactionDate (full ISO) for a raise request', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected' }))
    const out = getOutputJson()
    expect(out.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(out.reportedDate).toBeUndefined()
  })

  it('includes reportedDate (date-only) for a failed request', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Rejected' }))
    const out = getOutputJson()
    expect(out.reportedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(out.transactionDate).toBeUndefined()
  })

  it('strips time from ValueDate', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ ValueDate: '2024-09-01T12:00:00Z', CollectionStatus: 'Collected' }))
    expect(getOutputJson().valueDate).toBe('2024-09-01')
  })

  // ── Sample / Clear / Copy ─────────────────────────────────────────────
  it('loads the built-in sample on Load sample click', () => {
    render(<CollectionItem2ShadowLedger />)
    fireEvent.click(screen.getByText('Load sample'))
    expect(screen.getByPlaceholderText(/collection item document/i).value).toContain('OUTINT00172379')
  })

  it('clears input and output on Clear click', () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected' }))
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByPlaceholderText(/collection item document/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/shadow ledger request will appear/i)).toHaveValue('')
  })

  it('copy button writes output to clipboard', async () => {
    render(<CollectionItem2ShadowLedger />)
    convertItem(makeItem({ CollectionStatus: 'Collected' }))
    fireEvent.click(screen.getByText('Copy'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"policyNumber"')
      )
    )
  })
})
