## Selection is application state

Keyboard focus and selection are separate. Arrow keys move focus; Space or a row click selects. Enter expands a branch, follows a reference, or selects a leaf. Synthetic range groups support navigation but cannot be selected.

```tsx
import { useState } from 'react'
import {
  DataInspector,
  formatPath,
  type DataPath,
} from '@nipe-solutions/react-data-inspector'

export function Details() {
  const [selected, setSelected] = useState<DataPath | null>(null)
  const value = { user: { id: 42, name: 'Ada' } }
  return (
    <>
      <DataInspector
        value={value}
        selectedPath={selected}
        onSelectedPathChange={setSelected}
      />
      <output>{selected ? formatPath(selected) : 'Nothing selected'}</output>
    </>
  )
}
```

`undefined` means uncontrolled; `null` explicitly clears selection. The callback also receives a readonly node context with the value, summary, type, depth, and reference target. The context is not a clone: do not mutate `node.value`. Selection paths follow positions rather than application entity IDs.
