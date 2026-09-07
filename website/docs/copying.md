## Open node actions

Press F2 in the tree or use the node-actions button. Built-in actions can copy the value, key, formatted path, and a compatible JSON Pointer. The available operations depend on the node; rich collection and symbol paths do not have JSON Pointers.

`copyable` defaults to `true`. Set it to `false` to omit built-in copy actions while retaining application actions.

## Default serialization

Primitive values and valid Dates have direct text representations. Object and array subtrees copy only when their JSON meaning can be preserved without loss.

Default serialization does not invoke getters or `toJSON`. It refuses unsupported graph or value semantics rather than silently discarding them, including:

- Circular or shared object identity.
- Accessors and symbol properties.
- Sparse arrays and non-JSON values inside a subtree.
- Values outside the default serializer's supported types.

Presentation does not change serialization: [classic notation](/guides/presentation) is a visual choice, not an export format.

## Work limits

| Resource             | Default serializer limit |
| -------------------- | ------------------------ |
| Descriptors or nodes | 10,000                   |
| Depth                | 100                      |
| Output characters    | 1,000,000                |

A refusal is shown locally. Clipboard failure exposes selectable fallback text rather than losing the serialization result.

## Supply an application serializer

```tsx
import {
  DataInspector,
  type SerializationResult,
} from '@nipe-solutions/react-data-inspector'

const value = { id: 42n }
const serialize = (input: unknown): SerializationResult => {
  if (typeof input === 'bigint') return { ok: true, text: `${input}n` }
  return { ok: false, reason: 'Select a bigint value to export it.' }
}

export function Example() {
  return <DataInspector value={value} serialize={serialize} />
}
```

A serializer receives the value and readonly node context. It returns `{ ok: true, text }` or `{ ok: false, reason }`, directly or through a Promise. It owns its safety, size bounds, fidelity, and refusal messages.

The serializer customizes the value being copied. It is not a notification that a clipboard write succeeded. See [API reference](/reference/api) and [safe inspection](/concepts/safe-inspection) for application-callback responsibilities.
