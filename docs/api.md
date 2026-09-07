# API reference

The root export provides `DataInspector`, `defineInspectorType`, `formatPath`, `pathEqual`, `toJavaScriptPath`, `toJsonPointer`, and `toJsonPath`. Import the scoped default stylesheet from `@nipe-solutions/react-data-inspector/styles.css`. All types used below are exported from the root. Internal nodes, traversal, search scheduling, reducers and windowing are not public APIs.

## DataInspector props

| Prop                        | Type / default                                  | Contract                                                                                                     |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| value                       | unknown, required                               | Application-owned input. Never mutated.                                                                      |
| defaultExpandedDepth        | number / 1                                      | Initialize expansion by data depth; root depth is zero. Ranges do not auto-expand.                           |
| defaultExpandedPaths        | readonly DataPath[] / []                        | Initial explicit expansion addresses.                                                                        |
| expandedPaths               | readonly DataPath[]                             | Controlled complete expansion set; overrides defaults.                                                       |
| onExpandedPathsChange       | (paths) => void                                 | Requests the next complete set. Parent may decline.                                                          |
| selectedPath                | DataPath or null                                | Controlled single selection.                                                                                 |
| defaultSelectedPath         | DataPath or null / null                         | Initial selection.                                                                                           |
| onSelectedPathChange        | (path, node) => void                            | Receives requested selection and readonly context.                                                           |
| searchable                  | boolean / false                                 | Show search controls.                                                                                        |
| searchQuery                 | string                                          | Controlled query, including empty string.                                                                    |
| onSearchQueryChange         | (query) => void                                 | Requests a query change.                                                                                     |
| searchOptions               | SearchOptions                                   | See search configuration.                                                                                    |
| copyable                    | boolean / true                                  | Include built-in copy actions.                                                                               |
| serialize                   | (value, node) => SerializationResult or Promise | Override default copy serialization.                                                                         |
| types                       | readonly RegisteredInspectorType[] / []         | Custom types before built-ins, first match wins.                                                             |
| components                  | InspectorComponents                             | Independently replace Toggle, Key, Value, Reference, Actions content.                                        |
| actions                     | readonly InspectorAction[] / []                 | Extend the action list.                                                                                      |
| messages                    | Partial&lt;InspectorMessages&gt;                | Replace action labels, instructions, summary/nodeLabel functions and parameterized result/reference phrases. |
| className, style            | React root attributes                           | Styling hooks.                                                                                               |
| presentation                | inspector, classic / inspector                  | Visual notation only; shared inspection model and meaningful rows.                                           |
| theme                       | light, dark, system / system                    | CSS-only color preference.                                                                                   |
| density                     | compact, comfortable / compact                  | Default 28px or 36px rows; 40px on coarse pointers.                                                          |
| unstyled                    | boolean / false                                 | Omit all default appearance selectors; keep behavior and attributes.                                         |
| inspectionOptions           | InspectionOptions                               | Descriptor, sorting and work limits.                                                                         |
| arrayGrouping               | { threshold?, size? } / {1000,100}              | Also used for large collection/property sources. Hierarchical ranges bound each level.                       |
| virtualization              | auto, false, {threshold?,overscan?} / auto      | Client windowing above 200 model rows, 8 rows overscan.                                                      |
| aria-label, aria-labelledby | string                                          | Label the tree; default label is Data inspector.                                                             |

`undefined` means uncontrolled for selection/expansion/query; `null` explicitly clears selection. Do not switch controlledness during a mounted instance. Expansion is path-based. Array reorder and collection insertion/removal move values under existing addresses; they do not follow application entity IDs.

The application must rerender when input changes. A parent rerender re-inspects even a same-reference value. Inspection callbacks should remain pure. Custom code or Proxy traps may have their own side effects; the library cannot sandbox them.

## Inspection and search options

`inspectionOptions` supports `includeNonEnumerable` (false), `includeSymbols` (true for enumerable own symbols), `sortKeys` (false, true, or string comparator), `maxDepth` (100, maximum 200), `stringLimit` (200 characters, maximum 100,000), and `onInspectionError(error, path)`. Sorting never reorders Map/Set entries. Error detail adapters include non-enumerable own error properties.

`searchOptions` supports the following settings:

| Option        | Default           | Maximum / choices                   |
| ------------- | ----------------- | ----------------------------------- |
| `scope`       | `keys-and-values` | `keys`, `values`, `keys-and-values` |
| `debounce`    | 150 ms            | Query scheduling delay              |
| `maxNodes`    | 100,000           | 1,000,000                           |
| `maxResults`  | 1,000             | 10,000                              |
| `stringLimit` | 65,536 characters | 100,000 characters                  |

Search yields between bounded tasks and visits hidden branches. Depth, collection, node, result-count, and string limits can make counts incomplete. Query changes cancel earlier scans; data updates coalesce into a follow-up scan while completed results remain available.

See [search behavior](https://react-data-inspector.nipesolutions.com/docs/search) for shared-path revisits, refresh state, controlled queries, and reveal against changing data. A scan is not an atomic snapshot, and synchronous application callbacks cannot be preempted.

## Paths

`DataPath` is a readonly array of `DataPathSegment`:

- string: ordinary own property key.
- number: array/typed-array index.
- `{ kind: 'symbol', key: symbol }`: identity-bearing own symbol property.
- `{ kind: 'map-key' | 'map-value' | 'set-value', index: number }`: iteration position.
- `{ kind: 'custom', typeId: string, key: string }`: application type child or explicit inspector detail.
- `{ kind: 'range', start: number, end: number }`: synthetic expansion address, exclusive end.

Range segments address navigation groups, not actual data. Descendant data paths omit range segments. Range groups are not selectable. `formatPath` prints `$` followed by safe property notation or explicit inspector markers. Its rich output is not JavaScript source. Symbol descriptions are labels; identity is the actual symbol.

`toJsonPointer` returns RFC 6901 syntax for ordinary segments and undefined for rich paths. `toJavaScriptPath` returns property/index syntax (root `$`). `toJsonPath` returns the property/index subset only. Neither is a parser or evaluator. `pathEqual` compares types and symbol identity, so numeric zero differs from the string "0".

## Custom types

The [Money example](../examples/customization.tsx) is compiled and used by the live website. A definition has:

- `id`: stable unique string.
- `matches(value): value is T`: synchronous type guard.
- `summary(value: T): string`: bounded collapsed display.
- `children?(value: T): InspectorChildSource`: lazy source with `count` and `getPage(offset, limit)` returning `{ key: string, value: unknown }` children.
- `searchText?(value: T): string`: optional explicit searchable text.

Use `defineInspectorType<T>` to preserve inference while combining heterogeneous definitions. Children must have unique stable keys, satisfy the requested page, and return synchronously. The inspector bounds returned pages but cannot preempt work inside a custom callback. A failing matcher/summary/source produces an inspection diagnostic. React slot failures have a localized boundary. A custom renderer owns the security of its React output.

## Slots and custom actions

`InspectorSlotProps` contains `node`, `selected`, `focused`, and `expanded`. Node context contains `path`, `label`, `value`, `type`, `summary`, `depth`, `expandable` and an optional reference `{kind, path}`. These are readonly views of context, not cloned or frozen application values. Do not mutate `node.value`.

`Toggle` supplies icon content inside the built-in button. `Key` and `Value` replace their respective content. `Reference` customizes reference text. `Actions` receives a list of composed `{ id, label, run }` actions and the same node state. Preserve accessibility when replacing interactive content; content slots should not insert extra tab stops into tree rows.

`InspectorAction` has a unique stable `id`, `label`, optional `when(node)`, and `onAction(node): void | Promise<void>`. It extends default actions. No mutation helpers are provided. Pending actions disable the default action buttons; failures are shown locally. F2 or the footer button opens the panel; Escape closes and returns focus. Clipboard failure offers selectable text.

`SerializationResult` is `{ok:true,text:string}` or `{ok:false,reason:string}`. Default copying returns primitive text and ISO Date text; object/array subtrees must be losslessly JSON-compatible. Cycles, shared identity, accessors, sparse arrays and unsupported values require a custom serializer. Copy limits are 10,000 descriptors/nodes, depth 100, and 1,000,000 output characters. A custom serializer owns its own bounds and messages.

## Styling contract

The canonical [styling reference](https://react-data-inspector.nipesolutions.com/reference/styling) lists CSS variables, stable presence/state attributes, theme and density defaults, and unstyled responsibilities. Styles remain scoped with zero-specificity selectors; no global reset or CSS-in-JS runtime is required. DOM nesting and implementation class names are private.

## Presentation

`presentation="inspector"` is the default. `presentation="classic"` changes built-in visual notation using quoted property keys and balanced inline container delimiters. It adds no closing-delimiter rows or selectable synthetic punctuation. Both presentations share paths, graph identity, search, selection, expansion, actions, grouping, virtualization, and SSR behavior.

Classic output is not serialized JSON or executable JavaScript. Non-JSON type summaries and separately addressed Map key/value rows retain their meaning. See [presentation modes](https://react-data-inspector.nipesolutions.com/guides/presentation) for examples and customization boundaries.
