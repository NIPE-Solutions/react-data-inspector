# Performance methodology

Run `npm run benchmark` to regenerate `results.json`. Fixtures include small, deep, wide, 1k/10k/100k object arrays, 500k primitive array, cycles, and shared-reference-heavy arrays. Fixture allocation is excluded from timing.

Each synchronous case has one warmup and ten measured runs; raw samples, median and p95 are recorded. Expansion uses depth two without opening ranges. Collapse reuses the inspected model. SSR uses development React in-process and must not be represented as browser render performance. Search records three runs with default budgets and whether results were limited.

`npm run benchmark:memory` runs a forced-GC model-lifetime experiment. It reports observed collection, not a deterministic guarantee or a browser retained-heap audit. `npm run benchmark:browser` records Chromium UI timing samples against the local site, including expansion, collapse, selection reveal and scrolling. Browser fixture state and timings are in its JSON output.

Do not compare these numbers to a competitor without matching fixtures, expansion state, browser, production mode and work limits. No comparative speed claim is published. Wide-object property enumeration is synchronous and should be measured separately. Search and default rendering intentionally perform different amounts of work.

## Presentation comparison

Run `npx tsx benchmarks/presentation.ts > /tmp/rdi-presentation-results.json` to compare inspector and classic server rendering over identical datasets: a 100k-property object, a 200-level object (subject to the inspection depth limit), 1k records, and a grouped 500k array with ranges closed and open. The harness alternates order, warms up both modes, records ten samples, and asserts identical data-row counts. Output includes Node/React versions and hardware details.

This measures SSR traversal and markup generation, not browser frame rate. Classic emits additional decorative markup; equal row counts do not imply equal rendering cost. Browser tests separately cover uniform row heights, bounded mounted nodes and navigation in both presentations.
