import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShadowLedgerVisualizer from '../../src/components/tools/ShadowLedgerVisualizer.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
const BALANCED_ENTRIES = {
  entries: [
    { id: 1, policyNumber: 'POL-1', transactionReference: 'REF-1', riskCode: 'VEH', amountComponent: 'Premium', categoryCode: '', glEntry: 'Debit', amount: -10, operation: 'Refund', valueDate: '2026-06-16T00:00:00', glChartCode: '133206', dimension: 'DIM-A', batchId: 'BATCH-1', collectionItemId: 'Collection-1', paymentMethod: 'Card' },
    { id: 2, policyNumber: 'POL-1', transactionReference: 'REF-1', riskCode: 'VEH', amountComponent: 'PremiumNet', categoryCode: '', glEntry: 'Credit', amount: 10, operation: 'Refund', valueDate: '2026-06-16T00:00:00', glChartCode: '410101', dimension: 'DIM-A', batchId: 'BATCH-1', collectionItemId: 'Collection-1', paymentMethod: 'Card' },
  ],
  isTruncated: false,
}

const UNBALANCED_ENTRIES = {
  entries: [
    { id: 1, policyNumber: 'POL-2', transactionReference: 'REF-2', riskCode: 'VEH', amountComponent: 'Premium', glEntry: 'Debit', amount: -10, operation: 'Refund', dimension: 'DIM-B', batchId: 'BATCH-2' },
    { id: 2, policyNumber: 'POL-2', transactionReference: 'REF-2', riskCode: 'VEH', amountComponent: 'PremiumNet', glEntry: 'Credit', amount: 8, operation: 'Refund', dimension: 'DIM-B', batchId: 'BATCH-2' },
  ],
  isTruncated: true,
}

const visualize = (payload: unknown) => {
  fireEvent.change(screen.getByPlaceholderText(/shadow ledger entries json payload/i), {
    target: { value: typeof payload === 'string' ? payload : JSON.stringify(payload) },
  })
  fireEvent.click(screen.getByText('Visualize →'))
}

describe('ShadowLedgerVisualizer', () => {
  it('renders the input textarea', () => {
    render(<ShadowLedgerVisualizer />)
    expect(screen.getByPlaceholderText(/shadow ledger entries json payload/i)).toBeInTheDocument()
  })

  it('shows an error when input is empty', () => {
    render(<ShadowLedgerVisualizer />)
    fireEvent.click(screen.getByText('Visualize →'))
    expect(screen.getByText(/enter shadow ledger entries json/i)).toBeInTheDocument()
  })

  it('shows an error for malformed JSON', () => {
    render(<ShadowLedgerVisualizer />)
    visualize('{ bad json }')
    expect(document.querySelector('[data-testid="alert-error"]')).not.toBeNull()
  })

  it('shows an error when the JSON has no entries array', () => {
    render(<ShadowLedgerVisualizer />)
    visualize({ foo: 'bar' })
    expect(screen.getByText(/expected a json object with an "entries" array/i)).toBeInTheDocument()
  })

  it('accepts a bare array of entries', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES.entries)
    expect(screen.getAllByText('DIM-A').length).toBe(2)
  })

  it('renders parsed entries in the table with formatted amounts', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    expect(screen.getAllByText('POL-1').length).toBe(2)
    expect(screen.getByText('-10.00')).toBeInTheDocument()
    expect(screen.getByText('10.00')).toBeInTheDocument()
  })

  it('shows the balanced message when debit equals credit per dimension', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    expect(screen.getByText(/debit and credit totals balance/i)).toBeInTheDocument()
  })

  it('flags an unbalanced dimension', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(UNBALANCED_ENTRIES)
    expect(screen.getByText(/dimension.*out of balance/i)).toBeInTheDocument()
    expect(screen.getByText(/DIM-B — debit 10 vs credit 8/i)).toBeInTheDocument()
  })

  it('shows a truncated-results warning when isTruncated is true', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(UNBALANCED_ENTRIES)
    expect(screen.getByText(/result set is truncated/i)).toBeInTheDocument()
  })

  it('filters entries with the search box', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    fireEvent.change(screen.getByPlaceholderText('Search entries...'), { target: { value: 'REF-1' } })
    expect(screen.getByText(/entries \(2 of 2\)/i)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search entries...'), { target: { value: 'nomatch' } })
    expect(screen.getByText(/entries \(0 of 2\)/i)).toBeInTheDocument()
  })

  it('filters entries by GL entry direction', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    fireEvent.change(screen.getByDisplayValue('All GL entries'), { target: { value: 'debit' } })
    expect(screen.getByText(/entries \(1 of 2\)/i)).toBeInTheDocument()
  })

  it('loads the built-in sample on Load sample click', () => {
    render(<ShadowLedgerVisualizer />)
    fireEvent.click(screen.getByText('Load sample'))
    expect(screen.getByPlaceholderText<HTMLTextAreaElement>(/shadow ledger entries json payload/i).value).toContain('OUT00275391')
  })

  it('clears input and result on Clear click', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByPlaceholderText(/shadow ledger entries json payload/i)).toHaveValue('')
    expect(screen.queryByText('POL-1')).not.toBeInTheDocument()
  })

  it('downloads the visible columns as CSV', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    fireEvent.click(screen.getByText(/download visible columns/i))
    expect(screen.getByText(/downloaded/i)).toBeInTheDocument()
  })

  it('reveals additional columns when "Show all columns" is checked', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    expect(screen.queryByText('Payment Method')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/show all columns/i))
    expect(screen.getByText('Payment Method')).toBeInTheDocument()
  })

  it('filters entries by operation', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(UNBALANCED_ENTRIES)
    fireEvent.change(screen.getByDisplayValue('All operations'), { target: { value: 'Refund' } })
    expect(screen.getByText(/entries \(2 of 2\)/i)).toBeInTheDocument()
  })

  it('toggles sort direction when clicking the same column header twice', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    const idHeader = screen.getByText('ID')
    fireEvent.click(idHeader)
    const ascFirstRow = screen.getAllByRole('row')[1].textContent
    fireEvent.click(idHeader)
    const descFirstRow = screen.getAllByRole('row')[1].textContent
    expect(ascFirstRow).not.toBe(descFirstRow)
  })

  it('switches sort key when clicking a different column header', () => {
    render(<ShadowLedgerVisualizer />)
    visualize(BALANCED_ENTRIES)
    fireEvent.click(screen.getByText('Policy Number'))
    expect(screen.getByText('Policy Number').textContent).toContain('▲')
  })
})
