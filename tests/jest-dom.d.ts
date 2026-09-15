// Vitest 5 no longer reads matcher declarations from the global `jest.Matchers`
// interface, and @testing-library/jest-dom 7 still augments Vitest's old
// single-parameter `Assertion<T>`, so its matchers are untyped on Vitest 5.
// Augment Vitest's `Matchers<R, T>` (its supported extension point) directly.
// Remove this file once jest-dom ships a Vitest 5 compatible `./vitest` entry.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  // `T` is unused here but must be declared with the same name as in Vitest's
  // own `Matchers<R, T>` for the interface declarations to merge.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
