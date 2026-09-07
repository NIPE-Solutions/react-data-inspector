import { createModel } from './graph'
import type { DataPath } from './path'
import { positive } from './safe'
import type { InspectorNodeContext, ModelOptions, Node } from './types'
export interface SearchOptions {
  readonly scope?: 'keys' | 'values' | 'keys-and-values'
  readonly debounce?: number
  readonly maxNodes?: number
  readonly maxResults?: number
  readonly stringLimit?: number
}
export interface SearchMatch extends InspectorNodeContext {
  readonly reveal: readonly DataPath[]
}
export interface SearchResult {
  readonly matches: readonly SearchMatch[]
  readonly scanned: number
  readonly limited: boolean
}
export async function searchValue(
  value: unknown,
  query: string,
  options: SearchOptions = {},
  signal?: AbortSignal,
  modelOptions: ModelOptions = {},
): Promise<SearchResult> {
  const stringLimit = positive(options.stringLimit, 65536, 100000)
  const model = createModel(value, { ...modelOptions, stringLimit })
  const stack: { node: Node; reveal: readonly DataPath[] }[] = [
    { node: model.root, reveal: [] },
  ]
  const matches: SearchMatch[] = []
  let scanned = 0,
    limited = false
  const max = positive(options.maxNodes, 100000, 1000000),
    maxResults = positive(options.maxResults, 1000, 10000),
    needle = query.toLowerCase()
  const abort = () => {
    if (signal?.aborted)
      throw new DOMException('Search cancelled', 'AbortError')
  }
  abort()
  if (!needle) return { matches, scanned, limited }
  while (stack.length && scanned < max && matches.length < maxResults) {
    const start = performance.now()
    let count = 0
    while (
      stack.length &&
      scanned < max &&
      matches.length < maxResults &&
      count++ < 500 &&
      performance.now() - start < 8
    ) {
      abort()
      const { node, reveal } = stack.pop()!
      scanned++
      if (node.limited) limited = true
      if (
        options.scope !== 'keys' &&
        typeof node.value === 'string' &&
        node.value.length > stringLimit
      )
        limited = true
      const key = options.scope !== 'values' ? node.label : ''
      const text = options.scope !== 'keys' ? node.searchText : ''
      if (
        !node.synthetic &&
        (key.toLowerCase().includes(needle) ||
          text.toLowerCase().includes(needle))
      ) {
        const {
          path,
          label,
          value,
          type,
          summary,
          depth,
          expandable,
          reference,
        } = node
        matches.push({
          path,
          label,
          value,
          type,
          summary,
          depth,
          expandable,
          ...(reference ? { reference } : {}),
          reveal,
        })
      }
      if (node.expandable) {
        const children = node.children()
        for (let i = children.length - 1; i >= 0; i--)
          stack.push({ node: children[i]!, reveal: [...reveal, node.address] })
      }
    }
    if (stack.length)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  abort()
  return { matches, scanned, limited: limited || stack.length > 0 }
}
