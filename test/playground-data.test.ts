import { expect, it } from 'vitest'
import { initialLiveData, updateLiveData } from '../examples/live-data'
it('external updates preserve old data and shared identity', () => {
  const before = initialLiveData()
  const after = updateLiveData(before, 'tick')
  expect(before.stats.received).toBe(0)
  expect(after.stats.received).toBe(1)
  expect(after.owner).toBe(after.assignee)
  expect(after.owner).not.toBe(before.owner)
  expect(after.events).toHaveLength(before.events.length + 1)
})
it('external structural updates and retention remain bounded', () => {
  let value = initialLiveData()
  value = updateLiveData(value, 'metadata')
  expect(value.metadata).toBeDefined()
  value = updateLiveData(value, 'metadata')
  expect(value.metadata).toBeUndefined()
  const first = value.events[0]!.id
  value = updateLiveData(value, 'reverse')
  expect(value.events.at(-1)!.id).toBe(first)
  for (let i = 0; i < 300; i++) value = updateLiveData(value, 'tick')
  expect(value.events).toHaveLength(200)
  expect(value.stats.received).toBe(300)
})
