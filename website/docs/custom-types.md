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

`children` is lazy, synchronous, counted, and paged. Return only the requested slice with stable unique keys. Custom child paths use the type ID and key; they are not JSON properties. Matchers, summaries, sources, and search callbacks should be pure and bounded. Failures become inspection diagnostics, but work inside a callback cannot be interrupted.
