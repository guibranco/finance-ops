import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import App from '../src/App.jsx'

// Helper: get the nav element so tab assertions don't collide with the h2 heading
const getNav = () => screen.getByRole('navigation')

describe('App', () => {
  it('renders the brand header', () => {
    render(<App />)
    expect(screen.getByText('Finance Ops Toolbox')).toBeInTheDocument()
    expect(screen.getByText(/internal collection/i)).toBeInTheDocument()
  })

  it('renders all seven tab buttons', () => {
    render(<App />)
    const nav = getNav()
    expect(within(nav).getByText('Resubmission')).toBeInTheDocument()
    expect(within(nav).getByText('Collection → Shadow Ledger')).toBeInTheDocument()
    expect(within(nav).getByText('Process Collection')).toBeInTheDocument()
    expect(within(nav).getByText('SEPA XML')).toBeInTheDocument()
    expect(within(nav).getByText('Refund Schedule')).toBeInTheDocument()
    expect(within(nav).getByText('GL Reconciliation')).toBeInTheDocument()
    expect(within(nav).getByText('SL Visualizer')).toBeInTheDocument()
  })

  it('shows the Resubmission tool by default', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/rejected collection json here/i)).toBeInTheDocument()
  })

  it('switches to Collection → Shadow Ledger tab', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('Collection → Shadow Ledger'))
    expect(screen.getByPlaceholderText(/collection item document/i)).toBeInTheDocument()
  })

  it('switches to Reject Collection tab', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('Process Collection'))
    expect(screen.getByPlaceholderText(/original collection document/i)).toBeInTheDocument()
  })

  it('switches to SEPA XML tab', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('SEPA XML'))
    expect(screen.getByPlaceholderText(/direct debit json/i)).toBeInTheDocument()
  })

  it('switches to Refund Schedule tab', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('Refund Schedule'))
    expect(screen.getByPlaceholderText(/paymentschedule document/i)).toBeInTheDocument()
  })

  it('switches to GL Reconciliation tab', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('GL Reconciliation'))
    expect(screen.getByText(/collection items export/i)).toBeInTheDocument()
  })

  it('marks the active tab with the active class', () => {
    render(<App />)
    const shadowTab = within(getNav()).getByText('Collection → Shadow Ledger').closest('button')
    fireEvent.click(shadowTab)
    expect(shadowTab).toHaveClass('active')
  })

  it('removes active class from the previous tab when switching', () => {
    render(<App />)
    const nav = getNav()
    const resubTab = within(nav).getByText('Resubmission').closest('button')
    const shadowTab = within(nav).getByText('Collection → Shadow Ledger').closest('button')
    expect(resubTab).toHaveClass('active')
    fireEvent.click(shadowTab)
    expect(resubTab).not.toHaveClass('active')
    expect(shadowTab).toHaveClass('active')
  })

  it('displays the tool description subtitle on switch', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('SEPA XML'))
    expect(screen.getByText(/convert direct debit json to sepa/i)).toBeInTheDocument()
  })

  // ── Tab persistence ────────────────────────────────────────────────────
  it('persists the active tab to localStorage on switch', () => {
    render(<App />)
    fireEvent.click(within(getNav()).getByText('SEPA XML'))
    expect(localStorage.getItem('ft_active_tab')).toBe('sepa')
  })

  it('restores the last active tab from localStorage on mount', () => {
    localStorage.setItem('ft_active_tab', 'shadow-ledger')
    render(<App />)
    expect(screen.getByPlaceholderText(/collection item document/i)).toBeInTheDocument()
    const shadowTab = within(getNav()).getByText('Collection → Shadow Ledger').closest('button')
    expect(shadowTab).toHaveClass('active')
  })

  it('falls back to the default tab when localStorage has an unknown tab id', () => {
    localStorage.setItem('ft_active_tab', 'not-a-real-tool')
    render(<App />)
    expect(screen.getByPlaceholderText(/rejected collection json here/i)).toBeInTheDocument()
  })
})
