import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// ── localStorage (full in-memory mock) ────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:     (key: string)                 => (key in store ? store[key] : null),
    setItem:     (key: string, value: unknown) => { store[key] = String(value) },
    removeItem:  (key: string)                 => { delete store[key] },
    clear:       ()                            => { store = {} },
    get length() { return Object.keys(store).length },
    key:         (i: number)                   => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// ── Clipboard ──────────────────────────────────────────────────────────────
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
  writable: true,
})

// ── crypto.randomUUID ──────────────────────────────────────────────────────
let uuidCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => `00000000-0000-0000-0000-${String(++uuidCounter).padStart(12, '0')}`),
  getRandomValues: <T>(arr: T) => arr,
})

// ── URL helpers (download tests) ───────────────────────────────────────────
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()

// ── DOM anchor click (download) ────────────────────────────────────────────
HTMLAnchorElement.prototype.click = vi.fn()

// ── Reset between tests ────────────────────────────────────────────────────
beforeEach(() => {
  uuidCounter = 0
  vi.clearAllMocks()
  localStorageMock.clear()
})
