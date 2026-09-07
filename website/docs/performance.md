## Reproduce the evidence

Run benchmarks from a clean repository checkout. Fixture allocation is excluded from the model timing.

```sh
npm ci
npm run benchmark
npm run benchmark:memory
npm run benchmark:browser
```

Download the recorded [model results](/evidence/model.json) and [methodology](/evidence/methodology.md). The model suite uses one warmup and ten measured runs and records raw samples, median, and p95. Search records three runs and whether limits were reached. The forced-GC experiment observes discarded model roots; it does not prove the absence of mounted browser leaks.

## Interpret like-for-like work

Collapsed, expanded, and grouped states perform different work. SSR timings use development React in-process and are not browser render timings. Browser results include automation overhead and search debounce. Wide-object key enumeration is synchronous. Comparisons require the same fixture, expansion state, browser, production mode, and limits. No competitor timing claim follows from these measurements.
