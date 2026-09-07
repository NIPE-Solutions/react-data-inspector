import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { DataInspector, type DataPath } from '../src/index'
import { createModel } from '../src/model/graph'
import { resolvePath } from '../src/model/resolve'

it('reveals a search descendant through the visible generation’s canonical owner', async () => {
  const shared = { answer: 'needle' }
  const selected = vi.fn()
  render(
    <DataInspector
      value={{ left: { shared }, right: { shared } }}
      searchable
      searchOptions={{ debounce: 0 }}
      onSelectedPathChange={selected}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Expand right' }))
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'needle' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  await waitFor(() => expect(screen.getByText('"needle"')).toBeInTheDocument())
  expect(selected).toHaveBeenLastCalledWith(
    ['right', 'shared', 'answer'],
    expect.objectContaining({ value: 'needle' }),
  )
  expect(screen.getAllByRole('treeitem', { selected: true })).toHaveLength(1)
})
it('jumping to a hidden original expands its ancestors', () => {
  const shared = { answer: 'needle' }
  render(<DataInspector value={{ left: { shared }, right: { shared } }} />)
  fireEvent.click(screen.getByRole('button', { name: 'Expand right' }))
  fireEvent.click(screen.getByRole('button', { name: 'Collapse right' }))
  fireEvent.click(screen.getByRole('button', { name: 'Expand left' }))
  fireEvent.click(
    screen
      .getByText('↗ same reference as $.right.shared')
      .closest('[data-rdi-node]')!,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
  fireEvent.click(screen.getByRole('button', { name: 'Jump to original' }))
  expect(
    screen.getByRole('button', { name: 'Collapse right' }),
  ).toBeInTheDocument()
  const active = document.getElementById(
    screen.getByRole('tree').getAttribute('aria-activedescendant')!,
  )!
  expect(active.getAttribute('aria-label')).toBe('shared: Object')
})
it('waits for controlled expansion acceptance before reporting a revealed selection', async () => {
  const value = { hidden: { answer: 'needle' } }
  const select = vi.fn()
  let requested: readonly DataPath[] = []
  const props = {
    value,
    searchable: true,
    searchQuery: 'needle',
    searchOptions: { debounce: 0 },
    onSelectedPathChange: select,
    onExpandedPathsChange: (next: readonly DataPath[]) => {
      requested = next
    },
  }
  const { rerender } = render(<DataInspector {...props} expandedPaths={[[]]} />)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(select).not.toHaveBeenCalled()
  expect(screen.queryByText('"needle"')).not.toBeInTheDocument()
  expect(screen.queryByText('1 of 1 matches')).not.toBeInTheDocument()
  rerender(<DataInspector {...props} expandedPaths={requested} />)
  await waitFor(() => expect(select).toHaveBeenCalledTimes(1))
  expect(screen.getByText('"needle"')).toBeInTheDocument()
})
it.each([true, false])(
  'rechecks a pending reveal against updated data (target survives: %s)',
  async (survives) => {
    const selected = vi.fn()
    let requested: readonly DataPath[] = []
    const props = {
      searchable: true,
      searchQuery: 'needle',
      searchOptions: { debounce: 0 },
      onSelectedPathChange: selected,
      onExpandedPathsChange: (next: readonly DataPath[]) => {
        requested = next
      },
    }
    const { rerender } = render(
      <DataInspector
        {...props}
        value={{ hidden: { answer: 'needle' }, tick: 0 }}
        expandedPaths={[[]]}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
    expect(selected).not.toHaveBeenCalled()
    rerender(
      <DataInspector
        {...props}
        value={{ hidden: survives ? { answer: 'needle' } : {}, tick: 1 }}
        expandedPaths={requested}
      />,
    )
    if (survives) {
      expect(selected).toHaveBeenCalledExactlyOnceWith(
        ['hidden', 'answer'],
        expect.objectContaining({ value: 'needle' }),
      )
      expect(
        screen.getByRole('treeitem', { selected: true }),
      ).toHaveTextContent('needle')
    } else {
      expect(selected).not.toHaveBeenCalled()
      expect(
        screen.getByText(
          'This result cannot be revealed within the inspection limits.',
        ),
      ).toBeInTheDocument()
    }
  },
)
it('retains a hidden descendant’s explicit collapse override', () => {
  render(
    <DataInspector
      value={{ a: { b: { x: 1 } }, c: 2 }}
      defaultExpandedDepth={3}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Collapse b' }))
  fireEvent.click(screen.getByRole('button', { name: 'Collapse a' }))
  fireEvent.click(screen.getByRole('button', { name: 'Expand a' }))
  expect(screen.queryByText('1')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Expand b' })).toBeInTheDocument()
})
it('resolves data paths through synthetic ranges and reports bounded lookup limits', () => {
  const model = createModel(
    Array.from({ length: 1001 }, (_, i) => ({ answer: i })),
  )
  const resolved = resolvePath(model, [1000, 'answer'])
  expect(resolved.ok).toBe(true)
  if (resolved.ok) {
    expect(resolved.node.value).toBe(1000)
    expect(
      resolved.expand.some((p) =>
        p.some((s) => typeof s === 'object' && s.kind === 'range'),
      ),
    ).toBe(true)
  }
  const wide = createModel(
    Object.fromEntries(Array.from({ length: 1001 }, (_, i) => ['key' + i, i])),
  )
  expect(resolvePath(wide, ['key1000'], 10)).toMatchObject({
    ok: false,
    reason: 'limit',
  })
})
it('starts previous-result navigation at the last match', async () => {
  render(
    <DataInspector
      value={{ first: 'needle', second: 'needle', third: 'needle' }}
      searchable
      searchOptions={{ debounce: 0 }}
    />,
  )
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'needle' },
  })
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Previous result' }),
    ).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Previous result' }))
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    'third: "needle"',
  )
})
// This correctness fixture constructs 10,000 jsdom rows before client windowing.
// Its runtime on shared CI hardware is not a browser performance budget.
it('reports unavailable rather than selecting a result past the visible-row budget', async () => {
  const many = Array.from({ length: 1000 }, () =>
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['k' + i, i])),
  )
  const selected = vi.fn()
  render(
    <DataInspector
      value={{ many, target: 'needle' }}
      searchable
      defaultExpandedDepth={3}
      searchOptions={{ debounce: 0 }}
      onSelectedPathChange={selected}
    />,
  )
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'needle' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(selected).not.toHaveBeenCalled()
  expect(
    screen.getByText(
      'This result cannot be revealed within the inspection limits.',
    ),
  ).toBeInTheDocument()
}, 15000)
