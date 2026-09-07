import { it, expect } from 'vitest'
import { createModel, buildVisible } from '../src/model/graph'
import { toJsonPointer } from '../src/model/path'
it('inspects binary bytes without pretending they are ArrayBuffer properties', () => {
  for (const value of [new ArrayBuffer(2), new DataView(new ArrayBuffer(2))]) {
    const rows = buildVisible(createModel(value), () => true)
    expect(rows).toHaveLength(3)
    expect(rows[1]?.summary).toBe('0')
    expect(toJsonPointer(rows[1]!.path)).toBeUndefined()
  }
})
it('supports typed array variants and special built-ins', () => {
  const value = {
    u8: new Uint8Array([255]),
    big: new BigInt64Array([3n]),
    date: new Date(NaN),
    re: /a/gi,
    url: new URL('https://example.com/'),
    error: new Error('failure', { cause: 42 }),
    weak: new WeakMap(),
    promise: Promise.resolve(2),
  }
  const rows = buildVisible(createModel(value), () => true)
  expect(rows.map((n) => n.summary)).toEqual(
    expect.arrayContaining([
      '255',
      '3n',
      'Invalid Date',
      '/a/gi',
      'https://example.com/',
      'Error: failure',
      '42',
      'WeakMap',
      'Promise',
    ]),
  )
})
it('distinguishes symbol keys with identical descriptions', () => {
  const a = Symbol('same'),
    b = Symbol('same')
  const rows = buildVisible(createModel({ [a]: 1, [b]: 2 }), () => true)
  expect(rows[1]?.id).not.toBe(rows[2]?.id)
  expect(rows[1]?.path).toEqual([{ kind: 'symbol', key: a }])
})
it('honors a zero depth limit at the root', () => {
  const rows = buildVisible(createModel({ x: 1 }, { maxDepth: 0 }), () => true)
  expect(rows).toHaveLength(1)
  expect(rows[0]?.limited).toBe(true)
})
