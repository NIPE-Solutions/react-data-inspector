# Delivery audit

This audit maps the product deliverables to the implementation and honest release limits.

| Deliverable                  | Evidence                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1. Product boundary          | [Architecture](architecture.md): inspector owns behavior, application owns values                               |
| 2. Differentiation           | [README](../README.md): graph identity, real types, safe descriptors, controlled customization                  |
| 3. Public API                | [Reference](api.md), [exports](../src/index.ts)                                                                 |
| 4. Tree/object graph         | [Model](../src/model/graph.ts), bounded lazy sources                                                            |
| 5. Paths                     | [Path model](api.md#paths), rich collection/symbol/detail segments                                              |
| 6. References/cycles         | Identity WeakMap plus ancestor classification; [tests](../test/model.test.ts)                                   |
| 7. Expansion                 | Central state, controlled proposals, hidden collapse persistence; [reveal tests](../test/reveal.test.tsx)       |
| 8. Search                    | Cancellable batches, limits, current ownership resolution; [search](../src/model/search.ts)                     |
| 9. Performance architecture  | Bounded model, lazy descendants and explicit synchronous ownKeys boundary                                       |
| 10. Grouping/windowing       | Hierarchical ranges; nested semantic shells; uniform measured row height                                        |
| 11. Type support             | [Matrix](architecture.md#type-matrix) and built-in tests                                                        |
| 12. Type registry            | defineInspectorType with typed guards, summaries and lazy paged children                                        |
| 13. Editing                  | Not part of the public API; see [limitations](https://react-data-inspector.nipesolutions.com/limitations)       |
| 14. Accessibility            | Keyboard and axe evidence; actual screen-reader audit pending                                                   |
| 15. Styling                  | Plain scoped CSS, light/dark/system, two densities, logical properties                                          |
| 16. CSS variables            | [Contract](api.md#styling-contract), 19 semantic variables                                                      |
| 17. Data attributes          | [Stable selectors](api.md#styling-contract)                                                                     |
| 18. Slots                    | Toggle, Key, Value, Reference and Actions; error recovery                                                       |
| 19. Actions                  | Conditional additive actions with async feedback and default copying retained                                   |
| 20. Unstyled                 | Complete behavior retained with consumer-owned appearance                                                       |
| 21. SSR                      | Server render, hydration and multiple-instance IDs tested                                                       |
| 22. React 18/19              | Local matrix plus configured [CI](../.github/workflows/ci.yml)                                                  |
| 23. Security                 | No evaluation/input mutation/getter execution; safe copy containers and bounds                                  |
| 24. Tests                    | Unit/component, hydration, browser/axe and real packed-consumer checks                                          |
| 25. Benchmarks               | [Methodology and raw data](../benchmarks/README.md)                                                             |
| 26. Documentation site       | [Website](https://react-data-inspector.nipesolutions.com), routed static docs and verified automatic deployment |
| 27. Customization playground | Safe JSON, predefined-JS scenarios, presentation/styling controls and live updates                              |
| 28. README                   | Concise usage, differentiation, customization, docs and MIT                                                     |
| 29. Limitations              | [Architecture](architecture.md) and [readiness](release-readiness.md)                                           |
| 30. Roadmap                  | Inspection-first; editing/continuation/integration after audited core                                           |
| 31. Naming                   | Verified NIPE conventions, public GitHub repository and unpublished npm candidate                               |
| 32. Readiness                | **PRIVATE PREVIEW READY**; no public-beta or stable claim                                                       |

## Mandatory customization scenarios

| Scenario             | Demonstration and acceptance evidence                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Brand colors         | `.brand-colors` in website/style.css changes background/string/focus with only CSS variables. Browser checks actual computed background. |
| Different toggle     | `PlusToggle` replaces icon only; built-in button behavior remains. Unit and browser tests expand with it.                                |
| Custom actions       | Customer action adds “Open in application” while Copy path remains available. Browser test invokes it.                                   |
| Money                | `moneyType` displays EUR 12.99 and exposes amount/currency. Unit/browser checks expand fields.                                           |
| Design system        | `unstyled` with `.design-system` CSS; semantics and keyboard behavior remain.                                                            |
| Controlled expansion | Compiled ControlledExample and refusal/acceptance unit cases.                                                                            |
| Custom selection     | Selected path updates the adjacent details panel; unit/browser checks verify it.                                                         |

## Correctness audit

Cycle and shared-reference tests distinguish semantics without recursion; getter/function/coercion-hook counters remain untouched; frozen inputs are inspectable; serialization refuses unsupported graph values; Map/Set/symbol paths are not JSON Pointers; opaque weak collections are documented; half-million arrays are grouped; canceled searches do not deliver stale results; model roots are collectable in the forced-GC experiment. Full mounted-browser retention testing remains pending.

## Accessibility audit

Keyboard-only behavior, collapse/focus restoration, selection, search, actions, RTL/mobile and windowed active descendants have automated interaction coverage and live browser inspection. Axe passes the default and dark examples. No human screen-reader audit was performed. Editing accessibility is not applicable to this read-only alpha. See the public-beta blockers before describing the project as production-ready.

The dedicated [playground](playground.md) now includes externally updated data, typed-value scenarios, styling controls, lazy children and opt-in performance measurements. Standalone live examples are verified against the packed package.
