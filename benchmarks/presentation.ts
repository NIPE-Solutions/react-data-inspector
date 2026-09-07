import { performance } from 'node:perf_hooks'
import { arch, cpus, platform } from 'node:os'
import { createElement, version as reactVersion } from 'react'
import { renderToString } from 'react-dom/server'
import { DataInspector, type DataInspectorProps } from '../src'

// Run: npx tsx benchmarks/presentation.ts > presentation-results.json
// Keep local comparison output outside the repository unless publishing evidence.
const samples = 10
let deep: unknown = 'leaf'
for (let index = 0; index < 200; index++) deep = { child: deep }
const array500k = Array.from({ length: 500000 }, (_, index) => index)
const cases: Record<string, Omit<DataInspectorProps, 'presentation'>> = {
  wide100k: {
    value: Object.fromEntries(
      Array.from({ length: 100000 }, (_, i) => [`field${i}`, i]),
    ),
    defaultExpandedDepth: 2,
  },
  deep200: { value: deep, defaultExpandedDepth: 101 },
  array1k: {
    value: Array.from({ length: 1000 }, (_, id) => ({ id })),
    defaultExpandedDepth: 2,
  },
  grouped500k: { value: array500k, defaultExpandedDepth: 2 },
  grouped500kOpenRange: {
    value: array500k,
    defaultExpandedDepth: 2,
    defaultExpandedPaths: [
      [{ kind: 'range', start: 0, end: 10000 }],
      [
        { kind: 'range', start: 0, end: 10000 },
        { kind: 'range', start: 0, end: 100 },
      ],
    ],
  },
}
const results = Object.entries(cases).map(([name, props]) => {
  const timings = { inspector: [] as number[], classic: [] as number[] }
  const rowCounts = { inspector: 0, classic: 0 }
  for (let iteration = -1; iteration < samples; iteration++) {
    const order =
      iteration % 2 === 0
        ? (['classic', 'inspector'] as const)
        : (['inspector', 'classic'] as const)
    for (const presentation of order) {
      const start = performance.now()
      const html = renderToString(
        createElement(DataInspector, { ...props, presentation }),
      )
      const elapsed = performance.now() - start
      rowCounts[presentation] = (html.match(/data-rdi-node=/g) ?? []).length
      if (iteration >= 0) timings[presentation].push(elapsed)
    }
  }
  if (rowCounts.inspector !== rowCounts.classic)
    throw Error(`Presentation changed data row count for ${name}`)
  const summarize = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return {
      samplesMs: values,
      medianMs: (sorted[4]! + sorted[5]!) / 2,
      p95Ms: sorted[9],
    }
  }
  return {
    name,
    dataRows: rowCounts.inspector,
    inspector: summarize(timings.inspector),
    classic: summarize(timings.classic),
  }
})
process.stdout.write(
  JSON.stringify(
    {
      date: new Date().toISOString(),
      environment: {
        node: process.version,
        react: reactVersion,
        platform: platform(),
        arch: arch(),
        cpu: cpus()[0]?.model,
      },
      methodology:
        'Paired in-process React SSR; one warmup per mode and fixture, ten measured samples, alternating mode order. Dataset construction excluded. Each render creates the same model and visible rows. No client windowing, scrolling, or browser timings. Deep fixture reaches the default maximum depth (100); wide and 500k cases use default grouping. Open-range fixture explicitly expands the first 10k range and first 100-value subrange. Customization, themes, and actions use defaults. Samples are descriptive, not timing assertions.',
      results,
    },
    null,
    2,
  ) + '\n',
)
