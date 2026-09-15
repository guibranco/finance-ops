import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SepaXmlGenerator from '../../src/components/tools/SepaXmlGenerator.tsx'

const ddTab = () => screen.getByRole('tab', { name: /direct debit/i })
const ctTab = () => screen.getByRole('tab', { name: /credit transfer/i })

describe('SepaXmlGenerator', () => {
  it('renders both mode tabs with the Direct Debit generator selected by default', () => {
    render(<SepaXmlGenerator />)
    expect(ddTab()).toHaveAttribute('aria-selected', 'true')
    expect(ctTab()).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByPlaceholderText(/direct debit json/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/refund \/ payment csv/i)).not.toBeInTheDocument()
  })

  it('switches to the Credit Transfer generator', () => {
    render(<SepaXmlGenerator />)
    fireEvent.click(ctTab())
    expect(ctTab()).toHaveAttribute('aria-selected', 'true')
    expect(ddTab()).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByPlaceholderText(/refund \/ payment csv/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/direct debit json/i)).not.toBeInTheDocument()
  })

  it('switches back to the Direct Debit generator', () => {
    render(<SepaXmlGenerator />)
    fireEvent.click(ctTab())
    fireEvent.click(ddTab())
    expect(screen.getByPlaceholderText(/direct debit json/i)).toBeInTheDocument()
  })

  it('persists the selected mode to localStorage', () => {
    render(<SepaXmlGenerator />)
    fireEvent.click(ctTab())
    expect(localStorage.getItem('ft_sepa_mode')).toBe('ct')
  })

  it('restores the persisted mode on mount', () => {
    localStorage.setItem('ft_sepa_mode', 'ct')
    render(<SepaXmlGenerator />)
    expect(ctTab()).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByPlaceholderText(/refund \/ payment csv/i)).toBeInTheDocument()
  })

  it('falls back to Direct Debit when the persisted mode is unknown', () => {
    localStorage.setItem('ft_sepa_mode', 'nope')
    render(<SepaXmlGenerator />)
    expect(ddTab()).toHaveAttribute('aria-selected', 'true')
  })
})
