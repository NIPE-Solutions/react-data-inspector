## Bound visible structure

Large indexed arrays and typed data open through hierarchical range nodes. The default grouping threshold is 1,000 and group size is 100. Range nodes are navigation addresses and are omitted from descendant data paths. Auto virtualization begins above 200 model rows with eight rows of overscan.

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

## Understand unavoidable work

A collapsed object does not enumerate descendants, but opening a wide plain object must synchronously obtain its own keys because JavaScript has no paged `ownKeys` API. Map and Set inspection stops after the first 10,000 entries. Arrays expose indexed values; non-index properties are outside normal array children. Rows use a measured uniform height, so wrapping slot content is unsupported by the current virtualizer. `virtualization={false}` disables windowing while grouping and model limits still apply.
