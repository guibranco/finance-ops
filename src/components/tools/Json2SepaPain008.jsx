import { useState, useEffect, useRef } from 'react'
import CopyButton from '../CopyButton'

const STORAGE_KEY = 'sepaConverterFields'

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

function formatDate(s) {
  if (!s) return ''
  try { return new Date(s).toISOString().split('T')[0] } catch { return s }
}

function formatDateTime(d = null) {
  return (d || new Date()).toISOString().replace(/\.\d{3}Z$/, '')
}

function generateMessageId(type = 'NORMAL') {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
  return `${dateStr}-${timeStr}-${type}-PAIN008`
}

function getDefaultCollectionDate() {
  const d = new Date(); d.setDate(d.getDate() + 2)
  return d.toISOString().split('T')[0]
}

function cleanIban(iban) {
  return iban ? iban.trim().replace(/\s+/g, '') : ''
}

export default function Json2SepaPain008() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON)
  const [oin, setOin] = useState('IE99ZZZ999999')
  const [creditorName, setCreditorName] = useState('Company Name DAC')
  const [creditorIban, setCreditorIban] = useState('IE29AIBK93115212345678')
  const [collectionDate, setCollectionDate] = useState(getDefaultCollectionDate())
  const [transactionType, setTransactionType] = useState('NORMAL')
  const [xmlOutput, setXmlOutput] = useState('')
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const msgIdRef = useRef('')

  // Load saved fields on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const f = JSON.parse(raw)
        if (f.oin)             setOin(f.oin)
        if (f.creditorName)    setCreditorName(f.creditorName)
        if (f.creditorIban)    setCreditorIban(f.creditorIban)
        if (f.collectionDate)  setCollectionDate(f.collectionDate)
        if (f.transactionType) setTransactionType(f.transactionType)
        setSavedMsg('info:Previously saved fields have been restored.')
        setTimeout(() => setSavedMsg(''), 3000)
      } catch {}
    }
  }, [])

  function saveFields() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ oin, creditorName, creditorIban, collectionDate, transactionType }))
    setSavedMsg('success:Fields saved successfully.')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  function clearSavedFields() {
    localStorage.removeItem(STORAGE_KEY)
    setOin(''); setCreditorName(''); setCreditorIban('')
    setCollectionDate(getDefaultCollectionDate()); setTransactionType('NORMAL')
    setSavedMsg('info:Saved fields cleared and form reset.')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  function convertToXML() {
    setError(''); setXmlOutput('')
    if (!jsonInput.trim()) return setError('Please enter JSON data.')
    if (!oin.trim())         return setError('Please enter an OIN.')
    if (!creditorName.trim()) return setError('Please enter a creditor account name.')
    if (!creditorIban.trim()) return setError('Please enter a creditor IBAN.')

    try {
      const data = JSON.parse(jsonInput)
      const required = ['AmountDue', 'Iban', 'AccountHolderName', 'MandateId', 'MandateSignedDate']
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
      setError(e.message)
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
    <div className="tool-grid-2">
      {/* Left: Config + Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Config */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" />
            Configuration
          </div>
          <div className="form-field">
            <label className="form-label">OIN</label>
            <input className="form-input" value={oin} onChange={e => setOin(e.target.value)} placeholder="IE99ZZZ999999" />
          </div>
          <div className="form-field">
            <label className="form-label">Creditor Account Name</label>
            <input className="form-input" value={creditorName} onChange={e => setCreditorName(e.target.value)} placeholder="Company Name DAC" />
          </div>
          <div className="form-field">
            <label className="form-label">Creditor IBAN</label>
            <input className="form-input" value={creditorIban} onChange={e => setCreditorIban(e.target.value)} placeholder="IE29AIBK..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label className="form-label">Collection Date</label>
              <input type="date" className="form-input" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Transaction Type</label>
              <select className="form-input" value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                <option value="NORMAL">NORMAL</option>
                <option value="RNEWAL">RENEWAL</option>
                <option value="RESUBM">RESUBMISSION</option>
              </select>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={saveFields}>💾 Save fields</button>
            <button className="btn btn-ghost btn-danger" onClick={clearSavedFields}>🗑 Clear saved</button>
          </div>
          {savedText && (
            <div className={`alert ${savedType === 'success' ? 'alert-success' : 'alert-info'}`}>
              {savedText}
            </div>
          )}
        </div>

        {/* JSON Input */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-dot" />
            Direct Debit JSON
          </div>
          <div className="code-area-wrap">
            <textarea
              className="code-area code-area-tall"
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder="Paste the Direct Debit JSON here..."
            />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={convertToXML}>Convert to XML →</button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>

      {/* Right: XML Output */}
      <div className="card">
        <div className="card-title">
          <span className="card-title-dot green" />
          SEPA pain.008.001.08 XML Output
        </div>
        <div className="code-area-wrap" style={{ flex: 1 }}>
          <textarea
            className="code-area code-area-xl"
            value={xmlOutput}
            readOnly
            placeholder="XML output will appear here..."
            style={{ fontFamily: 'var(--font-mono)', color: '#a8d8ff' }}
          />
          <CopyButton text={xmlOutput} timeoutMs={2000} />
        </div>
        {xmlOutput && (
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn-secondary" onClick={handleDownload}>
              {downloaded ? '✓ Downloaded' : '⬇ Download XML'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
