import { useState } from 'react'
import { Check, Copy, Image as ImageIcon } from 'lucide-react'
import {
  IMAGE_FORMATS,
  copyPngToClipboard,
  downloadBlob,
  renderReportImage,
  type ImageFormat,
  type ReportImageInput,
} from '../lib/reportImage'
import { alert, alertVariants, btn, btnGhost, btnSecondary, cx, formSelect } from '../ui'

interface ReportImageActionsProps {
  /** Builds the report on demand, so the export always reflects what's on screen now. */
  getReport: () => ReportImageInput
  /** File name without extension, e.g. "schedule-dates-OUTINT00298552". */
  fileBaseName: string
  exportLabel?: string
  copyTitle?: string
}

const FEEDBACK_MS = 2000

// Format picker + "export as image" + "copy image" buttons for a report rendered by
// lib/reportImage. Downloads SVG, PNG or JPEG; copies PNG (the only image type browsers
// accept on the clipboard).
export default function ReportImageActions({
  getReport,
  fileBaseName,
  exportLabel = 'Export as image',
  copyTitle = 'Copy to the clipboard as a PNG image, ready to paste into an email, Teams or a document',
}: ReportImageActionsProps) {
  const [format, setFormat] = useState<ImageFormat>('png')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    setError('')
    setExported(false)
    setExporting(true)
    try {
      const blob = await renderReportImage(getReport(), format)
      const ext = format === 'jpeg' ? 'jpg' : format
      downloadBlob(`${fileBaseName}.${ext}`, blob)
      setExported(true)
      setTimeout(() => setExported(false), FEEDBACK_MS)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  async function handleCopy() {
    setError('')
    setCopied(false)
    setCopying(true)
    try {
      // Start the clipboard write inside the click handler (Safari needs the user gesture).
      await copyPngToClipboard(renderReportImage(getReport(), 'png'))
      setCopied(true)
      setTimeout(() => setCopied(false), FEEDBACK_MS)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCopying(false)
    }
  }

  let exportText = exportLabel
  if (exporting) exportText = 'Exporting…'
  else if (exported) exportText = 'Exported'

  let copyText = 'Copy image'
  if (copying) copyText = 'Copying…'
  else if (copied) copyText = 'Copied'

  return (
    <div>
      <div className="inline-flex items-center gap-2 flex-wrap">
        <select
          aria-label="Image format"
          className={cx(formSelect, 'w-auto! min-w-[92px]')}
          value={format}
          onChange={e => setFormat(e.target.value as ImageFormat)}
        >
          {IMAGE_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button type="button" className={cx(btn, btnSecondary)} onClick={() => void handleExport()} disabled={exporting}>
          {exported ? <Check size={14} /> : <ImageIcon size={14} />}
          {exportText}
        </button>
        <button type="button" className={cx(btn, btnGhost)} onClick={() => void handleCopy()} disabled={copying} title={copyTitle}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copyText}
        </button>
      </div>
      {error && <div data-testid="image-error" className={cx(alert, alertVariants.error)}>{error}</div>}
    </div>
  )
}
