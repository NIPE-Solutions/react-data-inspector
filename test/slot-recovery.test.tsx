import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataInspector, type InspectorSlotProps } from '../src'

const expectedError = (event: ErrorEvent) => {
  if (
    event.error instanceof Error &&
    ['bad value', 'bad actions'].includes(event.error.message)
  )
    event.preventDefault()
}
beforeEach(() => window.addEventListener('error', expectedError))
afterEach(() => window.removeEventListener('error', expectedError))

it('recovers a failed value slot after the data at the same path changes', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  function Value({ node }: InspectorSlotProps) {
    if (node.value === 1) throw Error('bad value')
    return <span>Recovered {node.summary}</span>
  }
  try {
    const { rerender } = render(
      <DataInspector value={1} components={{ Value }} />,
    )
    expect(screen.getByText('Custom renderer failed')).toBeInTheDocument()
    rerender(<DataInspector value={2} components={{ Value }} />)
    expect(screen.getByText('Recovered 2')).toBeInTheDocument()
    expect(screen.queryByText('Custom renderer failed')).not.toBeInTheDocument()
  } finally {
    errors.mockRestore()
  }
})
it('recovers an open actions slot when its component is replaced', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  function Broken(): never {
    throw Error('bad actions')
  }
  try {
    const { rerender } = render(
      <DataInspector value={1} components={{ Actions: Broken }} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
    expect(screen.getByText('Custom renderer failed')).toBeInTheDocument()
    rerender(
      <DataInspector
        value={1}
        components={{ Actions: () => <button>Recovered actions</button> }}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Recovered actions' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Custom renderer failed')).not.toBeInTheDocument()
  } finally {
    errors.mockRestore()
  }
})
it('distinguishes a limited empty search from a complete no-match result', async () => {
  render(
    <DataInspector
      value={{ text: 'abcNEEDLE' }}
      searchable
      searchQuery="needle"
      searchOptions={{ debounce: 0, stringLimit: 3 }}
    />,
  )
  await waitFor(() =>
    expect(screen.queryByText('Searching…')).not.toBeInTheDocument(),
  )
  expect(
    screen.getByText('No matches within the search limits.'),
  ).toBeInTheDocument()
  expect(screen.queryByText('No matches')).not.toBeInTheDocument()
})
