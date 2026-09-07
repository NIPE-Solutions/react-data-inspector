import { useEffect, useRef, useState } from 'react'
import { DataInspector } from '../../src'
import { Code } from '../site/Chrome'
import { graph } from './ExistingDemos'
const applicationData = {
  undefined,
  bigint: 9007199254740993n,
  symbol: Symbol('request'),
  date: new Date('2026-09-07T09:00:00Z'),
  map: new Map([['status', 'ready']]),
  set: new Set(['admin']),
  error: new Error('Request timed out'),
  url: new URL('https://example.com/api'),
  typedArray: new Uint8Array([12, 42, 255]),
  identity: graph,
}
export function JsonContrast() {
  return (
    <section className="section" id="beyond-json">
      <div className="section-intro">
        <h2>
          JSON is a format.
          <br />
          Your application state isn’t.
        </h2>
        <p>
          A JSON viewer shows serialized data. React Data Inspector understands
          the JavaScript graph.
        </p>
      </div>
      <div className="json-contrast">
        <div className="json-boundary">
          <h3>JSON can represent</h3>
          <Code>
            {
              '{\n  "object": {},\n  "array": [],\n  "string": "hello",\n  "number": 42,\n  "boolean": true,\n  "null": null\n}'
            }
          </Code>
          <div className="format-end">
            <span>End of the JSON format</span>
            <p>No Map. No Set. No object identity.</p>
          </div>
        </div>
        <div>
          <h3>Your application can contain</h3>
          <DataInspector
            value={applicationData}
            theme="light"
            aria-label="Beyond JSON inspector"
          />
          <p className="annotation">
            Values retain their types. References retain their meaning. Expand{' '}
            <code>identity</code> to follow the graph.
          </p>
        </div>
      </div>
    </section>
  )
}
export function SafeInspection() {
  const counters = useRef({ getters: 0, functions: 0, subscriptions: 0 })
  const [round, setRound] = useState(0)
  const [reported, setReported] = useState(counters.current)
  const [value] = useState(() => {
    const pending = Promise.resolve('ready')
    const then = pending.then.bind(pending)
    Object.defineProperty(pending, 'then', {
      value: (...args: Parameters<typeof then>) => {
        counters.current.subscriptions++
        return then(...args)
      },
    })
    return {
      get token() {
        counters.current.getters++
        return 'secret'
      },
      callback() {
        counters.current.functions++
      },
      pending,
      weakMap: new WeakMap(),
      weakSet: new WeakSet(),
    }
  })
  useEffect(() => {
    setReported({ ...counters.current })
  }, [round])
  return (
    <section className="section" id="safe-inspection">
      <div className="section-intro">
        <h2>
          Looking at data
          <br />
          shouldn’t run it.
        </h2>
        <p>
          Accessors are represented by their descriptors. Functions stay
          functions. Promises and weak collections stay opaque.
        </p>
      </div>
      <div className="split-proof">
        <div>
          <Code>{`const value = {\n  get token() {\n    dangerousSideEffect()\n    return 'secret'\n  },\n  callback() {},\n  pending: Promise.resolve('ready'),\n  weakMap: new WeakMap(),\n  weakSet: new WeakSet(),\n}`}</Code>
          <p className="annotation">
            This demonstration counts getter calls, callback calls and
            subscriptions to the inspected Promise.
          </p>
        </div>
        <div>
          <DataInspector
            value={value}
            key={round}
            theme="light"
            searchable
            aria-label="Safe inspection experiment"
          />
          <div className="inspection-counters" aria-live="polite">
            <span>
              Getter calls <strong>{reported.getters}</strong>
            </span>
            <span>
              Function calls <strong>{reported.functions}</strong>
            </span>
            <span>
              Promise subscriptions <strong>{reported.subscriptions}</strong>
            </span>
          </div>
          <button className="text-button" onClick={() => setRound(round + 1)}>
            Inspect again
          </button>
        </div>
      </div>
      <p className="section-link">
        This is descriptor-safe inspection, not a sandbox. Proxy traps and
        custom renderers can execute application code.{' '}
        <a href="/concepts/safe-inspection">Exact inspection semantics</a>
      </p>
    </section>
  )
}
export function LargeData() {
  const [values] = useState(() => Array.from({ length: 500000 }, (_, i) => i))
  return (
    <section className="section large-proof" id="large-data">
      <div className="section-intro">
        <h2>
          500,000 values.
          <br />
          Still usable.
        </h2>
        <p>
          This is a real half-million-item array. Open a range, then a smaller
          range. The inspector discovers the values you ask to see.
        </p>
      </div>
      <div className="split-proof">
        <div>
          <DataInspector
            value={values}
            searchable
            theme="light"
            aria-label="Half million values"
          />
          <p className="annotation">
            Default grouping: 50 first-level ranges, then groups of 100 values.
            Search is capped at 100,000 visited rows; partial results are
            labelled.
          </p>
        </div>
        <div className="work-model">
          <h3>Less visible data. Less work.</h3>
          <dl>
            <dt>Collapsed</dt>
            <dd>Descendants are not walked just to paint a row.</dd>
            <dt>Grouped</dt>
            <dd>Hierarchical ranges bound the size of each branch.</dd>
            <dt>Windowed</dt>
            <dd>
              Above 200 model rows, the client mounts a viewport and overscan,
              retaining focused ancestry.
            </dd>
            <dt>Budgeted</dt>
            <dd>
              Search yields between tasks and discloses incomplete results.
            </dd>
          </dl>
          <a href="/performance">Measurements and methodology</a>
          <a href="/playground?section=performance&size=500000">
            Measure on your device
          </a>
        </div>
      </div>
    </section>
  )
}
