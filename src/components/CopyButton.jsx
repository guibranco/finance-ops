import { useState } from 'react'

// Copy-to-clipboard button used alongside read-only output panes. Renders
// nothing when there's no text yet, so call sites don't need their own guard.
export default function CopyButton({ text, style, timeoutMs = 1500 }) {
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
    <button type="button" className={`btn-copy${copied ? ' copied' : ''}`} onClick={handleCopy} style={style}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
