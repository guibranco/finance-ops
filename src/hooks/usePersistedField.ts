import { useState } from 'react'

// Shared across every tool so the user's email only has to be entered once.
export const USER_EMAIL_KEY = 'ft_user_email'

// A form field whose value is restored from localStorage on mount and
// persisted back to it on every change (e.g. a remembered email address).
export function usePersistedField(storageKey: string, initialValue = ''): [string, (next: string) => void] {
  const [value, setValue] = useState(() => localStorage.getItem(storageKey) ?? initialValue)

  function setPersisted(next: string) {
    setValue(next)
    localStorage.setItem(storageKey, next)
  }

  return [value, setPersisted]
}
