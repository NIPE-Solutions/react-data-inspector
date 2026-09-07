## Inspection boundaries

- Proxy traps and custom callbacks can execute or block JavaScript; they cannot be sandboxed or preempted.
- Weak collections, Promises, SharedArrayBuffer and React elements are opaque or intentionally limited. Recognized HTML elements, Text and Document have opaque summaries; SVG, Comment and DocumentFragment fall back to own-property inspection.
- Arrays and typed arrays expose indexed entries. Wide object key discovery is synchronous.
- Map and Set inspection stops after 10,000 entries. Search, reveal, copying, depth, strings, and visible models have separate limits.
- Reference targets are canonical within current lazy discovery, not globally across all hidden data.
- Rich paths and position-based collection paths may not map to JSON Pointer or stable entity identity.

## Product boundaries

The component does not edit values, add or remove properties, emit JSON Patch, inspect prototypes, evaluate JavaScript, render schema forms, or diff snapshots. Default copying rejects graph semantics or values that cannot be represented without loss. Row virtualization assumes a uniform measured height.

Automated tests cover keyboard behavior, axe, SSR, hydration, and React 18.3.1 and 19.2.8. Manual screen-reader audits, current mobile Safari validation, mounted-browser heap analysis, and production application dogfooding are still outstanding.
