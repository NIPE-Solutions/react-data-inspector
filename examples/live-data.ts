export interface LiveData {
  owner: { id: number; name: string; revision: number }
  assignee: LiveData['owner']
  stats: { received: number; status: string; updatedAt: Date }
  events: { id: number; message: string; at: Date }[]
  metadata?: { source: string; retries: number }
}
export type LiveOperation =
  'tick' | 'metadata' | 'prepend' | 'remove' | 'reverse'
export function initialLiveData(): LiveData {
  const owner = { id: 42, name: 'Nicholas', revision: 0 }
  return {
    owner,
    assignee: owner,
    stats: {
      received: 0,
      status: 'ready',
      updatedAt: new Date('2026-09-07T09:00:00Z'),
    },
    events: [
      {
        id: 0,
        message: 'Source connected',
        at: new Date('2026-09-07T09:00:00Z'),
      },
    ],
  }
}
export function updateLiveData(
  value: LiveData,
  operation: LiveOperation,
): LiveData {
  if (operation === 'metadata') {
    const { metadata, ...rest } = value
    return metadata
      ? rest
      : { ...rest, metadata: { source: 'document-ingest', retries: 0 } }
  }
  if (operation === 'reverse')
    return { ...value, events: [...value.events].reverse() }
  if (operation === 'remove') return { ...value, events: value.events.slice(1) }
  const received = value.stats.received + 1
  const at = new Date(value.stats.updatedAt.getTime() + 1000)
  const owner = { ...value.owner, revision: received }
  const event = { id: received, message: `Processed document ${received}`, at }
  return {
    ...value,
    owner,
    assignee: owner,
    stats: {
      received,
      status: received % 5 === 0 ? 'retrying' : 'processing',
      updatedAt: at,
    },
    events:
      operation === 'prepend'
        ? [event, ...value.events].slice(0, 200)
        : [...value.events, event].slice(-200),
  }
}
