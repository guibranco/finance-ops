import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Check, Download, Save, Trash2, Upload } from 'lucide-react'
import CopyButton from '../CopyButton'
import {
  alert,
  alertList,
  alertListItem,
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
  codeAreaWrap,
  codeAreaXl,
  cx,
  formField,
  formInput,
  formLabel,
  formSelect,
  table,
  tableWrap,
  td,
  tdFirst,
  th,
  thFirst,
  theadRow,
  toolGrid2,
} from '../../ui'
import { parseCsv, type CsvRow } from '../../lib/csv'
import {
  addDays,
  cleanIban,
  downloadTextFile,
  escapeXml,
  formatDateTime,
  generateMessageId,
  isIbanChecksumValid,
  isIbanShaped,
  parseAmount,
  round2,
} from '../../lib/sepa'

const STORAGE_KEY = 'sepaCtConverterFields'
const MAX_END_TO_END_LEN = 35
const MAX_NAME_LEN = 70
const MAX_REMITTANCE_LEN = 140

interface SavedFields {
  initiatingPartyId?: string
  debtorName?: string
  debtorIban?: string
  debtorBic?: string
  executionDate?: string
  transactionType?: string
}

type FieldKey = 'endToEndId' | 'amount' | 'iban' | 'creditorName' | 'remittance'
type Mapping = Record<FieldKey, string>

interface FieldDef {
  key: FieldKey
  label: string
  required: boolean
  // Normalised header names (lower-case, alphanumerics only) tried in order.
  aliases: string[]
  // Last-resort aliases: usable, but worth a warning because they are not a
  // real name column (e.g. the policy number standing in for the payee name).
  fallbackAliases?: string[]
}

const FIELD_DEFS: FieldDef[] = [
  { key: 'endToEndId', label: 'End-to-End ID', required: true, aliases: ['transactionreference', 'endtoendid', 'transactionid', 'reference', 'id'] },
  { key: 'amount', label: 'Amount', required: true, aliases: ['amountduecs', 'amountdue', 'refundamount', 'amount', 'instdamt'] },
  { key: 'iban', label: 'Creditor IBAN', required: true, aliases: ['iban', 'creditoriban', 'policyholderiban', 'accountiban'] },
  {
    key: 'creditorName',
    label: 'Creditor Name',
    required: true,
    aliases: ['creditorname', 'accountholdername', 'policyholdername', 'accountholder', 'creditor', 'name', 'customername'],
    fallbackAliases: ['policynumber', 'customerid', 'policyholder'],
  },
  { key: 'remittance', label: 'Remittance Info', required: false, aliases: ['remittanceinfo', 'remittance', 'ustrd', 'description'] },
]

const EMPTY_MAPPING: Mapping = { endToEndId: '', amount: '', iban: '', creditorName: '', remittance: '' }

const SAMPLE_CSV = [
  'transaction_reference,PolicyNumber,policyholder_eircode,Amount Due (CS),CollectionStatus,IBAN',
  'OUT00140169-1-5-VEH-4,OUT00140169,D18 K7W4,-0.62,Rejected,IE29BOFI90121234123412',
  'OUT00140170-1-2-HME-3,OUT00140170,D02 X285,-17.35,Rejected,IE29AIBK93115212345678',
].join('\n')

interface CreditTransfer {
  row: number
  endToEndId: string
  creditorName: string
  iban: string
  amount: number
  remittance: string
}

interface Prepared {
  transfers: CreditTransfer[]
  errors: string[]
  warnings: string[]
}

function normaliseHeader(h: string): string {
  return h.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
}

function findHeader(headers: string[], aliases: string[]): string {
  const normalised = headers.map(normaliseHeader)
  for (const alias of aliases) {
    const idx = normalised.indexOf(alias)
    if (idx >= 0) return headers[idx]
  }
  return ''
}

// Picks a column for each field by header name; returns the mapping plus a
// note for every field that had to fall back to a stand-in column.
function autoDetectMapping(headers: string[]): { mapping: Mapping; notes: string[] } {
  const mapping: Mapping = { ...EMPTY_MAPPING }
  const notes: string[] = []
  for (const def of FIELD_DEFS) {
    let header = findHeader(headers, def.aliases)
    if (!header && def.fallbackAliases) {
      header = findHeader(headers, def.fallbackAliases)
      if (header) notes.push(`No ${def.label.toLowerCase()} column found — using "${header}" as the ${def.label.toLowerCase()}. Verify before sending.`)
    }
    mapping[def.key] = header
  }
  return { mapping, notes }
}

function prepareTransfers(rows: CsvRow[], mapping: Mapping): Prepared {
  const errors: string[] = []
  const warnings: string[] = []

  const missing = FIELD_DEFS.filter(d => d.required && !mapping[d.key]).map(d => d.label)
  if (missing.length) {
    errors.push(`Map a column for: ${missing.join(', ')}.`)
    return { transfers: [], errors, warnings }
  }
  if (rows.length === 0) {
    errors.push('The CSV has a header row but no data rows.')
    return { transfers: [], errors, warnings }
  }

  const transfers: CreditTransfer[] = []
  const seen = new Map<string, number>()
  let negatives = 0
  let positives = 0

  rows.forEach((r, idx) => {
    const row = idx + 2 // 1-based, after the header line
    const endToEndId = (r[mapping.endToEndId] || '').trim()
    const creditorName = (r[mapping.creditorName] || '').trim()
    const iban = cleanIban(r[mapping.iban])
    const rawAmount = r[mapping.amount] || ''
    const remittance = mapping.remittance ? (r[mapping.remittance] || '').trim() : ''

    if (!endToEndId) errors.push(`Row ${row}: End-to-End ID is empty.`)
    else if (endToEndId.length > MAX_END_TO_END_LEN) errors.push(`Row ${row}: End-to-End ID "${endToEndId}" exceeds ${MAX_END_TO_END_LEN} characters.`)
    else if (seen.has(endToEndId)) errors.push(`Row ${row}: duplicate End-to-End ID "${endToEndId}" (also on row ${seen.get(endToEndId)}).`)
    else seen.set(endToEndId, row)

    if (!creditorName) errors.push(`Row ${row}: Creditor Name is empty.`)
    else if (creditorName.length > MAX_NAME_LEN) warnings.push(`Row ${row}: creditor name is longer than ${MAX_NAME_LEN} characters and may be truncated by the bank.`)

    if (!iban) errors.push(`Row ${row}: IBAN is empty.`)
    else if (!isIbanShaped(iban)) errors.push(`Row ${row}: "${iban}" does not look like an IBAN.`)
    else if (!isIbanChecksumValid(iban)) warnings.push(`Row ${row}: IBAN "${iban}" fails the mod-97 checksum — double-check it before sending.`)

    const parsed = parseAmount(rawAmount)
    if (parsed === null) errors.push(`Row ${row}: amount "${rawAmount}" is not a number.`)
    else if (round2(Math.abs(parsed)) === 0) errors.push(`Row ${row}: amount is zero.`)
    else if (parsed < 0) negatives++
    else positives++

    if (remittance.length > MAX_REMITTANCE_LEN) warnings.push(`Row ${row}: remittance info is longer than ${MAX_REMITTANCE_LEN} characters and may be truncated by the bank.`)

    transfers.push({ row, endToEndId, creditorName, iban, amount: round2(Math.abs(parsed ?? 0)), remittance })
  })

  if (negatives > 0 && positives > 0) {
    warnings.push(`Amounts have mixed signs (${negatives} negative, ${positives} positive). Every transfer uses the absolute value.`)
  }

  return { transfers, errors, warnings }
}

function buildPain001Xml(opts: {
  msgId: string
  createdDT: string
  initiatingPartyId: string
  debtorName: string
  debtorIban: string
  debtorBic: string
  executionDate: string
  transfers: CreditTransfer[]
}): string {
  const total = round2(opts.transfers.reduce((s, t) => s + t.amount, 0)).toFixed(2)
  const agent = opts.debtorBic
    ? `<BICFI>${escapeXml(opts.debtorBic)}</BICFI>`
    : '<Othr>\n            <Id>NOTPROVIDED</Id>\n          </Othr>'

  const txs = opts.transfers.map(t => `      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${escapeXml(t.endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${t.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${escapeXml(t.creditorName)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${t.iban}</IBAN>
          </Id>
        </CdtrAcct>${t.remittance ? `
        <RmtInf>
          <Ustrd>${escapeXml(t.remittance)}</Ustrd>
        </RmtInf>` : ''}
      </CdtTrfTxInf>`).join('\n')

  return `<?xml version="1.0" encoding="utf-8"?>
<Document
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"
>
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${opts.msgId}</MsgId>
      <CreDtTm>${opts.createdDT}</CreDtTm>
      <NbOfTxs>${opts.transfers.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <InitgPty>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${escapeXml(opts.initiatingPartyId)}</Id>
            </Othr>
          </PrvtId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${opts.msgId}-REF</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${opts.transfers.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <ReqdExctnDt>
        <Dt>${opts.executionDate}</Dt>
      </ReqdExctnDt>
      <Dbtr>
        <Nm>${escapeXml(opts.debtorName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${opts.debtorIban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          ${agent}
        </FinInstnId>
      </DbtrAgt>
${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
}

function readSavedFields(): SavedFields | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as SavedFields } catch { return null }
}

export default function Csv2SepaPain001() {
  const [csvInput, setCsvInput] = useState(SAMPLE_CSV)
  const [initiatingPartyId, setInitiatingPartyId] = useState(() => readSavedFields()?.initiatingPartyId || '000000')
  const [debtorName, setDebtorName] = useState(() => readSavedFields()?.debtorName || 'Company Name DAC')
  const [debtorIban, setDebtorIban] = useState(() => readSavedFields()?.debtorIban || 'IE29AIBK93115212345678')
  const [debtorBic, setDebtorBic] = useState(() => readSavedFields()?.debtorBic || '')
  const [executionDate, setExecutionDate] = useState(() => readSavedFields()?.executionDate || addDays(1))
  const [transactionType, setTransactionType] = useState(() => readSavedFields()?.transactionType || 'REFUND')

  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING)
  const [mappingNotes, setMappingNotes] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState('')

  const [prepared, setPrepared] = useState<Prepared | null>(null)
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ initiatingPartyId, debtorName, debtorIban, debtorBic, executionDate, transactionType }))
    setSavedMsg('success:Fields saved successfully.')
  }

  function clearSavedFields() {
    localStorage.removeItem(STORAGE_KEY)
    setInitiatingPartyId(''); setDebtorName(''); setDebtorIban(''); setDebtorBic('')
    setExecutionDate(addDays(1)); setTransactionType('REFUND')
    setSavedMsg('info:Saved fields cleared and form reset.')
  }

  function resetParsed() {
    setHeaders([]); setRows([]); setMapping(EMPTY_MAPPING); setMappingNotes([])
    setPrepared(null); setXmlOutput('')
  }

  function parseInput(text: string) {
    setError(''); resetParsed()
    if (!text.trim()) return setError('Please paste or upload CSV data.')
    try {
      const parsed = parseCsv(text)
      if (parsed.headers.length === 0) throw new Error('The CSV is empty.')
      const detected = autoDetectMapping(parsed.headers)
      setHeaders(parsed.headers); setRows(parsed.rows)
      setMapping(detected.mapping); setMappingNotes(detected.notes)
      setPrepared(prepareTransfers(parsed.rows, detected.mapping))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleCsvChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setCsvInput(e.target.value)
    setCsvFileName('')
    if (headers.length) resetParsed()
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      setCsvInput(text); setCsvFileName(file.name)
      parseInput(text)
    } catch {
      setError(`Could not read ${file.name}.`)
    }
  }

  function handleMappingChange(key: FieldKey, header: string) {
    const next = { ...mapping, [key]: header }
    setMapping(next); setMappingNotes([]); setXmlOutput('')
    setPrepared(prepareTransfers(rows, next))
  }

  function generateXml() {
    setError(''); setXmlOutput('')
    if (!prepared) return setError('Parse the CSV first.')
    if (!initiatingPartyId.trim()) return setError('Please enter an initiating party ID.')
    if (!debtorName.trim()) return setError('Please enter a debtor account name.')
    const cleanedDbtrIban = cleanIban(debtorIban)
    if (!cleanedDbtrIban) return setError('Please enter a debtor IBAN.')
    if (!isIbanShaped(cleanedDbtrIban)) return setError(`Debtor IBAN "${cleanedDbtrIban}" does not look like an IBAN.`)
    const bic = debtorBic.trim().toUpperCase()
    if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return setError(`Debtor BIC "${bic}" is not a valid BIC (8 or 11 characters).`)
    if (!executionDate) return setError('Please choose an execution date.')
    if (prepared.errors.length) return setError('Fix the CSV issues listed above before generating the XML.')

    const msgId = generateMessageId(transactionType, 'PAIN001')
    msgIdRef.current = msgId
    setXmlOutput(buildPain001Xml({
      msgId,
      createdDT: formatDateTime(),
      initiatingPartyId: initiatingPartyId.trim(),
      debtorName: debtorName.trim(),
      debtorIban: cleanedDbtrIban,
      debtorBic: bic,
      executionDate,
      transfers: prepared.transfers,
    }))
  }

  function handleDownload() {
    if (!xmlOutput) return
    const filename = msgIdRef.current ? `${msgIdRef.current}.xml` : 'sepa-credit-transfer.xml'
    downloadTextFile(filename, xmlOutput, 'application/xml')
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  const [savedType, savedText] = savedMsg ? savedMsg.split(':') : ['', '']
  const total = prepared ? round2(prepared.transfers.reduce((s, t) => s + t.amount, 0)) : 0
  const showRemittance = Boolean(mapping.remittance)

  return (
    <div className={toolGrid2}>
      {/* Left: Config + CSV input + mapping */}
      <div className="flex flex-col gap-4">
        {/* Config */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Configuration (origin account)
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="ct-initg-pty">Initiating Party ID</label>
            <input id="ct-initg-pty" className={formInput} value={initiatingPartyId} onChange={e => setInitiatingPartyId(e.target.value)} placeholder="673710" />
          </div>
          <div className={formField}>
            <label className={formLabel} htmlFor="ct-debtor-name">Debtor Account Name</label>
            <input id="ct-debtor-name" className={formInput} value={debtorName} onChange={e => setDebtorName(e.target.value)} placeholder="Company Name DAC" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={formField}>
              <label className={formLabel} htmlFor="ct-debtor-iban">Debtor IBAN</label>
              <input id="ct-debtor-iban" className={formInput} value={debtorIban} onChange={e => setDebtorIban(e.target.value)} placeholder="IE29AIBK..." />
            </div>
            <div className={formField}>
              <label className={formLabel} htmlFor="ct-debtor-bic">Debtor BIC (optional)</label>
              <input id="ct-debtor-bic" className={formInput} value={debtorBic} onChange={e => setDebtorBic(e.target.value)} placeholder="BOFIIE2D" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={formField}>
              <label className={formLabel} htmlFor="ct-exec-date">Execution Date</label>
              <input id="ct-exec-date" type="date" className={formInput} value={executionDate} onChange={e => setExecutionDate(e.target.value)} />
            </div>
            <div className={formField}>
              <label className={formLabel} htmlFor="ct-tx-type">Transaction Type</label>
              <select id="ct-tx-type" className={formSelect} value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                <option value="REFUND">REFUND</option>
                <option value="CLMPAY">CLAIM PAYMENT</option>
              </select>
            </div>
          </div>
          <div className={btnRow}>
            <button type="button" className={cx(btn, btnGhost)} onClick={saveFields}>
              <Save size={14} /> Save fields
            </button>
            <button type="button" className={cx(btn, btnDanger)} onClick={clearSavedFields}>
              <Trash2 size={14} /> Clear saved
            </button>
          </div>
          {savedText && (
            <div className={cx(alert, savedType === 'success' ? alertVariants.success : alertVariants.info)}>
              {savedText}
            </div>
          )}
        </div>

        {/* CSV Input */}
        <div className={card}>
          <div className={cardTitle}>
            <span className={cardTitleDot} />
            Credit Transfer CSV (destination accounts)
          </div>
          <div className={codeAreaWrap}>
            <textarea
              className={codeArea}
              value={csvInput}
              onChange={handleCsvChange}
              placeholder="Paste the refund / payment CSV here (header row + one row per transfer)..."
            />
          </div>
          {csvFileName && <p className="text-[0.78rem] text-text-muted mt-2 font-mono">{csvFileName}</p>}
          <div className={btnRow}>
            <button type="button" className={cx(btn, btnPrimary)} onClick={() => parseInput(csvInput)}>Parse CSV →</button>
            <label className={cx(btn, btnGhost)}>
              <Upload size={14} /> Upload CSV
              <input type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={e => void handleFileChange(e)} />
            </label>
          </div>
          {error && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{error}</div>}
        </div>

        {/* Column mapping */}
        {headers.length > 0 && (
          <div className={card} data-testid="mapping-card">
            <div className={cardTitle}>
              <span className={cardTitleDot} />
              Column Mapping
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FIELD_DEFS.map(def => (
                <div className={formField} key={def.key}>
                  <label className={formLabel} htmlFor={`ct-map-${def.key}`}>
                    {def.label}{def.required ? '' : ' (optional)'}
                  </label>
                  <select
                    id={`ct-map-${def.key}`}
                    className={formSelect}
                    value={mapping[def.key]}
                    onChange={e => handleMappingChange(def.key, e.target.value)}
                  >
                    <option value="">— not mapped —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {mappingNotes.length > 0 && (
              <div data-testid="alert-mapping" className={cx(alert, alertVariants.warning)}>
                <ul className={cx(alertList, 'pl-0 list-none')}>
                  {mappingNotes.map(n => <li className={alertListItem} key={n}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Preview + XML Output */}
      <div className="flex flex-col gap-4">
        {prepared && (
          <div className={card} data-testid="preview-card">
            <div className={cardTitle}>
              <span className={prepared.errors.length ? cardTitleDot : cardTitleDotGreen} />
              Transfers Preview ({prepared.transfers.length} · EUR {total.toFixed(2)})
            </div>
            {prepared.errors.length > 0 && (
              <div data-testid="alert-rows-error" className={cx(alert, alertVariants.error, 'mt-0')}>
                <strong>{prepared.errors.length} issue{prepared.errors.length === 1 ? '' : 's'} found:</strong>
                <ul className={alertList}>
                  {prepared.errors.map(msg => <li className={alertListItem} key={msg}>{msg}</li>)}
                </ul>
              </div>
            )}
            {prepared.warnings.length > 0 && (
              <div data-testid="alert-rows-warning" className={cx(alert, alertVariants.warning, prepared.errors.length ? '' : 'mt-0')}>
                <strong>{prepared.warnings.length} warning{prepared.warnings.length === 1 ? '' : 's'}:</strong>
                <ul className={alertList}>
                  {prepared.warnings.map(msg => <li className={alertListItem} key={msg}>{msg}</li>)}
                </ul>
              </div>
            )}
            {prepared.transfers.length > 0 && (
              <div className={cx(tableWrap, 'max-h-[320px]')}>
                <table className={table}>
                  <thead>
                    <tr className={theadRow}>
                      <th className={thFirst}>#</th>
                      <th className={thFirst}>End-to-End ID</th>
                      <th className={thFirst}>Creditor</th>
                      <th className={thFirst}>IBAN</th>
                      {showRemittance && <th className={thFirst}>Remittance</th>}
                      <th className={th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prepared.transfers.map(t => (
                      <tr key={`${t.row}-${t.endToEndId}`}>
                        <td className={tdFirst}>{t.row - 1}</td>
                        <td className={tdFirst}>{t.endToEndId || '—'}</td>
                        <td className={tdFirst}>{t.creditorName || '—'}</td>
                        <td className={tdFirst}>{t.iban || '—'}</td>
                        {showRemittance && <td className={tdFirst}>{t.remittance || '—'}</td>}
                        <td className={td}>{t.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={btnRow}>
              <button type="button" className={cx(btn, btnPrimary)} onClick={generateXml} disabled={prepared.errors.length > 0}>
                Generate XML →
              </button>
            </div>
          </div>
        )}

        <div className={cx(card, 'flex-1 flex flex-col')}>
          <div className={cardTitle}>
            <span className={cardTitleDotGreen} />
            SEPA pain.001.001.09 XML Output
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
              <button type="button" className={cx(btn, btnSecondary)} onClick={handleDownload}>
                {downloaded ? <Check size={14} /> : <Download size={14} />}
                {downloaded ? 'Downloaded' : 'Download XML'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
