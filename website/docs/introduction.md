## A data inspector, not a JSON formatter

React Data Inspector renders application-owned JavaScript values as an accessible tree. It understands values JSON cannot represent, including `undefined`, bigint, symbols, typed arrays, Map, Set, shared references, and cycles. Input remains owned by the application and is never mutated.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'

const data = { user: { id: 42, roles: new Set(['admin']) } }

export function Example() {
  return <DataInspector value={data} searchable />
}
```

## Choose it for inspection workflows

The component provides path-based expansion and selection, bounded search, conservative copying, reference navigation, custom domain types, and targeted render slots. It is read-only: editing, patch generation, schema forms, and diffing are outside the current API.

Version 1.0 provides a stable read-only inspection API. React 18.3.1 and 19.3.0 have automated unit, component, SSR, hydration, keyboard, and axe coverage. Human VoiceOver and NVDA audits remain adopter qualification; evaluate the component against your own browser and assistive-technology requirements.
