## Replace the root API

Version 0.2.10 uses a default `JsonView`, a `src` prop, and source CSS. React Data Inspector uses a named component, `value`, and an exported stylesheet.

```tsx
// before
import JsonView from 'react18-json-view'
import 'react18-json-view/src/style.css'
export const Before = () => <JsonView src={{ ready: true }} />
```

```tsx
// after
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'
export const After = () => <DataInspector value={{ ready: true }} />
```

## Map behavior explicitly

| react18-json-view 0.2.10       | React Data Inspector                                           |
| ------------------------------ | -------------------------------------------------------------- |
| `src`                          | `value`                                                        |
| `collapsed`                    | `defaultExpandedDepth`, default paths, or controlled paths     |
| `enableClipboard`              | `copyable` and optional `serialize`                            |
| `theme`, source CSS variables  | `theme` plus exported stylesheet tokens                        |
| `customizeNode`, custom arrows | `components` content slots                                     |
| `onAdd`, `onEdit`, `onDelete`  | No editing API; update application state outside the inspector |

Numeric depth is not a drop-in rename. `collapsed={n}` collapses source nodes whose package depth is greater than `n`; `defaultExpandedDepth={n}` opens React Data Inspector nodes whose zero-based data depth is less than `n`. Check nested fixtures and use explicit paths when the exact initial shape matters.

React Data Inspector models cycles and shared object identity as references and can address symbols and collection positions with rich paths. Input remains application-owned; callbacks receive readonly context rather than mutation helpers.

Source verified against [`react18-json-view@0.2.10`](https://github.com/YYsuni/react18-json-view/tree/96815ffd2fa895494a8a34bb2fc5959620136c0b).
