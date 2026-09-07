import { StrictMode, useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DataInspector, defineInspectorType, type DataPath } from '../src/index'
it('navigates with keyboard while keeping focus distinct from selection', () => {
  render(<DataInspector value={{ user: { name: 'Nick' }, active: true }} />)
  const tree = screen.getByRole('tree')
  tree.focus()
  fireEvent.keyDown(tree, { key: 'ArrowDown' })
  fireEvent.keyDown(tree, { key: 'ArrowRight' })
  expect(screen.getByText('"Nick"')).toBeInTheDocument()
  expect(screen.queryAllByRole('treeitem', { selected: true })).toHaveLength(0)
  fireEvent.keyDown(tree, { key: 'Enter' })
  expect(screen.getAllByRole('treeitem', { selected: true })).toHaveLength(1)
  fireEvent.keyDown(tree, { key: 'ArrowLeft' })
  expect(screen.queryByText('"Nick"')).not.toBeInTheDocument()
})
it('respects a controlled parent refusing expansion', () => {
  let requested: readonly DataPath[] = []
  render(
    <DataInspector
      value={{ secret: 42 }}
      expandedPaths={[]}
      onExpandedPathsChange={(next) => {
        requested = next
      }}
    />,
  )
  const tree = screen.getByRole('tree')
  fireEvent.keyDown(tree, { key: 'ArrowRight' })
  expect(requested).toEqual([[]])
  expect(screen.queryByText('42')).not.toBeInTheDocument()
})
it('preserves expanded paths across new values and same-reference updates', () => {
  const value = { nested: { x: 1 } }
  const { rerender } = render(<DataInspector value={value} />)
  fireEvent.click(screen.getByRole('button', { name: 'Expand nested' }))
  value.nested.x = 2
  rerender(<DataInspector value={value} />)
  expect(screen.getByText('2')).toBeInTheDocument()
  rerender(<DataInspector value={{ nested: { x: 3 }, extra: true }} />)
  expect(screen.getByText('3')).toBeInTheDocument()
})
it('search reveals collapsed ancestors and selects a match', async () => {
  render(<DataInspector value={{ hidden: { answer: 'needle' } }} searchable />)
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'needle' },
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Next result' }))
  expect(screen.getByText('"needle"')).toBeInTheDocument()
  expect(screen.getAllByRole('treeitem', { selected: true })).toHaveLength(1)
})
it('customizes a Money type, one toggle, and an added action', () => {
  class Money {
    constructor(
      readonly amount: number,
      readonly currency: string,
    ) {}
  }
  const money = defineInspectorType<Money>({
    id: 'money',
    matches: (v): v is Money => v instanceof Money,
    summary: (v) => `${v.currency} ${v.amount.toFixed(2)}`,
    children: (v) => ({
      count: 2,
      getPage: (offset, limit) =>
        [
          { key: 'amount', value: v.amount },
          { key: 'currency', value: v.currency },
        ].slice(offset, offset + limit),
    }),
  })
  let opened = false
  render(
    <DataInspector
      value={{ price: new Money(12.99, 'EUR') }}
      types={[money]}
      components={{ Toggle: () => <span>+</span> }}
      actions={[
        {
          id: 'open',
          label: 'Open in application',
          onAction: () => {
            opened = true
          },
        },
      ]}
    />,
  )
  expect(screen.getByText('EUR 12.99')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Expand price' }))
  expect(screen.getByText('"EUR"')).toBeInTheDocument()
  fireEvent.click(screen.getByText('EUR 12.99'))
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
  expect(screen.getByRole('button', { name: 'Copy path' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Open in application' }))
  expect(opened).toBe(true)
})
it('supports unstyled controlled selection for an adjacent panel', () => {
  function App() {
    const [path, setPath] = useState<DataPath | null>(null)
    return (
      <>
        <DataInspector
          unstyled
          value={{ x: 1 }}
          selectedPath={path}
          onSelectedPathChange={setPath}
        />
        <output>{JSON.stringify(path)}</output>
      </>
    )
  }
  const { container } = render(<App />)
  fireEvent.click(screen.getByText('1'))
  expect(screen.getByText('["x"]')).toBeInTheDocument()
  expect(container.querySelector('[data-rdi-unstyled]')).toBeInTheDocument()
})
it('renders server markup with distinct IDs and survives Strict Mode', () => {
  const html = renderToString(
    <>
      <DataInspector value={{ x: 1 }} />
      <DataInspector value={{ x: 1 }} />
    </>,
  )
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
  expect(new Set(ids).size).toBe(ids.length)
  render(
    <StrictMode>
      <DataInspector value={{ x: 1 }} />
    </StrictMode>,
  )
  expect(screen.getByRole('tree')).toBeInTheDocument()
})
it('localizes descriptor summaries and focuses an initially controlled selection', () => {
  render(
    <DataInspector
      value={{
        get x() {
          return 1
        },
        y: 2,
      }}
      selectedPath={['y']}
      messages={{
        summary: (node) =>
          node.type === 'accessor' ? 'Zugriffsfunktion' : node.summary,
      }}
    />,
  )
  expect(screen.getByText('Zugriffsfunktion')).toBeInTheDocument()
  const tree = screen.getByRole('tree')
  const active = tree.getAttribute('aria-activedescendant')
  expect(document.getElementById(active!)).toHaveTextContent('y')
})
