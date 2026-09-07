## Define a domain adapter

Custom types run before built-ins in declaration order; the first match wins. `defineInspectorType<T>` preserves the narrowed value type.

```tsx
import {
  DataInspector,
  defineInspectorType,
} from '@nipe-solutions/react-data-inspector'

class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}
}
const moneyType = defineInspectorType<Money>({
  id: 'money',
  matches: (value): value is Money => value instanceof Money,
  summary: (value) => `${value.currency} ${value.amount.toFixed(2)}`,
  children: (value) => ({
    count: 2,
    getPage: (offset, limit) =>
      [
        { key: 'amount', value: value.amount },
        { key: 'currency', value: value.currency },
      ].slice(offset, offset + limit),
  }),
  searchText: (value) => `${value.currency} ${value.amount}`,
})
export function Example() {
  return (
    <DataInspector
      value={{ total: new Money(12.99, 'EUR') }}
      types={[moneyType]}
    />
  )
}
```

## Children and paging

`children` is lazy, synchronous, counted, and paged. Its source declares a count and returns the requested slice through `getPage(offset, limit)`. Use stable unique keys. Avoid constructing an entire large collection merely to return a small page.

## Paths and search text

Custom child paths use the type ID and child key. They are rich inspector addresses, not ordinary JSON properties, and cannot be represented as JSON Pointers. See [paths](/concepts/paths).

Supply `searchText` when the domain value has meaningful searchable text beyond its summary or children. Keep the returned text bounded; the inspector does not need an arbitrary object serializer.

## Execution and failure boundaries

Matchers, summaries, child sources, and search callbacks are application code. Keep them pure, synchronous where required, and bounded. Failures become inspection diagnostics, but work inside a callback cannot be interrupted.

A type adapter works with either [presentation](/guides/presentation). It supplies domain meaning without replacing tree navigation, selection, copy actions, or row rendering. Use a [slot](/guides/customization#replace-only-a-toggle) when the change concerns content rendering rather than type semantics.
