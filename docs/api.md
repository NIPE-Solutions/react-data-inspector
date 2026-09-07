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

`searchOptions` supports `scope: 'keys' | 'values' | 'keys-and-values'` (last by default), `debounce` (150 ms), `maxNodes` (100,000, maximum 1,000,000), `maxResults` (1,000, maximum 10,000), and `stringLimit` (65,536). Work yields between bounded tasks. A search can be limited by depth, collections, nodes, result count or string truncation. Search enumerates hidden branches; normal collapsed rendering does not. Counts indicate incomplete results. Shared descendants are visited once.

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

Styles are scoped with zero-specificity selectors rooted in `[data-rdi-root]:not([data-rdi-unstyled])`. No global reset or CSS-in-JS runtime. Consumer CSS variables override defaults without specificity escalation.

| Variables                                                           | Meaning                                    |
| ------------------------------------------------------------------- | ------------------------------------------ |
| --rdi-font-family, --rdi-font-size, --rdi-line-height               | Typography                                 |
| --rdi-background, --rdi-foreground, --rdi-muted                     | Surface and text                           |
| --rdi-key-color, --rdi-string-color, --rdi-number-color             | Key, string, number/bigint syntax          |
| --rdi-boolean-color, --rdi-null-color, --rdi-special-color          | Boolean, nullish/accessor, special syntax  |
| --rdi-row-height, --rdi-indent                                      | Uniform row height and logical indentation |
| --rdi-radius, --rdi-border-color                                    | Frame treatment                            |
| --rdi-hover-background, --rdi-selected-background, --rdi-focus-ring | Interaction state                          |

Stable presence selectors: `data-rdi-root`, `data-rdi-node`, `data-rdi-tree`, `data-rdi-key`, `data-rdi-value`, `data-rdi-toggle`, `data-rdi-actions`, `data-rdi-reference`, `data-rdi-search`, `data-rdi-footer`, `data-rdi-unstyled`, `data-rdi-match` (only matches).

Stable state attributes: `data-type`, `data-depth` (zero-based display depth), `data-expanded`, `data-selected`, `data-focused` (string true/false), `data-theme`, `data-density`. DOM nesting and private CSS class names are not a styling contract. Logical padding supports RTL. Search matches are underlined, focus is outlined, selection has its own fill.

In unstyled mode, provide your own tree overflow, single-line row geometry, indentation, focus and selection appearance. The current virtualizer requires uniform row heights; use `virtualization={false}` for wrapping or variable-height custom rows. Even without virtualization, grouping and the row limit remain active.

## Editing design

No editing prop is exported in this alpha. The next editing stage proposes a readonly replace/add/remove union with `path`, `value`, and `previousValue` where applicable. The application decides whether to apply a proposal. Initial string/number/boolean/null input will use deterministic parsing and normal form controls; any later JSON text mode uses JSON.parse. JSON Patch conversion will be restricted to compatible paths and values, not used as the internal model.
