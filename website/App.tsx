import { DataInspector } from '../src'
import { Header, Footer, Code, Installation } from './site/Chrome'
import {
  ScenarioDemo,
  CustomizationWorkshop,
  graph,
} from './home/ExistingDemos'
import { JsonContrast, SafeInspection, LargeData } from './home/Proofs'
import { Products, Ownership } from './home/Products'
export function App() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Inspect the object
              <br />
              you actually have.
            </h1>
            <p>
              A React inspector for real JavaScript object graphs. Explore
              values, follow shared references and cycles, and keep your
              application in control.
            </p>
            <div className="hero-links">
              <a className="primary" href="/docs/installation">
                Install
              </a>
              <a href="/playground">Open playground</a>
              <a href="/docs">Read docs</a>
            </div>
            <Code>{`import { DataInspector } from\n  '@nipe-solutions/react-data-inspector'\nimport '@nipe-solutions/react-data-inspector/styles.css'\n\n<DataInspector value={data} />`}</Code>
            <Installation compact />
            <p className="hero-note">
              React 18 / 19 · TypeScript · No library runtime dependencies
            </p>
          </div>
          <div className="hero-demo">
            <div className="demo-caption">
              <span>application-state.ts</span>
              <span>Live inspection · try a reference</span>
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
        <dl className="principles" aria-label="Design principles">
          <div>
            <dt>Graph-aware</dt>
            <dd>Values and identity, together.</dd>
          </div>
          <div>
            <dt>Application-owned</dt>
            <dd>Your data. Your state.</dd>
          </div>
          <div>
            <dt>CSS-first</dt>
            <dd>Style one layer at a time.</dd>
          </div>
        </dl>
        <JsonContrast />
        <ScenarioDemo />
        <SafeInspection />
        <LargeData />
        <CustomizationWorkshop />
        <Ownership />
        <Products />
        <aside className="keyboard-proof" aria-label="Accessibility evidence">
          <h2>Keep your keyboard.</h2>
          <p>
            Arrow keys navigate. Enter activates. Space selects. F2 opens
            actions.
          </p>
          <p>
            Keyboard and axe checks run in Chromium, Firefox and WebKit. Manual
            screen-reader audits remain outstanding.
          </p>
          <a href="/accessibility">Keyboard model and audit status →</a>
        </aside>
        <section className="section community">
          <h2>
            Like where this is going?
            <br />
            Help it grow.
          </h2>
          <div>
            <p>
              React Data Inspector is free, open source, and we're only getting
              started. Give it a star and help more developers find it.
            </p>
            <a
              className="star-link"
              href="https://github.com/NIPE-Solutions/react-data-inspector"
            >
              ★ Star React Data Inspector on GitHub ↗
            </a>
            <p className="annotation">
              Have a real-world edge case?{' '}
              <a href="https://github.com/NIPE-Solutions/react-data-inspector/issues">
                Bring it to the issue tracker.
              </a>
            </p>
          </div>
        </section>
        <section className="section onward" id="docs">
          <h2>
            A focused primitive.
            <br />A clear place to start.
          </h2>
          <p>
            Read the contracts, run the examples, and inspect the values your
            application actually owns.
          </p>
          <div className="hero-links">
            <a className="primary" href="/docs/installation">
              Install
            </a>
            <a href="/playground">Playground</a>
            <a href="/docs">Documentation</a>
            <a href="https://github.com/NIPE-Solutions/react-data-inspector">
              GitHub ↗
            </a>
          </div>
          <p className="annotation">
            Beta. Inspection core available; editing and manual accessibility
            audits remain ahead.{' '}
            <a href="/limitations">Read the limitations.</a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
