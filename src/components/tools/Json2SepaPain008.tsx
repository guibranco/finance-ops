import { useState, useEffect, useRef } from 'react'
import { Check, Download, Save, Trash2 } from 'lucide-react'
import CopyButton from '../CopyButton'
import {
  alert,
  alertVariants,
  btn,
  btnDanger,
  btnGhost,
  btnPrimary,
  btnRow,
  btnSecondary,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  codeArea,
  codeAreaTall,
  codeAreaWrap,
  codeAreaXl,
  cx,
  formField,
  formInput,
  formLabel,
  formSelect,
  toolGrid2,
} from '../../ui'

const STORAGE_KEY = 'sepaConverterFields'

interface DirectDebitInput {
  AmountDue: number
  Iban: string
  AccountHolderName: string
  MandateId: string
  MandateSignedDate: string
  TransactionReference?: string
  id?: string
  IsFirstDirectDebit?: boolean
}

interface SavedFields {
  oin?: string
  creditorName?: string
  creditorIban?: string
  collectionDate?: string
  transactionType?: string
}

const SAMPLE_JSON = JSON.stringify({
  BatchId: '94a6b2dc-9999-427b-9999-539999c9666f',
  Type: 'DirectDebitCollect',
  TransactionReference: 'OUT00123456-1-2-HME-8',
  CustomerId: 'OUT00123456',
  AmountDue: 55.69,
  Iban: 'IE29AIBK93115212345678 ',
  AccountHolderName: 'John Doe',
  MandateId: 'OUT00123456-2',
  MandateSignedDate: '2024-10-21',
  IsFirstDirectDebit: false,
  id: 'OUT00123456-1-2-HME-8',
}, null, 2)

function formatDate(s?: string): string {
  if (!s) return ''
  try { return new Date(s).toISOString().split('T')[0] } catch { return s }
}

function formatDateTime(d: Date | null = null): string {
  return (d || new Date()).toISOString().replace(/\.\d{3}Z$/, '')
}

function generateMessageId(type = 'NORMAL'): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
  return `${dateStr}-${timeStr}-${type}-PAIN008`
}

function getDefaultCollectionDate(): string {
  const d = new Date(); d.setDate(d.getDate() + 2)
  return d.toISOString().split('T')[0]
}

function cleanIban(iban?: string): string {
  return iban ? iban.trim().replace(/\s+/g, '') : ''
}

function readSavedFields(): SavedFields | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as SavedFields } catch { return null }
}

export default function Json2SepaPain008() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)
  const [oin, setOin] = useState(() => readSavedFields()?.oin || 'IE99ZZZ999999')
  const [creditorName, setCreditorName] = useState(() => readSavedFields()?.creditorName || 'Company Name DAC')
  const [creditorIban, setCreditorIban] = useState(() => readSavedFields()?.creditorIban || 'IE29AIBK93115212345678')
  const [collectionDate, setCollectionDate] = useState(() => readSavedFields()?.collectionDate || getDefaultCollectionDate())
  const [transactionType, setTransactionType] = useState(() => readSavedFields()?.transactionType || 'NORMAL')
  const [xmlOutput, setXmlOutput] = useState('')
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(() => (readSavedFields() ? 'info:Previously saved fields have been restored.' : ''))
  const [downloaded, setDownloaded] = useState(false)
  const msgIdRef = useRef('')

  // Auto-clear whichever saved-fields notice (restored/saved/cleared) is showing.
  useEffect(() => {
    if (!savedMsg) return
    const id = setTimeout(() => setSavedMsg(''), 3000)
    return () => clearTimeout(id)
  }, [savedMsg])

  function saveFields() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ oin, creditorName, creditorIban, collectionDate, transactionType }))
    setSavedMsg('success:Fields saved successfully.')
  }

  function clearSavedFields() {
    localStorage.removeItem(STORAGE_KEY)
    setOin(''); setCreditorName(''); setCreditorIban('')
    setCollectionDate(getDefaultCollectionDate()); setTransactionType('NORMAL')
    setSavedMsg('info:Saved fields cleared and form reset.')
  }

  function convertToXML() {
    setError(''); setXmlOutput('')
    if (!jsonInput.trim()) return setError('Please enter JSON data.')
    if (!oin.trim())         return setError('Please enter an OIN.')
    if (!creditorName.trim()) return setError('Please enter a creditor account name.')
    if (!creditorIban.trim()) return setError('Please enter a creditor IBAN.')

    try {
      const data = JSON.parse(jsonInput) as DirectDebitInput
      const required: (keyof DirectDebitInput)[] = ['AmountDue', 'Iban', 'AccountHolderName', 'MandateId', 'MandateSignedDate']
      const missing = required.filter(f => !data[f])
      if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`)

      const msgId = generateMessageId(transactionType)
      msgIdRef.current = msgId
      const seqType = data.IsFirstDirectDebit ? 'FRST' : 'RCUR'
      const createdDT = formatDateTime()
      const cleanedDbtrIban = cleanIban(data.Iban)
      const cleanedCdtrIban = cleanIban(creditorIban)
      const endToEndId = data.TransactionReference || data.id || 'NOTPROVIDED'

      const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Document
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08"
>
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${createdDT}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${data.AmountDue}</CtrlSum>
      <InitgPty>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${oin}</Id>
            </Othr>
          </PrvtId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-${seqType}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${data.AmountDue}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>${seqType}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${collectionDate}</ReqdColltnDt>
      <Cdtr>
        <Nm>${creditorName}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${cleanedCdtrIban}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <Othr>
            <Id>NOTPROVIDED</Id>
          </Othr>
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${oin}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${endToEndId}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${data.AmountDue}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${data.MandateId}</MndtId>
            <DtOfSgntr>${formatDate(data.MandateSignedDate)}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            <Othr>
              <Id>NOTPROVIDED</Id>
            </Othr>
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${data.AccountHolderName}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${cleanedDbtrIban}</IBAN>
          </Id>
        </DbtrAcct>
      </DrctDbtTxInf>
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`

      setXmlOutput(xml)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleDownload() {
    if (!xmlOutput) return
    const filename = msgIdRef.current ? `${msgIdRef.current}.xml` : 'sepa-payment.xml'
    const blob = new Blob([xmlOutput], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  const [savedType, savedText] = savedMsg ? savedMsg.split(':') : ['', '']

  return (
    <div className={toolGrid2}>
      {/* Left: Config + Input */}
      <div className="flex flex-col gap-4">
        {/* Config */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Configuration
          </div>
          <div className={formField}>
            <label className={formLabel}>OIN</label>
            <input className={formInput} value={oin} onChange={e => setOin(e.target.value)} placeholder="IE99ZZZ999999" />
          </div>
          <div className={formField}>
            <label className={formLabel}>Creditor Account Name</label>
            <input className={formInput} value={creditorName} onChange={e => setCreditorName(e.target.value)} placeholder="Company Name DAC" />
          </div>
          <div className={formField}>
            <label className={formLabel}>Creditor IBAN</label>
            <input className={formInput} value={creditorIban} onChange={e => setCreditorIban(e.target.value)} placeholder="IE29AIBK..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={formField}>
              <label className={formLabel}>Collection Date</label>
              <input type="date" className={formInput} value={collectionDate} onChange={e => setCollectionDate(e.target.value)} />
            </div>
            <div className={formField}>
              <label className={formLabel}>Transaction Type</label>
              <select className={formSelect} value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                <option value="NORMAL">NORMAL</option>
                <option value="RNEWAL">RENEWAL</option>
                <option value="RESUBM">RESUBMISSION</option>
              </select>
            </div>
          </div>
          <div className={btnRow}>
            <button className={cx(btn, btnGhost)} onClick={saveFields}>
              <Save size={14} /> Save fields
            </button>
            <button className={cx(btn, btnDanger)} onClick={clearSavedFields}>
              <Trash2 size={14} /> Clear saved
            </button>
          </div>
          {savedText && (
            <div className={cx(alert, savedType === 'success' ? alertVariants.success : alertVariants.info)}>
              {savedText}
            </div>
          )}
        </div>

        {/* JSON Input */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Direct Debit JSON
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={cx(codeArea, codeAreaTall)}
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder="Paste the Direct Debit JSON here..."
            />
          </div>
          <div className={btnRow}>
            <button className={cx(btn, btnPrimary)} onClick={convertToXML}>Convert to XML →</button>
          </div>
          {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
        </div>
      </div>

      {/* Right: XML Output */}
      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDotGreen} />
          SEPA pain.008.001.08 XML Output
        </div>
        <div className={cx(codeAreaWrap, 'flex-1')}>
          <textarea
            className={cx(codeArea, codeAreaXl, 'font-mono text-[#a8d8ff]')}
            value={xmlOutput}
            readOnly
            placeholder="XML output will appear here..."
          />
          <CopyButton text={xmlOutput} timeoutMs={2000} />
        </div>
        {xmlOutput && (
          <div className={cx(btnRow, 'mt-3.5')}>
            <button className={cx(btn, btnSecondary)} onClick={handleDownload}>
              {downloaded ? <Check size={14} /> : <Download size={14} />}
              {downloaded ? 'Downloaded' : 'Download XML'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
