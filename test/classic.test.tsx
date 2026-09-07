import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { DataInspector, defineInspectorType } from '../src'

it('adds classic syntax without changing SSR tree names or data row counts', () => {
  const shared = { name: 'Nicholas' }
  const value: Record<string, unknown> = {
    user: shared,
    copyOfUser: shared,
    list: [1, undefined],
    date: new Date('2026-09-07T09:00:00.000Z'),
    map: new Map([['status', 'ready']]),
    set: new Set(['admin']),
    [Symbol('token')]: 42n,
  }
  value.self = value
  const fragments = (['inspector', 'classic'] as const).map((presentation) => {
    const root = document.createElement('div')
    root.innerHTML = renderToString(
      <DataInspector
        value={value}
        presentation={presentation}
        defaultExpandedDepth={3}
      />,
    )
    return root
  })
  const [inspector, classic] = fragments
  const labels = (root: HTMLElement) =>
    [...root.querySelectorAll('[role=treeitem]')].map((node) =>
      node.getAttribute('aria-label'),
    )
  expect(labels(classic!)).toEqual(labels(inspector!))
  expect(classic!.querySelector('[data-rdi-root]')).toHaveAttribute(
    'data-rdi-presentation',
    'classic',
  )
  expect(classic!.querySelector('[data-rdi-key]')?.textContent).toBe('$')
  expect(classic!.textContent).toContain('"user"')
  expect(classic!.textContent).toContain('Date("2026-09-07T09:00:00.000Z")')
  expect(classic!.textContent).toContain('Map(1)')
  expect(classic!.textContent).toContain('0 · key')
  expect(classic!.textContent).toContain('↗ same reference as $.user')
  expect(classic!.textContent).toContain('↩ circular reference to $')
  expect(
    classic!.querySelectorAll('[data-rdi-delimiter]').length,
  ).toBeGreaterThan(0)
  for (const delimiter of classic!.querySelectorAll('[data-rdi-delimiter]'))
    expect(delimiter).toHaveAttribute('aria-hidden', 'true')
  expect(inspector!.querySelector('[data-rdi-delimiter]')).toBeNull()
})

it('preserves expansion, selection and reference activation when switching presentation', async () => {
  const user = { name: 'Nicholas' },
    value = { user, copy: user }
  const { rerender } = render(<DataInspector value={value} />)
  fireEvent.click(screen.getByRole('button', { name: 'Expand user' }))
  fireEvent.click(screen.getByText('"Nicholas"'))
  rerender(<DataInspector value={value} presentation="classic" />)
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAccessibleName(
    'name: "Nicholas"',
  )
  const tree = screen.getByRole('tree')
  fireEvent.keyDown(tree, { key: 'End' })
  fireEvent.keyDown(tree, { key: 'Enter' })
  await waitFor(() =>
    expect(
      screen.getByRole('treeitem', { selected: true }),
    ).toHaveAccessibleName('user: Object'),
  )
})

it('keeps safe inspection and bounded 500k grouping in classic mode', () => {
  const getter = vi.fn(),
    callback = vi.fn()
  const value = {
    get token() {
      return getter()
    },
    callback,
    huge: Array(500000).fill(1),
  }
  const { container } = render(
    <StrictMode>
      <DataInspector
        value={value}
        presentation="classic"
        defaultExpandedDepth={2}
      />
    </StrictMode>,
  )
  expect(getter).not.toHaveBeenCalled()
  expect(callback).not.toHaveBeenCalled()
  expect(screen.getByText('Getter')).toBeInTheDocument()
  expect(container.querySelectorAll('[data-rdi-node]').length).toBeLessThan(100)
  expect(screen.getAllByRole('treeitem').length).toBeLessThan(100)
})

it('retains custom types, slots, actions and unstyled behavior', () => {
  class Money {
    constructor(readonly amount: number) {}
  }
  const money = defineInspectorType<Money>({
    id: 'money',
    matches: (v): v is Money => v instanceof Money,
    summary: (v) => `EUR ${v.amount.toFixed(2)}`,
    children: (v) => ({
      count: 1,
      getPage: () => [{ key: 'amount', value: v.amount }],
    }),
  })
  const action = vi.fn()
  const { container } = render(
    <DataInspector
      value={{ price: new Money(12.99) }}
      presentation="classic"
      unstyled
      types={[money]}
      components={{
        Toggle: () => <span>+</span>,
        Key: ({ node }) => <em>{node.label}</em>,
      }}
      actions={[{ id: 'open', label: 'Open in application', onAction: action }]}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Expand price' }))
  expect(screen.getByText('EUR 12.99')).toBeInTheDocument()
  expect(screen.getByText('amount')).toBeInTheDocument()
  expect(container.querySelector('[data-rdi-key] em')).toBeInTheDocument()
  expect(container.querySelector('[data-rdi-unstyled]')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('tree'), { key: 'F2' })
  expect(screen.getByRole('button', { name: 'Copy path' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Open in application' }))
  expect(action).toHaveBeenCalledOnce()
})

it('reveals search results in classic mode without punctuation becoming matches', async () => {
  render(
    <DataInspector
      value={{ hidden: { answer: 'needle' } }}
      presentation="classic"
      searchable
    />,
  )
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'needle' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByRole('treeitem', { selected: true })).toHaveAccessibleName(
    'answer: "needle"',
  )
})

it('does not enumerate collapsed custom children or reinterpret customized summaries', () => {
  const read = vi.fn(() => [{ key: 'field', value: 1 }])
  const count = vi.fn(() => 1)
  const value = Object.freeze({ token: true })
  const custom = defineInspectorType<typeof value>({
    id: 'date',
    matches: (candidate): candidate is typeof value => candidate === value,
    summary: () => 'Application date summary',
    children: () => ({
      get count() {
        return count()
      },
      getPage: read,
    }),
  })
  const { rerender } = render(
    <DataInspector
      value={value}
      presentation="classic"
      types={[custom]}
      defaultExpandedDepth={0}
    />,
  )
  expect(screen.getByText('Application date summary')).toBeInTheDocument()
  expect(count).not.toHaveBeenCalled()
  expect(read).not.toHaveBeenCalled()
  rerender(
    <DataInspector
      value={value}
      presentation="classic"
      types={[custom]}
      defaultExpandedDepth={0}
      components={{ Value: ({ node }) => <strong>{node.summary}</strong> }}
    />,
  )
  expect(screen.getByText('Application date summary').tagName).toBe('STRONG')
  fireEvent.keyDown(screen.getByRole('tree'), { key: 'Enter' })
  expect(count).toHaveBeenCalledOnce()
  expect(read).toHaveBeenCalledOnce()
})

it('keeps a nonempty container honest when its children fall beyond the visible row budget', () => {
  // The root plus 9,998 primitives puts the final container at row 10,000.
  // Its child exists but cannot enter the bounded flattened row set.
  const value: unknown[] = Array.from({ length: 9999 }, (_, index) => index)
  value[9998] = { hidden: 'still here' }
  const html = renderToString(
    <DataInspector
      value={value}
      presentation="classic"
      defaultExpandedDepth={2}
      arrayGrouping={{ threshold: 10000 }}
    />,
  )
  // Parse only the last row to keep this correctness check independent of the
  // cost of constructing a complete 10,000-row jsdom document.
  const document = new DOMParser().parseFromString(
    html.slice(html.lastIndexOf('<div', html.lastIndexOf('role="treeitem"'))),
    'text/html',
  )
  expect((html.match(/data-rdi-node=/g) ?? []).length).toBe(10000)
  expect(document.querySelector('[data-rdi-value]')?.textContent).toBe('{ … }')
  expect(html).not.toContain('still here')
})

it('formats a built-in even when an unmatched custom definition uses the same type id', () => {
  const custom = defineInspectorType<string>({
    id: 'date',
    matches: (value): value is string => typeof value === 'string',
    summary: () => 'Domain-specific date',
  })
  const { container } = render(
    <DataInspector
      presentation="classic"
      value={new Date('2026-09-07T09:00:00.000Z')}
      types={[custom]}
    />,
  )
  expect(container.querySelector('[data-rdi-value]')?.textContent).toBe(
    'Date("2026-09-07T09:00:00.000Z")',
  )
})
