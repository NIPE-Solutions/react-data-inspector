## Identity changes the shape of inspection

Two properties can contain the same object instance. A property can also refer back to an ancestor. The inspector tracks object identity independently from the paths used for expansion and selection.

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

## Circular versus shared references

| Relationship | Detection                                                               | Rendered behavior                                   |
| ------------ | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Circular     | The object occurs in the current ancestor chain                         | Terminal circular reference linking to its target   |
| Shared       | The object was previously discovered outside the current ancestor chain | Terminal shared-reference row linking to its target |

A repeated object is not automatically circular. Reference rows prevent recursive duplication of the same subtree and remain distinct from the original data node.

## Canonical means first discovered here

Canonical discovery is lazy and scoped to the current inspection generation. There is no up-front scan of every hidden descendant.

A parent rerender starts a new inspection generation. Different expansion order or shallower search traversal can change which occurrence owns the canonical target. A displayed target is therefore the canonical address for current discovery, not a globally permanent identifier.

## Follow a reference

Click its target or use Enter while the reference row is focused. Navigation resolves against the current value and requests the necessary ancestor expansion.

A target can be unavailable after an update or outside the current inspection/reveal limits. In controlled mode the parent must accept requested expansion. The inspector reports unsuccessful reveal rather than selecting an unrelated row.

## Keep addresses and identities separate

Expansion and selection are path-based. Object reference tracking is identity-based. Array order and collection iteration changes can move values beneath existing paths even when the objects themselves are unchanged.

See [paths](/concepts/paths), [controlled state](/guides/controlled-state), and [search](/docs/search) for their separate contracts. Try the [graph scenario](/playground?section=scenarios&scenario=graph) to follow both relationships.
