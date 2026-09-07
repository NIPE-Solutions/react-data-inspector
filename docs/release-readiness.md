# Release readiness

Classification: **PRIVATE PREVIEW READY**

Assessed 2026-09-07. Version: 0.1.0-alpha.0. Not published to npm or deployed to the intended public hostname.

## Verified

- Descriptor-safe object graphs: cycles, shared references, sparse arrays, symbols, throwing/revoked proxies, subclasses, collection limits, custom source laziness.
- Controlled expansion, independent selection, reference jumps, search reveal across canonical ownership changes, retained collapse state, cancellation and bounded search.
- Primitive and JSON-compatible copying without getter/toJSON execution; lossy subtrees are refused. Clipboard fallback and failed actions are localized.
- React 18.3.1 and 19.2.8 unit/component, SSR and hydration checks. Strict Mode and same-reference parent updates are covered.
- Chromium, Firefox and WebKit interaction/axe tests, including 390px mobile layout, RTL, grouped large arrays, virtualized focus and CSS row-height updates.
- ESM and CJS tarball imports, declarations, CSS export and SSR in a clean consumer fixture. No runtime dependencies beyond React peers.
- Runnable customization cases for CSS-only brand colors, toggle-only replacement, added application actions, Money, unstyled mode, controlled expansion and adjacent selection details.
- Repeatable model, SSR, search, browser interaction and model-lifetime benchmarks with raw output and methodology.

The local harness has 74 unit/component tests and 21 browser cases per engine (63 runs), including search during random updates every 50 ms. Both React 18.3.1 and 19.2.8 passed the full local suites; CI also defines the matrix for both peers. Those local executions are evidence, not a claim that a remote CI run has completed.

The browser runner is pinned to Playwright 1.58.2 to support the WebKit build available on this macOS host. A newer runner failed before opening a page with an unsupported WebKit protocol setting. This is not evidence of current Safari/iOS support; current-browser CI and actual mobile Safari checks remain necessary.

The [playground](playground.md) adds repeatable live application-state simulations and opt-in measurement tools. It is not a completed production integration or manual audit.

## Measurements and limits

See [model results](../benchmarks/results.json), [browser results](../benchmarks/browser-results.json), [memory experiment](../benchmarks/memory-results.json), and [methodology](../benchmarks/README.md).

Opening the 500,000-item array produces 51 first-level model rows with defaults. The 100,000-property object must synchronously enumerate its own keys. Search yields between batches and can return partial results under its limits. Custom sources load at most 100 entries per call: the 1,000-child regression fixture needs 10 calls instead of 1,000. Search stops child discovery at its node/result budget. Visible row and ownership indexes are reused across internal focus and scroll updates, while parent renders still inspect a fresh generation. Browser wall-clock action timings include automation overhead and search debounce; they are not pure React render timings.

The forced-GC experiment observed all 50 discarded model roots collected. It does not establish absence of leaks in mounted React components, browser heaps or application-held callback contexts. No frame-loss or retained-browser-heap claim is made.

## Public-beta blockers

1. Perform and record actual VoiceOver/Safari and NVDA/Firefox or Chrome navigation, selection, search, actions and virtualization audits. Keyboard automation and axe are insufficient.
2. Dogfood through the public API in an application such as source metadata/job payload inspection. No application integration has been performed.
3. Audit mounted-browser retained heaps across repeated input replacement/unmount, and scrolling frame timing on representative hardware.
4. Validate current desktop/mobile Safari and current evergreen browser versions beyond the locally available pinned WebKit.
5. Review the deliberately limited alpha contracts: uniform-height virtualization, first 10,000 Map/Set entries, indexed-only arrays, bounded search/reveal and discovery-scoped reference targets.

## Deferred features

Editing, add/remove proposals, JSON Patch conversion, collection continuation, prototype inspection and specialized binary/DOM views are not implemented. There is no editing prop that implies otherwise. The [API document](api.md#editing-design) records the immutable proposal boundary.

## Naming and publication

The existing private GitHub repository is `NIPE-Solutions/react-data-inspector`, matching this checkout's origin. The npm registry returned 404 for `@nipe-solutions/react-data-inspector` on 2026-09-07. The name follows neighboring NIPE packages; it is not reserved and publication permission has not been proven by a publish attempt.

`react-data-inspector.nipesolutions.com` follows the NIPE docs-host pattern but returned NXDOMAIN at the naming check. The site is runnable locally and builds to `website/dist`; no DNS, hosting assignment, npm publication or remote Git push was performed.
