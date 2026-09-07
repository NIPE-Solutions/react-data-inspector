import { useEffect, useMemo, useState } from 'react'
import { DataInspector, formatPath, toJsonPointer } from '../../src'
import { createStressState, stepStressState } from '../../examples/stress-data'
import source from '../../examples/stress-data.ts?raw'
import pulseSource from '../../examples/update-pulse.tsx?raw'
import { ChangedPaths, UpdatingValue } from '../../examples/update-pulse'
import { Measurements } from './Measurements'
import { Source } from './Source'
export function Stress() {
  const [size, setSize] = useState(100)
  const [seed, setSeed] = useState(42)
  const [state, setState] = useState(() => createStressState(100, 42))
  const [running, setRunning] = useState(false)
  const [interval, setIntervalMs] = useState(500)
  const [batch, setBatch] = useState(10)
  const [measure, setMeasure] = useState(false)
  const [pulse, setPulse] = useState(true)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(
      () => setState((previous) => stepStressState(previous, batch)),
      interval,
    )
    return () => window.clearInterval(timer)
  }, [running, interval, batch])
  const changed = useMemo(
    () => ({
      tick: state.tick,
      paths: new Set(
        pulse
          ? state.changes.flatMap((change) => [
              toJsonPointer(change.path)!,
              toJsonPointer([...change.path.slice(0, 2), 'updatedAt'])!,
            ])
          : [],
      ),
    }),
    [pulse, state.tick, state.changes],
  )
  return (
    <>
      <div className="lab-intro">
        <h2>A changing fleet of complex objects.</h2>
        <p>
          Random batches update service metrics, nested configuration, status,
          Maps, Sets, binary data and errors. Every service has a cycle and
          shares one tenant. A fixed seed reproduces the same sequence; no
          network requests are made.
        </p>
      </div>
      <div className="lab-controls">
        <button onClick={() => setRunning(!running)}>
          {running ? 'Pause random updates' : 'Start random updates'}
        </button>
        <button
          onClick={() =>
            setState((previous) => stepStressState(previous, batch))
          }
        >
          Apply random batch
        </button>
        <label>
          Update interval
          <select
            value={interval}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
          >
            {[1000, 500, 100, 50].map((n) => (
              <option key={n} value={n}>
                {n} ms
              </option>
            ))}
          </select>
        </label>
        <label>
          Fields per batch
          <select
            value={batch}
            onChange={(e) => setBatch(Number(e.target.value))}
          >
            {[1, 10, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Services
          <select
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value)
              setSize(next)
              setRunning(false)
              setState(createStressState(next, seed))
            }}
          >
            {[25, 100, 1000].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Seed
          <input
            type="number"
            min={0}
            max={4294967295}
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) >>> 0)}
          />
        </label>
        <button
          onClick={() => {
            setRunning(false)
            setState(createStressState(size, seed))
          }}
        >
          Reset seeded run
        </button>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={measure}
            onChange={(e) => setMeasure(e.target.checked)}
          />
          Enable measurements
        </label>
        <label className="lab-check">
          <input
            type="checkbox"
            checked={pulse}
            onChange={(e) => setPulse(e.target.checked)}
          />
          Pulse updated fields
        </label>
      </div>
      <div className="lab-caption">
        <span>
          {running ? 'Running' : 'Paused'} · {state.value.services.length}{' '}
          services
        </span>
        <span data-testid="stress-ticks">
          {state.tick} batches · {state.totalChanges} field updates
        </span>
      </div>
      <Measurements enabled={measure}>
        <ChangedPaths.Provider value={changed}>
          <DataInspector
            value={state.value}
            searchable
            defaultExpandedDepth={2}
            theme="light"
            aria-label="Random updates inspector"
            components={{ Value: UpdatingValue }}
            arrayGrouping={{ threshold: 500, size: 100 }}
          />
        </ChangedPaths.Provider>
      </Measurements>
      <p className="lab-note">
        Intervals are requested rates, not guaranteed throughput. Each field
        operation also advances its service timestamp. Immutable application
        updates and change-log rendering add work outside the profiled
        inspector. Pause for stable search results. Pulses mark the latest
        logged paths that are visible; they do not scan hidden descendants.
      </p>
      <details open className="lab-source">
        <summary>Latest changes (up to 20)</summary>
        <ol data-testid="change-journal" className="stress-journal">
          {state.changes.slice(-20).map((change, index) => (
            <li key={index}>
              <code>{formatPath(change.path)}</code>
              <span>{change.summary}</span>
            </li>
          ))}
        </ol>
      </details>
      <Source code={source} title="Seeded immutable update model source" />
      <Source
        code={pulseSource.replaceAll(
          "'../src'",
          "'@nipe-solutions/react-data-inspector'",
        )}
        title="Application-owned pulse slot source"
      />
      <Source code={pulseCss} title="Reduced-motion-aware pulse CSS" />
    </>
  )
}
const pulseCss = `[data-stress-updated] { animation: field-update 700ms ease-out; }\n@keyframes field-update { from { background: #e8dbaf; } to { background: transparent; } }\n@media (prefers-reduced-motion: reduce) { [data-stress-updated] { animation: none; } }`
