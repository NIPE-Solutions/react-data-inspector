import { useState } from 'react'
import { DataInspector } from '../../src'
import {
  ControlledExample,
  customizationValue,
  moneyType,
  PlusToggle,
} from '../../examples/customization'
const shared = {
  id: 42,
  name: 'Nicholas',
  createdAt: new Date('2026-09-07T09:00:00Z'),
}
export const graph: Record<string, unknown> = {
  user: shared,
  copyOfUser: shared,
  roles: new Set(['admin', 'editor']),
  cache: new Map([['status', 'ready']]),
  revision: 9007199254740993n,
  optional: undefined,
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
  '500,000 items': null,
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
    <pre tabIndex={0}>
      <code>{children}</code>
    </pre>
  )
}

import { IdentityDiagram, CustomizationLayers } from './Visuals'
export function ScenarioDemo() {
  const [demo, setDemo] = useState('Object graph')
  const [large, setLarge] = useState<number[]>([])
  return (
    <section id="playground" className="section">
      <div className="section-intro">
        <h2>A tree isn’t always a tree.</h2>
        <p>
          Open a branch. Follow a reference. Search inside a collapsed value.
          These are actual JavaScript objects.
        </p>
      </div>
      <IdentityDiagram />
      <div className="playground">
        <div className="toolbar">
          <label htmlFor="scenario">Inspect</label>
          <select
            id="scenario"
            value={demo}
            onChange={(e) => {
              const next = e.currentTarget.value
              if (next === '500,000 items' && !large.length)
                setLarge(Array.from({ length: 500000 }, (_, i) => i))
              setDemo(next)
            }}
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
          value={demo === '500,000 items' ? large : scenarios[demo]}
          searchable
          theme="light"
          aria-label="Playground inspector"
        />
      </div>
    </section>
  )
}
export function CustomizationWorkshop() {
  const [mode, setMode] = useState('Colors only'),
    [action, setAction] = useState('')
  const modes = [
    'Colors only',
    'Dark',
    'Compact',
    'Unstyled',
    'Custom type',
    'Custom actions',
    'Toggle',
    'Controlled selection',
  ]
  const modeCode =
    mode === 'Controlled selection'
      ? '<DataInspector value={data}\n  selectedPath={selected}\n  onSelectedPathChange={setSelected} />'
      : mode === 'Colors only'
        ? '<DataInspector value={data} className="brand-colors" />'
        : mode === 'Custom type'
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
    <section id="customize" className="section customization">
      <div className="section-intro">
        <h2>
          Change one layer.
          <br />
          Keep the rest.
        </h2>
        <p>
          Start with the default. Change only what you need. Styling should not
          require render props; domain behavior should not require a fork.
        </p>
      </div>
      <CustomizationLayers />
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
        {mode === 'Controlled selection' ? (
          <ControlledExample />
        ) : (
          <DataInspector
            key={mode}
            value={customizationValue}
            theme={mode === 'Dark' ? 'dark' : 'light'}
            density={mode === 'Compact' ? 'compact' : 'comfortable'}
            unstyled={mode === 'Unstyled'}
            className={
              mode === 'Unstyled'
                ? 'design-system'
                : mode === 'Colors only'
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
        )}
        <div className="code-panel">
          <span>
            {mode === 'Unstyled'
              ? 'Your design system. Our behavior.'
              : 'The change is this small.'}
          </span>
          <Code>{modeCode}</Code>
          {mode === 'Colors only' && (
            <Code>
              {
                '.brand-colors {\n  --rdi-background: #f7fbf9;\n  --rdi-string-color: #206246;\n  --rdi-number-color: #934b08;\n  --rdi-focus-ring: #1d664c;\n}'
              }
            </Code>
          )}
          {mode === 'Custom actions' && (
            <p>Select customer, then open Node actions.</p>
          )}
          <output>{action}</output>
        </div>
      </div>
      <p className="section-link">
        Simple customization should remain simple. Deep customization should not
        require a fork. <a href="/guides/customization">Explore every layer</a>
      </p>
    </section>
  )
}
export function JsonDemo() {
  const [input, setInput] = useState('{"name":"Nicholas","active":true}'),
    [json, setJson] = useState<unknown>({ name: 'Nicholas', active: true }),
    [error, setError] = useState('')
  return (
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
  )
}
