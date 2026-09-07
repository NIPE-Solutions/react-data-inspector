import { describe, it, expect } from 'vitest'
import { createModel, buildVisible } from '../src/model/graph'
import {
  formatPath,
  toJsonPointer,
  toJavaScriptPath,
  pathEqual,
} from '../src/model/path'
import { defineInspectorType } from '../src/model/types'
const expanded = () => true

describe('paths', () => {
  it('escapes property keys without conflating numeric keys', () => {
    expect(toJsonPointer(['a/b', '~', 0, ''])).toBe('/a~1b/~0/0/')
    expect(toJavaScriptPath(['user', 'a.b', 0])).toBe('user["a.b"][0]')
    expect(toJsonPointer([])).toBe('')
    expect(pathEqual(['0'], [0])).toBe(false)
  })
  it('does not misrepresent collection or symbol addresses as JSON paths', () => {
    expect(toJsonPointer([{ kind: 'map-value', index: 0 }])).toBeUndefined()
    expect(
      toJsonPointer([{ kind: 'symbol', key: Symbol('x') }]),
    ).toBeUndefined()
    expect(formatPath([{ kind: 'set-value', index: 2 }])).toContain('Set')
    expect(
      pathEqual(
        [{ kind: 'symbol', key: Symbol('x') }],
        [{ kind: 'symbol', key: Symbol('x') }],
      ),
    ).toBe(false)
  })
})
describe('safe lazy graph inspection', () => {
  it('discloses collection traversal limits and preserves already reachable entries', () => {
    for (const value of [
      new Map(Array.from({ length: 20001 }, (_, i) => [i, i])),
      new Set(Array.from({ length: 20001 }, (_, i) => i)),
    ]) {
      const root = createModel(value).root
      let last = root.children().at(-1)!
      while (last.synthetic) last = last.children().at(-1)!
      expect(last.type).toBe('limit')
      expect(last.limited).toBe(true)
      expect(last.summary).toContain('Collection traversal limit')
      let first = root.children()[0]!
      while (first.synthetic) first = first.children()[0]!
      expect(first.summary).toBe('0')
    }
  })
  it('recognizes built-in subclasses without invoking overridden methods', () => {
    class DerivedMap extends Map<string, number> {
      override entries(): MapIterator<[string, number]> {
        throw Error('unsafe')
      }
    }
    class DerivedSet extends Set<number> {}
    class DerivedDate extends Date {}
    class DerivedView extends DataView<ArrayBuffer> {
      constructor(buffer: ArrayBuffer) {
        super(buffer)
      }
    }
    expect(
      createModel(new DerivedMap([['key', 42]]))
        .root.children()
        .map((n) => n.summary),
    ).toEqual(['"key"', '42'])
    expect(createModel(new DerivedSet([42])).root.children()[0]?.summary).toBe(
      '42',
    )
    expect(createModel(new DerivedDate(0)).root.type).toBe('date')
    expect(createModel(new DerivedView(new ArrayBuffer(1))).root.type).toBe(
      'dataview',
    )
  })
  it('validates a claimed built-in brand and localizes revoked proxies', () => {
    const fake = Object.create({ constructor: function Map() {} }) as object
    const revoked = Proxy.revocable({}, {})
    revoked.revoke()
    const rows = buildVisible(
      createModel({ fake, revoked: revoked.proxy, healthy: 42 }),
      expanded,
    )
    expect(rows.filter((n) => n.type === 'inspection-error')).toHaveLength(2)
    expect(rows.find((n) => n.label === 'healthy')?.summary).toBe('42')
  })
  it('discloses indexed-only array inspection without enumerating properties', () => {
    let enumerations = 0
    const value = new Proxy(Object.assign([1], { extra: 2 }), {
      ownKeys(target) {
        enumerations++
        return Reflect.ownKeys(target)
      },
    })
    expect(createModel(value).root.summary).toContain('indexed items only')
    expect(enumerations).toBe(0)
  })
  it('defers custom child source construction until expansion and localizes its errors', () => {
    let calls = 0
    const custom = { special: true }
    const definition = defineInspectorType({
      id: 'lazy',
      matches: (v: unknown): v is typeof custom => v === custom,
      summary: () => 'Custom',
      children() {
        calls++
        throw Error('bad source')
      },
    })
    const root = createModel(
      { custom, healthy: 42 },
      { types: [definition] },
    ).root
    const children = root.children()
    expect(calls).toBe(0)
    expect(children[0]?.children()[0]?.type).toBe('inspection-error')
    expect(calls).toBe(1)
    expect(children[1]?.summary).toBe('42')
  })
  it('distinguishes an ancestor cycle from a shared object', () => {
    const shared = { id: 42 }
    const root: Record<string, unknown> = { left: shared, right: shared }
    root.self = root
    const rows = buildVisible(createModel(root), expanded)
    expect(rows.find((n) => n.label === 'right')?.reference?.kind).toBe(
      'shared',
    )
    expect(rows.find((n) => n.label === 'right')?.reference?.path).toEqual([
      'left',
    ])
    expect(rows.find((n) => n.label === 'self')?.reference?.kind).toBe(
      'circular',
    )
    expect(rows.length).toBe(5)
  })
  it('never invokes accessors, coercion hooks, or functions', () => {
    let calls = 0
    const value = {
      get dangerous() {
        calls++
        return 3
      },
      fn() {
        calls++
      },
    }
    Object.defineProperty(value, Symbol.toStringTag, {
      get() {
        calls++
        return 'Date'
      },
    })
    const rows = buildVisible(createModel(value), expanded)
    expect(rows.find((n) => n.label === 'dangerous')?.type).toBe('accessor')
    expect(calls).toBe(0)
  })
  it('does not enumerate descendants of a collapsed node', () => {
    let calls = 0
    const child = new Proxy(
      {},
      {
        ownKeys() {
          calls++
          return []
        },
      },
    )
    const rows = buildVisible(createModel({ child }), () => false)
    expect(rows).toHaveLength(1)
    expect(calls).toBe(0)
  })
  it('localizes a throwing proxy and keeps siblings', () => {
    const bad = new Proxy(
      {},
      {
        ownKeys() {
          throw Error('blocked')
        },
      },
    )
    const rows = buildVisible(createModel({ bad, good: 42 }), expanded)
    expect(rows.some((n) => n.type === 'inspection-error')).toBe(true)
    expect(rows.find((n) => n.label === 'good')?.summary).toBe('42')
  })
  it('bounds the first expansion of a half-million item array', () => {
    const rows = buildVisible(
      createModel(Array(500000).fill(0)),
      (n) => n.address.length === 0,
    )
    expect(rows.length).toBeLessThanOrEqual(101)
    expect(rows[1]?.type).toBe('range')
  })
  it('keeps range descendants and their reference ownership stable across renders', () => {
    const model = createModel(Array.from({ length: 1001 }, () => ({ x: 1 })))
    const range = model.root.children()[0]!
    const first = range.children()
    expect(range.children()).toBe(first)
    expect(range.children()[0]?.type).toBe('object')
    expect(range.children()[0]?.reference).toBeUndefined()
  })
  it('makes grouping progress even when size exceeds threshold', () => {
    const model = createModel(Array(100).fill(1), {
      arrayGrouping: { threshold: 10, size: 100 },
    })
    let current = model.root
    for (let i = 0; i < 10 && current.expandable; i++)
      current = current.children()[0]!
    expect(current.type).toBe('number')
  })
  it('caps partial leaf ranges at the configured size', () => {
    const model = createModel(Array(10500).fill(1))
    const pending = [...model.root.children()]
    while (pending.length) {
      const range = pending.pop()!
      const children = range.children()
      if (children[0]?.synthetic) pending.push(...children)
      else expect(children.length).toBeLessThanOrEqual(100)
    }
  })
  it('keeps Map key/value relationships and Set addresses honest', () => {
    const rows = buildVisible(
      createModel(new Map([[{ id: 1 }, new Set([2])]])),
      expanded,
    )
    expect(
      rows.some((n) =>
        n.path.some((s) => typeof s === 'object' && s.kind === 'map-key'),
      ),
    ).toBe(true)
    const two = rows.find((n) => n.summary === '2')
    expect(two?.path).toEqual([
      { kind: 'map-value', index: 0 },
      { kind: 'set-value', index: 0 },
    ])
  })
  it('does not mutate frozen inputs and distinguishes holes', () => {
    const input = Object.freeze({
      x: Object.freeze([, undefined, -0, NaN, 123n]),
    })
    const rows = buildVisible(createModel(input), expanded)
    expect(rows.map((n) => n.summary)).toEqual(
      expect.arrayContaining(['<empty>', 'undefined', '-0', 'NaN', '123n']),
    )
  })
  it('terminates deep traversal with a disclosed depth limit', () => {
    let value: unknown = 1
    for (let i = 0; i < 10000; i++) value = { child: value }
    const rows = buildVisible(createModel(value, { maxDepth: 20 }), expanded)
    expect(rows.length).toBeLessThan(30)
    expect(rows.some((n) => n.limited)).toBe(true)
  })
})
