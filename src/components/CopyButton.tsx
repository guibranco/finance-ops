import { useState, type CSSProperties } from 'react'
import { Check, Copy } from 'lucide-react'
import { btnCopy, btnCopyCopied, cx } from '../ui'

interface CopyButtonProps {
  text: string
  style?: CSSProperties
  timeoutMs?: number
}

// Copy-to-clipboard button used alongside read-only output panes. Renders
// nothing when there's no text yet, so call sites don't need their own guard.
export default function CopyButton({ text, style, timeoutMs = 1500 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeoutMs)
    } catch {
      // Clipboard access denied or unavailable - fail silently
    }
  }

  if (!text) return null

  return (
    <button
      type="button"
      className={cx(btnCopy, copied && btnCopyCopied, 'flex items-center gap-1')}
      onClick={() => void handleCopy()}
      style={style}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
