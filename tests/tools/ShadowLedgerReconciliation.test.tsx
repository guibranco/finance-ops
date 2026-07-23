import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ShadowLedgerReconciliation from '../../src/components/tools/ShadowLedgerReconciliation.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
// "Clean" pair: DIM-A matches exactly on both sides, DIM-C only exists in the
// raw file, DIM-D only exists in the journal — no mismatches, both balance.
const MATCH_RAW_CSV = [
  'BatchId,Dimension,Amount,GlEntry,AmountComponent,Operation',
  'BATCH-1,DIM-A,100,Debit,Premium,Collection',
  'BATCH-1,DIM-A,100,Credit,PremiumNet,Collection',
  'BATCH-1,DIM-C,30,Debit,AdminFee,Collection',
  'BATCH-1,DIM-C,30,Credit,PremiumNet,Collection',
].join('\n')

const MATCH_JOURNAL_CSV = [
  'ACCOUNTDISPLAYVALUE,ACCOUNTTYPE,DEBITAMOUNT,CREDITAMOUNT,DESCRIPTION',
  'DIM-A,Ledger,100,,BATCH-1',
  'DIM-A,Ledger,,100,BATCH-1',
  'DIM-D,Ledger,40,,BATCH-1',
  'DIM-D,Ledger,,40,BATCH-1',
  'BANK-ACC-1,Bank,50,,BATCH-1',
  'BANK-ACC-1,Bank,,50,BATCH-1',
].join('\n')

// DIM-A's credit total disagrees between the two files (90 vs 80); DIM-B
// matches; DIM-C is journal-only. Both files still balance on their own.
const MISMATCH_RAW_CSV = [
  'BatchId,Dimension,Amount,GlEntry',
  'BATCH-1,DIM-A,100,Debit',
  'BATCH-1,DIM-A,90,Credit',
  'BATCH-1,DIM-B,10,Credit',
].join('\n')

const MISMATCH_JOURNAL_CSV = [
  'ACCOUNTDISPLAYVALUE,ACCOUNTTYPE,DEBITAMOUNT,CREDITAMOUNT,DESCRIPTION',
  'DIM-A,Ledger,100,,BATCH-1',
  'DIM-A,Ledger,,80,BATCH-1',
  'DIM-B,Ledger,,10,BATCH-1',
  'DIM-C,Ledger,,10,BATCH-1',
].join('\n')

// Same dimension, same amounts, but the batch id differs between files.
const BATCH_A_RAW_CSV = [
  'BatchId,Dimension,Amount,GlEntry',
  'BATCH-RAW,DIM-A,50,Debit',
  'BATCH-RAW,DIM-A,50,Credit',
].join('\n')

const BATCH_B_JOURNAL_CSV = [
  'ACCOUNTDISPLAYVALUE,ACCOUNTTYPE,DEBITAMOUNT,CREDITAMOUNT,DESCRIPTION',
  'DIM-A,Ledger,50,,BATCH-JOURNAL',
  'DIM-A,Ledger,,50,BATCH-JOURNAL',
].join('\n')

const MISSING_COLUMN_RAW_CSV = [
  'BatchId,Dimension,Amount,AmountComponent',
  'BATCH-1,DIM-A,100,Premium',
].join('\n')

// The quoted Dimension field is never closed — a truncated/corrupted export.
const UNTERMINATED_QUOTE_RAW_CSV = [
  'BatchId,Dimension,Amount,GlEntry',
  'BATCH-1,"DIM-A,100,Debit',
].join('\n')

function getInputs() {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]')
  return { rawInput: inputs[0], journalInput: inputs[1] }
}

async function uploadCsv(input: HTMLInputElement, csvText: string, filename = 'file.csv') {
  const file = new File([csvText], filename, { type: 'text/csv' })
  const card = input.closest<HTMLElement>('[data-testid="card"]')!
  fireEvent.change(input, { target: { files: [file] } })
  // file.text() resolves asynchronously — wait (scoped to this card, since the
  // other card's stats text may already be on screen) for either the parsed
  // stats line or an error message to appear, not just the (synchronously
  // set) filename.
  await within(card).findByText(/rows ·|missing column\(s\)|could not read file|malformed csv/i)
}

describe('ShadowLedgerReconciliation', () => {
  it('renders both upload inputs with Reconcile disabled', () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    expect(rawInput).toBeInTheDocument()
    expect(journalInput).toBeInTheDocument()
    expect(screen.getByText(/reconcile/i)).toBeDisabled()
  })

  it('parses the raw CSV and shows row/dimension/batch stats', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput } = getInputs()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    expect(screen.getByText(/4 rows · 2 dimensions · batch BATCH-1/)).toBeInTheDocument()
  })

  it('enables Reconcile once both files are parsed', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    expect(screen.getByText(/reconcile/i)).toBeDisabled()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    expect(screen.getByText(/reconcile/i)).toBeDisabled()
    await uploadCsv(journalInput, MATCH_JOURNAL_CSV, 'journal.csv')
    expect(screen.getByText(/reconcile/i)).not.toBeDisabled()
  })

  it('shows "all checks passed" for a fully matched pair, and lists raw-only/journal-only dimensions without flagging them as issues', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, MATCH_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    expect(screen.getByText(/all checks passed/i)).toBeInTheDocument()
    expect(screen.getByText('DIM-A')).toBeInTheDocument()
    expect(screen.getAllByText('Match').length).toBeGreaterThan(0)
    expect(screen.getByText('Raw only')).toBeInTheDocument()
    expect(screen.getByText('Journal only')).toBeInTheDocument()
  })

  it('shows the raw breakdown by component and by operation', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, MATCH_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('PremiumNet')).toBeInTheDocument()
    expect(screen.getByText('Collection')).toBeInTheDocument()
  })

  it('shows journal bank lines separately from ledger dimensions', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, MATCH_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    expect(screen.getByText('Journal Bank Lines')).toBeInTheDocument()
    expect(screen.getByText('BANK-ACC-1')).toBeInTheDocument()
  })

  it('flags a dimension whose totals differ between the two files', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, MISMATCH_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, MISMATCH_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    expect(screen.getByText(/1 issue found/i)).toBeInTheDocument()
    expect(screen.getByText(/dimension "dim-a" totals differ/i)).toBeInTheDocument()
    expect(screen.getByText('Mismatch')).toBeInTheDocument()
  })

  it('flags a batch id mismatch between the two files', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, BATCH_A_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, BATCH_B_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    expect(screen.getByText(/batch id mismatch/i)).toBeInTheDocument()
    expect(screen.getByText(/"BATCH-RAW".*"BATCH-JOURNAL"/)).toBeInTheDocument()
  })

  it('shows a parse error and keeps Reconcile disabled when a required column is missing', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput } = getInputs()
    await uploadCsv(rawInput, MISSING_COLUMN_RAW_CSV, 'raw.csv')
    expect(screen.getByText(/missing column\(s\): GlEntry/i)).toBeInTheDocument()
    expect(screen.getByText(/reconcile/i)).toBeDisabled()
  })

  it('shows a parse error instead of silently accepting a CSV with an unterminated quoted field', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput } = getInputs()
    await uploadCsv(rawInput, UNTERMINATED_QUOTE_RAW_CSV, 'raw.csv')
    expect(screen.getByText(/malformed csv/i)).toBeInTheDocument()
    expect(screen.getByText(/reconcile/i)).toBeDisabled()
  })

  it('downloads the comparison as CSV after reconciling', async () => {
    render(<ShadowLedgerReconciliation />)
    const { rawInput, journalInput } = getInputs()
    await uploadCsv(rawInput, MATCH_RAW_CSV, 'raw.csv')
    await uploadCsv(journalInput, MATCH_JOURNAL_CSV, 'journal.csv')
    fireEvent.click(screen.getByText(/reconcile/i))

    fireEvent.click(screen.getByText(/download comparison/i))
    await screen.findByText(/downloaded/i)
  })
})
