import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { DataInspector } from '../src/index'

function active() {
  return document.getElementById(
    screen.getByRole('tree').getAttribute('aria-activedescendant')!,
  )!
}
it('clicking reference text follows and selects the original', () => {
  const shared = { id: 42 }
  render(<DataInspector value={{ original: shared, copy: shared }} />)
  fireEvent.click(screen.getByText('↗ same reference as $.original'))
  expect(active()).toHaveAttribute('aria-label', 'original: Object')
  expect(active()).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tree')).toHaveFocus()
})
it('Enter toggles branches and follows references while Space only selects', () => {
  const value: Record<string, unknown> = { branch: { id: 42 } }
  value.self = value
  render(<DataInspector value={value} />)
  const tree = screen.getByRole('tree')
  fireEvent.keyDown(tree, { key: 'ArrowDown' })
  fireEvent.keyDown(tree, { key: ' ' })
  expect(active()).toHaveAttribute('aria-expanded', 'false')
  fireEvent.keyDown(tree, { key: 'Enter' })
  expect(active()).toHaveAttribute('aria-expanded', 'true')
  fireEvent.keyDown(tree, { key: 'Enter' })
  expect(active()).toHaveAttribute('aria-expanded', 'false')
  fireEvent.keyDown(tree, { key: 'End' })
  fireEvent.keyDown(tree, { key: 'Enter' })
  expect(active()).toHaveAttribute('aria-level', '1')
  expect(active()).toHaveAttribute('aria-selected', 'true')
})
it('search Enter advances and Shift+Enter moves backwards', async () => {
  render(
    <DataInspector
      value={{ first: 'needle', second: 'needle' }}
      searchable
      searchOptions={{ debounce: 0 }}
    />,
  )
  const search = screen.getByRole('searchbox')
  fireEvent.change(search, { target: { value: 'needle' } })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next result' })).toBeEnabled(),
  )
  fireEvent.keyDown(search, { key: 'Enter' })
  expect(active()).toHaveAttribute('aria-label', 'first: "needle"')
  fireEvent.keyDown(search, { key: 'Enter' })
  expect(active()).toHaveAttribute('aria-label', 'second: "needle"')
  fireEvent.keyDown(search, { key: 'Enter', shiftKey: true })
  expect(active()).toHaveAttribute('aria-label', 'first: "needle"')
})
