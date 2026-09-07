## Theme with the public CSS contract

Start with CSS variables and stable data attributes, then replace only the content that needs application knowledge. `className` and `style` reach the root; `theme` accepts `light`, `dark`, or `system`; `density` accepts `compact` or `comfortable`.

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

The public tokens are `--rdi-font-family`, `--rdi-font-size`, `--rdi-line-height`, `--rdi-background`, `--rdi-foreground`, `--rdi-muted`, the key/string/number/boolean/null/special color tokens, `--rdi-row-height`, `--rdi-indent`, `--rdi-radius`, `--rdi-border-color`, and the hover/selected/focus interaction tokens. Defaults use zero-specificity selectors, so a class on the inspector can override them directly.

Stable presence hooks are `data-rdi-root`, `data-rdi-tree`, `data-rdi-node`, `data-rdi-key`, `data-rdi-value`, `data-rdi-toggle`, `data-rdi-actions`, `data-rdi-reference`, `data-rdi-search`, `data-rdi-footer`, `data-rdi-unstyled`, and `data-rdi-match`. Stable state attributes are `data-type`, `data-depth`, `data-expanded`, `data-selected`, `data-focused`, `data-theme`, and `data-density`. Treat DOM nesting and class names as private.

## Slots, actions, and controlled state

```tsx
import { useState } from 'react'
import {
  DataInspector,
  type DataPath,
  type InspectorSlotProps,
} from '@nipe-solutions/react-data-inspector'

const Toggle = ({ expanded }: InspectorSlotProps) => (
  <span>{expanded ? '−' : '+'}</span>
)
export function Customized() {
  const [selectedPath, setSelectedPath] = useState<DataPath | null>(null)
  const [openedPath, setOpenedPath] = useState('No node opened')
  return (
    <section>
      <DataInspector
        className="billing-inspector"
        value={{ invoice: 'INV-42' }}
        components={{ Toggle }}
        actions={[
          {
            id: 'open-in-application',
            label: 'Open in application',
            onAction: (node) => setOpenedPath(JSON.stringify(node.path)),
          },
        ]}
        selectedPath={selectedPath}
        onSelectedPathChange={setSelectedPath}
      />
      <aside aria-live="polite">Application panel: {openedPath}</aside>
    </section>
  )
}
```

Slots also include `Key`, `Value`, `Reference`, and `Actions`. Preserve tree semantics and avoid extra row tab stops. `types` adds domain adapters.

## Own every visual rule with `unstyled`

`unstyled` removes all default appearance selectors while retaining semantics, keyboard behavior, and data attributes. Your CSS must provide tree overflow, uniform single-line row geometry and indentation, visible focus and selection, controls, action feedback, and value differentiation. The current virtualizer needs a uniform row height; set `virtualization={false}` if custom rows wrap or vary in height. Grouping and the visible-row limit still apply.

The website's complete [`.design-system` unstyled example](https://github.com/NIPE-Solutions/react-data-inspector/blob/main/website/style.css#L340-L388) is a working starting point. Copy it into application CSS and keep the `className="design-system"` scope, or adapt every selector to your own root class.
