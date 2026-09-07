## Bound the visible structure

Collapsed nodes do not recursively enumerate their descendants merely to render a summary. Expanded indexed values and large property/collection sources use hierarchical range groups. Client-side windowing limits mounted rows independently from grouping.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const values = Array.from({ length: 500_000 }, (_, index) => index)
export function LargeArray() {
  return (
    <DataInspector
      value={values}
      arrayGrouping={{ threshold: 2_000, size: 200 }}
      virtualization={{ threshold: 300, overscan: 12 }}
    />
  )
}
```

## Grouping defaults

| Setting                       | Default                     |
| ----------------------------- | --------------------------- |
| `arrayGrouping.threshold`     | 1,000                       |
| `arrayGrouping.size`          | 100                         |
| Automatic windowing threshold | More than 200 model rows    |
| Windowing overscan            | 8 rows                      |
| Inspection depth limit        | 100; configurable up to 200 |

Large ranges subdivide hierarchically instead of creating hundreds of thousands of rows at once. Range nodes have expansion addresses, but descendant data paths omit the range segments. Ranges are not selectable application values.

## Window geometry

The virtualizer measures a uniform row height. Both built-in [presentations](/guides/presentation) use the same meaningful rows and preserve this model; classic closing lines contribute visual offsets without adding navigable data nodes.

Custom content that wraps or varies in height is unsupported by the current virtualizer. Use `virtualization={false}` for variable-height rows. This disables windowing only: grouping and the 10,000-row visible-model limit still apply.

The server and first client render use matching non-windowed markup. Windowing begins after mount. Avoid an initial expansion set that constructs a large model merely because client windowing will eventually reduce the mounted rows.

## Unavoidable synchronous work

Opening a wide plain object must obtain its own keys synchronously because JavaScript has no paged `ownKeys` API. Grouping limits resulting rows; it does not eliminate key enumeration.

Map and Set inspection stops after the first 10,000 entries. Arrays expose indexed children; their non-index properties are outside normal array inspection. Custom child sources can be paged but remain synchronous application callbacks.

## Search has a separate budget

Searching collapsed branches intentionally performs more work than rendering them. Its node, result, depth, collection, and string limits can produce incomplete results. See [search](/docs/search) for defaults, cancellation, and update behavior.

## Measure the workload you have

Use the [performance methodology and recorded evidence](/performance). Compare the same values, expansion state, limits, browser, and build mode; a grouped model timing is not a claim about fully expanding every item.

Try [500,000 array items](/playground?section=performance&size=500000), a [wide object](/playground?section=scenarios&scenario=wide), or a [deep object](/playground?section=scenarios&scenario=deep).
