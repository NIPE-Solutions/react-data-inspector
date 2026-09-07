## Import the component and styles

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'

const data = { status: 'ready', attempts: 3 }

export function DebugPanel() {
  return <DataInspector value={data} aria-label="Job payload" />
}
```

The root export includes the component, path helpers, `defineInspectorType`, and their public TypeScript types. Import the stylesheet once in the application entry point. Use `unstyled` only when supplying the full visual treatment yourself.

React and React DOM are peer dependencies. The supported peer ranges are React 18.3 and React 19.

## Server rendering and hydration

The initial render does not read `window`, measure layout, or start search work. Virtualization begins after mount, so the server and first client render share the same tree markup. React's `useId` scopes the generated DOM IDs.

```tsx
import { renderToString } from 'react-dom/server'
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const html = renderToString(<DataInspector value={{ status: 'ready' }} />)
```

Hydration still follows normal React rules: provide equivalent input, controlled paths, messages, and custom type definitions on server and client. Browser-only slot code or callbacks can make your integration unsafe for SSR even though the built-in component is safe. Automated SSR and hydration checks cover React 18.3.1 and 19.2.8; this is not a claim about every framework's streaming or server-component boundary.
