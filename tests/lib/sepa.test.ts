import { describe, it, expect } from 'vitest'
import {
  cleanIban,
  escapeXml,
  generateMessageId,
  isIbanChecksumValid,
  isIbanShaped,
  parseAmount,
  round2,
} from '../../src/lib/sepa.ts'

describe('sepa helpers', () => {
  it('cleanIban strips whitespace and upper-cases', () => {
    expect(cleanIban(' ie29 aibk 9311 5212 3456 78 ')).toBe('IE29AIBK93115212345678')
    expect(cleanIban(undefined)).toBe('')
  })

  it('isIbanShaped accepts country + check digits + 11-30 alphanumerics', () => {
    expect(isIbanShaped('IE29AIBK93115212345678')).toBe(true)
    expect(isIbanShaped('GB33BUKB20201555555555')).toBe(true)
    expect(isIbanShaped('IE29AIBK')).toBe(false)
    expect(isIbanShaped('1E29AIBK93115212345678')).toBe(false)
    expect(isIbanShaped('IE29AIBK9311521234567!')).toBe(false)
  })

  it('isIbanChecksumValid implements ISO 7064 mod-97', () => {
    expect(isIbanChecksumValid('IE29AIBK93115212345678')).toBe(true)
    expect(isIbanChecksumValid('GB33BUKB20201555555555')).toBe(true)
    expect(isIbanChecksumValid('IE50BOFI90121234123412')).toBe(false)
  })

  it('escapeXml escapes the five XML special characters', () => {
    expect(escapeXml(`Sheedy & Kinsella <LLP> "O'Dwyer"`)).toBe('Sheedy &amp; Kinsella &lt;LLP&gt; &quot;O&apos;Dwyer&quot;')
  })

  it.each([
    ['-0.62', -0.62],
    ['17.35', 17.35],
    ['8000', 8000],
    [' € 1,234.56 ', 1234.56],
    ['1.234,56', 1234.56],
    ['-0,62', -0.62],
    ['(12.50)', -12.5],
    ['+3', 3],
  ])('parseAmount("%s") → %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '1.2.3', '12-'])('parseAmount("%s") → null', raw => {
    expect(parseAmount(raw)).toBeNull()
  })

  it('round2 rounds half-up to two decimals', () => {
    expect(round2(0.62 + 17.35)).toBe(17.97)
    expect(round2(1.005)).toBe(1.01)
  })

  it('generateMessageId ends with the type and PAIN suffix', () => {
    expect(generateMessageId('REFUND', 'PAIN001')).toMatch(/^\d{8}-\d{6}-REFUND-PAIN001$/)
    expect(generateMessageId('NORMAL', 'PAIN008')).toMatch(/^\d{8}-\d{6}-NORMAL-PAIN008$/)
  })
})
