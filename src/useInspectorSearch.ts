import { useEffect, useRef, useState } from 'react'
import {
  searchValue,
  type SearchOptions,
  type SearchResult,
} from './model/search'
import type { ModelOptions } from './model/types'
interface Input {
  generation: object
  value: unknown
  query: string
  options: SearchOptions | undefined
  modelOptions: ModelOptions
}
interface State {
  query: string
  result: SearchResult
  busy: boolean
  completed: boolean
}
const empty: SearchResult = { matches: [], scanned: 0, limited: false }
export function useInspectorSearch(input: Input) {
  const [state, setState] = useState<State>({
    query: '',
    result: empty,
    busy: false,
    completed: false,
  })
  const scheduler = useRef<((input: Input) => void) | null>(null)
  useEffect(() => {
    let latest: Input | undefined
    let query = '',
      epoch = 0,
      disposed = false,
      running = false
    let result = empty,
      completed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    const publish = (busy: boolean) =>
      setState({ query, result, completed, busy })
    const schedule = (delay: number) => {
      timer = setTimeout(run, delay)
    }
    function run() {
      timer = undefined
      const job = latest!
      const version = epoch
      controller = new AbortController()
      running = true
      const finish = (next: SearchResult) => {
        if (disposed || version !== epoch) return
        running = false
        result = next
        completed = true
        const refresh = latest!.generation !== job.generation
        publish(refresh)
        if (refresh) schedule(50)
      }
      void searchValue(
        job.value,
        job.query,
        job.options,
        controller.signal,
        job.modelOptions,
      ).then(finish, () => finish({ ...empty, limited: true }))
    }
    scheduler.current = (next) => {
      latest = next
      if (next.query !== query) {
        epoch++
        controller?.abort()
        clearTimeout(timer)
        timer = undefined
        running = false
        query = next.query
        result = empty
        completed = false
        publish(!!query)
        if (query) {
          const delay = next.options?.debounce ?? 150
          schedule(
            Number.isFinite(delay) ? Math.max(0, Math.min(60000, delay)) : 150,
          )
        }
      } else if (query && !running && timer === undefined) {
        // Coalesce data generations without restarting the query debounce or an in-flight scan.
        publish(true)
        schedule(50)
      }
    }
    return () => {
      disposed = true
      controller?.abort()
      clearTimeout(timer)
      scheduler.current = null
    }
  }, [])
  useEffect(() => {
    scheduler.current?.(input)
  }, [input.generation, input.query])
  const current =
    state.query === input.query
      ? state
      : {
          query: input.query,
          result: empty,
          busy: !!input.query,
          completed: false,
        }
  return {
    result: current.result,
    searching: current.busy && !current.completed,
    refreshing: current.busy && current.completed,
  }
}
