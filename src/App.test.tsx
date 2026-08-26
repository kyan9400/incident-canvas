import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

describe('Incident Canvas', () => {
  beforeEach(() => localStorage.clear())

  it('renders the sample report and calculated metrics', () => {
    render(<App />)
    expect(screen.getByDisplayValue(/Checkout requests stalled/)).toBeInTheDocument()
    expect(screen.getByText('55m')).toBeInTheDocument()
    expect(screen.getByText('7m')).toBeInTheDocument()
    expect(screen.getAllByText('33%')).toHaveLength(2)
  })

  it('creates a timeline event and persists edits locally', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /add timeline event/i }))
    const newTitle = screen.getByLabelText('Title for timeline event 6')
    await user.clear(newTitle)
    await user.type(newTitle, 'Customer update posted')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.timeline).toHaveLength(6)
    expect(stored.timeline[5].label).toBe('Customer update posted')
  })

  it('updates follow-up status and completion', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Status for action 2'), 'done')
    expect(screen.getAllByText('67%')).toHaveLength(2)
  })

  it('starts a blank report and restores the example', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^new$/i }))
    expect(screen.getByDisplayValue('Untitled incident')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /example/i }))
    expect(screen.getByDisplayValue(/Checkout requests stalled/)).toBeInTheDocument()
  })

  it('rejects invalid imports without replacing the report', () => {
    render(<App />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['{"schemaVersion":2}'], 'old.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByDisplayValue(/Checkout requests stalled/)).toBeInTheDocument()
  })
})
