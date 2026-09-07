import { it, expect } from 'vitest'
import { searchValue } from '../src/model/search'
import { serializeValue } from '../src/model/serialize'
it('searches collapsed data and never evaluates getters', async () => {
  let calls = 0
  const value = {
    nested: { needle: 'target' },
    get unsafe() {
      calls++
      return 'target'
    },
  }
  const result = await searchValue(value, 'target')
  expect(result.matches.map((n) => n.path)).toEqual([['nested', 'needle']])
  expect(calls).toBe(0)
})
it('search terminates cycles and reports a budget', async () => {
  const value: Record<string, unknown> = {}
  value.self = value
  value.a = Array(1000).fill('yes')
  const result = await searchValue(value, 'yes', { maxNodes: 20 })
  expect(result.limited).toBe(true)
  expect(result.scanned).toBeLessThanOrEqual(20)
})
it('cancels an obsolete search without delivering stale results', async () => {
  const controller = new AbortController()
  controller.abort()
  await expect(
    searchValue({ a: 1 }, '1', {}, controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' })
})
it('cancels a search after its first scheduled batch', async () => {
  const controller = new AbortController()
  const pending = searchValue(
    Array(20000).fill('entry'),
    'missing',
    {},
    controller.signal,
  )
  controller.abort()
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
})
it('reports collection limits when a distant value cannot be searched', async () => {
  const value = new Set(
    Array.from({ length: 10001 }, (_, i) => (i === 10000 ? 'unreachable' : i)),
  )
  const result = await searchValue(value, 'unreachable')
  expect(result.matches).toHaveLength(0)
  expect(result.limited).toBe(true)
})
it('serializes JSON data while refusing lossy graph and special values', () => {
  expect(serializeValue({ x: [1, true, null] })).toEqual({
    ok: true,
    text: '{\n  "x": [\n    1,\n    true,\n    null\n  ]\n}',
  })
  const shared = { id: 1 }
  expect(serializeValue({ a: shared, b: shared }).ok).toBe(false)
  expect(serializeValue({ date: new Date() }).ok).toBe(false)
  expect(serializeValue([, 1]).ok).toBe(false)
  expect(serializeValue({ n: NaN }).ok).toBe(false)
})
it('does not call toJSON or getter hooks during serialization', () => {
  let calls = 0
  const value = {
    get x() {
      calls++
      return 1
    },
    toJSON() {
      calls++
      return {}
    },
  }
  expect(serializeValue(value).ok).toBe(false)
  expect(calls).toBe(0)
})
it('does not execute inherited array toJSON hooks on sanitized copies', () => {
  let calls = 0
  const original = Object.getOwnPropertyDescriptor(Array.prototype, 'toJSON')
  let result: ReturnType<typeof serializeValue>
  try {
    Object.defineProperty(Array.prototype, 'toJSON', {
      configurable: true,
      get() {
        calls++
        return () => 'changed'
      },
    })
    result = serializeValue({ a: [1] })
  } finally {
    if (original) Object.defineProperty(Array.prototype, 'toJSON', original)
    else Reflect.deleteProperty(Array.prototype, 'toJSON')
  }
  expect(calls).toBe(0)
  expect(result!).toEqual({ ok: true, text: '{\n  "a": [\n    1\n  ]\n}' })
})
it('bounds descriptor processing before queuing a wide object', () => {
  let reads = 0
  const target = Object.fromEntries(
    Array.from({ length: 20000 }, (_, i) => ['k' + i, i]),
  )
  const value = new Proxy(target, {
    getOwnPropertyDescriptor(t, key) {
      reads++
      return Reflect.getOwnPropertyDescriptor(t, key)
    },
  })
  expect(serializeValue(value).ok).toBe(false)
  expect(reads).toBeLessThanOrEqual(10000)
})
it('discloses when string scan limits can hide a match', async () => {
  const result = await searchValue({ x: 'abcTARGET' }, 'target', {
    stringLimit: 3,
  })
  expect(result.matches).toHaveLength(0)
  expect(result.limited).toBe(true)
})
