# Release readiness

Distribution: **stable 1.0**. Manual integration and device qualification remain open.

Assessed 2026-09-30. Version: 1.0.0. Stable publication is performed by the protected [Release workflow](https://github.com/NIPE-Solutions/react-data-inspector/actions/workflows/release.yml); check the [npm versions](https://www.npmjs.com/package/@nipe-solutions/react-data-inspector?activeTab=versions) and workflow result for registry status. See [deployment](deployment.md).

## Verified

- Descriptor-safe object graphs: cycles, shared references, sparse arrays, symbols, throwing/revoked proxies, subclasses, collection limits, and lazy custom sources.
- Controlled expansion, independent selection, reference jumps, search reveal across canonical ownership changes, retained collapse state, cancellation, and bounded search.
- Primitive and JSON-compatible copying without getter or `toJSON` execution; lossy subtrees are refused. Clipboard fallback and failed actions are localized.
- React 18.3.1 and 19.3.0 unit/component, SSR, and hydration checks. Strict Mode and same-reference parent updates are covered.
- Chromium, Firefox, and WebKit interaction/axe tests, including 390px mobile layout, RTL, grouped large arrays, virtualized focus, and CSS row-height updates.
- ESM and CommonJS tarball imports, declarations, CSS export, and SSR in clean consumer fixtures. React and React DOM are the only runtime peers.
- Runnable customization cases for CSS-only brand colors, toggle-only replacement, added application actions, Money, unstyled mode, controlled expansion, and adjacent selection details.
- Repeatable model, SSR, search, browser interaction, and model-lifetime benchmarks with raw output and methodology.

The harness covers unit/component behavior and browser interactions, including search during random updates every 50 ms, documentation without JavaScript, website hydration, classic presentation, legal routes, documentation content search, and mobile layouts. CI runs the full checks for React 18.3.1 and 19.3.0; use the commit-specific workflow result and test summaries as current verification evidence. The website build verifies every indexed route and compiles the public documentation examples. Counts are reported by the tools rather than fixed here as the suite grows.

The browser runner is pinned to Playwright 1.58.2 to support the WebKit build available on this macOS host. This is not evidence of current Safari or iOS support; current-browser CI and physical-device checks remain necessary.

The [playground](playground.md) provides repeatable live application-state simulations and opt-in measurement tools. It is not a completed production integration or human accessibility audit.

## Measurements and stable boundaries

See [model results](../benchmarks/results.json), [browser results](../benchmarks/browser-results.json), [memory experiment](../benchmarks/memory-results.json), and [methodology](../benchmarks/README.md).

Opening the 500,000-item array produces 51 first-level model rows with defaults. The 100,000-property object must synchronously enumerate its own keys. Search yields between batches and can return partial results under its limits. Custom sources load at most 100 entries per call: the 1,000-child regression fixture needs 10 calls instead of 1,000. Search stops child discovery at its node/result budget. Visible row and ownership indexes are reused across internal focus and scroll updates, while parent renders still inspect a fresh generation. Browser wall-clock action timings include automation overhead and search debounce; they are not pure React render timings.

The forced-GC experiment observed all 50 discarded model roots collected. It does not establish absence of leaks in mounted React components, browser heaps, or application-held callback contexts. No frame-loss or retained-browser-heap claim is made.

The stable 1.0 contract deliberately includes uniform measured rows for virtualization, indexed array inspection, the first 10,000 Map/Set entries, bounded search and reveal, and reference targets scoped to the current discovery generation. These are supported limits rather than promises of unbounded inspection.

## Remaining adopter qualification

1. Perform and record VoiceOver/Safari and NVDA/Firefox or Chrome navigation, selection, search, actions, and virtualization audits. Keyboard automation and axe are insufficient.
2. Dogfood the public API in a representative application such as source metadata or job-payload inspection.
3. Audit mounted-browser retained heaps across repeated input replacement/unmount and scrolling frame timing on representative hardware.
4. Validate current desktop and mobile Safari plus the evergreen browser versions required by the adopting application.

These checks depend on a real application, human assistive-technology use, or physical devices and therefore are not claimed by this release.

## Deferred features

Editing, add/remove proposals, JSON Patch conversion, collection continuation, prototype inspection, and specialized binary/DOM views are not implemented. There is no editing prop that implies otherwise. See the current [public API](api.md) and [limitations](https://react-data-inspector.nipesolutions.com/limitations).

## Naming and publication

The public GitHub repository and npm package are `NIPE-Solutions/react-data-inspector` and `@nipe-solutions/react-data-inspector`. Version 1.0.0 is published with the `latest` dist-tag through trusted publishing. Stable API status does not imply completion of the adopter-specific audits above.

GitHub Actions verifies React 18.3.1 and 19.3.0, builds and tests the package, publishes the artifact associated with a matching GitHub Release, and deploys the website only after npm publication succeeds. See the [release process](releasing.md).
