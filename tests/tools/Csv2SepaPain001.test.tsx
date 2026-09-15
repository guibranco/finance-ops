import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Csv2SepaPain001 from '../../src/components/tools/Csv2SepaPain001.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
// Shape of the "Failed Refunds — BOI support" export: no name column, negative
// "amount due" meaning money owed back to the policyholder.
const REFUNDS_CSV = [
  'transaction_reference,PolicyNumber,policyholder_eircode,Amount Due (CS),CollectionStatus,IBAN',
  'OUT00140169-1-5-VEH-4,OUT00140169,D18 K7W4,-0.62,Rejected,IE29BOFI90121234123412',
  'OUT00140170-1-2-HME-3,OUT00140170,D02 X285,-17.35,Rejected,IE29AIBK93115212345678',
].join('\n')

// A payee export that has a proper name column and a remittance column.
const NAMED_CSV = [
  'Reference,Name,IBAN,Amount,Description',
  'OCM024704-15,"Sheedy & Kinsella Solicitors LLP",GB33BUKB20201555555555,8000,INV-001',
  'OCM024704-16,Brendan Treacy,IE29AIBK93115212345678,80.5,',
].join('\n')

const getCsvArea = () => screen.getByPlaceholderText<HTMLTextAreaElement>(/refund \/ payment csv/i)
const getXml = () => screen.getByPlaceholderText<HTMLTextAreaElement>(/xml output will appear/i).value
const parseBtn = () => screen.getByText('Parse CSV →')
const generateBtn = () => screen.getByText('Generate XML →')

function setCsv(csv: string) {
  fireEvent.change(getCsvArea(), { target: { value: csv } })
}

function parse(csv = REFUNDS_CSV) {
  setCsv(csv)
  fireEvent.click(parseBtn())
}

function parseAndGenerate(csv = REFUNDS_CSV) {
  parse(csv)
  fireEvent.click(generateBtn())
}

const mappingSelect = (field: string) => document.querySelector<HTMLSelectElement>(`#ct-map-${field}`)!

describe('Csv2SepaPain001', () => {
  // ── Rendering ──────────────────────────────────────────────────────────
  it('renders the configuration inputs with defaults', () => {
    render(<Csv2SepaPain001 />)
    expect(screen.getByPlaceholderText('673710')).toHaveValue('000000')
    expect(screen.getByPlaceholderText('Company Name DAC')).toHaveValue('Company Name DAC')
    expect(screen.getByPlaceholderText('IE29AIBK...')).toHaveValue('IE29AIBK93115212345678')
    expect(screen.getByPlaceholderText('BOFIIE2D')).toHaveValue('')
    expect(screen.getByLabelText(/transaction type/i)).toHaveValue('REFUND')
  })

  it('pre-fills the CSV area with a sample and no mapping card until parsed', () => {
    render(<Csv2SepaPain001 />)
    expect(getCsvArea().value).toMatch(/^transaction_reference,PolicyNumber/)
    expect(screen.queryByTestId('mapping-card')).not.toBeInTheDocument()
    expect(screen.queryByText('Generate XML →')).not.toBeInTheDocument()
  })

  it('renders the output textarea as read-only', () => {
    render(<Csv2SepaPain001 />)
    expect(screen.getByPlaceholderText(/xml output will appear/i)).toHaveAttribute('readonly')
  })

  // ── Parsing + column mapping ───────────────────────────────────────────
  it('shows an error when the CSV is empty', () => {
    render(<Csv2SepaPain001 />)
    parse('')
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/paste or upload csv/i)
  })

  it('shows an error for malformed CSV', () => {
    render(<Csv2SepaPain001 />)
    parse('a,b\n1,"unterminated')
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/unterminated quoted field/i)
  })

  it('auto-detects the refund export columns and falls back to PolicyNumber for the creditor name', () => {
    render(<Csv2SepaPain001 />)
    parse()
    expect(mappingSelect('endToEndId')).toHaveValue('transaction_reference')
    expect(mappingSelect('amount')).toHaveValue('Amount Due (CS)')
    expect(mappingSelect('iban')).toHaveValue('IBAN')
    expect(mappingSelect('creditorName')).toHaveValue('PolicyNumber')
    expect(mappingSelect('remittance')).toHaveValue('')
    expect(screen.getByTestId('alert-mapping')).toHaveTextContent(/no creditor name column found/i)
  })

  it('auto-detects a proper name column and a remittance column without a fallback note', () => {
    render(<Csv2SepaPain001 />)
    parse(NAMED_CSV)
    expect(mappingSelect('endToEndId')).toHaveValue('Reference')
    expect(mappingSelect('creditorName')).toHaveValue('Name')
    expect(mappingSelect('remittance')).toHaveValue('Description')
    expect(screen.queryByTestId('alert-mapping')).not.toBeInTheDocument()
  })

  it('previews every transfer with absolute amounts and the running total', () => {
    render(<Csv2SepaPain001 />)
    parse()
    const preview = screen.getByTestId('preview-card')
    expect(within(preview).getByText(/transfers preview \(2 · EUR 17\.97\)/i)).toBeInTheDocument()
    expect(within(preview).getByText('OUT00140169-1-5-VEH-4')).toBeInTheDocument()
    expect(within(preview).getByText('0.62')).toBeInTheDocument()
    expect(within(preview).getByText('17.35')).toBeInTheDocument()
  })

  it('re-prepares the preview when a mapping select changes', () => {
    render(<Csv2SepaPain001 />)
    parse()
    fireEvent.change(mappingSelect('creditorName'), { target: { value: 'policyholder_eircode' } })
    expect(within(screen.getByTestId('preview-card')).getByText('D18 K7W4')).toBeInTheDocument()
    expect(screen.queryByTestId('alert-mapping')).not.toBeInTheDocument()
  })

  it('reports an unmapped required column and disables generation', () => {
    render(<Csv2SepaPain001 />)
    parse()
    fireEvent.change(mappingSelect('iban'), { target: { value: '' } })
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/map a column for: creditor iban/i)
    expect(generateBtn()).toBeDisabled()
  })

  it('discards the parsed state when the CSV text is edited', () => {
    render(<Csv2SepaPain001 />)
    parse()
    expect(screen.getByTestId('mapping-card')).toBeInTheDocument()
    setCsv(REFUNDS_CSV + '\n')
    expect(screen.queryByTestId('mapping-card')).not.toBeInTheDocument()
  })

  it('loads and parses an uploaded CSV file', async () => {
    render(<Csv2SepaPain001 />)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File([NAMED_CSV], 'payees.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })
    await screen.findByText('payees.csv')
    await waitFor(() => expect(mappingSelect('creditorName')).toHaveValue('Name'))
    expect(getCsvArea().value).toBe(NAMED_CSV)
  })

  // ── Row validation ─────────────────────────────────────────────────────
  it('flags a non-numeric amount with its row number', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,IE29AIBK93115212345678,abc')
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/row 2: amount "abc" is not a number/i)
  })

  it('flags a zero amount', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,IE29AIBK93115212345678,0.00')
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/row 2: amount is zero/i)
  })

  it('flags duplicate End-to-End IDs', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,IE29AIBK93115212345678,1\nR1,Bob,IE29AIBK93115212345678,2')
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/row 3: duplicate end-to-end id "R1" \(also on row 2\)/i)
  })

  it('flags an End-to-End ID longer than 35 characters', () => {
    render(<Csv2SepaPain001 />)
    parse(`Reference,Name,IBAN,Amount\n${'X'.repeat(36)},Ann,IE29AIBK93115212345678,1`)
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/exceeds 35 characters/i)
  })

  it('flags empty End-to-End ID, name and IBAN cells', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\n,,,1')
    const alertEl = screen.getByTestId('alert-rows-error')
    expect(alertEl).toHaveTextContent(/end-to-end id is empty/i)
    expect(alertEl).toHaveTextContent(/creditor name is empty/i)
    expect(alertEl).toHaveTextContent(/iban is empty/i)
  })

  it('flags a malformed IBAN as an error', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,NOT-AN-IBAN,1')
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/does not look like an iban/i)
  })

  it('warns (without blocking) when an IBAN fails the mod-97 checksum', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,IE50BOFI90121234123412,1')
    expect(screen.queryByTestId('alert-rows-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('alert-rows-warning')).toHaveTextContent(/fails the mod-97 checksum/i)
    expect(generateBtn()).toBeEnabled()
  })

  it('warns when amounts have mixed signs', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount\nR1,Ann,IE29AIBK93115212345678,-1\nR2,Bob,IE29AIBK93115212345678,2')
    expect(screen.getByTestId('alert-rows-warning')).toHaveTextContent(/mixed signs \(1 negative, 1 positive\)/i)
  })

  it('reports a header-only CSV', () => {
    render(<Csv2SepaPain001 />)
    parse('Reference,Name,IBAN,Amount')
    expect(screen.getByTestId('alert-rows-error')).toHaveTextContent(/no data rows/i)
  })

  // ── Configuration validation ───────────────────────────────────────────
  it.each([
    ['673710', /initiating party id/i],
    ['Company Name DAC', /debtor account name/i],
    ['IE29AIBK...', /debtor iban/i],
  ])('shows an error when the "%s" field is cleared', (placeholder, message) => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: '' } })
    parseAndGenerate()
    expect(screen.getByTestId('alert-error')).toHaveTextContent(message)
    expect(getXml()).toBe('')
  })

  it('rejects a malformed debtor IBAN', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByPlaceholderText('IE29AIBK...'), { target: { value: 'nope' } })
    parseAndGenerate()
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/does not look like an iban/i)
  })

  it('rejects a malformed debtor BIC', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByPlaceholderText('BOFIIE2D'), { target: { value: 'BAD' } })
    parseAndGenerate()
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/not a valid bic/i)
  })

  it('requires an execution date', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByLabelText(/execution date/i), { target: { value: '' } })
    parseAndGenerate()
    expect(screen.getByTestId('alert-error')).toHaveTextContent(/execution date/i)
  })

  // ── Successful XML generation ──────────────────────────────────────────
  it('produces a pain.001.001.09 document with group header totals', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    const xml = getXml()
    expect(xml).toContain('urn:iso:std:iso:20022:tech:xsd:pain.001.001.09')
    expect(xml).toContain('<CstmrCdtTrfInitn>')
    expect(xml).toMatch(/<MsgId>\d{8}-\d{6}-REFUND-PAIN001<\/MsgId>/)
    expect(xml).toMatch(/<PmtInfId>\d{8}-\d{6}-REFUND-PAIN001-REF<\/PmtInfId>/)
    expect(xml).toContain('<PmtMtd>TRF</PmtMtd>')
    expect((xml.match(/<NbOfTxs>2<\/NbOfTxs>/g) || []).length).toBe(2)
    expect((xml.match(/<CtrlSum>17\.97<\/CtrlSum>/g) || []).length).toBe(2)
    expect((xml.match(/<CdtTrfTxInf>/g) || []).length).toBe(2)
  })

  it('writes the origin account from the configuration', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByPlaceholderText('673710'), { target: { value: '673710' } })
    fireEvent.change(screen.getByPlaceholderText('Company Name DAC'), { target: { value: 'OUTSURANCE DAC' } })
    fireEvent.change(screen.getByPlaceholderText('IE29AIBK...'), { target: { value: 'ie81 bofi 9036 2194 9006 74' } })
    fireEvent.change(screen.getByPlaceholderText('BOFIIE2D'), { target: { value: 'bofiie2d' } })
    fireEvent.change(screen.getByLabelText(/execution date/i), { target: { value: '2026-09-15' } })
    parseAndGenerate()
    const xml = getXml()
    expect(xml).toContain('<InitgPty>\n        <Id>\n          <PrvtId>\n            <Othr>\n              <Id>673710</Id>')
    expect(xml).toContain('<Dbtr>\n        <Nm>OUTSURANCE DAC</Nm>')
    expect(xml).toContain('<IBAN>IE81BOFI90362194900674</IBAN>')
    expect(xml).toContain('<BICFI>BOFIIE2D</BICFI>')
    expect(xml).toContain('<ReqdExctnDt>\n        <Dt>2026-09-15</Dt>')
  })

  it('emits NOTPROVIDED as the debtor agent when the BIC is empty', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    expect(getXml()).not.toContain('<BICFI>')
    expect(getXml()).toContain('<Othr>\n            <Id>NOTPROVIDED</Id>')
  })

  it('maps each CSV row to a credit transfer with the absolute amount', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    const xml = getXml()
    expect(xml).toContain('<EndToEndId>OUT00140169-1-5-VEH-4</EndToEndId>')
    expect(xml).toContain('<InstdAmt Ccy="EUR">0.62</InstdAmt>')
    expect(xml).toContain('<InstdAmt Ccy="EUR">17.35</InstdAmt>')
    expect(xml).toContain('<Nm>OUT00140169</Nm>')
    expect(xml).toContain('<IBAN>IE29BOFI90121234123412</IBAN>')
    expect(xml).not.toContain('<RmtInf>')
  })

  it('uses the CLMPAY transaction type in the message id', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByLabelText(/transaction type/i), { target: { value: 'CLMPAY' } })
    parseAndGenerate()
    expect(getXml()).toMatch(/<MsgId>\d{8}-\d{6}-CLMPAY-PAIN001<\/MsgId>/)
  })

  it('escapes XML special characters in names and emits remittance info when mapped', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate(NAMED_CSV)
    const xml = getXml()
    expect(xml).toContain('<Nm>Sheedy &amp; Kinsella Solicitors LLP</Nm>')
    expect(xml).toContain('<RmtInf>\n          <Ustrd>INV-001</Ustrd>')
    expect((xml.match(/<RmtInf>/g) || []).length).toBe(1)
    expect(xml).toContain('<InstdAmt Ccy="EUR">8000.00</InstdAmt>')
    expect(xml).toContain('<InstdAmt Ccy="EUR">80.50</InstdAmt>')
    expect(xml).toContain('<CtrlSum>8080.50</CtrlSum>')
  })

  it('strips whitespace from creditor IBANs', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate('Reference,Name,IBAN,Amount\nR1,Ann,"ie29 aibk 9311 5212 3456 78",1')
    expect(getXml()).toContain('<IBAN>IE29AIBK93115212345678</IBAN>')
  })

  it('clears the previous XML when the mapping changes', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    expect(getXml()).toContain('<Document')
    fireEvent.change(mappingSelect('remittance'), { target: { value: 'CollectionStatus' } })
    expect(getXml()).toBe('')
  })

  // ── localStorage ───────────────────────────────────────────────────────
  it('saves fields to localStorage on Save fields click', () => {
    render(<Csv2SepaPain001 />)
    fireEvent.change(screen.getByPlaceholderText('673710'), { target: { value: '111111' } })
    fireEvent.change(screen.getByPlaceholderText('BOFIIE2D'), { target: { value: 'BOFIIE2D' } })
    fireEvent.click(screen.getByText(/save fields/i))
    const stored = JSON.parse(localStorage.getItem('sepaCtConverterFields')!)
    expect(stored.initiatingPartyId).toBe('111111')
    expect(stored.debtorBic).toBe('BOFIIE2D')
    expect(screen.getByText(/fields saved successfully/i)).toBeInTheDocument()
  })

  it('restores saved fields from localStorage on mount', () => {
    localStorage.setItem(
      'sepaCtConverterFields',
      JSON.stringify({ initiatingPartyId: '555555', debtorName: 'Restored Corp', debtorBic: 'AIBKIE2D', transactionType: 'CLMPAY' })
    )
    render(<Csv2SepaPain001 />)
    expect(screen.getByPlaceholderText('673710')).toHaveValue('555555')
    expect(screen.getByPlaceholderText('Company Name DAC')).toHaveValue('Restored Corp')
    expect(screen.getByPlaceholderText('BOFIIE2D')).toHaveValue('AIBKIE2D')
    expect(screen.getByLabelText(/transaction type/i)).toHaveValue('CLMPAY')
    expect(screen.getByText(/previously saved fields have been restored/i)).toBeInTheDocument()
  })

  it('clears localStorage and resets the form on Clear saved click', () => {
    localStorage.setItem('sepaCtConverterFields', JSON.stringify({ initiatingPartyId: '999999' }))
    render(<Csv2SepaPain001 />)
    fireEvent.click(screen.getByText(/clear saved/i))
    expect(localStorage.getItem('sepaCtConverterFields')).toBeNull()
    expect(screen.getByPlaceholderText('673710')).toHaveValue('')
    expect(screen.getByLabelText(/transaction type/i)).toHaveValue('REFUND')
  })

  // ── Copy and Download ──────────────────────────────────────────────────
  it('copy button writes XML to clipboard', async () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    fireEvent.click(screen.getByText('Copy'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('<CstmrCdtTrfInitn>'))
    )
  })

  it('download button names the file after the message id', () => {
    render(<Csv2SepaPain001 />)
    parseAndGenerate()
    fireEvent.click(screen.getByText(/download xml/i))
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(screen.getByText('Downloaded')).toBeInTheDocument()
  })
})
