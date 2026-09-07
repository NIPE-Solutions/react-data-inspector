## Descriptor-based object inspection

Ordinary properties are read through own property descriptors. Accessors render as getter/setter markers, so inspecting them does not invoke their getter. Functions are not called, Promises are not awaited, prototype properties are not expanded (type detection may examine prototypes), and application input is never mutated.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const value = Object.defineProperty({ visible: true }, 'secret', {
  enumerable: true,
  get() {
    throw new Error('not evaluated')
  },
})

export function Example() {
  return (
    <DataInspector
      value={value}
      inspectionOptions={{ onInspectionError: console.error }}
    />
  )
}
```

## Safety has a JavaScript boundary

Reflection on a Proxy can execute user-defined traps or throw. Built-in adapters call intrinsic operations for Date, Map, Set, typed arrays, and related values. Custom type matchers, summaries, child sources, search text, slots, actions, and serializers are application callbacks and can run arbitrary code. The inspector catches many localized failures, but it cannot sandbox or preempt them. Keep callbacks synchronous where required, pure, and bounded.
