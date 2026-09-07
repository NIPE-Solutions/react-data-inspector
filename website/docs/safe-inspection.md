## Ordinary accessors stay unevaluated

Ordinary properties are inspected through own property descriptors. An accessor renders as a Getter, Setter, or Getter/Setter marker; the inspector does not invoke its getter to discover a value.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const value = Object.defineProperty({ visible: true }, 'secret', {
  enumerable: true,
  get() {
    throw new Error('not evaluated')
  },
})

export function Example() {
  return <DataInspector value={value} />
}
```

## Built-in boundaries

- Functions are summarized, never called.
- Promises are not awaited or subscribed to for inspection.
- WeakMap and WeakSet contents remain opaque.
- Application input is never mutated.
- Prototype properties are not expanded; type detection may examine prototypes.
- Default copying does not invoke `toJSON` or getters.

The [type matrix](/reference/types) distinguishes expandable, summarized, and opaque values. These guarantees do not turn JavaScript reflection into a sandbox.

## Proxy reflection can execute code

A Proxy may run user-defined traps during key enumeration, descriptor access, or type detection. Traps may throw or block. The inspector captures many localized failures so other nodes remain usable, but it cannot preempt synchronous work inside a trap.

Built-in adapters use intrinsic operations for Date, Map, Set, typed arrays, and related values. Inspection of these values is not equivalent to evaluating application-provided text.

## Customization is application code

Custom matchers, summaries, paged child sources, search text, React slots, actions, and serializers can execute application code. Keep inspection callbacks pure and bounded; obey synchronous contracts where required.

Custom React output belongs to the application. The inspector does not sanitize it or promise that a consumer-provided component is free of side effects.

## Diagnostics and input text

Inspection failures can render localized diagnostics and can be reported through `inspectionOptions.onInspectionError(error, path)`. React slot failures have localized boundaries. Not every JavaScript failure can be recovered or interrupted.

The playground accepts pasted JSON through `JSON.parse` only. It does not evaluate JavaScript expressions. Predefined JavaScript scenarios are application code bundled with the website.

See [copying](/docs/copying), [custom types](/guides/custom-types), and [limitations](/limitations).
