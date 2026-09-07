## Compatibility matrix

| JavaScript value                                        | Display and expansion                                                    | Current boundary                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| string, boolean, null, undefined                        | Terminal primitive                                                       | Strings are truncated for display by `stringLimit`.                     |
| number, bigint, symbol                                  | Terminal primitive; preserves `-0`, `NaN`, infinities, and bigint suffix | Symbol descriptions are labels, not identity.                           |
| function                                                | Terminal `ƒ name()` summary                                              | Never called; own properties are not expanded.                          |
| plain object and class instance                         | Enumerable own string and symbol properties                              | Prototype chain is not shown. Non-enumerables are opt-in.               |
| Array                                                   | Indexed children, including explicit empty rows for holes                | Non-index properties are excluded.                                      |
| Date, RegExp, URL                                       | Terminal intrinsic summary                                               | Invalid Date is explicit; no object properties.                         |
| Error subclasses                                        | Expandable own error details                                             | Includes non-enumerable own error properties.                           |
| Map                                                     | Key and value rows by iteration position                                 | Stops after 10,000 entries; insertion changes paths.                    |
| Set                                                     | Value rows by iteration position                                         | Stops after 10,000 entries; insertion changes paths.                    |
| typed arrays                                            | Indexed element rows                                                     | Extra properties are excluded.                                          |
| DataView, ArrayBuffer                                   | Indexed byte rows                                                        | Byte paths are rich custom segments.                                    |
| SharedArrayBuffer                                       | Opaque summary                                                           | Bytes are not read.                                                     |
| WeakMap, WeakSet, Promise                               | Opaque summary                                                           | Contents or state cannot be inspected.                                  |
| Recognized HTML elements, Text, Document, React element | Opaque recognized summary                                                | SVG, Comment and DocumentFragment fall back to own-property inspection. |
| getter/setter property                                  | Terminal descriptor marker                                               | Getter is not invoked.                                                  |
| circular/shared object                                  | Terminal reference with target path                                      | Target is scoped to current lazy discovery.                             |
| custom registered type                                  | Summary and optional paged children                                      | Application callbacks execute and own their safety.                     |
| unrecognized object                                     | Enumerable own properties                                                | Proxy reflection may execute traps or fail.                             |

## Try representative values

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const value = {
  bytes: new Uint8Array([1, 2, 3]),
  map: new Map([[{ id: 1 }, 'value']]),
  weak: new WeakMap<object, string>(),
  special: [-0, NaN, 42n, undefined],
}
export function Matrix() {
  return <DataInspector value={value} defaultExpandedDepth={2} />
}
```

Depth, string, grouping, search, copy, and visible-row limits apply independently of type support. An inspection failure renders a diagnostic and can be reported through `inspectionOptions.onInspectionError`.
