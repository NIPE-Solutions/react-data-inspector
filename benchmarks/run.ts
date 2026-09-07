import { performance } from 'node:perf_hooks'
import { cpus, platform, release, arch } from 'node:os'
import { writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createModel, buildVisible } from '../src/model/graph'
import { searchValue } from '../src/model/search'
import { DataInspector } from '../src'
import { fixtures } from './fixtures'
const samples = 10
function measure(run: () => unknown) {
  run()
  const values = Array.from({ length: samples }, () => {
    const start = performance.now()
    run()
    return performance.now() - start
  }).sort((a, b) => a - b)
  return {
    medianMs: values[Math.floor(samples / 2)],
    p95Ms: values[Math.ceil(samples * 0.95) - 1],
    samplesMs: values,
  }
}
const rows = []
for (const [name, value] of Object.entries(fixtures())) {
  const collapsed = measure(() => buildVisible(createModel(value), () => false))
  const expanded = measure(() =>
    buildVisible(createModel(value), (n) => n.depth < 2 && !n.synthetic),
  )
  const model = createModel(value)
  buildVisible(model, (n) => n.depth < 2 && !n.synthetic)
  const collapse = measure(() => buildVisible(model, () => false))
  const ssr = measure(() =>
    renderToString(
      createElement(DataInspector, { value, defaultExpandedDepth: 1 }),
    ),
  )
  const searchTimes = []
  let searchResult
  for (let i = 0; i < 3; i++) {
    const start = performance.now()
    searchResult = await searchValue(value, 'needle')
    searchTimes.push(performance.now() - start)
  }
  rows.push({
    name,
    collapsed,
    expanded,
    collapse,
    ssr,
    visibleRows: buildVisible(
      createModel(value),
      (n) => n.depth < 2 && !n.synthetic,
    ).length,
    search: {
      samplesMs: searchTimes,
      scanned: searchResult?.scanned,
      limited: searchResult?.limited,
    },
  })
}
const report = {
  date: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: platform(),
    release: release(),
    arch: arch(),
    cpu: cpus()[0]?.model,
  },
  methodology:
    'One warmup, 10 sync samples; 3 search samples. Construction excluded. In-process development React SSR, not browser performance. Expansion depth 2, ranges stay closed. Search default budgets. Values are frozen by ownership contract, not deep-freeze instrumentation.',
  rows,
}
writeFileSync('benchmarks/results.json', JSON.stringify(report, null, 2) + '\n')
console.table(
  rows.map((r) => ({
    fixture: r.name,
    collapsed: r.collapsed.medianMs?.toFixed(2),
    expanded: r.expanded.medianMs?.toFixed(2),
    ssr: r.ssr.medianMs?.toFixed(2),
    visible: r.visibleRows,
    searchMs: r.search.samplesMs[0]?.toFixed(1),
    limited: r.search.limited,
  })),
)
