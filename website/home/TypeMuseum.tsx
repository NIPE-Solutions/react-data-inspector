import { useEffect, useState } from 'react'
import { DataInspector } from '../../src'
const exhibits = {
  Primitives: {
    undefined,
    bigint: 12345678901234567890n,
    Symbol: Symbol('request'),
    NaN,
    Infinity,
    negativeZero: -0,
  },
  Structured: {
    Date: new Date('2026-09-07T09:00:00Z'),
    RegExp: /source/gi,
    Error: new TypeError('Missing identifier', {
      cause: new Error('Empty source'),
    }),
    URL: new URL('https://example.com/api?page=2'),
    Map: new Map<unknown, unknown>([
      ['status', 'ready'],
      [{ id: 42 }, 'object key'],
    ]),
    Set: new Set(['admin', 'editor']),
  },
  Binary: {
    Uint8Array: new Uint8Array([0, 16, 32, 128, 255]),
    Float64Array: new Float64Array([Math.PI, NaN, Infinity]),
    ArrayBuffer: new ArrayBuffer(8),
    DataView: new DataView(new Uint8Array([1, 2, 3, 4]).buffer),
  },
  'Opaque by design': {
    Promise: Promise.resolve('not awaited'),
    WeakMap: new WeakMap(),
    WeakSet: new WeakSet(),
    Function: function onEvent() {},
    ReactElement: <span>Application component</span>,
  },
}
const descriptions = {
  Primitives:
    'Inspected as values, including distinctions JSON loses. Long strings use bounded previews.',
  Structured:
    'Date, RegExp and URL receive concise summaries. Error, Map and Set expand into details with explicit collection paths.',
  Binary:
    'Typed arrays, ArrayBuffer and DataView expose indexed entries. Large binary sources use the same range grouping.',
  'Opaque by design':
    'Functions are summarized. Promises are not awaited; weak collection contents cannot be enumerated. Recognized HTML elements, Text, Document and React elements have limited opaque summaries. Other DOM objects fall back to own-property inspection.',
}
type Group = keyof typeof exhibits
export function TypeMuseum() {
  const [group, setGroup] = useState<Group>('Primitives')
  const [dom, setDom] = useState<Element | null>(null)
  useEffect(() => {
    const element = document.createElement('div')
    element.id = 'example'
    setDom(element)
  }, [])
  return (
    <section className="section museum" id="types">
      <div className="section-intro">
        <h2>
          Real JavaScript,
          <br />
          included.
        </h2>
        <p>
          Inspect a type, not its serialization. This small museum uses the same
          renderer you install in your application.
        </p>
      </div>
      <div className="museum-layout">
        <nav aria-label="Type museum groups">
          {(Object.keys(exhibits) as Group[]).map((name) => (
            <button
              key={name}
              aria-pressed={group === name}
              onClick={() => setGroup(name)}
            >
              {name}
              <span aria-hidden="true">↳</span>
            </button>
          ))}
        </nav>
        <div>
          <div className="museum-label">
            <h3>{group}</h3>
            <span>Live values</span>
          </div>
          <DataInspector
            key={group}
            value={
              group === 'Opaque by design'
                ? { ...exhibits[group], ...(dom ? { DOMNode: dom } : {}) }
                : exhibits[group]
            }
            theme="light"
            aria-label="Type museum inspector"
          />
          <p className="annotation">{descriptions[group]}</p>
          <a href="/reference/types">Full type compatibility matrix</a>
        </div>
      </div>
    </section>
  )
}
