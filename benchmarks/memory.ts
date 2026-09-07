import { writeFileSync } from 'node:fs'
import { createModel, buildVisible } from '../src/model/graph'
if (!global.gc)
  throw Error('Run node --expose-gc --import tsx benchmarks/memory.ts')
function inspect() {
  const value = { items: Array.from({ length: 1000 }, (_, id) => ({ id })) }
  const weak = new WeakRef(value)
  const model = createModel(value)
  buildVisible(model, (n) => n.depth < 2)
  return weak
}
const references = Array.from({ length: 50 }, inspect)
for (let i = 0; i < 5; i++) {
  await new Promise((resolve) => setTimeout(resolve, 0))
  global.gc()
}
const retained = references.filter((ref) => ref.deref() !== undefined).length
const report = {
  date: new Date().toISOString(),
  node: process.version,
  models: 50,
  retainedRoots: retained,
  methodology:
    'Drop model and input strong references, yield tasks and force GC five times; inspect WeakRefs only after GC. Observation, not guarantee; excludes mounted React and browser heaps.',
}
writeFileSync(
  'benchmarks/memory-results.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log(report)
