## Circular and shared identity

JavaScript data is often a graph rather than a tree. An object encountered in its current ancestor chain becomes a circular reference. An object previously discovered elsewhere becomes a shared reference. Both render as terminal rows linking to a canonical path instead of recursing forever.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const shared = { status: 'ready' }
const value: { first: object; second: object; self?: unknown } = {
  first: shared,
  second: shared,
}
value.self = value

export function Graph() {
  return <DataInspector value={value} defaultExpandedDepth={3} />
}
```

## Canonical means first discovered here

Canonical discovery is lazy and scoped to the current inspection generation. It is not a global scan of hidden data. A parent rerender, different expansion order, or shallower search traversal can change which occurrence owns the canonical target. Reference jumps therefore resolve against the current value and may report an unavailable or limited target. Expansion and selection remain path-based.
