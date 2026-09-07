interface Service {
  id: string
  status: string
  metrics: { requests: number; latency: number; cpu: number }
  config: {
    retries: number
    endpoint: URL
    headers: { region: string; version: number }
  }
  cache: Map<string, number>
  tags: Set<string>
  bytes: Uint8Array
  updatedAt: Date
  error: Error | null
  tenant: { id: number; name: string }
  self?: Service
}
export interface StressState {
  value: { tenant: Service['tenant']; services: Service[]; description: string }
  random: number
  tick: number
  totalChanges: number
  changes: {
    path: readonly (string | number)[]
    field: string
    summary: string
  }[]
}
export function createStressState(size = 100, seed = 42): StressState {
  const count = [25, 100, 1000].includes(size) ? size : 100
  const tenant = { id: 42, name: 'North region' }
  const services = Array.from({ length: count }, (_, index) => {
    const service: Service = {
      id: `service-${index}`,
      status: 'ready',
      metrics: { requests: 0, latency: 10, cpu: 0 },
      config: {
        retries: 0,
        endpoint: new URL(`https://example.test/service/${index}`),
        headers: { region: 'eu', version: 1 },
      },
      cache: new Map([
        ['hits', 0],
        ['misses', 0],
      ]),
      tags: new Set(['active']),
      bytes: new Uint8Array(32),
      updatedAt: new Date('2026-09-07T09:00:00Z'),
      error: null,
      tenant,
    }
    service.self = service
    return service
  })
  return {
    value: {
      tenant,
      services,
      description:
        'Simulated service fleet with shared tenant and per-service cycles',
    },
    random: Number.isFinite(seed) ? seed >>> 0 : 42,
    tick: 0,
    totalChanges: 0,
    changes: [],
  }
}
export function stepStressState(
  previous: StressState,
  batch = 10,
): StressState {
  const count = Number.isFinite(batch)
    ? Math.max(1, Math.min(50, Math.floor(batch)))
    : 10
  let random = previous.random
  const next = () => {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0
    return random / 4294967296
  }
  const services = [...previous.value.services]
  const changes: StressState['changes'] = []
  for (let i = 0; i < count; i++) {
    const index = Math.floor(next() * services.length)
    const field = Math.floor(next() * 9)
    const amount = Math.floor(next() * 1000)
    const before = services[index]!
    const service = { ...before }
    let path: (string | number)[], summary: string
    switch (field) {
      case 0:
        service.metrics = {
          ...before.metrics,
          requests: before.metrics.requests + amount + 1,
        }
        path = ['metrics', 'requests']
        summary = String(service.metrics.requests)
        break
      case 1:
        service.metrics = { ...before.metrics, cpu: amount / 10 }
        path = ['metrics', 'cpu']
        summary = `${service.metrics.cpu}%`
        break
      case 2:
        service.metrics = { ...before.metrics, latency: amount }
        path = ['metrics', 'latency']
        summary = `${amount} ms`
        break
      case 3:
        service.status = before.status === 'ready' ? 'degraded' : 'ready'
        path = ['status']
        summary = service.status
        break
      case 4:
        service.config = {
          ...before.config,
          headers: {
            ...before.config.headers,
            version: before.config.headers.version + 1,
          },
        }
        path = ['config', 'headers', 'version']
        summary = String(service.config.headers.version)
        break
      case 5:
        service.cache = new Map(before.cache)
        service.cache.set('hits', (before.cache.get('hits') ?? 0) + amount + 1)
        path = ['cache']
        summary = `hits: ${service.cache.get('hits')}`
        break
      case 6:
        service.tags = new Set(before.tags)
        if (service.tags.has('alert')) service.tags.delete('alert')
        else service.tags.add('alert')
        path = ['tags']
        summary = [...service.tags].join(', ')
        break
      case 7:
        service.bytes = before.bytes.slice()
        service.bytes[amount % 32] = (service.bytes[amount % 32]! + 1) % 256
        path = ['bytes', amount % 32]
        summary = String(service.bytes[amount % 32])
        break
      default:
        service.error = before.error
          ? null
          : new Error(`Upstream timeout ${amount}`)
        path = ['error']
        summary = service.error?.message ?? 'Recovered'
        break
    }
    service.updatedAt = new Date(before.updatedAt.getTime() + 1000)
    service.self = service
    services[index] = service
    changes.push({
      path: ['services', index, ...path],
      field: path.join('.'),
      summary,
    })
  }
  return {
    value: { ...previous.value, services },
    random,
    tick: previous.tick + 1,
    totalChanges: previous.totalChanges + count,
    changes: changes.slice(-20),
  }
}
