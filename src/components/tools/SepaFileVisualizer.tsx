import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Check, Download, Trash2, X } from 'lucide-react'
import {
  alert,
  alertVariants,
  btn,
  btnGhost,
  btnDanger,
  btnPrimary,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  codeArea,
  codeAreaSm,
  cx,
  fileList,
  fileMeta,
  fileName as fileNameClass,
  fileRemoveBtn,
  fileRow,
  fileRowActive,
  fileRowError,
  formInput,
  formLabel,
  formSelect,
  pmtInfCard,
  pmtInfCardHead,
  pmtInfDetail,
  pmtInfId as pmtInfIdClass,
  seqBadgeBase,
  seqBadgeVariants,
  statTile,
  statTileLabel,
  statTileRow,
  statTileValue,
  typeBadgeVariants,
  vizRowHover,
  vizSortArrow,
  vizTable,
  vizTableWrap,
  vizTd,
  vizTdNum,
  vizTh,
  vizThNum,
  vizTheadRow,
  vizToolbar,
  vizToolbarInput,
  amtNeg,
  amtPos,
  btnRow,
  btnSecondary,
} from '../../ui'

interface SampleFile {
  name: string
  content: string
}

const SAMPLE_FILES: SampleFile[] = [
  {
    name: '20260721-220026-NORMAL-PAIN008.xml',
    content: `<?xml version="1.0" encoding="utf-8" standalone="yes"?><Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08"><CstmrDrctDbtInitn><GrpHdr><MsgId>20260721-220026-NORMAL-PAIN008</MsgId><CreDtTm>2026-07-21T22:10:04</CreDtTm><NbOfTxs>17</NbOfTxs><CtrlSum>998.77</CtrlSum><InitgPty><Id><PrvtId><Othr><Id>IE84ZZZ714029</Id></Othr></PrvtId></Id></InitgPty></GrpHdr><PmtInf><PmtInfId>20260721-220026-NORMAL-PAIN008-FRST</PmtInfId><PmtMtd>DD</PmtMtd><NbOfTxs>2</NbOfTxs><CtrlSum>83.75</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>FRST</SeqTp></PmtTpInf><ReqdColltnDt>2026-07-27</ReqdColltnDt><Cdtr><Nm>MEADOWBROOK AUTOBODY DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE57BOFI35977365128713</IBAN></Id></CdtrAcct><CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt><CdtrSchmeId><Id><PrvtId><Othr><Id>IE84ZZZ714029</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId><DrctDbtTxInf><PmtId><EndToEndId>OUT21602730-2-2-HME-2</EndToEndId></PmtId><InstdAmt Ccy="EUR">44.49</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT21602730-2</MndtId><DtOfSgntr>2026-06-27</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Ailbhe Kilbride</Nm></Dbtr><DbtrAcct><Id><IBAN>IE54IPBS91515082855079</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT25951555-1-4-VEH-6</EndToEndId></PmtId><InstdAmt Ccy="EUR">39.26</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT25951555-3</MndtId><DtOfSgntr>2026-06-22</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Maeve Guilfoyle</Nm></Dbtr><DbtrAcct><Id><IBAN>IE79BOFI79743421781588</IBAN></Id></DbtrAcct></DrctDbtTxInf></PmtInf><PmtInf><PmtInfId>20260721-220026-NORMAL-PAIN008-RCUR</PmtInfId><PmtMtd>DD</PmtMtd><NbOfTxs>15</NbOfTxs><CtrlSum>915.02</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>RCUR</SeqTp></PmtTpInf><ReqdColltnDt>2026-07-27</ReqdColltnDt><Cdtr><Nm>MEADOWBROOK AUTOBODY DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE57BOFI35977365128713</IBAN></Id></CdtrAcct><CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt><CdtrSchmeId><Id><PrvtId><Othr><Id>IE84ZZZ714029</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId><DrctDbtTxInf><PmtId><EndToEndId>OUT58565217-1-5-HME-12</EndToEndId></PmtId><InstdAmt Ccy="EUR">53.51</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT58565217-2</MndtId><DtOfSgntr>2025-11-28</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Siobhan Coyne</Nm></Dbtr><DbtrAcct><Id><IBAN>IE50IPBS85923972548568</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT95644665-1-6-VEH-11</EndToEndId></PmtId><InstdAmt Ccy="EUR">64.86</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT95644665-3</MndtId><DtOfSgntr>2026-01-08</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Aoife Rafter</Nm></Dbtr><DbtrAcct><Id><IBAN>IE03BOFI91896961521238</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT15730781-1-3-VEH-18</EndToEndId></PmtId><InstdAmt Ccy="EUR">39.75</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT15730781-2</MndtId><DtOfSgntr>2025-04-28</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Orla Fahey</Nm></Dbtr><DbtrAcct><Id><IBAN>IE91IPBS82947805904656</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT13385438-1-3-VEH-10</EndToEndId></PmtId><InstdAmt Ccy="EUR">53.85</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT13385438-3</MndtId><DtOfSgntr>2026-04-28</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Aoife Hanrahan</Nm></Dbtr><DbtrAcct><Id><IBAN>IE71BOFI76276622477956</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT32618707-1-9-VEH-18</EndToEndId></PmtId><InstdAmt Ccy="EUR">82.62</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT32618707-2</MndtId><DtOfSgntr>2025-05-23</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Fergal Malone</Nm></Dbtr><DbtrAcct><Id><IBAN>IE78AIBK43107765547880</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT94387899-1-3-VEH-4</EndToEndId></PmtId><InstdAmt Ccy="EUR">42.57</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT94387899-2</MndtId><DtOfSgntr>2026-06-15</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Clodagh Guilfoyle</Nm></Dbtr><DbtrAcct><Id><IBAN>IE44BOFI19933909388155</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT79844974-1-4-VEH-18</EndToEndId></PmtId><InstdAmt Ccy="EUR">97.4</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT79844974-2</MndtId><DtOfSgntr>2024-11-28</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Darragh Loftus</Nm></Dbtr><DbtrAcct><Id><IBAN>IE98AIBK29035223638343</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT96148230-1-2-VEH-10</EndToEndId></PmtId><InstdAmt Ccy="EUR">41.34</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT96148230-2</MndtId><DtOfSgntr>2025-10-06</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Sorcha Deasy</Nm></Dbtr><DbtrAcct><Id><IBAN>IE29AIBK23151829622295</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT97917675-3-5-VEH-9</EndToEndId></PmtId><InstdAmt Ccy="EUR">36.22</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT97917675-2</MndtId><DtOfSgntr>2025-12-02</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Padraig Quigley</Nm></Dbtr><DbtrAcct><Id><IBAN>IE03IPBS80400306513842</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT74488163-1-8-VEH-20</EndToEndId></PmtId><InstdAmt Ccy="EUR">53.09</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT74488163-2</MndtId><DtOfSgntr>2025-01-20</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Clodagh Kinsella</Nm></Dbtr><DbtrAcct><Id><IBAN>IE56IPBS01958350440030</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT72120713-2-1-VEH-7</EndToEndId></PmtId><InstdAmt Ccy="EUR">37.6</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT72120713-2</MndtId><DtOfSgntr>2026-01-06</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Grainne Nolan</Nm></Dbtr><DbtrAcct><Id><IBAN>IE80IPBS80210163669247</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT03455344-1-3-VEH-9</EndToEndId></PmtId><InstdAmt Ccy="EUR">35.78</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT03455344-2</MndtId><DtOfSgntr>2026-01-06</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Oisin Sweeney</Nm></Dbtr><DbtrAcct><Id><IBAN>IE19AIBK93664955006722</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT12136243-1-3-VEH-8</EndToEndId></PmtId><InstdAmt Ccy="EUR">180.09</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT12136243-3</MndtId><DtOfSgntr>2026-03-02</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Fionn Kilbride</Nm></Dbtr><DbtrAcct><Id><IBAN>IE41REVO52235158262916</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT15177471-1-5-HME-18</EndToEndId></PmtId><InstdAmt Ccy="EUR">56.44</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT15177471-3</MndtId><DtOfSgntr>2025-12-30</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Eoghan Deasy</Nm></Dbtr><DbtrAcct><Id><IBAN>IE37BOFI07482971958739</IBAN></Id></DbtrAcct></DrctDbtTxInf><DrctDbtTxInf><PmtId><EndToEndId>OUT73987142-1-3-VEH-9</EndToEndId></PmtId><InstdAmt Ccy="EUR">39.9</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT73987142-3</MndtId><DtOfSgntr>2026-05-26</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Aisling Enright</Nm></Dbtr><DbtrAcct><Id><IBAN>IE71AIBK45423638883195</IBAN></Id></DbtrAcct></DrctDbtTxInf></PmtInf></CstmrDrctDbtInitn></Document>`,
  },
  {
    name: '20260722-220031-RESUBM-PAIN008.xml',
    content: `<?xml version="1.0" encoding="utf-8" standalone="yes"?><Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08"><CstmrDrctDbtInitn><GrpHdr><MsgId>20260722-220031-RESUBM-PAIN008</MsgId><CreDtTm>2026-07-22T22:03:11</CreDtTm><NbOfTxs>1</NbOfTxs><CtrlSum>168.74</CtrlSum><InitgPty><Id><PrvtId><Othr><Id>IE84ZZZ714029</Id></Othr></PrvtId></Id></InitgPty></GrpHdr><PmtInf><PmtInfId>20260722-220031-RESUBM-PAIN008-FRST</PmtInfId><PmtMtd>DD</PmtMtd><NbOfTxs>1</NbOfTxs><CtrlSum>168.74</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>FRST</SeqTp></PmtTpInf><ReqdColltnDt>2026-07-27</ReqdColltnDt><Cdtr><Nm>MEADOWBROOK AUTOBODY DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE57BOFI35977365128713</IBAN></Id></CdtrAcct><CdtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></CdtrAgt><CdtrSchmeId><Id><PrvtId><Othr><Id>IE84ZZZ714029</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId><DrctDbtTxInf><PmtId><EndToEndId>OUT60310799-1-3-VEH-18</EndToEndId></PmtId><InstdAmt Ccy="EUR">168.74</InstdAmt><DrctDbtTx><MndtRltdInf><MndtId>OUT60310799-2</MndtId><DtOfSgntr>2026-07-22</DtOfSgntr></MndtRltdInf></DrctDbtTx><DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt><Dbtr><Nm>Cian Fahey</Nm></Dbtr><DbtrAcct><Id><IBAN>IE90REVO12430187577691</IBAN></Id></DbtrAcct></DrctDbtTxInf></PmtInf></CstmrDrctDbtInitn></Document>`,
  },
  {
    name: '20260722-220032-CLMPAY-PAIN001.xml',
    content: `<?xml version="1.0" encoding="utf-8"?><Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"><CstmrCdtTrfInitn><GrpHdr><MsgId>20260722-220032-CLMPAY-PAIN001</MsgId><CreDtTm>2026-07-22T22:02:20</CreDtTm><NbOfTxs>26</NbOfTxs><CtrlSum>67117.15</CtrlSum><InitgPty><Id><PrvtId><Othr><Id>673005</Id></Othr></PrvtId></Id></InitgPty></GrpHdr><PmtInf><PmtInfId>20260722-220032-CLMPAY-PAIN001-REF</PmtInfId><PmtMtd>TRF</PmtMtd><NbOfTxs>26</NbOfTxs><CtrlSum>67117.15</CtrlSum><ReqdExctnDt><Dt>2026-07-23</Dt></ReqdExctnDt><Dbtr><Nm>MEADOWBROOK AUTOBODY DAC</Nm></Dbtr><DbtrAcct><Id><IBAN>IE57BOFI04403489576141</IBAN></Id></DbtrAcct><DbtrAgt><FinInstnId><BICFI>BOFIIE2D</BICFI></FinInstnId></DbtrAgt><CdtTrfTxInf><PmtId><EndToEndId>CL000000003-9</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">922.5</InstdAmt></Amt><Cdtr><Nm>WESTBOURNE PANEL WORKS LIMITED</Nm></Cdtr><CdtrAcct><Id><IBAN>IE71BOFI95372634197938</IBAN></Id></CdtrAcct><RmtInf><Ustrd>OUT_CDX_06_2026_BORD</Ustrd></RmtInf></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM024704-15</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">8000</InstdAmt></Amt><Cdtr><Nm>Brendan Treacy</Nm></Cdtr><CdtrAcct><Id><IBAN>IE42AIBK08185832240558</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM024704-16</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">80</InstdAmt></Amt><Cdtr><Nm>Brendan Treacy</Nm></Cdtr><CdtrAcct><Id><IBAN>IE42AIBK08185832240558</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM022390-2</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">2161.65</InstdAmt></Amt><Cdtr><Nm>OAKLAND ENGINEERING LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE48AIBK34662330335135</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>0013951345616-15</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">1500</InstdAmt></Amt><Cdtr><Nm>Sheedy &amp; Kinsella Solicitors LLP</Nm></Cdtr><CdtrAcct><Id><IBAN>IE87BOFI55063762898601</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM026564-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">2569.12</InstdAmt></Amt><Cdtr><Nm>WESTBOURNE MOTORS LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE73BOFI58233965303987</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM024930-2</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">2913.43</InstdAmt></Amt><Cdtr><Nm>OAKLAND ENGINEERING LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE48AIBK34662330335135</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM021426-10</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">6996.69</InstdAmt></Amt><Cdtr><Nm>THORNBURY ENGINEERING DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE95AIBK61942116555886</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM027547-3</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">5170</InstdAmt></Amt><Cdtr><Nm>Conor Reidy</Nm></Cdtr><CdtrAcct><Id><IBAN>IE28AIBK13506982108032</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM025724-9</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">800</InstdAmt></Amt><Cdtr><Nm>Ailbhe O'Dwyer</Nm></Cdtr><CdtrAcct><Id><IBAN>IE57AIBK39447035660204</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM023755-9</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>0013951345616-16</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">17000</InstdAmt></Amt><Cdtr><Nm>Sheedy &amp; Kinsella Solicitors LLP</Nm></Cdtr><CdtrAcct><Id><IBAN>IE87BOFI55063762898601</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM026702-5</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">272.31</InstdAmt></Amt><Cdtr><Nm>HARBOUR MOTORS LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE94AIBK63744160901721</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>0013951345616-17</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">1095</InstdAmt></Amt><Cdtr><Nm>Sheedy &amp; Kinsella Solicitors LLP</Nm></Cdtr><CdtrAcct><Id><IBAN>IE87BOFI55063762898601</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM020576-2</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">4540.48</InstdAmt></Amt><Cdtr><Nm>WESTBOURNE MOTORS LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE73BOFI58233965303987</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM029373-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM023367-5</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">600.01</InstdAmt></Amt><Cdtr><Nm>HARBOUR MOTORS LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE94AIBK63744160901721</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM027853-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM020115-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM029737-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM020701-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">395.63</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM020412-2</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">2397.94</InstdAmt></Amt><Cdtr><Nm>RIVERSIDE COLLISION REPAIR LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE93BOFI73040366730975</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM025710-1</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM024155-6</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">4341.7</InstdAmt></Amt><Cdtr><Nm>Ailbhe Deasy</Nm></Cdtr><CdtrAcct><Id><IBAN>IE45AIBK76777037750892</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM023815-2</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">270.78</InstdAmt></Amt><Cdtr><Nm>ASHWOOD MOTORS DAC</Nm></Cdtr><CdtrAcct><Id><IBAN>IE47AIBK08055971103104</IBAN></Id></CdtrAcct></CdtTrfTxInf><CdtTrfTxInf><PmtId><EndToEndId>OCM026702-6</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">3465.23</InstdAmt></Amt><Cdtr><Nm>THORNBURY GLASS SERVICES LTD</Nm></Cdtr><CdtrAcct><Id><IBAN>IE36BOFI86872187172359</IBAN></Id></CdtrAcct></CdtTrfTxInf></PmtInf></CstmrCdtTrfInitn></Document>`,
  },
]

interface Column {
  key: string
  label: string
  num?: boolean
}

const DD_COLUMNS: Column[] = [
  { key: 'seqTp', label: 'Sequence' },
  { key: 'endToEndId', label: 'End-to-End ID' },
  { key: 'debtorName', label: 'Debtor' },
  { key: 'debtorIban', label: 'Debtor IBAN' },
  { key: 'mandateId', label: 'Mandate ID' },
  { key: 'mandateSignedDate', label: 'Mandate Signed' },
  { key: 'reqdColltnDt', label: 'Collection Date' },
  { key: 'amount', label: 'Amount', num: true },
]

const CT_COLUMNS: Column[] = [
  { key: 'endToEndId', label: 'End-to-End ID' },
  { key: 'creditorName', label: 'Creditor' },
  { key: 'creditorIban', label: 'Creditor IBAN' },
  { key: 'remittanceInfo', label: 'Remittance Info' },
  { key: 'reqdExctnDt', label: 'Execution Date' },
  { key: 'amount', label: 'Amount', num: true },
]

interface Transaction {
  pmtInfId: string
  seqTp?: string
  reqdColltnDt?: string
  reqdExctnDt?: string
  endToEndId: string
  amount: number
  ccy: string
  mandateId?: string
  mandateSignedDate?: string
  debtorName?: string
  debtorIban?: string
  creditorName?: string
  creditorIban?: string
  remittanceInfo?: string
  [key: string]: unknown
}

interface PmtInf {
  pmtInfId: string
  seqTp?: string
  reqdColltnDt?: string
  reqdExctnDt?: string
  creditorName?: string
  creditorIban?: string
  debtorName?: string
  debtorIban?: string
  debtorBic?: string
  nbOfTxs: number
  ctrlSum: number
  transactions: Transaction[]
}

interface Header {
  msgId: string
  creDtTm: string
  nbOfTxs: number
  ctrlSum: number
  initiatingPartyId: string
}

interface ParsedFile {
  fileName: string
  type: 'pain008' | 'pain001'
  typeLabel: string
  header: Header
  pmtInfs: PmtInf[]
  transactions: Transaction[]
}

type FileEntry =
  | ({ id: number; error?: undefined } & ParsedFile)
  | { id: number; fileName: string; error: string }

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100 }

function directChildren(parent: Element | null, tag: string): Element[] {
  if (!parent) return []
  return [...parent.children].filter(c => c.tagName === tag)
}

function directChild(parent: Element | null, tag: string): Element | null {
  return directChildren(parent, tag)[0] || null
}

function walk(root: Element | null, tags: string[]): Element | null {
  let cur = root
  for (const tag of tags) {
    cur = directChild(cur, tag)
    if (!cur) return null
  }
  return cur
}

function walkText(root: Element | null, tags: string[]): string {
  const el = walk(root, tags)
  return el ? (el.textContent || '').trim() : ''
}

function partyId(idEl: Element | null): string {
  if (!idEl) return ''
  return walkText(idEl, ['PrvtId', 'Othr', 'Id']) || walkText(idEl, ['OrgId', 'Othr', 'Id']) || walkText(idEl, ['OrgId', 'BICOrBEI'])
}

function extractSchemaVersion(ns: string | null): string {
  const m = /(pain\.\d{3}\.\d{3}\.\d{2})/.exec(ns || '')
  return m ? m[1] : ''
}

function detectType(docEl: Element): { kind: 'pain008' | 'pain001' | 'unknown'; version: string } {
  const version = extractSchemaVersion(docEl.namespaceURI)
  const rootTag = docEl.children[0]?.tagName
  if (/pain\.008/.test(docEl.namespaceURI || '') || rootTag === 'CstmrDrctDbtInitn') return { kind: 'pain008', version }
  if (/pain\.001/.test(docEl.namespaceURI || '') || rootTag === 'CstmrCdtTrfInitn') return { kind: 'pain001', version }
  return { kind: 'unknown', version }
}

function parseHeader(grpHdr: Element | null): Header {
  return {
    msgId: walkText(grpHdr, ['MsgId']),
    creDtTm: walkText(grpHdr, ['CreDtTm']),
    nbOfTxs: Number(walkText(grpHdr, ['NbOfTxs'])) || 0,
    ctrlSum: Number(walkText(grpHdr, ['CtrlSum'])) || 0,
    initiatingPartyId: partyId(walk(grpHdr, ['InitgPty', 'Id'])),
  }
}

function parsePain008(root: Element): { header: Header; pmtInfs: PmtInf[]; transactions: Transaction[] } {
  const header = parseHeader(directChild(root, 'GrpHdr'))
  const pmtInfs = directChildren(root, 'PmtInf').map(pi => {
    const pmtInfId = walkText(pi, ['PmtInfId'])
    const seqTp = walkText(pi, ['PmtTpInf', 'SeqTp'])
    const reqdColltnDt = walkText(pi, ['ReqdColltnDt'])
    const creditorName = walkText(pi, ['Cdtr', 'Nm'])
    const creditorIban = walkText(pi, ['CdtrAcct', 'Id', 'IBAN'])
    const nbOfTxs = Number(walkText(pi, ['NbOfTxs'])) || 0
    const ctrlSum = Number(walkText(pi, ['CtrlSum'])) || 0
    const transactions: Transaction[] = directChildren(pi, 'DrctDbtTxInf').map(tx => {
      const amountEl = walk(tx, ['InstdAmt'])
      return {
        pmtInfId,
        seqTp,
        reqdColltnDt,
        endToEndId: walkText(tx, ['PmtId', 'EndToEndId']),
        amount: amountEl ? Number((amountEl.textContent || '').trim()) || 0 : 0,
        ccy: amountEl?.getAttribute('Ccy') || '',
        mandateId: walkText(tx, ['DrctDbtTx', 'MndtRltdInf', 'MndtId']),
        mandateSignedDate: walkText(tx, ['DrctDbtTx', 'MndtRltdInf', 'DtOfSgntr']),
        debtorName: walkText(tx, ['Dbtr', 'Nm']),
        debtorIban: walkText(tx, ['DbtrAcct', 'Id', 'IBAN']),
      }
    })
    return { pmtInfId, seqTp, reqdColltnDt, creditorName, creditorIban, nbOfTxs, ctrlSum, transactions }
  })
  return { header, pmtInfs, transactions: pmtInfs.flatMap(p => p.transactions) }
}

function parsePain001(root: Element): { header: Header; pmtInfs: PmtInf[]; transactions: Transaction[] } {
  const header = parseHeader(directChild(root, 'GrpHdr'))
  const pmtInfs = directChildren(root, 'PmtInf').map(pi => {
    const pmtInfId = walkText(pi, ['PmtInfId'])
    const reqdExctnDt = walkText(pi, ['ReqdExctnDt', 'Dt']) || walkText(pi, ['ReqdExctnDt'])
    const debtorName = walkText(pi, ['Dbtr', 'Nm'])
    const debtorIban = walkText(pi, ['DbtrAcct', 'Id', 'IBAN'])
    const debtorBic = walkText(pi, ['DbtrAgt', 'FinInstnId', 'BICFI'])
    const nbOfTxs = Number(walkText(pi, ['NbOfTxs'])) || 0
    const ctrlSum = Number(walkText(pi, ['CtrlSum'])) || 0
    const transactions: Transaction[] = directChildren(pi, 'CdtTrfTxInf').map(tx => {
      const amountEl = walk(tx, ['Amt', 'InstdAmt'])
      return {
        pmtInfId,
        reqdExctnDt,
        endToEndId: walkText(tx, ['PmtId', 'EndToEndId']),
        amount: amountEl ? Number((amountEl.textContent || '').trim()) || 0 : 0,
        ccy: amountEl?.getAttribute('Ccy') || '',
        creditorName: walkText(tx, ['Cdtr', 'Nm']),
        creditorIban: walkText(tx, ['CdtrAcct', 'Id', 'IBAN']),
        remittanceInfo: walkText(tx, ['RmtInf', 'Ustrd']),
      }
    })
    return { pmtInfId, reqdExctnDt, debtorName, debtorIban, debtorBic, nbOfTxs, ctrlSum, transactions }
  })
  return { header, pmtInfs, transactions: pmtInfs.flatMap(p => p.transactions) }
}

function parseSepaFile(text: string, fileName: string): ParsedFile {
  const dom = new DOMParser().parseFromString(text, 'application/xml')
  if (dom.getElementsByTagName('parsererror').length) {
    throw new Error(`${fileName}: could not parse as XML.`)
  }
  const docEl = dom.documentElement
  if (!docEl || docEl.tagName !== 'Document') {
    throw new Error(`${fileName}: not a recognizable ISO 20022 <Document>.`)
  }
  const { kind, version } = detectType(docEl)
  const root = docEl.children[0]

  if (kind === 'pain008') {
    const { header, pmtInfs, transactions } = parsePain008(root)
    return { fileName, type: 'pain008', typeLabel: `${version || 'pain.008.001.08'} — SEPA Direct Debit Initiation`, header, pmtInfs, transactions }
  }
  if (kind === 'pain001') {
    const { header, pmtInfs, transactions } = parsePain001(root)
    return { fileName, type: 'pain001', typeLabel: `${version || 'pain.001.001.09'} — SEPA Credit Transfer Initiation`, header, pmtInfs, transactions }
  }
  throw new Error(`${fileName}: unrecognized message type (root element "${root?.tagName || '?'}"). Expected CstmrDrctDbtInitn (pain.008) or CstmrCdtTrfInitn (pain.001).`)
}

function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

function compareValues(a: unknown, b: unknown): number {
  if (a === undefined || a === null || a === '') return -1
  if (b === undefined || b === null || b === '') return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return toSafeString(a).localeCompare(toSafeString(b))
}

function downloadCsv(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className={statTile}>
      <div className={statTileLabel}>{label}</div>
      <div className={statTileValue}>{value}</div>
    </div>
  )
}

export default function SepaFileVisualizer() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [globalError, setGlobalError] = useState('')
  const idCounter = useRef(0)

  const [search, setSearch] = useState('')
  const [seqFilter, setSeqFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [sortKey, setSortKey] = useState('endToEndId')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [downloaded, setDownloaded] = useState(false)

  const selected = files.find(f => f.id === selectedId) || files.find(f => !f.error) || files[0] || null

  function resetFilters() {
    setSearch(''); setSeqFilter('all'); setGroupFilter('all'); setSortKey('endToEndId'); setSortDir('asc')
  }

  function selectFile(id: number | null) {
    setSelectedId(id)
    resetFilters()
  }

  async function addFiles(fileList: File[]) {
    setGlobalError('')
    const newEntries: FileEntry[] = []
    for (const f of fileList) {
      const id = ++idCounter.current
      try {
        const text = await f.text()
        newEntries.push({ id, ...parseSepaFile(text, f.name) })
      } catch (err) {
        newEntries.push({ id, fileName: f.name, error: (err as Error).message })
      }
    }
    setFiles(prev => [...prev, ...newEntries])
    if (newEntries.length) selectFile(newEntries[0].id)
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const list = [...(e.target.files ?? [])]
    e.target.value = ''
    if (list.length) void addFiles(list)
  }

  function handlePasteAdd() {
    if (!pasteText.trim()) { setGlobalError('Paste XML content first.'); return }
    const id = ++idCounter.current
    try {
      const parsed = parseSepaFile(pasteText, `pasted-${id}.xml`)
      setFiles(prev => [...prev, { id, ...parsed }])
      selectFile(id)
      setPasteText(''); setGlobalError('')
    } catch (err) {
      setGlobalError((err as Error).message)
    }
  }

  function loadSamples() {
    setGlobalError('')
    const entries: FileEntry[] = SAMPLE_FILES.map(s => {
      const id = ++idCounter.current
      try { return { id, ...parseSepaFile(s.content, s.name) } }
      catch (err) { return { id, fileName: s.name, error: (err as Error).message } }
    })
    setFiles(prev => [...prev, ...entries])
    selectFile(entries[0]?.id ?? null)
  }

  function removeFile(id: number) {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (id === selectedId) selectFile(null)
  }

  function clearAll() {
    setFiles([]); selectFile(null); setGlobalError('')
  }

  const active = selected && selected.error === undefined ? selected : null
  const columns = active?.type === 'pain008' ? DD_COLUMNS : CT_COLUMNS

  const seqOptions = useMemo(
    () => (active ? [...new Set(active.transactions.map(t => t.seqTp).filter((v): v is string => Boolean(v)))].sort() : []),
    [active]
  )

  const filteredTransactions = useMemo(() => {
    if (!active) return []
    const term = search.trim().toLowerCase()
    return active.transactions.filter(t => {
      if (seqFilter !== 'all' && t.seqTp !== seqFilter) return false
      if (groupFilter !== 'all' && t.pmtInfId !== groupFilter) return false
      if (term) {
        const haystack = columns.map(c => toSafeString(t[c.key])).join(' ').toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [active, columns, search, seqFilter, groupFilter])

  const sortedTransactions = useMemo(() => {
    const rows = [...filteredTransactions]
    rows.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey])
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [filteredTransactions, sortKey, sortDir])

  const checks = useMemo(() => {
    if (!active) return null
    const computedTotal = round2(active.transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0))
    const headerOk = active.header.nbOfTxs === active.transactions.length && Math.abs(active.header.ctrlSum - computedTotal) <= 0.01
    const groups = active.pmtInfs.map(pi => {
      const computed = round2(pi.transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0))
      const ok = pi.nbOfTxs === pi.transactions.length && Math.abs(pi.ctrlSum - computed) <= 0.01
      return { pmtInfId: pi.pmtInfId, computed, ok, declaredCtrlSum: pi.ctrlSum, declaredNbOfTxs: pi.nbOfTxs, actualNbOfTxs: pi.transactions.length }
    })
    return { computedTotal, headerOk, groups, allOk: headerOk && groups.every(g => g.ok) }
  }, [active])

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleDownload() {
    if (!sortedTransactions.length || !active) return
    const header = columns.map(c => `"${c.label}"`).join(',')
    const lines = sortedTransactions.map(t => columns.map(c => {
      const v = c.num ? (Number(t[c.key]) || 0).toFixed(2) : t[c.key]
      const s = toSafeString(v)
      return `"${s.replace(/"/g, '""')}"`
    }).join(','))
    downloadCsv(`${active.fileName.replace(/\.xml$/i, '')}-transactions.csv`, [header, ...lines].join('\n'))
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDot} /> Load SEPA XML Files
        </div>
        <input type="file" accept=".xml" multiple onChange={handleFileInputChange} />
        <div className={btnRow}>
          <button className={cx(btn, btnGhost)} onClick={loadSamples}>Load 3 samples</button>
          {files.length > 0 && (
            <button className={cx(btn, btnGhost, btnDanger)} onClick={clearAll}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>

        <div className="h-px bg-border my-[22px]" />

        <div className="mb-4 last:mb-0">
          <label className={formLabel}>Or paste raw XML</label>
          <div className="relative">
            <textarea
              className={cx(codeArea, codeAreaSm)}
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); setGlobalError('') }}
              placeholder="Paste a pain.008 or pain.001 XML document here..."
            />
          </div>
        </div>
        <div className={btnRow}>
          <button className={cx(btn, btnPrimary)} onClick={handlePasteAdd}>Parse &amp; add →</button>
        </div>

        {globalError && <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>{globalError}</div>}

        {files.length > 0 && (
          <div className={fileList}>
            {files.map(f => (
              <div
                key={f.id}
                className={cx(fileRow, f.id === selected?.id && fileRowActive, f.error && fileRowError)}
                onClick={() => selectFile(f.id)}
              >
                <span className={f.error !== undefined ? typeBadgeVariants.unknown : typeBadgeVariants[f.type]}>
                  {f.error !== undefined ? 'ERROR' : f.type.toUpperCase()}
                </span>
                <span className={fileNameClass}>{f.fileName}</span>
                {f.error === undefined && (
                  <span className={fileMeta}>{f.header.nbOfTxs} tx · {f.header.ctrlSum.toFixed(2)} · {f.header.msgId}</span>
                )}
                {f.error && <span className={cx(fileMeta, 'text-danger')}>{f.error}</span>}
                <button
                  type="button"
                  data-testid="sepa-file-remove"
                  className={fileRemoveBtn}
                  onClick={e => { e.stopPropagation(); removeFile(f.id) }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && selected.error === undefined && (
        <>
          <div className={card}>
            <div className={cardTitle}>
              <span className={checks?.allOk ? cardTitleDotGreen : cardTitleDot} /> {selected.fileName}
            </div>
            <span className={typeBadgeVariants[selected.type]}>{selected.typeLabel}</span>
            <div className={cx(statTileRow, 'mt-3.5')}>
              <StatTile label="Message ID" value={selected.header.msgId || '—'} />
              <StatTile label="Created" value={selected.header.creDtTm || '—'} />
              <StatTile label="Transactions" value={selected.header.nbOfTxs.toLocaleString()} />
              <StatTile label="Control Sum" value={selected.header.ctrlSum.toLocaleString()} />
              <StatTile label="Initiating Party" value={selected.header.initiatingPartyId || '—'} />
            </div>
            {checks && (checks.allOk ? (
              <div className={cx(alert, alertVariants.success)}>✓ Declared totals match computed totals for every payment group.</div>
            ) : (
              <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>
                <strong>Totals mismatch detected:</strong>
                <ul className="mt-1 pl-[18px]">
                  {!checks.headerOk && (
                    <li className="my-0.5">Group header — declared {selected.header.nbOfTxs} tx / {selected.header.ctrlSum} vs computed {selected.transactions.length} tx / {checks.computedTotal}</li>
                  )}
                  {checks.groups.filter(g => !g.ok).map(g => (
                    <li className="my-0.5" key={g.pmtInfId}>{g.pmtInfId} — declared {g.declaredNbOfTxs} tx / {g.declaredCtrlSum} vs computed {g.actualNbOfTxs} tx / {g.computed}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Payment Groups ({selected.pmtInfs.length})
            </div>
            {selected.pmtInfs.map(pi => (
              <div key={pi.pmtInfId} className={pmtInfCard}>
                <div className={pmtInfCardHead}>
                  <span className={pmtInfIdClass}>{pi.pmtInfId}</span>
                  {selected.type === 'pain008' && <span className={cx(seqBadgeBase, pi.seqTp ? seqBadgeVariants[pi.seqTp as keyof typeof seqBadgeVariants] : '')}>{pi.seqTp}</span>}
                  <span className={fileMeta}>{pi.nbOfTxs} tx · {pi.ctrlSum.toFixed(2)} EUR</span>
                </div>
                {selected.type === 'pain008' ? (
                  <p className={pmtInfDetail}>
                    Collection date {pi.reqdColltnDt || '—'} · Creditor {pi.creditorName || '—'} · {pi.creditorIban || '—'}
                  </p>
                ) : (
                  <p className={pmtInfDetail}>
                    Execution date {pi.reqdExctnDt || '—'} · Debtor {pi.debtorName || '—'} · {pi.debtorIban || '—'}{pi.debtorBic ? ` · ${pi.debtorBic}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Transactions ({sortedTransactions.length.toLocaleString()} of {selected.transactions.length.toLocaleString()})
            </div>

            <div className={vizToolbar}>
              <input
                type="text"
                className={formInput}
                placeholder="Search transactions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {selected.type === 'pain008' && seqOptions.length > 0 && (
                <select className={cx(formSelect, vizToolbarInput)} value={seqFilter} onChange={e => setSeqFilter(e.target.value)}>
                  <option value="all">All sequences</option>
                  {seqOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {selected.pmtInfs.length > 1 && (
                <select className={cx(formSelect, vizToolbarInput)} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                  <option value="all">All payment groups</option>
                  {selected.pmtInfs.map(pi => <option key={pi.pmtInfId} value={pi.pmtInfId}>{pi.pmtInfId}</option>)}
                </select>
              )}
            </div>

            <div className={vizTableWrap}>
              <table className={vizTable}>
                <thead>
                  <tr className={vizTheadRow}>
                    {columns.map(c => (
                      <th key={c.key} className={c.num ? vizThNum : vizTh} onClick={() => handleSort(c.key)}>
                        {c.label}
                        {sortKey === c.key && <span className={vizSortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((t, idx) => (
                    <tr key={`${t.endToEndId}-${idx}`} className={vizRowHover}>
                      {columns.map(c => {
                        if (c.key === 'seqTp') {
                          return <td key={c.key} className={vizTd}><span className={cx(seqBadgeBase, t.seqTp ? seqBadgeVariants[t.seqTp as keyof typeof seqBadgeVariants] : '')}>{t.seqTp || '—'}</span></td>
                        }
                        if (c.num) {
                          const n = Number(t[c.key]) || 0
                          return <td key={c.key} className={cx(vizTdNum, n < 0 ? amtNeg : amtPos)}>{n.toFixed(2)}</td>
                        }
                        return <td key={c.key} className={vizTd}>{(t[c.key] as string) || '—'}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={btnRow}>
              <button type="button" className={cx(btn, btnSecondary)} onClick={handleDownload}>
                {downloaded ? <Check size={14} /> : <Download size={14} />}
                {downloaded ? 'Downloaded' : 'Download transactions as CSV'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
