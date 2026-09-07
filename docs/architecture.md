# Inspection architecture

## Ownership and differentiation

One React package owns inspection and transient UI behavior. The application owns its values, changes and storage. There are no API requests, telemetry, schema workflows or evaluator. The focus is the combination of real values, graph identity, descriptor safety, controlled state and layered customization rather than another JSON-only tree.

## Model and reference semantics

A model generation contains a scoped WeakMap of object identities, a path encoder and lazily cached child sources. Explicit ancestor identity distinguishes cycles from previously discovered shared references. Shared rows remain terminal by default. Canonical references are first-discovered paths for the current generation, not a promise about the globally first hidden occurrence. A reference target can move after discovery order or a parent render changes. Search has an independent traversal; reveal resolves against the current visible model.

Expansion belongs to a centralized React controller. The model flattens visible rows for navigation and windowing; the renderer reconstructs nested treeitem/group ownership, retaining ancestor shells. No per-row expansion state, random IDs or module-global inspected graph caches. A fresh parent render creates a model generation; internal focus/search/scroll state does not invalidate the input model. Old jobs cancel on replacement/unmount.

Collapsed objects do not enumerate descendants. Arrays use length and index descriptors. Object ownKeys enumeration is unavoidably synchronous. Grouping is hierarchical and follows original enumeration order. At most 100 range groups are emitted at each grouping level. Explicit safety bounds apply to depth, visible rows, collection iteration, search and copying. Reaching a bound is disclosed.

Map entries are currently adjacent paired key/value rows labelled with their common iteration index. They are not a normal object property and are not editable JSON paths. Set items have value addresses without property keys. Map/Set inspection is currently limited to the first 10,000 iteration entries; distant ranges show the collection limit. Array summaries explicitly disclose indexed-only inspection, excluding extra properties.

## Type matrix

| Type                     | Support                                                          | Limits                                                                  |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| string                   | Escaped preview, length, explicit full-text action               | Preview bounded; full action capped at 100,000 characters               |
| number                   | Exact JS display including -0, NaN, infinities                   | Already-rounded JS numbers cannot regain precision                      |
| boolean, null, undefined | Literal leaf                                                     | No coercion to JSON                                                     |
| bigint, symbol           | Literal or description                                           | Symbol addresses preserve actual identity                               |
| Object                   | Enumerable own descriptors, optional non-enumerables and symbols | No inherited/prototype traversal                                        |
| Array                    | Indexed descriptors, holes, grouping                             | Extra properties excluded and disclosed                                 |
| Date                     | ISO or Invalid Date                                              | Intrinsic method; no overridden toString                                |
| RegExp                   | Source and flags                                                 | Bounded summary                                                         |
| Error                    | Name/message summary; own stack/cause/custom details             | No inherited custom getters evaluated                                   |
| URL                      | Intrinsic href summary                                           | No arbitrary string coercion                                            |
| Map                      | Size and paired key/value rows                                   | Iteration index paths; first 10,000 entries                             |
| Set                      | Size and value rows                                              | Iteration index paths; first 10,000 entries                             |
| TypedArray               | Intrinsic length and grouped indices                             | Includes bigint variants; detached buffer behavior is runtime-dependent |
| ArrayBuffer, DataView    | Byte count and grouped bytes                                     | Byte detail addresses are inspector-specific                            |
| WeakMap, WeakSet         | Opaque summary                                                   | Contents cannot be enumerated                                           |
| Promise                  | Opaque summary                                                   | No then call, awaiting or settlement tracking                           |
| Function                 | Bounded name only                                                | No execution or source dump                                             |
| DOM, React element       | Conservative opaque summaries                                    | No DevTools internal traversal; DOM recognition is limited              |
| SharedArrayBuffer        | Opaque summary                                                   | Concurrent byte inspection not supported                                |
| Custom type              | Matched summary and lazy paged children                          | Synchronous application callbacks own their behavior                    |

Built-in subclasses are identified through bounded prototype descriptor inspection followed by intrinsic operations where available. Revoked/spoofed/throwing objects become localized diagnostics. Promise and DOM detection is conservative name-based recognition; this is not an unforgeable brand guarantee.

## Accessibility architecture

The labelled tree owns nested treeitems and groups. Items have explicit level, position and sibling count. The tree itself is the navigation tab stop and uses aria-activedescendant pointing to a mounted item. Focus is independent of selection. Collapsing or removing a focused descendant falls back to a surviving ancestor. Keyboard controls include arrows, Home/End, type-ahead, Enter/Space selection, and F2 actions.

Search controls and the current-node action panel are outside the tree. They use normal buttons, status regions and form controls. Custom content slots retain library-owned tree and toggle semantics. Uniform measured rows support bounded windowing; custom variable-height rows require disabling virtualization. The public-beta gate includes actual screen-reader testing; axe alone cannot establish this.

## Security and SSR

Property access uses descriptors; accessors are shown rather than invoked. Functions and promises remain inert. Text is rendered through React, never injected as HTML. Clipboard serialization inspects and copies descriptors into clean containers before JSON.stringify, avoiding toJSON inheritance. The JSON playground uses JSON.parse only.

Proxy reflection traps and custom callbacks can execute arbitrary application code and cannot be sandboxed or preempted. Browser/React development tooling may also inspect application props independently of this library. Diagnostics are localized; consumer error callbacks own their reporting behavior.

SSR performs no browser-global access. React useId prevents cross-instance ID collisions; input/configuration must match on server/client. Windowing begins after hydration. Search jobs start in effects and cancel on generation changes. React 18.3 and 19 are the support targets, with a CI matrix and local matrix verification.

## Roadmap

Before public beta: manual assistive technology audit, real application integration, stronger memory/performance evidence, uniform-row windowing audit and resolution of any remaining correctness defects. Then primitive immutable editing proposals, collection continuation beyond the current cap, and explicit extra-array-property discovery. JSON Patch helpers, worker search, prototype views, hex mode and diffing require separate justification. No AI features or JavaScript evaluator.
