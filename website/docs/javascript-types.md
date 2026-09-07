## Choose the right mental model

A JavaScript value may be a primitive, a collection, an object with identity, or an intentionally opaque value. The inspector chooses a representation for that value directly; it does not serialize the input into JSON first.

Use the [type compatibility matrix](/reference/types) for the exact display and expansion behavior of each built-in type.

## Primitive values retain their meaning

`undefined`, bigint, symbols, `NaN`, infinities, and negative zero are distinct values. They are not coerced to JSON-compatible substitutes. Strings are truncated for display according to the inspection string limit; truncation does not modify the original value.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

export function Values() {
  return (
    <DataInspector
      value={{
        missing: undefined,
        identifier: 9007199254740993n,
        label: Symbol('request'),
        numeric: [NaN, Infinity, -0],
      }}
    />
  )
}
```

## Summarized is different from expandable

Date, RegExp, and URL have concise intrinsic summaries. Ordinary objects expose their own properties. Errors expose their own details, including non-enumerable error fields. Arrays and binary values expose indexed children and use grouping when large.

An object summary does not promise that its entire prototype or every host-specific field can be inspected. The [matrix](/reference/types) states the boundary for each adapter.

## Collection addresses are not property paths

Maps can contain object keys. Sets have values without property names. Their rows use explicit iteration-position addresses, so a collection insertion or removal may change what an address refers to.

The inspector does not manufacture JSON Pointers for these rows. See [paths](/concepts/paths) for rich addresses and conversion rules.

## Opaque values are deliberate

Functions are represented without invocation; Promises are represented without awaiting or reading a resolved state. WeakMap and WeakSet contents cannot be enumerated. Recognized DOM and React values have bounded specialized treatment rather than an unrestricted walk through framework internals.

Opacity is a statement about inspection support, not a claim that a value is empty. Read [safe inspection](/concepts/safe-inspection) for reflection and custom-callback boundaries.

## Teach the inspector about a domain value

A [custom type](/guides/custom-types) supplies a summary, optional paged children, and optional search text. It composes with either [presentation](/guides/presentation) and retains the same navigation, paths, and actions.

Try the [predefined JavaScript scenarios](/playground?section=scenarios). Pasted playground input accepts JSON only; it does not evaluate JavaScript expressions.
