// Helpers shared by the SEPA XML generators (pain.008 Direct Debit and
// pain.001 Credit Transfer): message ids, IBAN normalisation/validation, XML
// escaping and amount parsing.

export type PainType = 'PAIN008' | 'PAIN001'

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// ISO 8601 local date-time without milliseconds/zone, e.g. 2026-09-11T22:02:41
export function formatDateTime(d: Date | null = null): string {
  return (d || new Date()).toISOString().replace(/\.\d{3}Z$/, '')
}

// e.g. 20260911-220023-REFUND-PAIN001
export function generateMessageId(type: string, pain: PainType): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0].replaceAll('-', '')
  const timeStr = now.toTimeString().split(' ')[0].replaceAll(':', '')
  return `${dateStr}-${timeStr}-${type}-${pain}`
}

export function addDays(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function cleanIban(iban?: string): string {
  return iban ? iban.trim().replace(/\s+/g, '').toUpperCase() : ''
}

// Structural check only: country code, two check digits, 11–30 alphanumerics.
export function isIbanShaped(iban: string): boolean {
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)
}

// ISO 7064 mod-97 checksum. Assumes the IBAN is already cleaned/shaped.
export function isIbanChecksumValid(iban: string): boolean {
  const rearranged = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55))
  let remainder = 0
  for (const ch of rearranged) remainder = (remainder * 10 + Number(ch)) % 97
  return remainder === 1
}

export function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

// Parses a spreadsheet-style amount cell: tolerates currency symbols, spaces,
// thousands separators and a comma decimal separator ("1.234,56", "-0,62",
// "€ 1,234.56"). Returns null when the cell is empty or not numeric.
export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[€$£\s]/g, '')
  if (!s) return null
  const negative = /^\(.*\)$/.test(s)
  if (negative) s = s.slice(1, -1)
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma >= 0 && lastDot >= 0) {
    s = lastComma > lastDot ? s.replaceAll('.', '').replace(',', '.') : s.replaceAll(',', '')
  } else if (lastComma >= 0) {
    s = s.replace(',', '.')
  }
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return negative ? -n : n
}

export function downloadTextFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
