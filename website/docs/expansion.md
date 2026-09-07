## Uncontrolled expansion

The root has data depth zero and opens by default. `defaultExpandedDepth` initializes data nodes only; synthetic range groups do not automatically open. `defaultExpandedPaths` adds explicit initial addresses.

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

## Controlled expansion

`expandedPaths` is the complete authoritative set. The callback proposes the next complete set; the parent may accept, transform, or decline it.

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

Expansion follows addresses. Reordering an array or changing Map/Set iteration order can place a different value at an expanded path. Do not switch between controlled and uncontrolled expansion during a mount.
