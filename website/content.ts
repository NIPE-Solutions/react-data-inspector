export const guide = [
  {
    id: 'introduction',
    title: 'Introduction',
    text: 'React Data Inspector is a focused primitive for application-owned data. It inspects JavaScript values, identity and references without mutating input. This is an alpha implementation; see the release assessment before adopting it in production.',
  },
  {
    id: 'installation',
    title: 'Installation',
    text: 'The package name has been checked against npm and NIPE conventions. This alpha is not published yet. Build the repository, run npm pack, and install the resulting tarball. The commands below describe the package import contract.',
    code: "import { DataInspector } from '@nipe-solutions/react-data-inspector'\nimport '@nipe-solutions/react-data-inspector/styles.css'\n\n<DataInspector value={data} />",
  },
  {
    id: 'expansion',
    title: 'Expansion',
    text: 'The root opens by default. defaultExpandedDepth applies to data nodes, never automatically to synthetic ranges. expandedPaths is authoritative; callbacks propose the entire next set. Existing path expansion survives data updates. Array and collection state follows positions, not entity identity. Disappeared paths are ignored.',
    code: '<DataInspector\n  value={data}\n  expandedPaths={expanded}\n  onExpandedPathsChange={setExpanded}\n/>',
  },
  {
    id: 'selection',
    title: 'Selection',
    text: 'Focus and selection are distinct. Arrow keys move focus; Space or clicking a row selects. Enter toggles branches, follows references, or selects a leaf. Clicking reference text jumps to the original. selectedPath can be null for no selection. The change callback receives both the path and a readonly node context, so an application can update an adjacent details panel. Range groups are navigation aids, not selectable data.',
  },
  {
    id: 'search',
    title: 'Search',
    text: 'Enable searchable for the search controls, or control searchQuery externally. Search traverses collapsed data in cancellable tasks with a 150 ms debounce. searchOptions.scope accepts keys, values or keys-and-values. Next/previous reveals ancestors and selects a match while keeping focus in the controls. Counts disclose partial searches. Default limits are 100,000 visited rows, 1,000 results and 64 KiB per string. Incoming data coalesces into follow-up scans without restarting query debounce. Completed results remain usable during refresh. Search may revisit a shallower shared path to cover depth-limited descendants; reference labels can still match.',
  },
  {
    id: 'copying',
    title: 'Copying',
    text: 'The focused node has an actions panel, opened with F2 or the Node actions button. Copy value, key, path and compatible JSON Pointer are available. Default subtree copying refuses accessors, non-JSON values, sparse arrays, cycles and shared identity. It never invokes toJSON. Copy is capped at 10,000 nodes and 1 MB output. serialize can supply application-specific text. Clipboard failure exposes selectable text.',
  },
  {
    id: 'editing',
    title: 'Editing',
    text: 'Read-only by default, and read-only in this alpha. Editing is staged after the inspection core. The design is an immutable replace/add/remove proposal containing a DataPath and values; the application accepts or rejects it. No input mutation or JavaScript evaluation will be added. Primitive parsing will be deterministic, with JSON.parse reserved for explicit JSON input.',
  },
  {
    id: 'paths',
    title: 'Paths',
    text: 'Ordinary object keys and array indices use readonly (string | number) segments. Symbols, Map keys/values, Set values, custom children and synthetic ranges use discriminated records. formatPath displays inspector addresses; toJavaScriptPath, toJsonPointer and toJsonPath return undefined for rich segments. JSON Pointer escapes ~ and /. Root Pointer is the empty string. A symbol description is a display label, never its identity.',
    code: "toJsonPointer(['user', 'addresses', 0]) // /user/addresses/0\ntoJavaScriptPath(['user', 'name']) // user.name\nformatPath([{ kind: 'map-value', index: 0 }]) // $⟨Map:0:value⟩",
  },
  {
    id: 'types',
    title: 'JavaScript types',
    text: 'Primitives include undefined, bigint, symbol, NaN, Infinity and -0. Built-ins cover arrays, Date, RegExp, Error, URL, Map, Set, typed arrays, ArrayBuffer and DataView. Invalid Dates are explicit. Functions are not executed; Promises are not awaited. WeakMap and WeakSet are opaque. DOM and React element detection provides limited opaque summaries. See the repository type matrix for exact limitations.',
  },
  {
    id: 'references',
    title: 'Circular and shared references',
    text: 'An identity in the current ancestor chain is circular. An identity already discovered elsewhere is shared. Both render terminal reference rows. Canonical targets mean first discovered in the current lazy inspection generation, not globally first in hidden data. Targets can change after a parent rerender or discovery-order change. Expansion remains path-oriented. Functions and special objects participate in identity tracking too.',
  },
  {
    id: 'large-data',
    title: 'Large data',
    text: 'A collapsed object does not enumerate descendants. Huge arrays open into hierarchical ranges with at most 100 groups per level. Plain wide objects must enumerate their own keys once; JavaScript has no incremental ownKeys API. Visible model rows are capped at 10,000 with a limit notice. Auto windowing starts above 200 rows; virtualization={false} disables windowing while retaining grouping. Rows are single-line with a measured uniform height: arbitrary wrapping slots are not supported by the current virtualizer. Large Map/Set scans have an explicit traversal cap.',
  },
  {
    id: 'customization',
    title: 'Customization',
    text: 'Start with the default. Change only what you need. Use CSS variables for appearance, data attributes for selectors, slots for targeted content, types for domain values, and actions for application behavior. unstyled removes the default appearance while preserving DOM semantics and controls. Root className/style are forwarded. Light/dark/system themes are CSS-based. Density is compact or comfortable.',
    code: '.my-inspector {\n  --rdi-background: #f7fbf9;\n  --rdi-string-color: #206246;\n  --rdi-number-color: #934b08;\n  --rdi-focus-ring: #1d664c;\n}',
  },
  {
    id: 'slots',
    title: 'Slots and actions',
    text: 'components accepts Toggle, Key, Value, Reference and Actions independently. Toggle supplies only the icon; the library retains the button and tree behavior. Slot props include node, selected, focused and expanded. Actions receives built-ins plus extensions. Custom actions specify id, label, optional when(node), and onAction(node). Promise rejection becomes local feedback. Custom render components have localized error boundaries.',
  },
  {
    id: 'custom-types',
    title: 'Custom types',
    text: 'defineInspectorType<T> preserves inferred value types in callbacks. Custom definitions run in declaration order before built-ins. Return a concise summary and optionally a counted, paged children source. Child keys must be stable and unique. Custom child addresses are not JSON properties. Matchers and renderers are application code and own their side effects.',
    code: "const moneyType = defineInspectorType<Money>({\n  id: 'money',\n  matches: (value): value is Money => value instanceof Money,\n  summary: value => `${value.currency} ${value.amount.toFixed(2)}`,\n  children: value => ({\n    count: 2,\n    getPage: (offset, limit) => [\n      { key: 'amount', value: value.amount },\n      { key: 'currency', value: value.currency },\n    ].slice(offset, offset + limit),\n  }),\n})",
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    text: 'Nested treeitem/group semantics retain ownership under windowing. The tree has one navigation tab stop and active-descendant focus. Arrow keys, Home/End, type-ahead, Enter/Space and F2 are supported. Search Enter advances and Shift+Enter moves backwards. Search controls and current-node actions have normal tab stops. Selection, focus and search matches have distinct styling. Automated browser checks do not establish screen-reader compatibility; manual VoiceOver and NVDA audits remain a public-beta gate.',
  },
  {
    id: 'ssr',
    title: 'SSR and React',
    text: 'React 18.3 and React 19 are the peer targets. Server render never reads browser globals. React useId scopes DOM IDs; client and server must receive equivalent input and custom definitions. Windowing initializes after mount using the same initial markup. Effects cancel search on query/value replacement and unmount. The inspector expects React to rerender when data changes; same-reference parent rerenders are re-inspected.',
  },
  {
    id: 'performance',
    title: 'Performance',
    text: 'Benchmarks are reproducible scripts in the repository with raw results and environment information. Inspect collapsed, expanded and grouped states separately: dataset size alone does not describe work. Model traversal, browser rendering and search timings are different measurements. No competitor speed claim is made. Built-in reflection is synchronous; a hostile proxy or custom callback can block JavaScript and cannot be preempted by this library.',
  },
  {
    id: 'api',
    title: 'API reference',
    text: 'The package exports DataInspector, defineInspectorType, formatPath, pathEqual, toJavaScriptPath, toJsonPointer and toJsonPath. Types describe props, slots, actions, node contexts, paths, registered types, messages, inspection/search options and serialization results. Model classes and reducers are private. See docs/api.md for defaults and complete contracts.',
  },
  {
    id: 'limitations',
    title: 'Limitations',
    text: 'Getters stay unevaluated. Weak collections are opaque. Promises/functions do not execute. Array inspection prioritizes indexed values; extra properties are disclosed separately or excluded as documented. Default copy refuses unsupported graph semantics. Rich paths may not be serializable. Collection addresses and selection follow positions. There is no editor, arbitrary JS playground, prototype explorer, worker, schema form or diff engine. Public beta requires additional manual accessibility and real integration evidence.',
  },
] as const
