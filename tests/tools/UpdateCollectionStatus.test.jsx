import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UpdateCollectionStatus from '../../src/components/tools/UpdateCollectionStatus.jsx'

const VALID_COLLECTION = JSON.stringify({
  BatchId: '00000000-0000-0000-0000-000000000000',
  CollectionId: 'col-id-xyz',
  PolicyNumber: 'OUTINT00001',
  CollectionStatus: 'Created',
  IsLatest: true,
  ModifiedBy: 'system',
  ModifiedDate: '2024-06-15T10:30:00.000Z',
  CreatedBy: 'system',
  CreatedDate: '2024-06-10T09:00:00.000Z',
  id: 'Collection-1-1',
  ProviderDetails: {
    ProcessingDate: '2024-06-15T10:30:00.000Z',
    Filename: null,
    ErrorCode: null,
    ErrorMessage: null,
  },
  _etag: '"abc123"',
  _rid: 'rid-value',
  _self: 'dbs/x/colls/y/docs/z',
  _attachments: 'attachments/',
  _ts: 1700000000,
})

const selectStatus = (status) => fireEvent.click(screen.getByRole("button", { name: status }))

const pasteAndGenerate = (email = 'ops@test.ie', jsonValue = VALID_COLLECTION) => {
  fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: email } })
  fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: jsonValue } })
  fireEvent.click(screen.getByText('Generate Documents →'))
}

const fillRejected = (code = 'ERR', msg = 'Something failed') => {
  fireEvent.change(screen.getByPlaceholderText(/NOT_FOUND/i), { target: { value: code } })
  fireEvent.change(screen.getByPlaceholderText(/transaction not found/i), { target: { value: msg } })
}

const getHistoric = () =>
  JSON.parse(screen.getByPlaceholderText(/updated original will appear/i).value)

const getNewDoc = () =>
  JSON.parse(screen.getByPlaceholderText(/new processed document will appear/i).value)

describe('Created2Rejected (Process Collection)', () => {

  // ── Rendering ────────────────────────────────────────────────────────
  it('renders email input', () => {
    render(<UpdateCollectionStatus />)
    expect(screen.getByPlaceholderText('you@company.ie')).toBeInTheDocument()
  })

  it('renders the three status buttons', () => {
    render(<UpdateCollectionStatus />)
    expect(screen.getByRole('button', { name: 'Refunded' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collected' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rejected' })).toBeInTheDocument()
  })

  it('defaults to Rejected — shows ErrorCode + ErrorMessage fields', () => {
    render(<UpdateCollectionStatus />)
    expect(screen.getByPlaceholderText(/NOT_FOUND/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/transaction not found/i)).toBeInTheDocument()
  })

  it('shows ProcessingDate datetime input when Refunded is selected', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Refunded')
    expect(document.querySelector('input[type="datetime-local"]')).not.toBeNull()
    expect(screen.queryByPlaceholderText(/NOT_FOUND/i)).not.toBeInTheDocument()
  })

  it('shows ProcessingDate datetime input when Collected is selected', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Collected')
    expect(document.querySelector('input[type="datetime-local"]')).not.toBeNull()
    expect(screen.queryByPlaceholderText(/NOT_FOUND/i)).not.toBeInTheDocument()
  })

  it('renders both output textareas as read-only', () => {
    render(<UpdateCollectionStatus />)
    expect(screen.getByPlaceholderText(/updated original will appear/i)).toHaveAttribute('readonly')
    expect(screen.getByPlaceholderText(/new processed document will appear/i)).toHaveAttribute('readonly')
  })

  // ── ProcessingDate prefill ──────────────────────────────────────────
  it('prefills ProcessingDate from ModifiedDate when JSON is pasted', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Refunded')
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), {
      target: { value: VALID_COLLECTION },
    })
    const dtInput = document.querySelector('input[type="datetime-local"]')
    expect(dtInput.value).toMatch(/^2024-06-15/)
  })

  // ── Validation errors ─────────────────────────────────────────────
  it('shows error when email is empty', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: VALID_COLLECTION } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument()
  })

  it('shows error when JSON is empty', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'ops@test.ie' } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    expect(screen.getByText(/paste the collection json/i)).toBeInTheDocument()
  })

  it('shows error for Rejected when ErrorCode is empty', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    // only fill message, leave code empty
    fireEvent.change(screen.getByPlaceholderText(/transaction not found/i), { target: { value: 'msg' } })
    pasteAndGenerate()
    expect(screen.getByText(/error code/i)).toBeInTheDocument()
  })

  it('shows error for Rejected when ErrorMessage is empty', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fireEvent.change(screen.getByPlaceholderText(/NOT_FOUND/i), { target: { value: 'ERR' } })
    // leave message empty
    pasteAndGenerate()
    expect(screen.getByText(/error message/i)).toBeInTheDocument()
  })

  it('shows error for Refunded when ProcessingDate is cleared', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Refunded')
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: VALID_COLLECTION } })
    fireEvent.change(document.querySelector('input[type="datetime-local"]'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'ops@test.ie' } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    expect(screen.getByText(/processing date/i)).toBeInTheDocument()
  })

  it('shows error for malformed JSON', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'ops@test.ie' } })
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: '{ bad json }' } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
  })

  // ── Historic item ─────────────────────────────────────────────────
  it('sets IsLatest=false on the historic item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getHistoric().IsLatest).toBe(false)
  })

  it('sets historic id to {originalId}-{currentCollectionStatus}', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getHistoric().id).toBe('Collection-1-1-Created')
  })

  it('sets ModifiedBy to email on historic item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate('editor@co.ie')
    expect(getHistoric().ModifiedBy).toBe('editor@co.ie')
  })

  it('updates ModifiedDate to a fresh timestamp on historic item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getHistoric().ModifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(getHistoric().ModifiedDate).not.toBe('2024-06-15T10:30:00.000Z')
  })

  // ── New item — common ─────────────────────────────────────────────
  it('sets IsLatest=true on the new item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getNewDoc().IsLatest).toBe(true)
  })

  it('preserves the original id on the new item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getNewDoc().id).toBe('Collection-1-1')
  })

  it('sets CreatedBy, CreatedDate, ModifiedBy, ModifiedDate on the new item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate('fresh@co.ie')
    const doc = getNewDoc()
    expect(doc.CreatedBy).toBe('fresh@co.ie')
    expect(doc.ModifiedBy).toBe('fresh@co.ie')
    expect(doc.CreatedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(doc.ModifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  // ── New item — Rejected ───────────────────────────────────────────
  it('sets CollectionStatus=Rejected and correct ProviderDetails for Rejected', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fireEvent.change(screen.getByPlaceholderText(/NOT_FOUND/i), { target: { value: 'TIMEOUT' } })
    fireEvent.change(screen.getByPlaceholderText(/transaction not found/i), { target: { value: 'Gateway timed out' } })
    pasteAndGenerate()
    const doc = getNewDoc()
    expect(doc.CollectionStatus).toBe('Rejected')
    expect(doc.ProviderDetails.ErrorCode).toBe('TIMEOUT')
    expect(doc.ProviderDetails.ErrorMessage).toBe('Gateway timed out')
  })

  // ── New item — Refunded ───────────────────────────────────────────
  it('sets CollectionStatus=Refunded with ProcessingDate and no ErrorCode', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Refunded')
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: VALID_COLLECTION } })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'ops@test.ie' } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    const doc = getNewDoc()
    expect(doc.CollectionStatus).toBe('Refunded')
    expect(doc.ProviderDetails.ProcessingDate).toBeTruthy()
    expect(doc.ProviderDetails.ErrorCode).toBeNull()
    expect(doc.ProviderDetails.ErrorMessage).toBeNull()
  })

  // ── New item — Collected ──────────────────────────────────────────
  it('sets CollectionStatus=Collected on the new item', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Collected')
    fireEvent.change(screen.getByPlaceholderText(/original collection document/i), { target: { value: VALID_COLLECTION } })
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'ops@test.ie' } })
    fireEvent.click(screen.getByText('Generate Documents →'))
    expect(getNewDoc().CollectionStatus).toBe('Collected')
  })

  // ── Cosmos field stripping ────────────────────────────────────────
  it.each(['_etag', '_rid', '_self', '_attachments', '_ts'])(
    'strips Cosmos field "%s" from both outputs',
    (field) => {
      render(<UpdateCollectionStatus />)
      selectStatus('Rejected')
      fillRejected()
      pasteAndGenerate()
      expect(getHistoric()).not.toHaveProperty(field)
      expect(getNewDoc()).not.toHaveProperty(field)
    }
  )

  // ── Diff viewer ───────────────────────────────────────────────────
  it('shows the diff viewer after a successful generation', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(screen.getByText(/diff viewer/i)).toBeInTheDocument()
  })

  it('hides the diff viewer before any generation', () => {
    render(<UpdateCollectionStatus />)
    expect(screen.queryByText(/diff viewer/i)).not.toBeInTheDocument()
  })

  // ── localStorage ──────────────────────────────────────────────────
  it('persists email to localStorage', () => {
    render(<UpdateCollectionStatus />)
    fireEvent.change(screen.getByPlaceholderText('you@company.ie'), { target: { value: 'store@test.ie' } })
    expect(localStorage.getItem('ft_user_email')).toBe('store@test.ie')
  })

  it('restores email from localStorage on mount', () => {
    localStorage.setItem('ft_user_email', 'restored@test.ie')
    render(<UpdateCollectionStatus />)
    expect(screen.getByPlaceholderText('you@company.ie')).toHaveValue('restored@test.ie')
  })

  // ── Copy buttons ──────────────────────────────────────────────────
  it('copy button for historic doc writes to clipboard', async () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    fireEvent.click(screen.getAllByText('Copy')[0])
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"IsLatest": false')
      )
    )
  })

  it('copy button for new doc writes to clipboard', async () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    fireEvent.click(screen.getAllByText('Copy')[1])
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('"IsLatest": true')
      )
    )
  })

  // ── Clear ─────────────────────────────────────────────────────────
  it('clears all inputs and outputs on Clear click', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByPlaceholderText(/original collection document/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/updated original will appear/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/new processed document will appear/i)).toHaveValue('')
  })

  // ── Load sample ──────────────────────────────────────────────────────
  it('loads the built-in sample on Load sample click', () => {
    render(<UpdateCollectionStatus />)
    fireEvent.click(screen.getByText('Load sample'))
    expect(screen.getByPlaceholderText(/original collection document/i).value).toContain('OUTINT00172379')
  })

  it('prefills ProcessingDate from the sample and clears any prior outputs', () => {
    render(<UpdateCollectionStatus />)
    selectStatus('Rejected')
    fillRejected()
    pasteAndGenerate()
    expect(getHistoric().id).toBeTruthy()

    fireEvent.click(screen.getByText('Load sample'))
    expect(screen.getByPlaceholderText(/updated original will appear/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/new processed document will appear/i)).toHaveValue('')

    selectStatus('Collected')
    const dtInput = document.querySelector('input[type="datetime-local"]')
    expect(dtInput.value).toMatch(/^2024-08-08/)
  })
})
