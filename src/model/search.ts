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
  const model = createModel(value, { ...modelOptions, stringLimit }, true)
  type Work =
    | { kind: 'node'; node: Node; reveal: readonly DataPath[] }
    | {
        kind: 'children'
        node: Node
        offset: number
        reveal: readonly DataPath[]
      }
  const stack: Work[] = [{ kind: 'node', node: model.root, reveal: [] }]
  const matches: SearchMatch[] = []
  let discovered = 1
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
      const work = stack.pop()!
      const { node, reveal } = work
      if (work.kind === 'children') {
        const remaining = max - discovered
        if (remaining <= 0) {
          limited = true
          continue
        }
        const take = Math.min(100, remaining)
        const children = node.children(work.offset, take)
        discovered += children.length
        const last = children[children.length - 1]
        if (last && last.position < last.setSize)
          stack.push({ ...work, offset: work.offset + children.length })
        for (let i = children.length - 1; i >= 0; i--)
          stack.push({ kind: 'node', node: children[i]!, reveal })
        continue
      }
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
        if (scanned >= max || matches.length >= maxResults) limited = true
        else
          stack.push({
            kind: 'children',
            node,
            offset: 0,
            reveal: [...reveal, node.address],
          })
      }
    }
    if (stack.length)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  abort()
  return { matches, scanned, limited: limited || stack.length > 0 }
}
