## One inspector, two presentations

`presentation` changes the built-in visual notation. It does not change the inspected values, paths, reference identity, or behavior engine.

| Value       | Appearance                                                                              |
| ----------- | --------------------------------------------------------------------------------------- |
| `inspector` | Default compact labels and type summaries                                               |
| `classic`   | Quoted property keys and object/array delimiters with explicit JavaScript type notation |

## Inspector presentation

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

export function InspectorExample() {
  return <DataInspector value={{ user: { name: 'Ada' } }} />
}
```

Omitting the prop is equivalent to `presentation="inspector"`.

## Classic presentation

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'

const shared = { name: 'Ada' }
const data: Record<string, unknown> = {
  user: shared,
  copyOfUser: shared,
  createdAt: new Date('2026-09-07T09:00:00Z'),
  roles: new Set(['admin', 'editor']),
  cache: new Map([['status', 'ready']]),
}
data.self = data

export function ClassicExample() {
  return <DataInspector value={data} presentation="classic" />
}
```

Expanded containers open on their data row and close on a separate decorative line after their children. Object properties use quoted keys; the root and array/Set items omit positional labels. Commas follow values or closing delimiters. Collapsed containers retain a compact preview.

Closing lines are not selectable data nodes. The renderer tracks their visual offsets for windowing while keyboard navigation still moves only through meaningful data nodes.

## Non-JSON values remain non-JSON

Date and URL summaries identify their types. Maps and Sets retain collection labels. Map keys and values remain separately addressed meaningful rows, including when a key is an object. Shared and circular references retain their distinct markers and target paths.

Classic presentation is not serialized source. It does not promise executable JavaScript, lossless JSON, or a text document that can be copied back into a parser. [Copying](/docs/copying) uses the same independent serialization policy in both presentations.

## What stays the same

- Expansion, selection, search, reference navigation, and keyboard behavior.
- Application-owned data and descriptor-based inspection.
- Rich paths, grouping, depth limits, and virtualization.
- Themes, density, CSS variables, slots, custom types, and actions.
- Server rendering and the requirement for matching server/client input.

Punctuation is visual decoration and is hidden from assistive technology. It adds no selectable nodes or tab stops. The project's [manual screen-reader audit status](/accessibility) still applies to both presentations.

## Customize the layer you need

Combine `presentation="classic"` with `theme`, `density`, or `unstyled`. Custom `Key`, `Value`, and `Reference` slots own their replacement content; `Toggle` and `Actions` retain their existing responsibilities. Custom domain summaries remain supplied by the type registry.

Use the [styling reference](/reference/styling) for public attributes and CSS variables, or try the [customization playground](/playground?section=customization).

The interaction model follows the [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/). Decorative punctuation uses [`aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden); it never contains focusable controls.

For reproducible rendering comparisons, see the [presentation benchmark methodology](https://github.com/NIPE-Solutions/react-data-inspector/blob/main/benchmarks/README.md#presentation-comparison).
