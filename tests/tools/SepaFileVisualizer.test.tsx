import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SepaFileVisualizer from '../../src/components/tools/SepaFileVisualizer.tsx'

// ── Fixtures ───────────────────────────────────────────────────────────────
const MINIMAL_DD = `<?xml version="1.0" encoding="utf-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08"><CstmrDrctDbtInitn><GrpHdr><MsgId>MSG-DD-1</MsgId><CreDtTm>2026-07-23T10:00:00</CreDtTm><NbOfTxs>1</NbOfTxs><CtrlSum>10.00</CtrlSum><InitgPty><Id><PrvtId><Othr><Id>IE00ZZZ000000</Id></Othr></PrvtId></Id></InitgPty></GrpHdr><PmtInf><PmtInfId>PMT-1</PmtInfId><PmtMtd>DD</PmtMtd><NbOfTxs>1</NbOfTxs><CtrlSum>10.00</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>FRST</SeqTp></PmtTpInf><ReqdColltnDt>2026-07-27</ReqdColltnDt><Cdtr><Nm>Test Creditor</Nm></Cdtr><CdtrAcct><Id><IBAN>IE00AAAA00000000000000</IBAN></Id></CdtrAcct><CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt><CdtrSchmeId><Id><PrvtId><Othr><Id>IE00ZZZ000000</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId><DrctDbtTxInf><PmtId><EndToEndId>E2E-DD-1</EndToEndId></PmtId><InstdAmt Ccy="EUR">10.00</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>MND-1</MndtId><DtOfSgntr>2026-01-01</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Jane Debtor</Nm></Dbtr><DbtrAcct><Id><IBAN>IE00BBBB00000000000000</IBAN></Id></DbtrAcct></DrctDbtTxInf></PmtInf></CstmrDrctDbtInitn></Document>`

const MISMATCHED_DD = MINIMAL_DD.replace('<NbOfTxs>1</NbOfTxs><CtrlSum>10.00</CtrlSum><PmtTpInf>', '<NbOfTxs>2</NbOfTxs><CtrlSum>10.00</CtrlSum><PmtTpInf>')

const MINIMAL_CT = `<?xml version="1.0" encoding="utf-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"><CstmrCdtTrfInitn><GrpHdr><MsgId>MSG-CT-1</MsgId><CreDtTm>2026-07-23T10:00:00</CreDtTm><NbOfTxs>1</NbOfTxs><CtrlSum>500.00</CtrlSum><InitgPty><Id><PrvtId><Othr><Id>12345</Id></Othr></PrvtId></Id></InitgPty></GrpHdr><PmtInf><PmtInfId>PMT-CT-1</PmtInfId><PmtMtd>TRF</PmtMtd><NbOfTxs>1</NbOfTxs><CtrlSum>500.00</CtrlSum><ReqdExctnDt><Dt>2026-07-24</Dt></ReqdExctnDt><Dbtr><Nm>Test Debtor Co</Nm></Dbtr><DbtrAcct><Id><IBAN>IE00CCCC00000000000000</IBAN></Id></DbtrAcct><DbtrAgt><FinInstnId><BICFI>TESTIE2D</BICFI></FinInstnId></DbtrAgt><CdtTrfTxInf><PmtId><EndToEndId>E2E-CT-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">500.00</InstdAmt></Amt><Cdtr><Nm>Some Supplier Ltd</Nm></Cdtr><CdtrAcct><Id><IBAN>IE00DDDD00000000000000</IBAN></Id></CdtrAcct><RmtInf><Ustrd>INV-001</Ustrd></RmtInf></CdtTrfTxInf></PmtInf></CstmrCdtTrfInitn></Document>`

const INVALID_XML = `<Document><Unclosed>`

function makeFile(content: string, name: string) {
  return new File([content], name, { type: 'application/xml' })
}

async function uploadFiles(files: File[]) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
  fireEvent.change(input, { target: { files } })
  await waitFor(() => expect(screen.getAllByText(/error|pain008|pain001/i).length).toBeGreaterThan(0))
}

const pasteAndAdd = (xml: string) => {
  fireEvent.change(screen.getByPlaceholderText(/paste a pain.008 or pain.001/i), { target: { value: xml } })
  fireEvent.click(screen.getByText(/parse & add/i))
}

describe('SepaFileVisualizer', () => {
  it('renders the file input and load samples button', () => {
    render(<SepaFileVisualizer />)
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument()
    expect(screen.getByText('Load 3 samples')).toBeInTheDocument()
  })

  it('shows an error when parsing invalid XML from the paste box', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(INVALID_XML)
    expect(document.querySelector('[data-testid="alert-error"]')).not.toBeNull()
  })

  it('parses a pasted pain.008 Direct Debit file and shows DD-specific columns', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    expect(screen.getByText('MSG-DD-1')).toBeInTheDocument()
    expect(screen.getByText(/direct debit initiation/i)).toBeInTheDocument()
    expect(screen.getByText('Mandate ID')).toBeInTheDocument()
    expect(screen.getByText('Jane Debtor')).toBeInTheDocument()
    expect(screen.getByText('E2E-DD-1')).toBeInTheDocument()
  })

  it('parses a pasted pain.001 Credit Transfer file and shows CT-specific columns', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_CT)
    expect(screen.getByText('MSG-CT-1')).toBeInTheDocument()
    expect(screen.getByText(/credit transfer initiation/i)).toBeInTheDocument()
    expect(screen.getByText('Remittance Info')).toBeInTheDocument()
    expect(screen.getByText('Some Supplier Ltd')).toBeInTheDocument()
    expect(screen.queryByText('Mandate ID')).not.toBeInTheDocument()
  })

  it('flags a totals mismatch between declared and computed values', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MISMATCHED_DD)
    expect(screen.getByText(/totals mismatch detected/i)).toBeInTheDocument()
  })

  it('shows the balanced message when declared and computed totals agree', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    expect(screen.getByText(/declared totals match computed totals/i)).toBeInTheDocument()
  })

  it('loads and detects both message types from an uploaded file list', async () => {
    render(<SepaFileVisualizer />)
    await uploadFiles([makeFile(MINIMAL_DD, 'dd.xml'), makeFile(MINIMAL_CT, 'ct.xml')])
    expect((await screen.findAllByText('dd.xml')).length).toBeGreaterThan(0)
    expect(screen.getByText('ct.xml')).toBeInTheDocument()
    expect(screen.getByText('PAIN008')).toBeInTheDocument()
    expect(screen.getByText('PAIN001')).toBeInTheDocument()
  })

  it('marks a file with an unrecognized root element as an error row', async () => {
    render(<SepaFileVisualizer />)
    await uploadFiles([makeFile(INVALID_XML, 'bad.xml')])
    expect(await screen.findByText('bad.xml')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
  })

  it('switches the detail view when a different loaded file is selected', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    pasteAndAdd(MINIMAL_CT)
    // Most recently added file is selected by default
    expect(screen.getByText('MSG-CT-1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('pasted-1.xml'))
    expect(screen.getByText('MSG-DD-1')).toBeInTheDocument()
  })

  it('removes a loaded file from the list', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    const removeBtn = document.querySelector<HTMLButtonElement>('[data-testid="sepa-file-remove"]')!
    fireEvent.click(removeBtn)
    expect(screen.queryByText('MSG-DD-1')).not.toBeInTheDocument()
  })

  it('clears all loaded files on Clear all click', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    fireEvent.click(screen.getByText(/clear all/i))
    expect(screen.queryByText('MSG-DD-1')).not.toBeInTheDocument()
    expect(screen.queryByText(/clear all/i)).not.toBeInTheDocument()
  })

  it('filters transactions with the search box', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    fireEvent.change(screen.getByPlaceholderText('Search transactions...'), { target: { value: 'Jane' } })
    expect(screen.getByText(/transactions \(1 of 1\)/i)).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search transactions...'), { target: { value: 'nomatch' } })
    expect(screen.getByText(/transactions \(0 of 1\)/i)).toBeInTheDocument()
  })

  it('downloads transactions as CSV', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    fireEvent.click(screen.getByText(/download transactions as csv/i))
    expect(screen.getByText(/downloaded/i)).toBeInTheDocument()
  })

  it('loads the three built-in samples and detects both message types', () => {
    render(<SepaFileVisualizer />)
    fireEvent.click(screen.getByText('Load 3 samples'))
    expect(screen.getAllByText('20260721-220026-NORMAL-PAIN008.xml').length).toBeGreaterThan(0)
    expect(screen.getByText('20260722-220031-RESUBM-PAIN008.xml')).toBeInTheDocument()
    expect(screen.getByText('20260722-220032-CLMPAY-PAIN001.xml')).toBeInTheDocument()
  })

  // ── Sorting ──────────────────────────────────────────────────────────────
  it('toggles sort direction when clicking the same column header twice', () => {
    render(<SepaFileVisualizer />)
    fireEvent.click(screen.getByText('Load 3 samples'))
    const amountHeader = screen.getByText('Amount')
    fireEvent.click(amountHeader)
    const ascFirstRow = screen.getAllByRole('row')[1].textContent
    fireEvent.click(amountHeader)
    const descFirstRow = screen.getAllByRole('row')[1].textContent
    expect(ascFirstRow).not.toBe(descFirstRow)
  })

  it('switches sort key when clicking a different column header', () => {
    render(<SepaFileVisualizer />)
    pasteAndAdd(MINIMAL_DD)
    fireEvent.click(screen.getByText('Debtor'))
    expect(screen.getByText('Debtor').textContent).toContain('▲')
  })

  // ── Filters (multi-group sample file) ─────────────────────────────────────
  it('filters transactions by sequence type', () => {
    render(<SepaFileVisualizer />)
    fireEvent.click(screen.getByText('Load 3 samples'))
    // The first sample (selected by default) has an FRST group with 2 txs and an RCUR group with 15 txs
    const seqSelect = screen.getByText('All sequences').closest('select')!
    fireEvent.change(seqSelect, { target: { value: 'FRST' } })
    expect(screen.getByText(/transactions \(2 of 17\)/i)).toBeInTheDocument()
  })

  it('filters transactions by payment group', () => {
    render(<SepaFileVisualizer />)
    fireEvent.click(screen.getByText('Load 3 samples'))
    const groupSelect = screen.getByText('All payment groups').closest('select')!
    fireEvent.change(groupSelect, { target: { value: '20260721-220026-NORMAL-PAIN008-FRST' } })
    expect(screen.getByText(/transactions \(2 of 17\)/i)).toBeInTheDocument()
  })
})
