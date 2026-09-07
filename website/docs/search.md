## Search hidden branches

`searchable` adds controls. Search visits collapsed branches in cancellable, yielding tasks and reveals the selected result through its ancestors.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

export function Searchable() {
  return (
    <DataInspector
      value={{ users: [{ name: 'Ada' }, { name: 'Lin' }] }}
      searchable
      searchOptions={{
        scope: 'keys-and-values',
        maxNodes: 50_000,
        maxResults: 500,
      }}
    />
  )
}
```

## Control the query

Pass `searchQuery` with `onSearchQueryChange` to coordinate an external search field. The defaults debounce for 150 ms, visit at most 100,000 nodes, return at most 1,000 results, and inspect at most 65,536 characters per string. Counts report when results are incomplete.

Search is not an atomic snapshot. New values coalesce into a follow-up scan, and completed results remain visible while refreshing. A match can become stale before reveal. Custom type callbacks and proxy operations happen inside inspection and cannot be preempted, so keep custom search text bounded and pure.
