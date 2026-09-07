## Path segments

`DataPath` is a readonly array. Strings address properties; numbers address array or typed-array indices. Discriminated segments represent symbols, Map keys and values, Set values, custom children, and synthetic ranges. Symbol segments retain symbol identity. Collection segments use iteration position.

```ts
import {
  formatPath,
  pathEqual,
  toJsonPointer,
  toJsonPath,
} from '@nipe-solutions/react-data-inspector'

const path = ['users', 0, 'name'] as const
toJsonPointer(path) // /users/0/name
toJsonPath(path) // $["users"][0]["name"]
formatPath(path) // $.users[0].name
pathEqual(path, ['users', 0, 'name']) // true
```

## Display and interchange

`formatPath` produces a readable inspector address and supports rich segments. It is not executable JavaScript. `toJsonPointer`, `toJavaScriptPath`, and `toJsonPath` accept only string and number segments and return `undefined` for rich paths. JSON Pointer uses the empty string for the root and escapes `~` and `/`. These helpers format paths; they do not parse or evaluate them.
