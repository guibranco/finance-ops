// Small RFC4180-aware CSV parser shared by every tool that ingests a CSV
// export: handles quoted fields (with embedded commas/quotes/newlines) and
// tolerates CRLF line endings.

export type CsvRow = Record<string, string>

// Splits raw CSV text into rows of raw (untrimmed) field arrays, honoring
// RFC4180 quoting (quoted fields may contain commas/quotes/newlines).
export function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c !== '"') { field += c; continue }
      if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      continue
    }
    if (c === '"') inQuotes = true
    else if (c === ',') pushField()
    else if (c === '\n') pushRow()
    else if (c !== '\r') field += c // \r is ignored; \n handles the line break
  }
  if (field !== '' || row.length > 0) pushRow()
  if (inQuotes) throw new Error('Malformed CSV: unterminated quoted field.')

  return rows
}

function rowToObject(headers: string[], cols: string[]): CsvRow {
  const obj: CsvRow = {}
  headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim() })
  return obj
}

// Parses CSV text into trimmed header names plus one object per data row
// (keyed by header). Blank lines are skipped; a leading UTF-8 BOM (U+FEFF,
// which Excel prepends) is stripped so the first header name stays clean.
export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows = tokenizeCsv(withoutBom).filter(r => !(r.length === 1 && r[0] === ''))
  if (rows.length === 0) return { headers: [], rows: [] }

  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1).map(cols => rowToObject(headers, cols))
  return { headers, rows: dataRows }
}
