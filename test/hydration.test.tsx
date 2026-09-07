import { StrictMode, act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { it, expect } from 'vitest'
import { DataInspector } from '../src'
it('hydrates identical bounded markup without recoverable errors', async () => {
  const value = { items: Array(500000).fill(1), date: new Date('2026-01-01') }
  const ui = (
    <StrictMode>
      <DataInspector value={value} searchable />
      <DataInspector value={{ a: 1 }} />
    </StrictMode>
  )
  const container = document.createElement('div')
  container.innerHTML = renderToString(ui)
  document.body.append(container)
  const errors: unknown[] = []
  let root: ReturnType<typeof hydrateRoot>
  await act(async () => {
    root = hydrateRoot(container, ui, {
      onRecoverableError: (error) => errors.push(error),
    })
  })
  expect(errors).toEqual([])
  expect(container.querySelectorAll('[role=tree]')).toHaveLength(2)
  await act(async () => root.unmount())
  container.remove()
})
