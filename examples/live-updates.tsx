import { useEffect, useState } from 'react'
import { DataInspector, formatPath, type DataPath } from '../src'
import {
  initialLiveData,
  updateLiveData,
  type LiveOperation,
} from './live-data'
export function Live() {
  const [value, setValue] = useState(initialLiveData)
  const [running, setRunning] = useState(false)
  const [interval, setIntervalMs] = useState(1000)
  const [mode, setMode] = useState('immutable')
  const [render, forceRender] = useState(0)
  const [selected, setSelected] = useState<DataPath | null>(null)
  const [expanded, setExpanded] = useState<readonly DataPath[]>([[]])
  const [generation, setGeneration] = useState(1)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(
      () => setValue((previous) => updateLiveData(previous, 'tick')),
      interval,
    )
    return () => window.clearInterval(timer)
  }, [running, interval])
  function update(operation: LiveOperation) {
    if (mode === 'mutation') {
      // Application code owns this explicit mutation. The inspector never mutates input.
      const next = updateLiveData(value, operation)
      Object.assign(value, next)
      if (!next.metadata) delete value.metadata
      forceRender((previous) => previous + 1)
    } else setValue((previous) => updateLiveData(previous, operation))
  }
  let detail: unknown = value
  let exists = selected !== null
  for (const segment of selected ?? []) {
    if (
      typeof segment === 'object' ||
      detail === null ||
      typeof detail !== 'object' ||
      !Object.hasOwn(detail, segment)
    ) {
      exists = false
      break
    }
    detail = Reflect.get(detail, segment)
  }
  const detailText = !exists
    ? 'The selected path is absent.'
    : detail instanceof Date
      ? detail.toISOString()
      : detail === null || typeof detail !== 'object'
        ? String(detail)
        : Array.isArray(detail)
          ? `Array(${detail.length})`
          : 'Object — select a field to see its current value.'
  return (
    <>
      <div className="lab-intro">
        <h2>Application-owned, always changing.</h2>
        <p>
          Keep branches open while the application updates fields, changes
          shape, and replaces its data. Timers start only when requested. This
          is a simulated document pipeline, not a connection to a production
          service.
        </p>
      </div>
      <div className="lab-controls">
        <button
          onClick={() => setRunning(!running)}
          disabled={mode === 'mutation'}
        >
          {running ? 'Pause stream' : 'Start stream'}
        </button>
        <button onClick={() => update('tick')}>Update once</button>
        <label>
          Update interval
          <select
            value={interval}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
          >
            <option value={2000}>2 seconds</option>
            <option value={1000}>1 second</option>
            <option value={250}>250 ms</option>
          </select>
        </label>
        <label>
          Update mode
          <select
            value={mode}
            onChange={(e) => {
              setRunning(false)
              setMode(e.target.value)
            }}
          >
            <option value="immutable">Immutable updates</option>
            <option value="mutation">Same reference + rerender</option>
          </select>
        </label>
      </div>
      <div className="lab-controls">
        <button onClick={() => update('metadata')}>Toggle metadata</button>
        <button onClick={() => update('prepend')}>Prepend event</button>
        <button onClick={() => update('remove')}>Remove first event</button>
        <button onClick={() => update('reverse')}>Reverse events</button>
        <button
          onClick={() => {
            setValue(initialLiveData())
            setGeneration((g) => g + 1)
          }}
        >
          Replace dataset
        </button>
        <button onClick={() => setExpanded([[], ['stats'], ['events']])}>
          Expand from application
        </button>
      </div>
      <div className="lab-caption">
        <span>
          {running ? 'Streaming' : 'Paused'} · Generation {generation} ·{' '}
          {render} explicit rerenders
        </span>
        <span data-testid="event-count">
          {value.events.length} events retained
        </span>
      </div>
      <div className="lab-live-grid">
        <DataInspector
          value={value}
          searchable
          theme="light"
          aria-label="Live application inspector"
          expandedPaths={expanded}
          onExpandedPathsChange={setExpanded}
          selectedPath={selected}
          onSelectedPathChange={setSelected}
        />
        <aside aria-label="Live selection details" className="lab-details">
          <h3>Selected in the application</h3>
          <code>
            {selected === null ? 'No selection' : formatPath(selected)}
          </code>
          <p>
            {selected === null
              ? 'Select a node to follow its current value here.'
              : detailText}
          </p>
          <p>
            Selection follows a path. Reordering events changes the entity at
            that path. Removing a path keeps the requested selection in
            application state; focus falls back to a surviving ancestor.
          </p>
          <p>
            owner and assignee share one object instance after every update. The
            stream retains the latest 200 events.
          </p>
        </aside>
      </div>
      <p className="lab-note">
        Same-reference mode mutates application-owned data in a click handler
        and explicitly rerenders React. Automatic streaming uses immutable
        updates. Search rescans after updates; pause the stream to inspect a
        stable result set.
      </p>
    </>
  )
}
