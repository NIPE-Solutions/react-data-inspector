# React Data Inspector

A structured JavaScript data inspector for React: inspect the value you actually have.

**Alpha package, not yet published to npm.** [Website](https://react-data-inspector.nipesolutions.com) · [Playground](https://react-data-inspector.nipesolutions.com/playground) · [Documentation](https://react-data-inspector.nipesolutions.com/docs). Run `npm install && npm run dev` locally. See [release readiness](docs/release-readiness.md) before production adoption.

```tsx
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'

;<DataInspector value={data} />
```

Until publication, run `npm run build && npm pack` and install the generated tarball in your application.

## Why this exists

JavaScript data is a graph. Dates, collections, undefined values, symbols and object identity deserve explicit semantics. A getter should not run just because a debugging panel opened.

- Distinct circular and shared references, with reference target navigation.
- Real JavaScript types and descriptor-based property inspection.
- Controlled expansion and selection; cancellable search through collapsed data.
- Hierarchical ranges and bounded rendering for large values.
- Tree keyboard navigation, separate focus/selection, accessible actions.
- Inspector and classic presentations on the same graph engine.
- CSS variables, targeted slots, custom types and actions, unstyled mode.
- React 18.3/19, SSR, TypeScript, ESM/CJS; no runtime dependencies beyond React peers.

## Change only what you need

```tsx
<DataInspector
  value={data}
  types={[moneyType]}
  actions={[openEntityAction]}
  className="my-inspector"
/>
```

```css
.my-inspector {
  --rdi-background: #f7fbf9;
  --rdi-string-color: #206246;
  --rdi-focus-ring: #1d664c;
}
```

Prefer quoted keys and object-viewer syntax? Set `presentation="classic"`; see [presentation modes](https://react-data-inspector.nipesolutions.com/guides/presentation).

See the [compiled customization examples](examples/customization.tsx), [API reference](docs/api.md), [architecture and type matrix](docs/architecture.md), and [performance methodology](benchmarks/README.md).

The alpha is read-only; editing is not part of the public API. Getters are not evaluated, promises are not awaited, functions are not executed, and WeakMap/WeakSet contents remain opaque. Collection paths are not presented as JSON Pointers.

## Development

```sh
npm run check
npm run test:e2e
npm run benchmark
```

[MIT](LICENSE) · [NIPE Open Source](https://oss.nipesolutions.com)

The [playground guide](docs/playground.md) covers live external updates, type scenarios, customization and opt-in measurements. Run `npm run dev` and open `/playground`.
