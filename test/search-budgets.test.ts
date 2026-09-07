import { expect, it } from 'vitest'
import { defineInspectorType } from '../src'
import { createModel } from '../src/model/graph'
import { searchValue } from '../src/model/search'
function fixture() {
  const calls: [number, number][] = []
  const value = { records: true }
  const type = defineInspectorType<typeof value>({
    id: 'records',
    matches: (v): v is typeof value => v === value,
    summary: () => 'records',
    children: () => ({
      count: 1000,
      getPage(offset, limit) {
        calls.push([offset, limit])
        return Array.from({ length: limit }, (_, i) => ({
          key: String(offset + i),
          value: offset + i,
        }))
      },
    }),
  })
  return { value, calls, types: [type] }
}
it.each([{ maxNodes: 1 }, { maxResults: 1 }])(
  'does not discover children after exhausting %o',
  async (options) => {
    const f = fixture()
    const result = await searchValue(f.value, 'records', options, undefined, {
      types: f.types,
    })
    expect(result.scanned).toBe(1)
    expect(result.limited).toBe(true)
    expect(f.calls).toEqual([])
  },
)
it('bounds actual child discovery by the remaining search budget', async () => {
  const f = fixture()
  const result = await searchValue(
    f.value,
    'absent',
    { maxNodes: 10 },
    undefined,
    { types: f.types },
  )
  expect(result.scanned).toBe(10)
  expect(
    f.calls.reduce((sum, [, limit]) => sum + limit, 0),
  ).toBeLessThanOrEqual(9)
  expect(result.limited).toBe(true)
})
it('requests contiguous custom pages and retains cached node identities', () => {
  const f = fixture()
  const model = createModel(f.value, { types: f.types })
  const children = model.root.children()
  expect(children).toHaveLength(1000)
  expect(f.calls.length).toBeLessThanOrEqual(10)
  expect(f.calls.every(([, limit]) => limit <= 100)).toBe(true)
  expect(model.root.children()[42]).toBe(children[42])
})

it('finds a shallower shared value after a depth-limited encounter', async () => {
  const shared = { needle: 'unique-match' }
  const value: unknown[] = Array.from({ length: 250 }, (_, i) => i)
  value[0] = { nested: shared }
  value[200] = shared
  const result = await searchValue(value, 'unique-match', {}, undefined, {
    maxDepth: 2,
  })
  expect(result.matches.map((match) => match.path)).toContainEqual([
    200,
    'needle',
  ])
})
it('does not mark a fully searched exact-budget page as partial', async () => {
  const result = await searchValue({ a: 1 }, 'missing', { maxNodes: 2 })
  expect(result).toEqual({ matches: [], scanned: 2, limited: false })
})

it('revisits a shallower shared subtree when a deeper descendant reached the limit', async () => {
  const shared = { child: { needle: 'unique-match' } }
  const value: unknown[] = Array.from({ length: 250 }, (_, i) => i)
  value[0] = { nested: shared }
  value[200] = shared
  const result = await searchValue(value, 'unique-match', {}, undefined, {
    maxDepth: 3,
  })
  expect(result.matches.map((match) => match.path)).toContainEqual([
    200,
    'child',
    'needle',
  ])
})
