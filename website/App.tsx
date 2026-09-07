import { useState } from 'react'
import { DataInspector } from '../src'
import {
  ControlledExample,
  customizationValue,
  moneyType,
  PlusToggle,
} from '../examples/customization'
import { guide } from './content'
const shared = {
  id: 42,
  name: 'Nicholas',
  createdAt: new Date('2026-09-07T09:00:00Z'),
}
const graph: Record<string, unknown> = {
  user: shared,
  copyOfUser: shared,
  roles: new Set(['admin', 'editor']),
  cache: new Map([['status', 'ready']]),
}
graph.self = graph
const scenarios: Record<string, unknown> = {
  'Object graph': graph,
  'API response': {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: {
      data: [
        {
          id: 1,
          title: 'Source document',
          publishedAt: new Date('2026-09-01'),
        },
        { id: 2, title: 'Normalized entity', confidence: 0.98 },
      ],
      cursor: null,
    },
  },
  'Error details': Object.assign(
    new TypeError('Source normalization failed', {
      cause: new Error('Missing entity identifier'),
    }),
    { jobId: 'job_42', retryable: true },
  ),
  '500,000 items': Array.from({ length: 500000 }, (_, i) => i),
  'JavaScript values': {
    missing: undefined,
    large: 9007199254740993n,
    token: Symbol('request'),
    pattern: /source/gi,
    notNumber: NaN,
    negativeZero: -0,
    url: new URL('https://nipesolutions.com'),
    bytes: new Uint8Array([0, 16, 32, 128, 255]),
    view: new DataView(new ArrayBuffer(8)),
    weak: new WeakMap(),
    pending: Promise.resolve('opaque'),
    callback: function onEvent() {},
  },
}
function Code({ children }: { children: string }) {
  return (
    <pre>
      <code>{children}</code>
    </pre>
  )
}
export function App() {
  const [demo, setDemo] = useState('Object graph'),
    [mode, setMode] = useState('Default'),
    [action, setAction] = useState(''),
    [input, setInput] = useState('{"name":"Nicholas","active":true}'),
    [json, setJson] = useState<unknown>({ name: 'Nicholas', active: true }),
    [error, setError] = useState(''),
    [docFilter, setDocFilter] = useState('')
  const modes = [
    'Default',
    'Dark',
    'Compact',
    'Unstyled',
    'Custom type',
    'Custom actions',
    'Toggle',
  ]
  const modeCode =
    mode === 'Custom type'
      ? '<DataInspector value={data} types={[moneyType]} />'
      : mode === 'Custom actions'
        ? '<DataInspector value={data} actions={[openEntityAction]} />'
        : mode === 'Toggle'
          ? '<DataInspector value={data} components={{ Toggle: PlusToggle }} />'
          : mode === 'Unstyled'
            ? '<DataInspector value={data} unstyled className="design-system" />'
            : mode === 'Dark'
              ? '<DataInspector value={data} theme="dark" />'
              : mode === 'Compact'
                ? '<DataInspector value={data} density="compact" />'
                : '<DataInspector value={data} />'
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <a className="brand" href="/">
          <img
            className="brand-mark"
            src="/logo.svg"
            width="32"
            height="32"
            alt=""
          />
          <span>React Data Inspector</span>
        </a>
        <nav aria-label="Main">
          <a href="/playground">Playground</a>
          <a href="#customize">Customization</a>
          <a href="#docs">Documentation</a>
          <a href="https://github.com/NIPE-Solutions/react-data-inspector">
            GitHub ↗
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <div className="project-name">
              <img src="/logo.svg" width="24" height="24" alt="" />
              React Data Inspector <span className="version">Alpha</span>
            </div>
            <h1>
              Inspect the object
              <br />
              you actually have.
            </h1>
            <p>
              Real JavaScript data is more than JSON. Explore its values, follow
              its references, and make the inspector part of your application.
            </p>
            <div className="hero-links">
              <a className="primary" href="#installation">
                Get started
              </a>
              <a href="#playground">Explore the data ↓</a>
            </div>
            <Code>
              {
                "import { DataInspector } from\n  '@nipe-solutions/react-data-inspector'\n\n<DataInspector value={data} />"
              }
            </Code>
            <p className="hero-note">
              React 18 / 19 · TypeScript · No runtime dependencies
            </p>
          </div>
          <div className="hero-demo">
            <div className="demo-caption">
              <span>application-state.ts</span>
              <span>Live inspection</span>
            </div>
            <DataInspector
              value={graph}
              defaultExpandedDepth={2}
              theme="light"
              aria-label="Hero object graph"
            />
            <div className="graph-key">
              <span>↩ Circular reference</span>
              <span>↗ Shared identity</span>
              <span>Own values, intact</span>
            </div>
          </div>
        </section>
        <div className="principles">
          <p>
            <strong>Graph-aware.</strong> Cycles and shared objects have
            different meanings.
          </p>
          <p>
            <strong>Application-owned.</strong> Your data stays yours.
            Inspection never mutates it.
          </p>
          <p>
            <strong>CSS-first.</strong> Change the appearance without rebuilding
            the tree.
          </p>
        </div>
        <section id="playground" className="section">
          <div className="section-intro">
            <h2>
              A value is worth
              <br />a thousand screenshots.
            </h2>
            <p>
              Open a branch. Follow a reference. Search inside a collapsed
              value. These are actual JavaScript objects.
            </p>
          </div>
          <div className="playground">
            <div className="toolbar">
              <label htmlFor="scenario">Inspect</label>
              <select
                id="scenario"
                value={demo}
                onChange={(e) => setDemo(e.currentTarget.value)}
              >
                {Object.keys(scenarios).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span>
                {demo === '500,000 items'
                  ? 'Grouped on demand'
                  : 'Keyboard navigation enabled'}
              </span>
            </div>
            <DataInspector
              key={demo}
              value={scenarios[demo]}
              searchable
              theme="light"
              aria-label="Playground inspector"
            />
          </div>
        </section>
        <section id="customize" className="section customization">
          <div className="section-intro">
            <h2>
              Make it yours
              <br />
              without rebuilding it.
            </h2>
            <p>
              Start with the default. Change only what you need. Styling should
              not require render props; domain behavior should not require a
              fork.
            </p>
          </div>
          <div
            className="mode-tabs"
            role="group"
            aria-label="Customization examples"
          >
            {modes.map((name) => (
              <button
                key={name}
                aria-pressed={mode === name}
                onClick={() => {
                  setMode(name)
                  setAction('')
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="custom-demo">
            <DataInspector
              key={mode}
              value={customizationValue}
              theme={mode === 'Dark' ? 'dark' : 'light'}
              density={mode === 'Compact' ? 'compact' : 'comfortable'}
              unstyled={mode === 'Unstyled'}
              className={
                mode === 'Unstyled'
                  ? 'design-system'
                  : mode === 'Default'
                    ? 'brand-colors'
                    : ''
              }
              types={mode === 'Custom type' ? [moneyType] : []}
              components={mode === 'Toggle' ? { Toggle: PlusToggle } : {}}
              actions={
                mode === 'Custom actions'
                  ? [
                      {
                        id: 'open',
                        label: 'Open in application',
                        when: (node) => node.label === 'customer',
                        onAction: () =>
                          setAction(
                            'Customer 42 opened in the application details panel.',
                          ),
                      },
                    ]
                  : []
              }
              aria-label="Customization inspector"
            />
            <div className="code-panel">
              <span>
                {mode === 'Unstyled'
                  ? 'Your design system. Our behavior.'
                  : 'The change is this small.'}
              </span>
              <Code>{modeCode}</Code>
              {mode === 'Default' && (
                <Code>
                  {
                    '.brand-colors {\n  --rdi-background: #f7fbf9;\n  --rdi-string-color: #206246;\n  --rdi-focus-ring: #1d664c;\n}'
                  }
                </Code>
              )}
              {mode === 'Custom actions' && (
                <p>Select customer, then open Node actions.</p>
              )}
              <output>{action}</output>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="section-intro">
            <h2>
              State stays
              <br />
              with your application.
            </h2>
            <p>
              Control expansion, keep selection in your own state, and use the
              selected path anywhere.
            </p>
          </div>
          <ControlledExample />
        </section>
        <section className="section json-section">
          <div>
            <h2>Try your own JSON.</h2>
            <p>
              Paste JSON here. Use the predefined examples above for values JSON
              cannot represent.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                try {
                  setJson(JSON.parse(input))
                  setError('')
                } catch {
                  setError('Invalid JSON. Check quotes, commas and brackets.')
                }
              }}
            >
              <label htmlFor="json">JSON input</label>
              <textarea
                id="json"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                spellCheck={false}
              />
              <button className="primary" type="submit">
                Inspect JSON
              </button>
              <span role="alert">{error}</span>
            </form>
          </div>
          <DataInspector
            value={json}
            searchable
            theme="light"
            aria-label="JSON input inspector"
          />
        </section>
        <section id="docs" className="documentation">
          <aside>
            <h2>Documentation</h2>
            <input
              type="search"
              aria-label="Filter documentation"
              placeholder="Find a topic…"
              value={docFilter}
              onChange={(e) => setDocFilter(e.currentTarget.value)}
            />
            <nav aria-label="Documentation">
              {guide
                .filter((g) =>
                  g.title.toLowerCase().includes(docFilter.toLowerCase()),
                )
                .map((g) => (
                  <a key={g.id} href={`#${g.id}`}>
                    {g.title}
                  </a>
                ))}
            </nav>
          </aside>
          <div>
            {guide.map((g) => (
              <article id={g.id} key={g.id}>
                <h2>{g.title}</h2>
                <p>{g.text}</p>
                {'code' in g && <Code>{g.code}</Code>}
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <a href="https://opensource.nipesolutions.com">
          Part of NIPE Open Source
        </a>
        <p>A focused primitive. Independently installable. MIT licensed.</p>
        <a href="#main">Back to top ↑</a>
      </footer>
    </>
  )
}
