import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildReportSvg,
  canCopyImage,
  copyPngToClipboard,
  downloadBlob,
  escapeXml,
  rasterScale,
  rasterizeSvg,
  renderReportImage,
  type ReportImageInput,
} from '../../src/lib/reportImage'

const REPORT: ReportImageInput = {
  title: 'Shadow Ledger — Summary & Entries',
  subtitle: 'Generated today',
  stats: [
    { label: 'Entries', value: '2' },
    { label: 'Net amount', value: '0' },
  ],
  notices: [
    { tone: 'error', title: '1 posting out of balance:', lines: ['REF-1 · Refund — debit 10 vs credit 5 (Δ5)'] },
    { tone: 'warning', title: 'Truncated' },
  ],
  tableTitle: 'Entries (2 of 2)',
  columns: [{ label: 'ID' }, { label: 'GL Entry' }, { label: 'Amount', numeric: true }],
  rows: [
    [{ text: '1' }, { text: 'Debit', tone: 'debit' }, { text: '-10.00', tone: 'negative' }],
    [{ text: '2' }, { text: 'Credit', tone: 'credit' }, { text: '' }],
  ],
}

/** Parses the SVG so the assertions don't depend on attribute order or formatting. */
function parse(svg: string): Document {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  expect(doc.querySelector('parsererror')).toBeNull()
  return doc
}

const texts = (doc: Document) => [...doc.querySelectorAll('text')].map(t => t.textContent)

describe('escapeXml', () => {
  it('escapes markup characters and drops XML-invalid control characters', () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>\u0001`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;',
    )
  })
})

describe('buildReportSvg', () => {
  it('produces a well-formed SVG with the title, tiles, notices, headers and cells', () => {
    const { svg, width, height } = buildReportSvg(REPORT)
    const doc = parse(svg)
    const root = doc.documentElement
    expect(root.getAttribute('width')).toBe(String(width))
    expect(root.getAttribute('height')).toBe(String(height))
    const all = texts(doc)
    expect(all).toEqual(
      expect.arrayContaining([
        'Shadow Ledger — Summary & Entries',
        'Generated today',
        'Entries',
        'Net amount',
        '1 posting out of balance:',
        '• REF-1 · Refund — debit 10 vs credit 5 (Δ5)',
        'Truncated',
        'Entries (2 of 2)',
        'ID',
        'GL Entry',
        'Amount',
        'Debit',
        'Credit',
        '-10.00',
      ]),
    )
  })

  it('right-aligns numeric columns and colours toned cells', () => {
    const doc = parse(buildReportSvg(REPORT).svg)
    const byText = (t: string) => [...doc.querySelectorAll('text')].find(n => n.textContent === t)!
    expect(byText('-10.00').getAttribute('text-anchor')).toBe('end')
    expect(byText('Debit').getAttribute('fill')).toBe('#c0392b')
    expect(byText('Credit').getAttribute('fill')).toBe('#76a432')
    expect(byText('1').getAttribute('text-anchor')).toBeNull()
  })

  it('escapes user data so it cannot break the document', () => {
    const doc = parse(
      buildReportSvg({ ...REPORT, rows: [[{ text: '<script>&' }, { text: '' }, { text: '1' }]] }).svg,
    )
    expect(texts(doc)).toContain('<script>&')
    expect(doc.querySelector('script')).toBeNull()
  })

  it('clips very long cell values and grows with the number of rows', () => {
    const long = 'x'.repeat(200)
    const one = buildReportSvg({ ...REPORT, rows: [[{ text: long }, { text: '' }, { text: '' }]] })
    expect(texts(parse(one.svg))).toContain(`${'x'.repeat(95)}…`)
    const many = buildReportSvg({ ...REPORT, rows: Array.from({ length: 50 }, () => REPORT.rows[0]) })
    expect(many.height).toBeGreaterThan(one.height)
  })

  it('renders a placeholder when no rows match and handles no subtitle/stats/notices', () => {
    const doc = parse(
      buildReportSvg({ ...REPORT, subtitle: undefined, stats: [], notices: [{ tone: 'success', title: 'ok' }], rows: [] }).svg,
    )
    expect(texts(doc)).toContain('No entries match the current filters.')
  })
})

describe('rasterScale', () => {
  it('uses 2× when the image is small', () => {
    expect(rasterScale(1000, 800)).toBe(2)
  })

  it('scales down to fit the canvas limits', () => {
    const s = rasterScale(4000, 6000)
    expect(s).toBeLessThan(2)
    expect(4000 * s * 6000 * s).toBeLessThanOrEqual(16_777_216 + 1)
  })

  it('refuses images that would be unreadably small', () => {
    expect(() => rasterScale(2000, 200_000)).toThrow(/export as SVG/i)
  })
})

describe('renderReportImage / rasterizeSvg', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns the SVG as-is for the svg format', async () => {
    const blob = await renderReportImage(REPORT, 'svg')
    expect(blob.type).toBe('image/svg+xml;charset=utf-8')
    expect(await blob.text()).toBe(buildReportSvg(REPORT).svg)
  })

  /** Stubs Image loading and the canvas so rasterization can run under jsdom. */
  function stubCanvas(opts: { loadFails?: boolean; noContext?: boolean; noBlob?: boolean } = {}) {
    const ctx = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement) {
      setTimeout(() => (opts.loadFails ? this.onerror?.(new Event('error')) : this.onload?.(new Event('load'))))
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => (opts.noContext ? null : ctx) as unknown as ReturnType<HTMLCanvasElement['getContext']>,
    )
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (cb: BlobCallback, type?: string) {
        cb(opts.noBlob ? null : new Blob(['img'], { type }))
      })
    return { ctx, toBlob }
  }

  it.each([
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
  ] as const)('rasterizes to %s on a white background', async (format, mime) => {
    const { ctx, toBlob } = stubCanvas()
    const blob = await renderReportImage(REPORT, format)
    expect(blob.type).toBe(mime)
    expect(ctx.fillStyle).toBe('#ffffff')
    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.drawImage).toHaveBeenCalled()
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), mime, 0.92)
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('rejects when the browser cannot load the SVG', async () => {
    stubCanvas({ loadFails: true })
    await expect(rasterizeSvg(buildReportSvg(REPORT), 'png')).rejects.toThrow(/could not render/i)
  })

  it('rejects when no 2D context is available', async () => {
    stubCanvas({ noContext: true })
    await expect(rasterizeSvg(buildReportSvg(REPORT), 'png')).rejects.toThrow(/canvas is not available/i)
  })

  it('rejects when encoding fails', async () => {
    stubCanvas({ noBlob: true })
    await expect(rasterizeSvg(buildReportSvg(REPORT), 'jpeg')).rejects.toThrow(/could not encode/i)
  })
})

describe('downloadBlob', () => {
  it('clicks a temporary link with the given filename', () => {
    const click = vi.mocked(HTMLAnchorElement.prototype.click)
    downloadBlob('report.png', new Blob(['x']))
    expect(click).toHaveBeenCalledTimes(1)
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('report.png')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})

describe('copyPngToClipboard', () => {
  /** Minimal ClipboardItem stand-in (jsdom has none) that records what it was given. */
  class FakeClipboardItem {
    items: Record<string, Promise<Blob>>;
        constructor(items: Record<string, Promise<Blob>>) {
          this.items = items;
        }
  }

  function stubClipboard(write: (items: FakeClipboardItem[]) => Promise<void>) {
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)
    const writeMock = vi.fn(write)
    Object.defineProperty(navigator, 'clipboard', { value: { write: writeMock }, configurable: true, writable: true })
    return writeMock
  }

  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')!
  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'clipboard', original)
  })

  it('reports no support without ClipboardItem / clipboard.write', async () => {
    expect(canCopyImage()).toBe(false)
    await expect(copyPngToClipboard(Promise.resolve(new Blob()))).rejects.toThrow(/can't copy images/i)
  })

  it('swallows the pending render when unsupported, so it never becomes an unhandled rejection', async () => {
    const png = Promise.reject(new Error('render failed'))
    await expect(copyPngToClipboard(png)).rejects.toThrow(/can't copy images/i)
  })

  it('writes the PNG promise straight into a ClipboardItem', async () => {
    const write = stubClipboard(() => Promise.resolve())
    expect(canCopyImage()).toBe(true)
    const png = Promise.resolve(new Blob(['x'], { type: 'image/png' }))
    await copyPngToClipboard(png)
    expect(write).toHaveBeenCalledTimes(1)
    const [item] = write.mock.calls[0][0]
    expect(Object.keys(item.items)).toEqual(['image/png'])
    expect(item.items['image/png']).toBe(png) // the promise itself, not an awaited blob
  })

  it('explains a blocked clipboard permission', async () => {
    stubClipboard(() => Promise.reject(new DOMException('denied', 'NotAllowedError')))
    await expect(copyPngToClipboard(Promise.resolve(new Blob()))).rejects.toThrow(/blocked by the browser/i)
  })

  it('reports other clipboard failures generically', async () => {
    stubClipboard(() => Promise.reject(new Error('boom')))
    await expect(copyPngToClipboard(Promise.resolve(new Blob()))).rejects.toThrow(/could not copy/i)
  })

  it('surfaces the rendering error when the image itself failed', async () => {
    stubClipboard(() => Promise.reject(new DOMException('aborted', 'AbortError')))
    await expect(copyPngToClipboard(Promise.reject(new Error('Too many entries')))).rejects.toThrow(
      'Too many entries',
    )
  })
})
