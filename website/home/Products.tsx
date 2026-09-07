import { useState } from 'react'
import { DataInspector } from '../../src'
import { ControlledExample } from '../../examples/customization'
const fragments = {
  'API debugging': {
    status: 200,
    headers: new Map([
      ['content-type', 'application/json'],
      ['x-request-id', 'req_8f42'],
    ]),
    body: { users: [{ id: 42, name: 'Nicholas' }], cursor: null },
    state: { receivedAt: new Date('2026-09-07T09:00:00Z'), cached: false },
  },
  'Background jobs': {
    id: 'job_0042',
    queue: 'source.normalize',
    attempt: 2,
    enqueuedAt: new Date('2026-09-07T08:59:00Z'),
    payload: {
      sourceId: 42,
      region: 'AT',
      document: {
        title: 'Council meeting',
        tags: new Set(['public', 'local']),
      },
    },
    retry: { delayMs: 5000, lastError: new Error('Upstream timed out') },
  },
  'Error investigation': {
    error: new TypeError('Could not normalize source', {
      cause: new Error('Missing entity identifier'),
    }),
    context: {
      jobId: 'job_0042',
      source: { id: 42, provider: 'public-records' },
      retryable: false,
    },
    occurredAt: new Date('2026-09-07T09:00:00Z'),
  },
}
type Fragment = keyof typeof fragments | 'Application state'
export function Products() {
  const [fragment, setFragment] = useState<Fragment>('API debugging')
  return (
    <section className="section" id="in-products">
      <div className="section-intro">
        <h2>
          Built to live
          <br />
          inside real products.
        </h2>
        <p>
          Keep the surrounding interface yours. Embed the inspector exactly
          where a raw value helps someone make a decision.
        </p>
      </div>
      <div className="mode-tabs" role="group" aria-label="Product examples">
        {(
          [
            'API debugging',
            'Background jobs',
            'Application state',
            'Error investigation',
          ] as const
        ).map((name) => (
          <button
            key={name}
            aria-pressed={fragment === name}
            onClick={() => setFragment(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="product-fragment">
        <div className="product-chrome">
          <span>
            {fragment === 'API debugging'
              ? 'Requests / GET /api/users'
              : fragment === 'Background jobs'
                ? 'Operations / source.normalize / job_0042'
                : fragment === 'Application state'
                  ? 'Workspace / active selection'
                  : 'Incidents / normalization failure'}
          </span>
          <span>
            {fragment === 'API debugging'
              ? '200 OK'
              : fragment === 'Background jobs'
                ? 'Retry scheduled'
                : fragment === 'Application state'
                  ? 'Application-owned'
                  : 'Investigation open'}
          </span>
        </div>
        {fragment === 'Application state' ? (
          <ControlledExample />
        ) : (
          <div className="product-body">
            <aside>
              <h3>
                {fragment === 'API debugging'
                  ? 'Request details'
                  : fragment === 'Background jobs'
                    ? 'Job timeline'
                    : 'Incident context'}
              </h3>
              <p>
                {fragment === 'API debugging'
                  ? 'GET /api/users\nRequest req_8f42\nResponse received'
                  : fragment === 'Background jobs'
                    ? '08:59 Enqueued\n09:00 Attempt 2\nWaiting to retry'
                    : 'Source 42\nTypeError\nAutomatic retry disabled'}
              </p>
              <p className="annotation">
                Local example data. No network request or job is executed.
              </p>
            </aside>
            <DataInspector
              key={fragment}
              value={fragments[fragment]}
              theme="light"
              searchable
              defaultExpandedDepth={2}
              aria-label="Embedded product inspector"
            />
          </div>
        )}
      </div>
    </section>
  )
}
export function Ownership() {
  return (
    <section className="section" id="ownership">
      <div className="section-intro">
        <h2>
          State stays
          <br />
          with your application.
        </h2>
        <p>
          The inspector exposes state. It does not become your state manager.
          Select a field and watch the adjacent application panel respond.
        </p>
      </div>
      <ControlledExample />
      <p className="section-link">
        <a href="/docs/expansion">Control expansion</a>
        <a href="/docs/selection">Connect selection</a>
        <a href="/playground?section=stress">Explore continuous updates</a>
      </p>
    </section>
  )
}
