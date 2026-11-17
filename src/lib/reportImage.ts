// Renders a "summary + table" report as a standalone SVG, and rasterizes it to PNG/JPEG.
//
// The SVG is built from the data rather than by capturing the DOM, so the export always
// contains every row (the on-screen table scrolls), looks the same in every browser, and
// needs no third-party dependency. Only system fonts are referenced: an SVG drawn into a
// canvas cannot load web fonts, and a monospace table font keeps column widths predictable.

export type ImageFormat = 'svg' | 'png' | 'jpeg'

export const IMAGE_FORMATS: { value: ImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'svg', label: 'SVG' },
]

/** Colour hint for a table cell (mirrors the on-screen badges / signed amounts). */
export type CellTone = 'debit' | 'credit' | 'positive' | 'negative'

export interface ReportCell {
  text: string
  tone?: CellTone
}

export interface ReportColumn {
  label: string
  numeric?: boolean
}

export interface ReportNotice {
  tone: 'success' | 'error' | 'warning'
  title: string
  lines?: string[]
}

export interface ReportImageInput {
  title: string
  subtitle?: string
  stats: { label: string; value: string }[]
  notices: ReportNotice[]
  tableTitle: string
  columns: ReportColumn[]
  rows: ReportCell[][]
}

export interface RenderedSvg {
  svg: string
  width: number
  height: number
}

// Palette taken from the app theme (src/index.css), flattened to opaque colours so the
// image looks identical on any background and in JPEG (which has no alpha).
const C = {
  bg: '#ffffff',
  text: '#1e1028',
  muted: '#6b5880',
  border: '#e7deec',
  headerBg: '#f3eff7',
  zebra: '#fbf9fc',
  tileBg: '#f8f5fa',
  purple: '#79378b',
  green: '#76a432',
  danger: '#c0392b',
  warning: '#b7791f',
  successBg: '#f1f6ea',
  errorBg: '#fbeeec',
  warningBg: '#faf3e8',
} as const

const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, 'Cascadia Mono', Consolas, Menlo, 'DejaVu Sans Mono', monospace"

const PAD = 24
const TABLE_FONT = 12
const MONO_CHAR = TABLE_FONT * 0.62 // a little wider than real monospace advance, for safety
const CELL_PAD_X = 10
const ROW_H = 24
const MAX_CELL_CHARS = 96
const TILE_W = 168
const TILE_H = 58
const TILE_GAP = 10
const NOTICE_LINE_H = 18
// Rough average advance of a proportional sans glyph, used only to size the canvas width.
const SANS_CHAR = 0.56

/** Escapes text for use in SVG character data / attribute values, dropping XML-invalid control chars. */
export function escapeXml(value: string): string {
  return value
    .replaceAll(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // eslint-disable-line no-control-regex
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** Shortens text to `max` characters with a trailing ellipsis. */
function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function toneColour(tone: CellTone | undefined): string {
  switch (tone) {
    case 'debit':
    case 'negative':
      return C.danger
    case 'credit':
    case 'positive':
      return C.green
    default:
      return C.text
  }
}

const NOTICE_STYLE: Record<ReportNotice['tone'], { fg: string; bg: string }> = {
  success: { fg: C.green, bg: C.successBg },
  error: { fg: C.danger, bg: C.errorBg },
  warning: { fg: C.warning, bg: C.warningBg },
}

/** Builds the report as a standalone SVG document. */
export function buildReportSvg(input: ReportImageInput): RenderedSvg {
  const { columns, rows } = input

  // ── Column widths (monospace: width is proportional to character count) ──
  const colChars = columns.map((col, i) =>
    Math.min(
      MAX_CELL_CHARS,
      Math.max(col.label.length, ...rows.map(r => (r[i]?.text ?? '').length)),
    ),
  )
  const colWidths = colChars.map(n => Math.ceil(n * MONO_CHAR) + CELL_PAD_X * 2)
  const tableWidth = colWidths.reduce((a, b) => a + b, 0)

  // ── Overall width: wide enough for the table, the title and the notices ──
  const noticeTexts = input.notices.flatMap(n => [n.title, ...(n.lines ?? [])])
  const longestText = Math.max(
    input.title.length * 20 * SANS_CHAR,
    ...noticeTexts.map(t => t.length * 13 * SANS_CHAR + 28),
  )
  const minTilesWidth = Math.min(input.stats.length, 6) * (TILE_W + TILE_GAP) - TILE_GAP
  const contentWidth = Math.ceil(Math.max(tableWidth, longestText, minTilesWidth, 480))
  const width = contentWidth + PAD * 2

  const parts: string[] = []
  let y = PAD

  // ── Title ──
  parts.push(
    `<text x="${PAD}" y="${y + 20}" font-family="${SANS}" font-size="20" font-weight="700" fill="${C.purple}">${escapeXml(input.title)}</text>`,
  )
  y += 28
  if (input.subtitle) {
    parts.push(
      `<text x="${PAD}" y="${y + 14}" font-family="${SANS}" font-size="12" fill="${C.muted}">${escapeXml(input.subtitle)}</text>`,
    )
    y += 22
  }
  y += 12

  // ── Summary tiles (wrap to the content width) ──
  const tilesPerRow = Math.max(1, Math.floor((contentWidth + TILE_GAP) / (TILE_W + TILE_GAP)))
  input.stats.forEach((s, i) => {
    const col = i % tilesPerRow
    const row = Math.floor(i / tilesPerRow)
    const tx = PAD + col * (TILE_W + TILE_GAP)
    const ty = y + row * (TILE_H + TILE_GAP)
    parts.push(
      `<rect x="${tx}" y="${ty}" width="${TILE_W}" height="${TILE_H}" rx="6" fill="${C.tileBg}" stroke="${C.border}"/>`,
      `<text x="${tx + 12}" y="${ty + 20}" font-family="${SANS}" font-size="11" fill="${C.muted}">${escapeXml(s.label)}</text>`,
      `<text x="${tx + 12}" y="${ty + 44}" font-family="${SANS}" font-size="18" font-weight="700" fill="${C.text}">${escapeXml(clip(s.value, 16))}</text>`,
    )
  })
  if (input.stats.length > 0) {
    y += Math.ceil(input.stats.length / tilesPerRow) * (TILE_H + TILE_GAP) + 6
  }

  // ── Notices (balance check, truncation warning, …) ──
  input.notices.forEach(n => {
    const style = NOTICE_STYLE[n.tone]
    const lines = n.lines ?? []
    const h = 16 + NOTICE_LINE_H * (1 + lines.length)
    parts.push(
      `<rect x="${PAD}" y="${y}" width="${contentWidth}" height="${h}" rx="6" fill="${style.bg}" stroke="${style.fg}" stroke-opacity="0.35"/>`,
      `<text x="${PAD + 14}" y="${y + 8 + 13}" font-family="${SANS}" font-size="13" font-weight="600" fill="${style.fg}">${escapeXml(n.title)}</text>`,
    )
    lines.forEach((line, li) => {
      parts.push(
        `<text x="${PAD + 24}" y="${y + 8 + 13 + NOTICE_LINE_H * (li + 1)}" font-family="${SANS}" font-size="12" fill="${style.fg}">• ${escapeXml(line)}</text>`,
      )
    })
    y += h + 10
  })

  // ── Table ──
  y += 8
  parts.push(
    `<text x="${PAD}" y="${y + 14}" font-family="${SANS}" font-size="14" font-weight="700" fill="${C.text}">${escapeXml(input.tableTitle)}</text>`,
  )
  y += 26

  const colX: number[] = []
  let nextX = PAD
  for (const w of colWidths) {
    colX.push(nextX)
    nextX += w
  }

  const cellText = (text: string, i: number, rowY: number, attrs: string) => {
    const numeric = columns[i].numeric
    const x = numeric ? colX[i] + colWidths[i] - CELL_PAD_X : colX[i] + CELL_PAD_X
    const anchor = numeric ? ' text-anchor="end"' : ''
    return `<text x="${x}" y="${rowY + 16}"${anchor} ${attrs}>${escapeXml(clip(text, MAX_CELL_CHARS))}</text>`
  }

  parts.push(`<rect x="${PAD}" y="${y}" width="${tableWidth}" height="${ROW_H}" fill="${C.headerBg}"/>`)
  columns.forEach((col, i) => {
    parts.push(cellText(col.label, i, y, `font-weight="700" fill="${C.purple}"`))
  })
  y += ROW_H

  rows.forEach((row, ri) => {
    if (ri % 2 === 1) {
      parts.push(`<rect x="${PAD}" y="${y}" width="${tableWidth}" height="${ROW_H}" fill="${C.zebra}"/>`)
    }
    row.forEach((cell, i) => {
      if (!cell.text) return
      const weight = cell.tone === 'debit' || cell.tone === 'credit' ? ' font-weight="600"' : ''
      parts.push(cellText(cell.text, i, y, `fill="${toneColour(cell.tone)}"${weight}`))
    })
    parts.push(
      `<line x1="${PAD}" y1="${y + ROW_H}" x2="${PAD + tableWidth}" y2="${y + ROW_H}" stroke="${C.border}"/>`,
    )
    y += ROW_H
  })
  if (rows.length === 0) {
    parts.push(
      `<text x="${PAD + CELL_PAD_X}" y="${y + 16}" fill="${C.muted}" font-style="italic">No entries match the current filters.</text>`,
    )
    y += ROW_H
  }

  const height = y + PAD
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${C.bg}"/>` +
    `<g font-family="${MONO}" font-size="${TABLE_FONT}">${parts.join('')}</g>` +
    `</svg>`
  return { svg, width, height }
}

// Conservative canvas limits that hold in every evergreen browser (Safari is the tightest).
const MAX_CANVAS_SIDE = 16384
const MAX_CANVAS_AREA = 16_777_216
const PREFERRED_SCALE = 2
const MIN_SCALE = 0.5

/**
 * Pixel scale for rasterizing a `width`×`height` image: 2× for crisp text when it fits the
 * browser canvas limits, otherwise as large as fits. Throws when even 0.5× would not fit.
 */
export function rasterScale(width: number, height: number): number {
  const scale = Math.min(
    PREFERRED_SCALE,
    MAX_CANVAS_SIDE / width,
    MAX_CANVAS_SIDE / height,
    Math.sqrt(MAX_CANVAS_AREA / (width * height)),
  )
  if (scale < MIN_SCALE) {
    throw new Error(
      'Too many entries to export as a PNG/JPEG image. Narrow the filters, hide extra columns, or export as SVG instead.',
    )
  }
  return scale
}

/** Rasterizes an SVG to a PNG or JPEG blob via an off-screen canvas. */
export async function rasterizeSvg(
  rendered: RenderedSvg,
  format: Exclude<ImageFormat, 'svg'>,
): Promise<Blob> {
  const scale = rasterScale(rendered.width, rendered.height)
  const url = URL.createObjectURL(new Blob([rendered.svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('The browser could not render the report image.'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(rendered.width * scale)
    canvas.height = Math.floor(rendered.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.fillStyle = C.bg // JPEG has no alpha: never let transparent pixels turn black
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const mime = format === 'png' ? 'image/png' : 'image/jpeg'
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('The browser could not encode the image.'))),
        mime,
        0.92,
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Builds the report in the requested format, ready to download. */
export async function renderReportImage(input: ReportImageInput, format: ImageFormat): Promise<Blob> {
  const rendered = buildReportSvg(input)
  if (format === 'svg') return new Blob([rendered.svg], { type: 'image/svg+xml;charset=utf-8' })
  return rasterizeSvg(rendered, format)
}

/** Triggers a browser download of `blob` as `filename`. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
