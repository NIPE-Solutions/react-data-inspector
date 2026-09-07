# Playground

Run `npm run dev` and open `/playground`, or use the [hosted playground](https://react-data-inspector.nipesolutions.com/playground). The production website build prerenders the route as HTML; Vercel serves it through clean URLs. GitHub Actions deploys verified website changes automatically, separately from npm publication. See [deployment](deployment.md).

## Scenarios

Predefined values cover primitives, ordinary/sparse/symbol-keyed objects, Date/RegExp/URL/Error, Map/Set, standard typed arrays and binary buffers, functions/promises/weak collections, React elements and a detached DOM node, throwing getters/proxies, long strings, custom Money, lazy custom children, deep/wide and repeated/cyclic graphs. Unsupported values and inspection limits are explained alongside the scenario. A separate JSON input uses only `JSON.parse`.

Factories run for the selected scenario. Large-data controls offer 1,000, 10,000, 100,000 and 500,000 array items. Grouping and virtualization can be changed independently. Search scope, node budget and depth limit are adjustable. Disabling virtualization still retains model limits; it is not an invitation to render unbounded data.

## External updates

The [standalone live example](../examples/live-updates.tsx) and [data model](../examples/live-data.ts) use the public API. Start/pause a stream, choose its frequency, update once, add/remove metadata, prepend/remove/reverse events, or replace the input. Streaming starts paused and cleans up when leaving the section. Retention is bounded to 200 records.

Immutable updates are primary. The same-reference example mutates application-owned data in a click handler and explicitly triggers a React rerender. Shared owner/assignee identity is preserved. Controlled expansion survives updates at matching paths; selection drives an adjacent panel that derives the current value, not a stale callback snapshot. Removed selected paths remain application-controlled and are shown as absent. Array reorders preserve locations, not entity IDs.

## Customization

Inspector/classic presentation, light/dark, CSS brand colors, compact/comfortable density, toggle-only replacement, Money children, additive application actions, unstyled design-system appearance and controlled selection are available. Source panels contain code from compiling files. Copy `live-updates.tsx` with `live-data.ts`; copy scenario definitions with `customization.tsx`. Imports shown in source panels target the package; install the package and React, and import the packaged stylesheet for default appearance. Unstyled mode requires your own stylesheet (the site provides an example appearance).

Share configuration produces a URL for section, scenario, appearance and dataset size. Other controls, pasted JSON, selections and running state are deliberately not included. Reset restores defaults. No values are transmitted.

## Measurements

Enable measurements explicitly. The readout polls its own state, outside the measured inspector subtree. A scoped DOM observer counts mounted rows and observes English search status. Search completion is measured from input until a searching state has been observed and the completed/limited result status arrives; it includes debounce and discovery. Superseded queries count replaced in-flight requests, not cancelled worker jobs. Lazy read counts are cumulative requested child values for the current instance, including search and reinspection, not unique records.

React Profiler supplies render durations for committed updates, not DOM commit-phase duration. Normal production builds disable profiling. Use `npm run build:website:profile` to produce `website/dist-profiling` with React's profiling build, then serve it with SPA fallback. The ordinary build remains uninstrumented by React in production. Profiling adds overhead; development and profiling results are not directly comparable. See [React Profiler](https://react.dev/reference/react/Profiler).

Interaction-to-frame uses two animation-frame callbacks after the latest click, key or scroll event. It is an approximation, not INP, actual paint timing, a sustained FPS measurement or a benchmark score. Timings depend on the host machine and browser. Measurements reset when toggled, otherwise accumulate across value replacements. Unmounting removes the inspector but the application retains its dataset until replaced or the section is left.

No portable browser heap measurement is claimed. Use browser memory tooling and the validation checklist for retained-object investigations.

## Validation

The checklist records observations only for the current mounted section. It neither runs CI nor asserts accessibility certification. Browser regression tests cover the playground interactions, plus the existing library suite. Manual screen-reader testing, current Safari/mobile Safari and real application dogfooding remain release gates. This simulated pipeline is a demonstration, not completed production integration.

## Random updates and field pulses

Open `/playground?section=stress`. The seeded service fleet contains nested metrics/configuration, Maps, Sets, binary buffers, URLs, dates, errors, shared tenants and per-service cycles. Choose 25/100/1,000 services, 1/10/50 field operations per batch, and requested intervals from 50 to 1,000 ms. Start/pause, apply one batch, or reset using the same seed. Seed changes take effect on reset or dataset-size changes. The same seed and batch sequence reproduce field choices; timings and Error stacks are environment-dependent.

Updates replace affected branches, preserving untouched service identities. The application owns the workload and timer. The journal retains the latest 20 primary field operations; each also advances its service timestamp. Counts refer to operations, not unique changed paths. The root, service list and update journal add work outside the profiled inspector, so its render duration is not a total application-update benchmark. Requested interval is not achieved throughput.

The optional pulse is an application-owned Value slot, demonstrated in [update-pulse.tsx](../examples/update-pulse.tsx). Pass known changed paths and a revision through `ChangeAwareInspector`; provide the pulse CSS shown in the playground. It highlights the latest logged ordinary paths, including timestamps, without recursively comparing the graph. Map/Set changes pulse the collection summary. Rich entry/symbol paths are not represented as JSON Pointer. Opening a previously hidden logged path may play its pulse; this is a latest-batch indication, not a wall-clock change detector. Reduced-motion disables the animation, and a textual journal remains available.

No general change-detection or animation API is added to the library. A future library option would need explicit behavior for hidden nodes, identity changes, shared references, coalescing and reduced motion before becoming a stable contract.

## Customization readiness

Implemented: semantic CSS variables and stable data attributes; light/dark/system themes; compact/comfortable density; normal className/style; unstyled behavior; Toggle/Key/Value/Reference/Actions slots; synchronous typed registries with children; additive application actions; localized messages; controlled expansion and selection. The brand studio exposes independent background/string/number/boolean/focus colors, font family/size, indentation and uniform row height, with copyable CSS. Explicit row-height tokens override density presets.

Still unproven: integrations across representative enterprise design systems and reset styles, manual assistive-technology behavior after custom slot replacements, and broad real-application usage. Uniform-height virtualization remains a constraint. The architecture supports substantial customization; “enterprise-proven” is not the current release claim.
