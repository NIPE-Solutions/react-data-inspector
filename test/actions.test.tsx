import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, expect } from 'vitest'
import { DataInspector } from '../src'
it('does not offer copy value for an unevaluated getter', () => {
  render(
    <DataInspector
      value={{
        get secret() {
          throw Error('must not execute')
        },
      }}
    />,
  )
  fireEvent.click(screen.getByText('Getter'))
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
  expect(
    screen.queryByRole('button', { name: 'Copy value' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy path' })).toBeInTheDocument()
})
it('provides selectable text if clipboard access fails', async () => {
  render(<DataInspector value="hello" />)
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
  fireEvent.click(screen.getByRole('button', { name: 'Copy value' }))
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Copy value' })).toHaveValue(
      'hello',
    ),
  )
})
it('reports failed custom action predicates instead of silently omitting them', () => {
  render(
    <DataInspector
      value={1}
      actions={[
        {
          id: 'bad',
          label: 'Bad action',
          when: () => {
            throw Error('predicate')
          },
          onAction: () => {},
        },
      ]}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Node actions' }))
  expect(screen.getByText('Action unavailable')).toBeInTheDocument()
})
