import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Json2SepaPain008 from '../../src/components/tools/Json2SepaPain008.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
const BASE_DD = {
  AmountDue: 55.69,
  Iban: 'IE29AIBK93115212345678',
  AccountHolderName: 'John Doe',
  MandateId: 'OUT00123456-2',
  MandateSignedDate: '2024-10-21',
  IsFirstDirectDebit: false,
  TransactionReference: 'OUT00123456-1-2-HME-8',
  id: 'OUT00123456-1-2-HME-8',
}

const fillForm = ({
  json = JSON.stringify(BASE_DD),
  oin = 'IE99ZZZ999999',
  name = 'Company Name DAC',
  iban = 'IE29AIBK93115212345678',
} = {}) => {
  fireEvent.change(screen.getByPlaceholderText(/direct debit json/i), { target: { value: json } })
  fireEvent.change(screen.getByPlaceholderText('IE99ZZZ999999'), { target: { value: oin } })
  fireEvent.change(screen.getByPlaceholderText('Company Name DAC'), { target: { value: name } })
  fireEvent.change(screen.getByPlaceholderText('IE29AIBK...'), { target: { value: iban } })
  fireEvent.click(screen.getByText('Convert to XML →'))
}

const getXml = () => screen.getByPlaceholderText<HTMLTextAreaElement>(/xml output will appear/i).value

describe('Json2SepaPain008', () => {
  // ── Rendering ──────────────────────────────────────────────────────────
  it('renders all configuration inputs with defaults', () => {
    render(<Json2SepaPain008 />)
    expect(screen.getByPlaceholderText('IE99ZZZ999999')).toHaveValue('IE99ZZZ999999')
    expect(screen.getByPlaceholderText('Company Name DAC')).toHaveValue('Company Name DAC')
    expect(screen.getByPlaceholderText('IE29AIBK...')).toHaveValue('IE29AIBK93115212345678')
  })

  it('renders the transaction type select with NORMAL default', () => {
    render(<Json2SepaPain008 />)
    expect(screen.getByRole('combobox')).toHaveValue('NORMAL')
  })

  it('renders the output textarea as read-only', () => {
    render(<Json2SepaPain008 />)
    expect(screen.getByPlaceholderText(/xml output will appear/i)).toHaveAttribute('readonly')
  })

  // ── Field validation errors ────────────────────────────────────────────
  it('shows error when JSON is empty', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByPlaceholderText(/direct debit json/i), { target: { value: '' } })
    fireEvent.click(screen.getByText('Convert to XML →'))
    expect(screen.getByText(/please enter json data/i)).toBeInTheDocument()
  })

  it('shows error when OIN is cleared', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByPlaceholderText('IE99ZZZ999999'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText(/direct debit json/i), {
      target: { value: JSON.stringify(BASE_DD) },
    })
    fireEvent.click(screen.getByText('Convert to XML →'))
    expect(screen.getByText(/enter an oin/i)).toBeInTheDocument()
  })

  it('shows error when creditor name is cleared', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByPlaceholderText('Company Name DAC'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText(/direct debit json/i), {
      target: { value: JSON.stringify(BASE_DD) },
    })
    fireEvent.click(screen.getByText('Convert to XML →'))
    expect(screen.getByText(/enter a creditor account name/i)).toBeInTheDocument()
  })

  it('shows error when creditor IBAN is cleared', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByPlaceholderText('IE29AIBK...'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText(/direct debit json/i), {
      target: { value: JSON.stringify(BASE_DD) },
    })
    fireEvent.click(screen.getByText('Convert to XML →'))
    expect(screen.getByText(/enter a creditor iban/i)).toBeInTheDocument()
  })

  it('shows error for malformed JSON', () => {
    render(<Json2SepaPain008 />)
    fillForm({ json: '{ not json }' })
    // The native JSON parse error is shown in the alert; just verify the alert exists
    expect(document.querySelector('[data-testid="alert-error"]')).not.toBeNull()
  })

  it.each(['AmountDue', 'AccountHolderName', 'MandateId', 'MandateSignedDate'])(
    'shows error when required field "%s" is missing from JSON',
    (field: string) => {
      render(<Json2SepaPain008 />)
      const { [field]: _omit, ...partial } = BASE_DD as Record<string, unknown>
      fillForm({ json: JSON.stringify(partial) })
      const alertEl = document.querySelector('[data-testid="alert-error"]')
      expect(alertEl).not.toBeNull()
      expect(alertEl!.textContent).toMatch(new RegExp(field, 'i'))
    }
  )

  it('shows error when Iban is missing from JSON', () => {
    render(<Json2SepaPain008 />)
    const { Iban: _omit, ...partial } = BASE_DD
    fillForm({ json: JSON.stringify(partial) })
    const alertEl = document.querySelector('[data-testid="alert-error"]')
    expect(alertEl).not.toBeNull()
    expect(alertEl!.textContent).toContain('Iban')
  })

  // ── Successful XML generation ──────────────────────────────────────────
  it('produces valid XML with Document root element', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<Document')
    expect(getXml()).toContain('</Document>')
  })

  it('includes the OIN in InitgPty and CdtrSchmeId', () => {
    render(<Json2SepaPain008 />)
    fillForm({ oin: 'IE88ZZZ888888' })
    expect(getXml()).toContain('<Id>IE88ZZZ888888</Id>')
  })

  it('includes the creditor name', () => {
    render(<Json2SepaPain008 />)
    fillForm({ name: 'Acme Finance DAC' })
    expect(getXml()).toContain('<Nm>Acme Finance DAC</Nm>')
  })

  it('includes the debtor name', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<Nm>John Doe</Nm>')
  })

  it('includes the amount with EUR currency', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<InstdAmt Ccy="EUR">55.69</InstdAmt>')
  })

  it('sets SeqTp to RCUR when IsFirstDirectDebit is false', () => {
    render(<Json2SepaPain008 />)
    fillForm({ json: JSON.stringify({ ...BASE_DD, IsFirstDirectDebit: false }) })
    expect(getXml()).toContain('<SeqTp>RCUR</SeqTp>')
  })

  it('sets SeqTp to FRST when IsFirstDirectDebit is true', () => {
    render(<Json2SepaPain008 />)
    fillForm({ json: JSON.stringify({ ...BASE_DD, IsFirstDirectDebit: true }) })
    expect(getXml()).toContain('<SeqTp>FRST</SeqTp>')
  })

  it('strips whitespace from debtor IBAN', () => {
    render(<Json2SepaPain008 />)
    fillForm({ json: JSON.stringify({ ...BASE_DD, Iban: 'IE29 AIBK 9311 5212 3456 78' }) })
    expect(getXml()).toContain('<IBAN>IE29AIBK93115212345678</IBAN>')
  })

  it('strips whitespace from creditor IBAN', () => {
    render(<Json2SepaPain008 />)
    fillForm({ iban: 'IE29 AIBK 9311 5212 3456 78' })
    // Both debtor and creditor IBAN tags should have no spaces
    const ibanMatches = [...getXml().matchAll(/<IBAN>(.*?)<\/IBAN>/g)]
    ibanMatches.forEach(([, val]) => expect(val).not.toContain(' '))
  })

  it('includes the mandate ID', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<MndtId>OUT00123456-2</MndtId>')
  })

  it('includes the mandate signed date', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<DtOfSgntr>2024-10-21</DtOfSgntr>')
  })

  it('uses TransactionReference as EndToEndId when present', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    expect(getXml()).toContain('<EndToEndId>OUT00123456-1-2-HME-8</EndToEndId>')
  })

  it('uses "NOTPROVIDED" as EndToEndId when TransactionReference and id are absent', () => {
    render(<Json2SepaPain008 />)
    const { TransactionReference: _r, id: _i, ...noRef } = BASE_DD
    fillForm({ json: JSON.stringify(noRef) })
    expect(getXml()).toContain('<EndToEndId>NOTPROVIDED</EndToEndId>')
  })

  it('message ID contains the transaction type', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'RESUBM' } })
    fillForm()
    expect(getXml()).toContain('RESUBM-PAIN008')
  })

  // ── localStorage ───────────────────────────────────────────────────────
  it('saves fields to localStorage on Save fields click', () => {
    render(<Json2SepaPain008 />)
    fireEvent.change(screen.getByPlaceholderText('IE99ZZZ999999'), {
      target: { value: 'IE11ZZZ111111' },
    })
    fireEvent.click(screen.getByText(/save fields/i))
    const stored = JSON.parse(localStorage.getItem('sepaConverterFields')!)
    expect(stored.oin).toBe('IE11ZZZ111111')
  })

  it('restores saved fields from localStorage on mount', () => {
    localStorage.setItem(
      'sepaConverterFields',
      JSON.stringify({ oin: 'IE55ZZZ555555', creditorName: 'Restored Corp' })
    )
    render(<Json2SepaPain008 />)
    expect(screen.getByPlaceholderText('IE99ZZZ999999')).toHaveValue('IE55ZZZ555555')
    expect(screen.getByPlaceholderText('Company Name DAC')).toHaveValue('Restored Corp')
  })

  it('clears localStorage and resets form on Clear saved click', () => {
    localStorage.setItem('sepaConverterFields', JSON.stringify({ oin: 'IE99ZZZ999999' }))
    render(<Json2SepaPain008 />)
    fireEvent.click(screen.getByText(/clear saved/i))
    expect(localStorage.getItem('sepaConverterFields')).toBeNull()
    expect(screen.getByPlaceholderText('IE99ZZZ999999')).toHaveValue('')
  })

  // ── Copy and Download ──────────────────────────────────────────────────
  it('copy button writes XML to clipboard', async () => {
    render(<Json2SepaPain008 />)
    fillForm()
    fireEvent.click(screen.getByText('Copy'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('<Document'))
    )
  })

  it('download button triggers createObjectURL', () => {
    render(<Json2SepaPain008 />)
    fillForm()
    fireEvent.click(screen.getByText(/download xml/i))
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
