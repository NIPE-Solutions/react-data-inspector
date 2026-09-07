import { createElement } from 'react'
import { defineInspectorType } from '../../src'
import { Money } from '../../examples/customization'
export class LazyRecords {
  reads = 0
  constructor(readonly count: number) {}
}
export const lazyType = defineInspectorType<LazyRecords>({
  id: 'lazy-records',
  matches: (value): value is LazyRecords => value instanceof LazyRecords,
  summary: (value) => `Records(${value.count})`,
  children: (value) => ({
    count: value.count,
    getPage(offset, limit) {
      value.reads += limit
      return Array.from({ length: limit }, (_, i) => ({
        key: String(offset + i),
        value: { id: offset + i, status: 'ready' },
      }))
    },
  }),
})
const Float16 = (
  globalThis as typeof globalThis & {
    Float16Array?: new (values: number[]) => ArrayBufferView
  }
).Float16Array
export const scenarios = {
  graph: {
    title: 'Circular & shared references',
    note: 'copyOfUser points to the same instance as user. self points to an ancestor. Follow either reference with a click or Enter.',
    create() {
      const user = {
        id: 42,
        name: 'Nicholas',
        createdAt: new Date('2026-09-07'),
      }
      const value: Record<string, unknown> = {
        user,
        copyOfUser: user,
        roles: new Set(['admin', 'editor']),
        cache: new Map([['status', 'ready']]),
      }
      value.self = value
      return value
    },
  },
  primitives: {
    title: 'Every primitive',
    note: 'Includes precision-sensitive numbers, negative zero, non-finite values, bigint and symbols. These are JavaScript values, not JSON literals.',
    create: () => ({
      string: 'Hello, inspector',
      number: 1.2345678901234567,
      boolean: true,
      null: null,
      undefined: undefined,
      bigint: 9007199254740993n,
      symbol: Symbol('request'),
      NaN: NaN,
      Infinity: Infinity,
      negativeInfinity: -Infinity,
      negativeZero: -0,
    }),
  },
  objects: {
    title: 'Objects, arrays & symbol keys',
    note: 'Own enumerable properties retain JavaScript order. Sparse array holes differ from undefined. Symbol keys have no JSON Pointer.',
    create: () => ({
      object: { 2: 'two', 1: 'one', z: true, a: false },
      sparse: [1, , undefined, 4],
      [Symbol('private-label')]: 'symbol value',
      empty: Object.create(null) as object,
    }),
  },
  core: {
    title: 'Date, RegExp, URL & Error',
    note: 'Expand the error to inspect its cause, stack and custom properties. Invalid dates are rendered without throwing.',
    create: () => ({
      date: new Date('2026-09-07T09:00:00Z'),
      invalidDate: new Date(NaN),
      expression: /documents/gi,
      url: new URL('https://nipesolutions.com/?page=2'),
      error: Object.assign(
        new TypeError('Document normalization failed', {
          cause: new Error('Missing identifier'),
        }),
        { jobId: 'job-42', retryable: true },
      ),
    }),
  },
  collections: {
    title: 'Map & Set',
    note: 'Map keys can be objects. Entry addresses are explicitly distinct from object properties. The alpha inspects the first 10,000 collection entries.',
    create() {
      const key = { tenant: 42 }
      return {
        map: new Map<unknown, unknown>([
          [key, { status: 'ready' }],
          ['answer', 42],
          [Symbol('token'), undefined],
        ]),
        set: new Set<unknown>(['editor', key, 42]),
        key,
      }
    },
  },
  binary: {
    title: 'Binary & typed arrays',
    note: 'Typed-array variants, ArrayBuffer and DataView. Float16Array is included where the browser supports it. Larger buffers are grouped; byte addresses are not JSON Pointers.',
    create: () => ({
      Int8Array: new Int8Array([-128, 0, 127]),
      Uint8Array: new Uint8Array([0, 128, 255]),
      Uint8ClampedArray: new Uint8ClampedArray([0, 300]),
      Int16Array: new Int16Array([-32768, 42]),
      Uint16Array: new Uint16Array([65535]),
      Int32Array: new Int32Array([-2147483648]),
      Uint32Array: new Uint32Array([4294967295]),
      Float16Array: Float16
        ? new Float16([Math.PI])
        : 'Not available in this browser',
      Float32Array: new Float32Array([Math.PI]),
      Float64Array: new Float64Array([Math.PI, NaN, Infinity]),
      BigInt64Array: new BigInt64Array([-42n]),
      BigUint64Array: new BigUint64Array([42n]),
      buffer: new ArrayBuffer(16),
      view: new DataView(new Uint8Array([0, 16, 255]).buffer),
    }),
  },
  opaque: {
    title: 'Functions, promises & weak collections',
    note: 'Functions are never called and promises are never awaited. WeakMap/WeakSet contents are not enumerable. React elements are summarized without exposing internal fields.',
    create: () => ({
      callback: function onDocument() {
        throw new Error('Do not execute')
      },
      promise: Promise.resolve('not awaited'),
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
      element: createElement('button', null, 'Save'),
    }),
  },
  safety: {
    title: 'Getters & throwing proxies',
    note: 'The getter throws if invoked. The proxy rejects key enumeration. Both remain inspectable without breaking their siblings.',
    create: () => ({
      get secret() {
        throw new Error('Getter must not run')
      },
      proxy: new Proxy(
        {},
        {
          ownKeys() {
            throw new Error('Enumeration blocked')
          },
        },
      ),
      sibling: 'Still visible',
    }),
  },
  strings: {
    title: 'Long & multiline strings',
    note: 'Long strings are truncated. Select a string and open Node actions to inspect a bounded full preview.',
    create: () => ({
      multiline: 'Request started\nDocument fetched\nNormalization complete',
      long: 'A document paragraph. '.repeat(10000),
      escaped: '<script>alert("text only")</script>',
    }),
  },
  domain: {
    title: 'Custom Money type',
    note: 'The Money registry entry supplies a summary and expandable fields. The tree renderer, copy actions and navigation remain unchanged.',
    create: () => ({
      price: new Money(12.99, 'EUR'),
      customer: { id: 42, name: 'Nicholas' },
      paid: true,
    }),
  },
  lazy: {
    title: 'Lazy custom children',
    note: '100,000 records are generated in requested pages. Collapsed children are not recursively generated. Searching intentionally discovers more pages. This is in-memory lazy inspection, not remote fetching.',
    create: () => new LazyRecords(100000),
  },
  dom: {
    title: 'DOM node',
    note: 'A detached HTML element is summarized as an opaque DOM type. It is never mounted into the page or traversed as an ordinary object.',
    create() {
      return { element: document.createElement('div') }
    },
  },
  wide: {
    title: 'Wide object',
    note: '100,000 own properties retain enumeration order and are grouped. Discovering own keys is synchronous; grouping limits rows, not the cost of ownKeys.',
    create: () =>
      Object.fromEntries(
        Array.from({ length: 100000 }, (_, i) => [`field${i}`, i]),
      ),
  },
  manyReferences: {
    title: 'Repeated and cyclic records',
    note: '10,000 rows share 100 records. Each record points to itself. Shared-reference markers avoid duplicating the same subtrees.',
    create() {
      const records = Array.from({ length: 100 }, (_, id) => {
        const record: Record<string, unknown> = { id }
        record.self = record
        return record
      })
      return Array.from({ length: 10000 }, (_, i) => records[i % 100])
    },
  },
  deep: {
    title: 'Deep object',
    note: '200 nested levels. Initial expansion is shallow; the configured depth limit prevents unbounded navigation.',
    create() {
      let value: unknown = { answer: 'deep target' }
      for (let i = 0; i < 200; i++) value = { child: value }
      return value
    },
  },
} as const
export type ScenarioId = keyof typeof scenarios
