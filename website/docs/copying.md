## Conservative copying

Press F2 or use the node-actions button to copy a value, key, formatted path, or compatible JSON Pointer. Primitive values and valid Dates have direct representations. Object and array subtrees copy only when their JSON meaning is lossless.

Default copying refuses cycles, shared identity, accessors, sparse arrays, symbols, and other unsupported values. It does not call getters or `toJSON`. Work is capped at 10,000 descriptors or nodes, depth 100, and 1,000,000 output characters.

## Supply an application serializer

```tsx
import {
  DataInspector,
  type SerializationResult,
} from '@nipe-solutions/react-data-inspector'

const value = { id: 42n }
const serialize = (input: unknown): SerializationResult => ({
  ok: true,
  text: String(input),
})

export function Example() {
  return <DataInspector value={value} serialize={serialize} />
}
```

A serializer may return `{ ok: false, reason }` and may be asynchronous. It owns its safety, size limits, and fidelity. Clipboard failure is localized and exposes selectable fallback text.
