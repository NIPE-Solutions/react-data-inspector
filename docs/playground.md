# Playground

Run `npm run dev` and open `/playground`. The homepage links to the laboratory. Static hosts must route `/playground` to the site's `index.html` (SPA fallback). Nothing is hosted or published automatically.

## Scenarios

Predefined values cover primitives, ordinary/sparse/symbol-keyed objects, Date/RegExp/URL/Error, Map/Set, standard typed arrays and binary buffers, functions/promises/weak collections, React elements and a detached DOM node, throwing getters/proxies, long strings, custom Money, lazy custom children, deep/wide and repeated/cyclic graphs. Unsupported values and inspection limits are explained alongside the scenario. A separate JSON input uses only `JSON.parse`.

Factories run for the selected scenario. Large-data controls offer 1,000, 10,000, 100,000 and 500,000 array items. Grouping and virtualization can be changed independently. Search scope, node budget and depth limit are adjustable. Disabling virtualization still retains model limits; it is not an invitation to render unbounded data.

## External updates

The [standalone live example](../examples/live-updates.tsx) and [data model](../examples/live-data.ts) use the public API. Start/pause a stream, choose its frequency, update once, add/remove metadata, prepend/remove/reverse events, or replace the input. Streaming starts paused and cleans up when leaving the section. Retention is bounded to 200 records.

Immutable updates are primary. The same-reference example mutates application-owned data in a click handler and explicitly triggers a React rerender. Shared owner/assignee identity is preserved. Controlled expansion survives updates at matching paths; selection drives an adjacent panel that derives the current value, not a stale callback snapshot. Removed selected paths remain application-controlled and are shown as absent. Array reorders preserve locations, not entity IDs.

## Customization

Light/dark, CSS brand colors, compact/comfortable density, toggle-only replacement, Money children, additive application actions, unstyled design-system appearance and controlled selection are available. Source panels contain code from compiling files. Copy `live-updates.tsx` with `live-data.ts`; copy scenario definitions with `customization.tsx`. Imports shown in source panels target the package; install the package and React, and import the packaged stylesheet for default appearance. Unstyled mode requires your own stylesheet (the site provides an example appearance).

Share configuration produces a URL for section, scenario, appearance and dataset size. Other controls, pasted JSON, selections and running state are deliberately not included. Reset restores defaults. No values are transmitted.

## Measurements

Enable measurements explicitly. The readout polls its own state, outside the measured inspector subtree. A scoped DOM observer counts mounted rows and observes English search status. Search completion is measured from input until a searching state has been observed and the completed/limited result status arrives; it includes debounce and discovery. Superseded queries count replaced in-flight requests, not cancelled worker jobs. Lazy read counts are cumulative requested child values for the current instance, including search and reinspection, not unique records.

React Profiler supplies render durations for committed updates, not DOM commit-phase duration. Normal production builds disable profiling. Use `npm run build:website:profile` to produce `website/dist-profiling` with React's profiling build, then serve it with SPA fallback. The ordinary build remains uninstrumented by React in production. Profiling adds overhead; development and profiling results are not directly comparable. See [React Profiler](https://react.dev/reference/react/Profiler).

Interaction-to-frame uses two animation-frame callbacks after the latest click, key or scroll event. It is an approximation, not INP, actual paint timing, a sustained FPS measurement or a benchmark score. Timings depend on the host machine and browser. Measurements reset when toggled, otherwise accumulate across value replacements. Unmounting removes the inspector but the application retains its dataset until replaced or the section is left.

No portable browser heap measurement is claimed. Use browser memory tooling and the validation checklist for retained-object investigations.

## Validation

The checklist records observations only for the current mounted section. It neither runs CI nor asserts accessibility certification. Browser regression tests cover the playground interactions, plus the existing library suite. Manual screen-reader testing, current Safari/mobile Safari and real application dogfooding remain release gates. This simulated pipeline is a demonstration, not completed production integration.
