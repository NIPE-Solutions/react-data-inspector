## Choose the smallest layer

Visual changes and domain behavior use different extension points. Start with the layer that owns your change; replacing a value summary should not require reimplementing tree navigation.

| Change                                 | Extension point                            |
| -------------------------------------- | ------------------------------------------ |
| Color, font, spacing                   | CSS variables                              |
| A selected or typed value's appearance | Stable data attributes                     |
| Classic object-viewer notation         | `presentation`                             |
| One icon or content region             | `components` slots                         |
| A domain value's meaning               | `types` registry                           |
| An application operation               | `actions`                                  |
| Application coordination               | Controlled expansion, selection, and query |
| Every visual rule                      | `unstyled` and application CSS             |

## Change colors with CSS

```css
.billing-inspector {
  --rdi-background: #f7fbf9;
  --rdi-string-color: #206246;
  --rdi-focus-ring: #1d664c;
}
.billing-inspector [data-type='number'] {
  font-variant-numeric: tabular-nums;
}
```

Apply `className="billing-inspector"` to the inspector. Root `className` and `style` are normal React styling hooks. The [styling reference](/reference/styling) owns the complete token and attribute contract.

Use `theme="light"`, `theme="dark"`, or the default `theme="system"` for built-in color preferences. `density` chooses `compact` or `comfortable`. [Presentation](/guides/presentation) is independent from both.

## Replace only a toggle

```tsx
import {
  DataInspector,
  type InspectorSlotProps,
} from '@nipe-solutions/react-data-inspector'

const Toggle = ({ expanded }: InspectorSlotProps) => (
  <span>{expanded ? '−' : '+'}</span>
)

export function CustomToggle() {
  return <DataInspector value={{ user: { id: 42 } }} components={{ Toggle }} />
}
```

The library still owns the toggle button and tree interaction. Other slots are `Key`, `Value`, `Reference`, and `Actions`. They replace content, not the behavior engine. Preserve accessible names and avoid adding extra row tab stops.

## Extend application actions

```tsx
import { useState } from 'react'
import { DataInspector, formatPath } from '@nipe-solutions/react-data-inspector'

export function InvoiceActions() {
  const [openedPath, setOpenedPath] = useState('No node opened')
  return (
    <section>
      <DataInspector
        value={{ invoice: { id: 'INV-42' } }}
        actions={[
          {
            id: 'open-in-application',
            label: 'Open in application',
            when: (node) => node.label === 'invoice',
            onAction: (node) => setOpenedPath(formatPath(node.path)),
          },
        ]}
      />
      <aside aria-live="polite">Application panel: {openedPath}</aside>
    </section>
  )
}
```

The action is added alongside default copy actions. It receives readonly node context and no mutation helpers. Use stable unique action IDs. See [API reference](/reference/api#slots-and-custom-actions) for asynchronous actions and failure behavior.

## Add domain meaning or controlled behavior

A [custom type](/guides/custom-types) supplies a value summary and optional paged children without replacing the row renderer. [Controlled state](/guides/controlled-state) coordinates the inspector with other application panels.

These are separate responsibilities: use actions to invoke an operation, types to describe a value, and controlled props to own state.

## Own appearance with unstyled

`unstyled` removes default appearance while retaining semantics, state, keyboard behavior, and stable attributes. Supply your own overflow, row geometry, indentation, controls, visible focus, selection, and value differentiation.

The current virtualizer requires uniform row heights. Disable virtualization if application CSS introduces wrapping or variable heights; grouping and visible-model limits remain. The [styling reference](/reference/styling#unstyled-responsibilities) lists those responsibilities.

Try the [customization playground](/playground?section=customization), including a complete unstyled example and copyable CSS. This guide explains extension boundaries; the playground owns the experiment controls.
