import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect } from 'vitest'
import { DataInspector, type DataPath } from '../src'

it('advances after controlled selection causes the same value to be rescanned', async () => {
  const value = { a: 'needle', b: 'needle' }
  function App() {
    const [selected, setSelected] = useState<DataPath | null>(null)
    return (
      <>
        <DataInspector
          value={value}
          searchable
          searchQuery="needle"
          searchOptions={{ debounce: 0 }}
          selectedPath={selected}
          onSelectedPathChange={setSelected}
        />
        <output>{JSON.stringify(selected)}</output>
      </>
    )
  }
  render(<App />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByText('["a"]')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByText('["b"]')).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.getByText('2 of 2 matches')).toBeInTheDocument(),
  )
})
it('retains the current result by path when another match is inserted before it', async () => {
  const { rerender } = render(
    <DataInspector
      value={{ a: 'needle', b: 'needle' }}
      searchable
      searchQuery="needle"
      searchOptions={{ debounce: 0 }}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByText('1 of 2 matches')).toBeInTheDocument()
  rerender(
    <DataInspector
      value={{ before: 'needle', a: 'needle', b: 'needle' }}
      searchable
      searchQuery="needle"
      searchOptions={{ debounce: 0 }}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  expect(screen.getByText('2 of 3 matches')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    'b: "needle"',
  )
})
it('resets the current result when the query changes even if matching paths overlap', async () => {
  const value = { a: 'needle other', b: 'needle other' }
  const { rerender } = render(
    <DataInspector
      value={value}
      searchable
      searchQuery="needle"
      searchOptions={{ debounce: 0 }}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  rerender(
    <DataInspector
      value={value}
      searchable
      searchQuery="other"
      searchOptions={{ debounce: 0 }}
    />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  expect(screen.getByText('2 matches')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    'a: "needle other"',
  )
})
