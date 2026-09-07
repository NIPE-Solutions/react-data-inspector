import { DataInspector } from '../src'
import { Header, Footer, Code, Installation } from './site/Chrome'
import {
  ScenarioDemo,
  CustomizationWorkshop,
  JsonDemo,
  graph,
} from './home/ExistingDemos'
import { JsonContrast, SafeInspection, LargeData } from './home/Proofs'
import { TypeMuseum } from './home/TypeMuseum'
import { Products, Ownership } from './home/Products'
import { KeyboardModel } from './home/Visuals'
import { Comparison } from './home/Comparison'
export function App() {
  return (
    <>
      <Header />
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
        <nav className="chapter-nav" aria-label="Product story">
          <a href="#beyond-json">Beyond JSON</a>
          <a href="#playground">Object identity</a>
          <a href="#safe-inspection">Safe inspection</a>
          <a href="#types">Type museum</a>
          <a href="#large-data">Large data</a>
          <a href="#customize">Customization</a>
        </nav>
        <JsonContrast />
        <ScenarioDemo />
        <SafeInspection />
        <TypeMuseum />
        <LargeData />
        <CustomizationWorkshop />
        <Products />
        <Ownership />
        <section className="section" id="keyboard">
          <div className="section-intro">
            <h2>
              Navigate the data.
              <br />
              Keep your keyboard.
            </h2>
            <p>
              One tree navigation tab stop. Separate focus and selection.
              Explicit ownership for nested and windowed tree items.
            </p>
          </div>
          <div className="split-proof">
            <KeyboardModel />
            <div>
              <h3>Behavior you can try here.</h3>
              <p>
                Tab to any inspector. Arrow keys move focus without selecting.
                Space selects; Enter opens a branch or follows a reference. F2
                opens actions for the focused node.
              </p>
              <p>
                Search controls and actions have their own normal tab stops.
                Windowed trees retain active descendants and their ancestry.
              </p>
              <p className="evidence-note">
                Keyboard interactions and axe checks run in Chromium, Firefox
                and WebKit. Manual VoiceOver and NVDA audits are still
                outstanding; screen-reader compatibility is not yet claimed.
              </p>
              <a href="/accessibility">
                Accessibility evidence and audit status
              </a>
            </div>
          </div>
        </section>
        <Comparison />
        <details className="json-disclosure">
          <summary>Have JSON ready? Inspect it here.</summary>
          <JsonDemo />
        </details>
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
            Alpha. Inspection core available; editing and manual accessibility
            audits remain ahead.{' '}
            <a href="/limitations">Read the limitations.</a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}
