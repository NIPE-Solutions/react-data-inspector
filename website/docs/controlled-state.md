## Keep ownership explicit

The inspector proposes expansion, selection, and query changes through callbacks. Your application can accept them, transform them, or keep its current state. These controls do not give the inspector ownership of the inspected value.

## Coordinate a details panel

```tsx
import { useState } from 'react'
import {
  DataInspector,
  formatPath,
  type DataPath,
} from '@nipe-solutions/react-data-inspector'

const data = { user: { id: 42, name: 'Ada' }, status: 'ready' }

export function ControlledPanel() {
  const [expanded, setExpanded] = useState<readonly DataPath[]>([[]])
  const [selected, setSelected] = useState<DataPath | null>(null)
  const [query, setQuery] = useState('')

  return (
    <section>
      <button onClick={() => setExpanded([[], ['user']])}>Open user</button>
      <DataInspector
        value={data}
        expandedPaths={expanded}
        onExpandedPathsChange={setExpanded}
        selectedPath={selected}
        onSelectedPathChange={setSelected}
        searchable
        searchQuery={query}
        onSearchQueryChange={setQuery}
      />
      <aside>
        <h2>Application details</h2>
        <p>Selected: {selected === null ? 'None' : formatPath(selected)}</p>
        <p>Expanded: {expanded.map(formatPath).join(', ') || 'None'}</p>
      </aside>
    </section>
  )
}
```

The expansion callback receives the next complete path set. It is not a single-node event or a patch. Selection is independent from keyboard focus, so arrow navigation does not repeatedly change the application details panel.

## Choose controlledness at mount

| State        | Uncontrolled         | Controlled empty state |
| ------------ | -------------------- | ---------------------- |
| Expansion    | Omit `expandedPaths` | `expandedPaths={[]}`   |
| Selection    | Omit `selectedPath`  | `selectedPath={null}`  |
| Search query | Omit `searchQuery`   | `searchQuery=""`       |

Do not switch between controlled and uncontrolled state during a mounted instance. Initial `default*` props belong to uncontrolled usage; they do not override controlled values.

## Handle updates outside the inspector

The application must trigger a React rerender when the data changes. A parent rerender re-inspects even an externally mutated same-reference value; the inspector does not poll for mutations.

Expansion and selection follow paths. Reordering array items or changing collection iteration order can put another value at an existing address. If you need entity-based persistence, map entity IDs to current paths in your application.

Search results refresh across updates, but they are not an atomic snapshot. See [search update behavior](/docs/search#data-updates-and-refreshing-results) before connecting continuously changing data.

## Reference and search reveal

Reveal may request additional ancestor expansion. In controlled mode the application must accept that proposed set for the target to become visible. A declined update or a target outside inspection limits can make the reveal unavailable; it does not authorize mutation of application state.

Try [external updates](/playground?section=live) and [randomized updates](/playground?section=stress). The exact state contracts remain in [expansion](/docs/expansion), [selection](/docs/selection), and [search](/docs/search).
