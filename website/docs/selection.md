## Keep focus separate from selection

Keyboard focus identifies the current navigation row. Selection identifies a value chosen for application behavior, such as an adjacent details panel. Arrow keys move focus without selecting each visited row.

## Controlled selection

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
      <output>
        {selected === null ? 'Nothing selected' : formatPath(selected)}
      </output>
    </>
  )
}
```

## Defaults and clearing

Omit `selectedPath` for uncontrolled selection. `defaultSelectedPath` initializes that selection; its default is `null`.

Pass `selectedPath={null}` to explicitly clear controlled selection. `undefined` means uncontrolled. Do not switch controlledness during a mounted instance.

## Interaction behavior

| Interaction          | Effect                       |
| -------------------- | ---------------------------- |
| Arrow keys           | Move keyboard focus          |
| Space                | Select the focused data node |
| Row click            | Select the clicked data node |
| Enter on a branch    | Expand or collapse           |
| Enter on a reference | Follow its target            |
| Enter on a leaf      | Select the leaf              |

Synthetic range groups support navigation and expansion but cannot be selected. Focus, selection, and search-match styling are distinct states.

## Callback context

`onSelectedPathChange` receives the requested path and a readonly node context containing value, label, summary, type, depth, and any reference target. The context is not a deep clone: do not mutate `node.value`.

Controlled selection does not automatically open every ancestor of an arbitrary externally supplied path. Coordinate expansion explicitly when your application needs to reveal a selection.

## Updates and path identity

Selection follows the address, not an application entity ID. Array reordering or collection changes may put another value at the selected path. An absent path has no visible selected row; the application remains responsible for its controlled selection.

See [controlled state](/guides/controlled-state), [path semantics](/concepts/paths), and [keyboard accessibility](/accessibility).
