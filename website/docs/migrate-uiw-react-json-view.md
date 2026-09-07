## Replace the v2 alpha root

Version 2.0.0-alpha.43 uses a default `JsonView` with `value` and compound child components. React Data Inspector keeps `value`, but uses named imports, stylesheet tokens, and a `components` slot object.

```tsx
// before
import JsonView from '@uiw/react-json-view'
export const Before = () => <JsonView value={{ ready: true }} />
```

```tsx
// after
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'
export const After = () => <DataInspector value={{ ready: true }} />
```

## Re-map customization

| @uiw/react-json-view 2.0.0-alpha.43      | React Data Inspector                                   |
| ---------------------------------------- | ------------------------------------------------------ |
| default `JsonView`, `value`              | named `DataInspector`, `value`                         |
| `collapsed`, `shouldExpandNodeInitially` | default depth/paths or controlled `expandedPaths`      |
| compound child render components         | `components` content slots                             |
| theme package imports and CSS properties | stylesheet tokens plus `theme`                         |
| `onCopied`, compound `Copied`            | No success callback equivalent; built-in copy feedback |
| update highlighting and editor export    | No direct equivalents                                  |

`serialize` changes the text to copy; it is not a notification that clipboard writing succeeded.

Numeric depths use different coordinate systems. UIW collapses descendant nodes when its internal `level > collapsed`; React Data Inspector expands nodes whose zero-based data depth is below `defaultExpandedDepth`. Verify the desired shape or use explicit paths.

React Data Inspector treats cycles and repeated object identity as navigable references and uses rich paths for non-property data. It never owns or mutates the input. Slots customize content within library-owned tree behavior; application state owns any editing workflow.

Source verified against [`@uiw/react-json-view@2.0.0-alpha.43`](https://github.com/uiwjs/react-json-view/tree/30b9760d22c4163d68c01c03854fd14bf5ae9bd9).
