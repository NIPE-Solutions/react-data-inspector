import { it, expect } from 'vitest'
import { createStressState, stepStressState } from '../examples/stress-data'
it('replays random updates deterministically without mutating the previous graph', () => {
  const initial = createStressState(25, 42)
  const previous = initial.value.services.map((service) => ({
    requests: service.metrics.requests,
    status: service.status,
    bytes: [...service.bytes],
  }))
  const first = stepStressState(initial, 50)
  const replay = stepStressState(createStressState(25, 42), 50)
  expect(first).toEqual(replay)
  expect(
    initial.value.services.map((service) => ({
      requests: service.metrics.requests,
      status: service.status,
      bytes: [...service.bytes],
    })),
  ).toEqual(previous)
  expect(first.tick).toBe(1)
  expect(first.changes).toHaveLength(20)
  expect(
    new Set(first.changes.map((change) => change.field)).size,
  ).toBeGreaterThan(3)
  for (const service of first.value.services) {
    expect(service.self).toBe(service)
    expect(service.tenant).toBe(first.value.tenant)
  }
})
it('preserves unaffected service identity and bounds workload settings', () => {
  const before = createStressState(100, 17)
  const after = stepStressState(before, 1)
  expect(
    after.value.services.filter(
      (service, i) => service === before.value.services[i],
    ),
  ).toHaveLength(99)
  expect(createStressState(Infinity, NaN).value.services).toHaveLength(100)
  expect(stepStressState(before, 1000000).totalChanges).toBe(50)
})
