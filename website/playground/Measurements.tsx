import {
  Profiler,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
interface Samples {
  commits: number
  render: number | null
  max: number
  rows: number
  interaction: number | null
  search: number | null
  superseded: number
  searchStatus: string
  lazyReads: number | null
}
const empty = (): Samples => ({
  commits: 0,
  render: null,
  max: 0,
  rows: 0,
  interaction: null,
  search: null,
  superseded: 0,
  searchStatus: '',
  lazyReads: null,
})
function Readings({ samples }: { samples: RefObject<Samples> }) {
  const [view, setView] = useState(empty)
  useEffect(() => {
    const timer = window.setInterval(() => setView({ ...samples.current }), 300)
    return () => clearInterval(timer)
  }, [samples])
  const ms = (value: number | null) =>
    value === null ? '—' : `${value.toFixed(1)} ms`
  return (
    <div className="lab-readings" aria-label="Live measurements">
      <dl>
        <div>
          <dt>Mounted rows</dt>
          <dd data-testid="mounted-rows">{view.rows}</dd>
        </div>
        <div>
          <dt>Profiled commits</dt>
          <dd>{view.commits}</dd>
        </div>
        <div>
          <dt>Latest render</dt>
          <dd>{ms(view.render)}</dd>
        </div>
        <div>
          <dt>Maximum render</dt>
          <dd>{view.commits ? ms(view.max) : '—'}</dd>
        </div>
        <div>
          <dt>Interaction → frame</dt>
          <dd>{ms(view.interaction)}</dd>
        </div>
        <div>
          <dt>Search completion</dt>
          <dd data-testid="search-duration">{ms(view.search)}</dd>
        </div>
        <div>
          <dt>Superseded queries</dt>
          <dd>{view.superseded}</dd>
        </div>
        {view.lazyReads !== null && (
          <div>
            <dt>Requested child values</dt>
            <dd data-testid="lazy-reads">{view.lazyReads}</dd>
          </div>
        )}
      </dl>
      <p>
        {view.searchStatus ||
          'Run a search or interact with the tree to collect samples.'}
      </p>
    </div>
  )
}
export function Measurements({
  enabled,
  children,
  lazyReads,
}: {
  enabled: boolean
  children: ReactNode
  lazyReads?: () => number
}) {
  const host = useRef<HTMLDivElement>(null)
  const samples = useRef(empty())
  const readLazy = useRef(lazyReads)
  readLazy.current = lazyReads
  useEffect(() => {
    samples.current = empty()
    if (!enabled || !host.current) return
    const element = host.current
    let started: number | null = null
    let observedSearching = false
    let firstFrame = 0,
      secondFrame = 0
    const read = () => {
      samples.current.rows = element.querySelectorAll('[data-rdi-node]').length
      samples.current.lazyReads = readLazy.current?.() ?? null
      const status =
        element.querySelector('[data-rdi-search] [role=status]')?.textContent ??
        ''
      samples.current.searchStatus = status
      if (started !== null && status === 'Searching…') observedSearching = true
      if (
        started !== null &&
        observedSearching &&
        status &&
        status !== 'Searching…'
      ) {
        samples.current.search = performance.now() - started
        started = null
      }
    }
    const observer = new MutationObserver(read)
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    const input = (event: Event) => {
      if (
        !(event.target instanceof HTMLInputElement) ||
        event.target.type !== 'search'
      )
        return
      if (started !== null) samples.current.superseded++
      started = event.target.value ? performance.now() : null
      samples.current.search = null
      observedSearching = false
    }
    const interaction = () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      const start = performance.now()
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          samples.current.interaction = performance.now() - start
          read()
        })
      })
    }
    element.addEventListener('input', input, true)
    element.addEventListener('click', interaction, true)
    element.addEventListener('keydown', interaction, true)
    element.addEventListener('scroll', interaction, true)
    read()
    return () => {
      observer.disconnect()
      element.removeEventListener('input', input, true)
      element.removeEventListener('click', interaction, true)
      element.removeEventListener('keydown', interaction, true)
      element.removeEventListener('scroll', interaction, true)
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [enabled])
  return (
    <>
      <div ref={host}>
        <Profiler
          id="playground-inspector"
          onRender={(_id, _phase, duration) => {
            if (!enabled) return
            samples.current.commits++
            samples.current.render = duration
            samples.current.max = Math.max(samples.current.max, duration)
          }}
        >
          {children}
        </Profiler>
      </div>
      {enabled && (
        <>
          <Readings samples={samples} />
          <p className="lab-note">
            Measurements add overhead. Render durations come from React
            Profiler; normal production builds disable it (shown as —).
            Development and profiling builds are not directly comparable.
            Interaction → frame is a two-animation-frame approximation, not INP
            or measured paint. Search includes debounce and discovery, and may
            be partial. DOM counts are sampled. No heap or leak claims are made.{' '}
            <a href="https://react.dev/reference/react/Profiler">
              React profiling reference
            </a>
            .
          </p>
        </>
      )}
    </>
  )
}
