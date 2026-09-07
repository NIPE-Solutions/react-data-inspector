## Translate the small surface

Version 2.5.0 exports `JsonView`, takes `data`, and requires one of its CSS exports. React Data Inspector takes `value` and includes richer selection, search, copy, and graph behavior.

```tsx
// before
import { JsonView, defaultStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
export const Before = () => (
  <JsonView data={{ ready: true }} style={defaultStyles} />
)
```

```tsx
// after
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'
export const After = () => <DataInspector value={{ ready: true }} />
```

## Recreate intentional expansion

| react-json-view-lite 2.5.0              | React Data Inspector                                            |
| --------------------------------------- | --------------------------------------------------------------- |
| `data`                                  | `value`                                                         |
| `style={defaultStyles}` or `darkStyles` | Imported stylesheet, `theme`, and CSS tokens                    |
| `shouldExpandNode(level, value, field)` | Default depth/paths or controlled `expandedPaths`               |
| `clickToExpandNode`                     | Built-in tree mouse and keyboard interaction                    |
| `beforeExpandChange`                    | `onExpandedPathsChange` receives the complete proposed path set |
| `compactTopLevel`                       | No direct equivalent                                            |

The expansion callback contracts differ: there is no direct translation for a predicate evaluated per source node. Compute initial `DataPath` values when necessary. React Data Inspector also represents cycles and shared identity explicitly and supports rich paths for symbols, collections, custom children, and ranges. Values stay application-owned, selection is independent from focus, and no editing API is exposed.

Source verified against [`react-json-view-lite@2.5.0`](https://github.com/AnyRoad/react-json-view-lite/tree/84334890ab99510d8f7d723864ad0ae5ec32923f).
