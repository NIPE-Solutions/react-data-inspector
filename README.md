# React Data Inspector

Put an expandable view of application data in a React debugging panel, admin screen, or support tool. React Data Inspector displays JavaScript values that a JSON viewer would lose or flatten: dates, collections, `undefined`, symbols, shared objects, and circular references.

It is useful when the question is “what is in this value?” and the answer needs more than serialized JSON. It reads property descriptors without evaluating getters and distinguishes a repeated reference from a cycle, with navigation to the referenced value.

[Try the playground](https://react-data-inspector.nipesolutions.com/playground) · [Documentation](https://react-data-inspector.nipesolutions.com/docs) · [npm](https://www.npmjs.com/package/@nipe-solutions/react-data-inspector)

## Add it to a React app

Requires React and React DOM 18.3 or 19. The package includes TypeScript declarations, ESM and CommonJS entry points, and a separate stylesheet.

```sh
npm install @nipe-solutions/react-data-inspector
```

Use this as an `App.tsx` in an existing React app:

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'

const user = { name: 'Alice', roles: new Set(['admin', 'editor']) }
const request: { user: typeof user; retryOf?: unknown } = { user }
request.retryOf = request

const data = {
  request,
  currentUser: user, // The same object, not a second copy.
  receivedAt: new Date('2026-09-30T12:00:00Z'),
  counts: new Map([['attempts', 2]]),
  optional: undefined,
}

export default function App() {
  return (
    <DataInspector
      value={data}
      searchable
      defaultExpandedDepth={2}
      aria-label="Request data"
    />
  )
}
```

Expand the request to follow its circular `retryOf` reference. The user appears in two places, and reference navigation links them to the same object. `searchable` adds search through collapsed branches. Import the stylesheet once in your app; omitting it leaves you responsible for the appearance.

The inspector reads application-owned data and does not edit it. When the data changes, rerender its parent: the component inspects again even when the value has the same object reference.

## Where it fits

Choose it for a React view of live JavaScript data, especially when identity, real types, search, or application-specific actions matter. Expansion, selection, and search can be controlled by your app. Large arrays are grouped into ranges, and windowed rendering bounds the number of mounted rows.

For a JSON-only response, a smaller JSON tree may be enough. For a static log or download, serialize the data with the semantics you need. For interactive debugging of arbitrary browser objects, the browser's developer tools offer capabilities this embedded component does not provide. Editing and JSON Patch generation are outside this package's API.

Prefer the appearance of a traditional object viewer? Set `presentation="classic"` for quoted keys and container delimiters; the same graph, search, and navigation behavior remains available. See [presentation modes](https://react-data-inspector.nipesolutions.com/guides/presentation).

## Match your application

Start with CSS variables on your own class. For example, add `className="request-inspector"` to the component above and put this in your app stylesheet:

```css
.request-inspector {
  --rdi-background: #f7fbf9;
  --rdi-string-color: #206246;
  --rdi-focus-ring: #1d664c;
}
```

The [styling reference](https://react-data-inspector.nipesolutions.com/reference/styling) documents the supported variables and attributes. The [customization guide](https://react-data-inspector.nipesolutions.com/guides/customization) covers replacing individual slots, registering custom types, adding actions, and using unstyled mode. The [compiled examples](examples/customization.tsx) show these together without requiring you to replace the whole renderer.

## Inspection limits

Getters are not evaluated, promises are not awaited, and functions are not executed. WeakMap and WeakSet contents remain opaque. This is not a sandbox: supplied Proxy traps and your custom inspection callbacks can execute application code.

Inspection and search have bounds. The default contract includes the first 10,000 Map/Set entries, depth limits, and bounded search results; a search count can be incomplete. Virtualized rows require uniform heights. Collection and symbol paths are not JSON Pointers, and copying refuses subtrees that cannot be represented losslessly as JSON. See the [API](docs/api.md), [type matrix and architecture](docs/architecture.md), and [limitations](https://react-data-inspector.nipesolutions.com/limitations) before depending on those details.

Stable 1.0 includes automated React, SSR, keyboard, and browser checks. Human screen-reader audits, physical-device qualification, and representative production integration remain unverified; the [release evidence](docs/release-readiness.md) records what has and has not been verified.

## Work on the package

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite; `/playground` contains live updates, type scenarios, and customization examples. Run `npm run check` for formatting, types, unit tests, builds, website checks, and packed-package verification. `npm run test:e2e` runs the browser suite separately. Benchmark commands and interpretation are in the [performance methodology](benchmarks/README.md).

[MIT](LICENSE) · [NIPE Open Source](https://opensource.nipesolutions.com)
