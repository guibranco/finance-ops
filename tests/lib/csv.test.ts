import { describe, it, expect } from 'vitest'
import { parseCsv, tokenizeCsv } from '../../src/lib/csv.ts'

describe('parseCsv', () => {
  it('returns trimmed headers and one object per row', () => {
    const { headers, rows } = parseCsv(' a , b \n1, 2 \n3,4\n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }])
  })

  it('handles quoted fields with embedded commas, quotes and newlines', () => {
    const { rows } = parseCsv('name,note\n"Doe, John","said ""hi""\nthen left"')
    expect(rows).toEqual([{ name: 'Doe, John', note: 'said "hi"\nthen left' }])
  })

  it('tolerates CRLF line endings and blank lines', () => {
    const { headers, rows } = parseCsv('a,b\r\n1,2\r\n\r\n3,4\r\n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toHaveLength(2)
  })

  it('strips a leading UTF-8 BOM from the first header', () => {
    const { headers } = parseCsv('﻿a,b\n1,2')
    expect(headers[0]).toBe('a')
  })

  it('fills missing trailing columns with empty strings', () => {
    const { rows } = parseCsv('a,b,c\n1,2')
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '' })
  })

  it('returns empty headers and rows for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] })
  })

  it('throws on an unterminated quoted field', () => {
    expect(() => tokenizeCsv('a,"b')).toThrow(/unterminated quoted field/i)
  })
})
