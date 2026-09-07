import { useState } from 'react'
import { DataInspector } from '../../src'
import {
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
            onChange={(e) => setDemo(e.currentTarget.value)}
          >
            {Object.keys(scenarios).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span>Keyboard navigation enabled</span>
        </div>
        <DataInspector
          key={demo}
          value={scenarios[demo]}
          searchable
          theme="light"
          aria-label="Playground inspector"
        />
      </div>
      <p className="section-link">
        <a href="/playground?section=json">
          Want to try your own data? Open the full Playground →
        </a>
      </p>
    </section>
  )
}
export function CustomizationWorkshop() {
  const [presentation, setPresentation] = useState<'inspector' | 'classic'>(
    'inspector',
  )
  const [mode, setMode] = useState('Colors only'),
    [action, setAction] = useState('')
  const modeCode =
    mode === 'Colors only'
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
          Adjust the appearance or connect application behavior. Each example
          changes only the relevant public API.
        </p>
      </div>
      <CustomizationLayers />
      <div className="workshop-controls">
        <div className="mode-tabs" role="group" aria-label="Presentation">
          <span>Presentation</span>
          {(['inspector', 'classic'] as const).map((name) => (
            <button
              key={name}
              aria-pressed={presentation === name}
              onClick={() => setPresentation(name)}
            >
              {name === 'classic' ? 'Classic' : 'Inspector'}
            </button>
          ))}
        </div>
        {[
          {
            label: 'Appearance',
            choices: ['Colors only', 'Dark', 'Compact', 'Unstyled'],
          },
          {
            label: 'Extensions',
            choices: ['Custom type', 'Custom actions', 'Toggle'],
          },
        ].map(({ label, choices }) => (
          <div
            key={label}
            className="mode-tabs"
            role="group"
            aria-label={label}
          >
            <span>{label}</span>
            {choices.map((name) => (
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
        ))}
      </div>
      <div className="custom-demo">
        {
          <DataInspector
            key={mode}
            presentation={presentation}
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
        }
        <div className="code-panel">
          <span>
            {mode === 'Unstyled'
              ? 'Your design system. Our behavior.'
              : 'The change is this small.'}
          </span>
          <Code>
            {presentation === 'classic'
              ? modeCode.replace(
                  'value={data}',
                  'value={data} presentation="classic"',
                )
              : modeCode}
          </Code>
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
