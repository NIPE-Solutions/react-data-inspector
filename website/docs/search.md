## Search collapsed data

`searchable` adds a query field, result count, and next/previous controls. Search visits collapsed branches in yielding tasks; choosing a result requests the ancestor expansion needed to reveal it.

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

Matching is case-insensitive text containment. `scope` chooses keys, values, or both; arbitrary objects are not passed through an unsafe stringify operation. Custom types may supply their own search text.

## Defaults and work limits

| Option        | Default           | Upper bound                            |
| ------------- | ----------------- | -------------------------------------- |
| `scope`       | `keys-and-values` | `keys`, `values`, or `keys-and-values` |
| `debounce`    | 150 ms            | Delay before a changed query starts    |
| `maxNodes`    | 100,000           | 1,000,000                              |
| `maxResults`  | 1,000             | 10,000                                 |
| `stringLimit` | 65,536 characters | 100,000 characters                     |

Depth, collection, and other inspection limits also apply. Counts disclose incomplete results when a work limit or truncation prevents a complete answer. A partial count is not a total count of matching values in the graph.

## Control the query

Pass `searchQuery` and `onSearchQueryChange` when another application control owns the query. An empty string is a controlled empty query; omitting the prop leaves the query uncontrolled. Keep that choice stable during a mount.

Query changes cancel the previous scan. Cancellation happens between bounded tasks; it cannot interrupt a synchronous Proxy trap or application callback already executing.

## Data updates and refreshing results

Search is not an atomic snapshot of application state.

- New data generations coalesce into a follow-up scan without restarting the query debounce.
- Completed results remain usable while the localizable refreshing status reports an update.
- A match can become stale before it is revealed. Reveal resolves against the current value and can report an unavailable target.
- Mutating a shared object during a scan does not create snapshot isolation.

See [controlled state](/guides/controlled-state) for external updates and ownership.

## Shared references and reveal

Search can revisit a shared subtree at a shallower path when a previous occurrence hid descendants behind the depth limit. Its discovery order can differ from normal visible rendering; it does not promise every possible alias path as a separate result.

Reveal requests required expansion and checks the current target. In controlled mode, the parent must accept the expansion request. Row and depth limits can prevent a result from becoming visible even when it was found.

## Keyboard and custom callbacks

In the search field, Enter moves to the next result and Shift+Enter moves to the previous result. Next/previous buttons provide the same operation. Result counts and refresh state have accessible status text.

Keep custom `searchText`, matchers, and child sources pure and bounded. Their synchronous work cannot be preempted. See [custom types](/guides/custom-types), [safe inspection](/concepts/safe-inspection), and [large-data configuration](/guides/large-data).
