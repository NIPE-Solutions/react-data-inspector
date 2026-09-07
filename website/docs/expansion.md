## Open branches by path

Expansion is separate from object identity. The inspector tracks which addresses are open, so replacing a child value does not automatically collapse its ancestors.

## Uncontrolled usage

```tsx
import {
  DataInspector,
  type DataPath,
} from '@nipe-solutions/react-data-inspector'

const initial: readonly DataPath[] = [[], ['user']]
const data = { user: { name: 'Ada' }, jobs: [{ id: 1 }] }

export function Example() {
  return <DataInspector value={data} defaultExpandedPaths={initial} />
}
```

`defaultExpandedPaths` adds explicit initial addresses. `defaultExpandedDepth` supplies the depth-based expansion baseline for data nodes.

## Defaults

| Setting                   | Default | Meaning                                                    |
| ------------------------- | ------- | ---------------------------------------------------------- |
| `defaultExpandedDepth`    | `1`     | Open data nodes whose zero-based depth is below this value |
| `defaultExpandedPaths`    | `[]`    | No additional explicit addresses                           |
| Root data depth           | `0`     | The default opens the root                                 |
| Synthetic range expansion | Closed  | Depth-based defaults do not open ranges                    |

A range is a navigation group, not a deeper application value. Its address can be included explicitly when needed.

## Controlled usage

```tsx
import { useState } from 'react'
import {
  DataInspector,
  type DataPath,
} from '@nipe-solutions/react-data-inspector'

export function Controlled() {
  const [paths, setPaths] = useState<readonly DataPath[]>([[]])
  return (
    <DataInspector
      value={{ user: { id: 42 } }}
      expandedPaths={paths}
      onExpandedPathsChange={setPaths}
    />
  )
}
```

`expandedPaths` is the complete authoritative set and overrides the defaults. The callback proposes the next complete set, not a single-node change. The parent may accept, transform, or decline it. Do not switch controlledness during a mount.

## Value updates and ordering

An address can remain expanded across new values. Missing addresses are not visible; the inspector does not promise automatic pruning of application-controlled paths.

Array reordering and Map/Set insertion or removal can place a different value at the same address. Expansion does not follow entity IDs. Use application logic to remap addresses if you require entity-based persistence.

## Reveal and limits

Search and reference navigation may request additional ancestor expansion. Controlled applications must accept that request for reveal to proceed. Depth, visible-row, and collection limits still apply to expanded paths.

See [paths](/concepts/paths), [controlled state](/guides/controlled-state), and [large data](/guides/large-data).
