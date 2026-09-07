import { useEffect, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DataInspector, type DataPath } from '../src'
it('completes search while values update faster than query debounce', async () => {
  vi.useFakeTimers()
  function App() {
    const [tick, setTick] = useState(0)
    useEffect(() => {
      const timer = setInterval(() => setTick((n) => n + 1), 50)
      return () => clearInterval(timer)
    }, [])
    return (
      <DataInspector
        value={{ tick, answer: 'needle' }}
        searchable
        searchQuery="needle"
      />
    )
  }
  const view = render(<App />)
  try {
    for (let i = 0; i < 10; i++)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50)
      })
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('1 matches')
  } finally {
    view.unmount()
    vi.useRealTimers()
  }
})
it('keeps completed results available during controlled-selection refresh', async () => {
  const value = { a: 'needle', b: 'needle' }
  function App() {
    const [selected, setSelected] = useState<DataPath | null>(null)
    return (
      <DataInspector
        value={value}
        searchable
        searchQuery="needle"
        selectedPath={selected}
        onSelectedPathChange={setSelected}
      />
    )
  }
  render(<App />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    'b: "needle"',
  )
})
it('refreshes results after a same-reference mutation and explicit rerender', async () => {
  const value = { answer: 'needle' }
  const { rerender } = render(
    <DataInspector value={value} searchable searchQuery="needle" />,
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  value.answer = 'changed'
  rerender(<DataInspector value={value} searchable searchQuery="needle" />)
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('No matches'),
  )
  expect(screen.getByRole('button', { name: 'Next result' })).toBeDisabled()
})
