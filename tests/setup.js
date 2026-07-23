import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── localStorage (full in-memory mock) ────────────────────────────────────
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:     (key)        => (key in store ? store[key] : null),
    setItem:     (key, value) => { store[key] = String(value) },
    removeItem:  (key)        => { delete store[key] },
    clear:       ()           => { store = {} },
    get length() { return Object.keys(store).length },
    key:         (i)          => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(global, 'localStorage', {
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
  getRandomValues: (arr) => arr,
})

// ── URL helpers (download tests) ───────────────────────────────────────────
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// ── DOM anchor click (download) ────────────────────────────────────────────
HTMLAnchorElement.prototype.click = vi.fn()

// ── Reset between tests ────────────────────────────────────────────────────
beforeEach(() => {
  uuidCounter = 0
  vi.clearAllMocks()
  localStorageMock.clear()
})
