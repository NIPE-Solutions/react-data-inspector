import { Header, Footer } from '../site/Chrome'
import { useState, type CSSProperties } from 'react'
import { DataInspector, type DataPath, formatPath } from '../../src'
import { moneyType, PlusToggle } from '../../examples/customization'
import customSource from '../../examples/customization.tsx?raw'
import scenarioSource from './scenarios.tsx?raw'
import { scenarios, lazyType, LazyRecords, type ScenarioId } from './scenarios'
import { Live } from './Live'
import { Stress } from './Stress'
import { JsonInput } from './JsonInput'
import { Measurements } from './Measurements'
import { Validation } from './Validation'
import { Source } from './Source'
import './playground.css'
import siteCss from '../style.css?raw'
const designSystemCss = siteCss.slice(
  siteCss.indexOf('.design-system {'),
  siteCss.indexOf('.controlled-example {'),
)
const sections = [
  'scenarios',
  'customization',
  'live',
  'stress',
  'performance',
  'json',
  'validation',
] as const
const titles = [
  'Scenarios',
  'Customization',
  'Live updates',
  'Random updates',
  'Performance',
  'Your JSON',
  'Validation',
]
type Section = (typeof sections)[number]
const appearances = ['default', 'dark', 'brand', 'unstyled'] as const
type Appearance = (typeof appearances)[number]
function initialConfig() {
  const params = new URLSearchParams(location.search)
  const section =
    sections.find((item) => item === params.get('section')) ?? 'scenarios'
  const scenario = Object.keys(scenarios).find(
    (item) => item === params.get('scenario'),
  ) as ScenarioId | undefined
  const appearance =
    appearances.find((item) => item === params.get('appearance')) ?? 'default'
  const size =
    [1000, 10000, 100000, 500000].find(
      (item) => String(item) === params.get('size'),
    ) ?? 10000
  return { section, scenario: scenario ?? 'graph', appearance, size }
}
export function Playground() {
  const [config, setConfig] = useState(initialConfig)
  const [reset, setReset] = useState(0)
  const [share, setShare] = useState('')
  function change(next: Partial<typeof config>) {
    setConfig((previous) => ({ ...previous, ...next }))
    setShare('')
  }
  return (
    <>
      <Header main="lab-main" />
      <main id="lab-main" className="lab-main">
        <div className="lab-heading">
          <div>
            <a href="/">React Data Inspector / Playground</a>
            <h1>Inspect under real conditions.</h1>
            <p>
              Real values. Changing state. Your design. Explore the behavior,
              then take the code.
            </p>
          </div>
          <span className="version">Beta preview</span>
        </div>
        <div className="lab-layout">
          <aside className="lab-nav">
            <nav aria-label="Playground sections">
              {sections.map((section, i) => (
                <button
                  key={section}
                  aria-pressed={config.section === section}
                  onClick={() => change({ section })}
                >
                  {titles[i]}
                </button>
              ))}
            </nav>
            <p>
              All examples run locally in your browser. No data leaves this
              page.
            </p>
            <button
              onClick={() => {
                const url = new URL(location.href)
                url.search = new URLSearchParams(
                  Object.entries(config).map(([key, value]) => [
                    key,
                    String(value),
                  ]),
                ).toString()
                url.hash = ''
                history.replaceState(null, '', url)
                setShare(url.href)
              }}
            >
              Share configuration
            </button>
            {share && (
              <label className="lab-share">
                Share URL
                <input
                  readOnly
                  value={share}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
            )}
            <button
              onClick={() => {
                setConfig({
                  section: 'scenarios',
                  scenario: 'graph',
                  appearance: 'default',
                  size: 10000,
                })
                setReset((r) => r + 1)
                setShare('')
                history.replaceState(null, '', '/playground')
              }}
            >
              Reset playground
            </button>
            <p>
              Shared URLs include the section, scenario, appearance and dataset
              size. They contain no inspected values or live state.
            </p>
          </aside>
          <div className="lab-workspace" key={reset}>
            {config.section === 'live' ? (
              <Live />
            ) : config.section === 'stress' ? (
              <Stress />
            ) : config.section === 'json' ? (
              <JsonInput />
            ) : config.section === 'validation' ? (
              <Validation />
            ) : (
              <Workbench
                key={config.section}
                section={config.section}
                scenario={config.scenario}
                appearance={config.appearance}
                size={config.size}
                change={change}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
function Workbench({
  section,
  scenario,
  appearance,
  size,
  change,
}: {
  section: Section
  scenario: ScenarioId
  appearance: Appearance
  size: number
  change: (
    value: Partial<{
      section: Section
      scenario: ScenarioId
      appearance: Appearance
      size: number
    }>,
  ) => void
}) {
  const chosen = section === 'customization' ? 'domain' : scenario
  const [data, setData] = useState<{ key: string; value: unknown }>(() =>
    makeData(),
  )
  const key = section === 'performance' ? `size-${size}` : chosen
  function makeData() {
    return {
      key: section === 'performance' ? `size-${size}` : chosen,
      value:
        section === 'performance'
          ? Array.from({ length: size }, (_, index) => index)
          : scenarios[chosen].create(),
    }
  }
  if (data.key !== key) setData(makeData())
  const [presentation, setPresentation] = useState<'inspector' | 'classic'>(
    'inspector',
  )
  const [metrics, setMetrics] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [generation, setGeneration] = useState(0)
  const [compact, setCompact] = useState(true)
  const [toggle, setToggle] = useState(false)
  const [virtual, setVirtual] = useState(true)
  const [group, setGroup] = useState(100)
  const [queryMode, setQueryMode] = useState<
    'keys' | 'values' | 'keys-and-values'
  >('keys-and-values')
  const [budget, setBudget] = useState(100000)
  const [depth, setDepth] = useState(100)
  const [background, setBackground] = useState('#f7fbf9')
  const [syntax, setSyntax] = useState('#206246')
  const [focusColor, setFocusColor] = useState('#1d664c')
  const [numberColor, setNumberColor] = useState('#92500b')
  const [booleanColor, setBooleanColor] = useState('#794b91')
  const [fontSize, setFontSize] = useState(13)
  const [rowHeight, setRowHeight] = useState(28)
  const [indent, setIndent] = useState(18)
  const [font, setFont] = useState('ui-monospace, monospace')
  const [selected, setSelected] = useState<DataPath | null>(null)
  const [action, setAction] = useState('')
  const custom = section === 'customization'
  const tokens = {
    '--rdi-background': background,
    '--rdi-string-color': syntax,
    '--rdi-number-color': numberColor,
    '--rdi-boolean-color': booleanColor,
    '--rdi-focus-ring': focusColor,
    '--rdi-font-size': `${fontSize}px`,
    '--rdi-row-height': `${rowHeight}px`,
    '--rdi-indent': `${indent}px`,
    '--rdi-font-family': font,
  }
  const css = `.my-inspector {\n${Object.entries(tokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}`
  const style = appearance === 'brand' ? (tokens as CSSProperties) : undefined
  return (
    <>
      <div className="lab-intro">
        <h2>
          {section === 'performance'
            ? 'Large values, bounded work.'
            : custom
              ? 'Change only what you need.'
              : scenarios[chosen].title}
        </h2>
        <p>
          {section === 'performance'
            ? 'Create a known-size array, expand its ranges, then compare mounted rows and interaction measurements. Dataset creation is synchronous and separate from inspector rendering. Search is bounded and can return partial results.'
            : scenarios[chosen].note}
        </p>
      </div>
      <div className="lab-controls">
        <label>
          Presentation
          <select
            value={presentation}
            onChange={(e) =>
              setPresentation(e.target.value as 'inspector' | 'classic')
            }
          >
            <option value="inspector">Inspector</option>
            <option value="classic">Classic</option>
          </select>
        </label>
        {section === 'scenarios' && (
          <label>
            Scenario
            <select
              value={scenario}
              onChange={(e) => {
                change({ scenario: e.target.value as ScenarioId })
                setSelected(null)
              }}
            >
              {Object.entries(scenarios).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {section === 'performance' && (
          <label>
            Dataset size
            <select
              value={size}
              onChange={(e) => change({ size: Number(e.target.value) })}
            >
              {[1000, 10000, 100000, 500000].map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString('en-US')} items
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Appearance
          <select
            value={appearance}
            onChange={(e) =>
              change({ appearance: e.target.value as Appearance })
            }
          >
            <option value="default">Default light</option>
            <option value="dark">Dark</option>
            <option value="brand">Brand colors</option>
            <option value="unstyled">Unstyled design system</option>
          </select>
        </label>
        <label>
          Search scope
          <select
            value={queryMode}
            onChange={(e) => setQueryMode(e.target.value as typeof queryMode)}
          >
            <option value="keys-and-values">Keys and values</option>
            <option value="keys">Keys</option>
            <option value="values">Values</option>
          </select>
        </label>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={compact}
            onChange={(e) => setCompact(e.target.checked)}
          />
          Compact
        </label>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={toggle}
            onChange={(e) => setToggle(e.target.checked)}
          />
          Custom toggle
        </label>
      </div>
      {appearance === 'brand' && (
        <div className="lab-controls">
          <label>
            Background
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
          </label>
          <label>
            String color
            <input
              type="color"
              value={syntax}
              onChange={(e) => setSyntax(e.target.value)}
            />
          </label>
          <label>
            Number color
            <input
              type="color"
              value={numberColor}
              onChange={(e) => setNumberColor(e.target.value)}
            />
          </label>
          <label>
            Boolean color
            <input
              type="color"
              value={booleanColor}
              onChange={(e) => setBooleanColor(e.target.value)}
            />
          </label>
          <label>
            Focus color
            <input
              type="color"
              value={focusColor}
              onChange={(e) => setFocusColor(e.target.value)}
            />
          </label>
          <label>
            Font family
            <select value={font} onChange={(e) => setFont(e.target.value)}>
              <option value="ui-monospace, monospace">Monospace</option>
              <option value="system-ui, sans-serif">System sans</option>
            </select>
          </label>
          <label>
            Font size
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[12, 13, 14, 16].map((n) => (
                <option key={n} value={n}>
                  {n} px
                </option>
              ))}
            </select>
          </label>
          <label>
            Row height
            <select
              value={rowHeight}
              onChange={(e) => setRowHeight(Number(e.target.value))}
            >
              {[28, 32, 36, 40].map((n) => (
                <option key={n} value={n}>
                  {n} px
                </option>
              ))}
            </select>
          </label>
          <label>
            Indentation
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
            >
              {[12, 18, 24, 28].map((n) => (
                <option key={n} value={n}>
                  {n} px
                </option>
              ))}
            </select>
          </label>
          <Source code={css} title="Copy CSS variables" />
        </div>
      )}
      <div className="lab-controls">
        <label>
          Range size
          <select
            value={group}
            onChange={(e) => setGroup(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </label>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={virtual}
            onChange={(e) => setVirtual(e.target.checked)}
          />
          Automatic virtualization
        </label>
        <label>
          Search node budget
          <select
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          >
            <option value={1000}>1,000</option>
            <option value={10000}>10,000</option>
            <option value={100000}>100,000</option>
          </select>
        </label>
        <label>
          Depth limit
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </label>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={metrics}
            onChange={(e) => setMetrics(e.target.checked)}
          />
          Enable measurements
        </label>
        <button
          onClick={() => {
            setData(makeData())
            setGeneration((g) => g + 1)
          }}
        >
          Replace value
        </button>
        <button onClick={() => setMounted(!mounted)}>
          {mounted ? 'Unmount inspector' : 'Mount inspector'}
        </button>
      </div>
      <div className="lab-caption">
        <span>
          {section === 'performance'
            ? `${size.toLocaleString('en-US')} array items`
            : scenarios[chosen].title}
        </span>
        <span>Replacement {generation}</span>
      </div>
      <Measurements
        enabled={metrics}
        {...(data.value instanceof LazyRecords
          ? { lazyReads: () => (data.value as LazyRecords).reads }
          : {})}
      >
        {mounted ? (
          <DataInspector
            presentation={presentation}
            key={key}
            value={data.value}
            searchable
            searchOptions={{ scope: queryMode, maxNodes: budget }}
            inspectionOptions={{ maxDepth: depth }}
            theme={appearance === 'dark' ? 'dark' : 'light'}
            density={compact ? 'compact' : 'comfortable'}
            unstyled={appearance === 'unstyled'}
            className={
              appearance === 'unstyled' ? 'design-system' : 'my-inspector'
            }
            {...(style ? { style } : {})}
            types={[moneyType, lazyType]}
            components={toggle ? { Toggle: PlusToggle } : {}}
            virtualization={virtual ? 'auto' : false}
            arrayGrouping={{ threshold: 1000, size: group }}
            selectedPath={selected}
            onSelectedPathChange={setSelected}
            aria-label="Scenario inspector"
            actions={
              custom
                ? [
                    {
                      id: 'open-application',
                      label: 'Open in application',
                      when: (node) => node.label === 'customer',
                      onAction: (node) =>
                        setAction(
                          `Opened customer at ${formatPath(node.path)} in the application.`,
                        ),
                    },
                  ]
                : []
            }
          />
        ) : (
          <p className="lab-empty">
            Inspector unmounted. The application still owns the dataset; use
            Replace value to discard it.
          </p>
        )}
      </Measurements>
      {custom && (
        <aside className="lab-details">
          <h3>Application details</h3>
          <p>
            {selected === null
              ? 'Select customer, then use F2 or Node actions to choose Open in application. Default copy actions remain available.'
              : `Selected path: ${formatPath(selected)}`}
          </p>
          <output>{action}</output>
        </aside>
      )}
      {appearance === 'unstyled' && (
        <Source code={designSystemCss} title="Design-system CSS" />
      )}
      <Source
        code={`import { DataInspector } from '@nipe-solutions/react-data-inspector'\nimport '@nipe-solutions/react-data-inspector/styles.css'\n\nexport function Example({ value }: { value: unknown }) {\n  return <DataInspector value={value} presentation="${presentation}" searchable theme="${appearance === 'dark' ? 'dark' : 'light'}"\n    density="${compact ? 'compact' : 'comfortable'}"\n    searchOptions={{ scope: '${queryMode}', maxNodes: ${budget} }}\n    inspectionOptions={{ maxDepth: ${depth} }}\n    arrayGrouping={{ threshold: 1000, size: ${group} }}\n    virtualization={${virtual ? "'auto'" : 'false'}}${appearance === 'unstyled' ? '\n    unstyled className="design-system"' : appearance === 'brand' ? '\n    className="my-inspector"' : ''} />\n}`}
        title="Basic configuration source"
      />
      <Source
        code={scenarioSource
          .replaceAll("'../../src'", "'@nipe-solutions/react-data-inspector'")
          .replaceAll("'../../examples/customization'", "'./customization'")}
        title="Scenario and lazy-type definitions"
      />
      <Source
        code={customSource.replaceAll(
          "'../src'",
          "'@nipe-solutions/react-data-inspector'",
        )}
        title="Money, toggle and controlled-state source"
      />
    </>
  )
}
