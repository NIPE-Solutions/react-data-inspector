import type { Model } from './graph'
import { pathEqual, type DataPath, type DataPathSegment } from './path'
import { positive } from './safe'
import type { Node } from './types'

export type PathResolution =
  | { ok: true; node: Node; expand: readonly DataPath[] }
  | { ok: false; reason: 'limit' | 'unavailable' }

// Resolve against this generation's canonical owners, not search's separate graph.
// Only presentation ranges are traversed while locating an immediate data child.
export function resolvePath(
  model: Model,
  requested: DataPath,
  budget = 10000,
): PathResolution {
  let remaining = positive(budget, 10000, 10000),
    path = requested,
    current = model.root,
    consumed = 0
  let expand: DataPath[] = []
  const redirects = new Set<string>()
  function children(node: Node): readonly Node[] | undefined {
    if (remaining <= 0) return undefined
    const result = node.children()
    remaining -= Math.max(1, result.length)
    return remaining >= 0 ? result : undefined
  }
  function position(
    parent: Node,
    segment: DataPathSegment,
  ): number | undefined {
    if (
      typeof segment === 'number' &&
      ['array', 'typedarray', 'dataview', 'arraybuffer'].includes(parent.type)
    )
      return segment
    if (typeof segment === 'object') {
      if (segment.kind === 'map-key') return segment.index * 2
      if (segment.kind === 'map-value') return segment.index * 2 + 1
      if (segment.kind === 'set-value') return segment.index
    }
    return undefined
  }
  try {
    while (consumed < path.length) {
      if (--remaining < 0) return { ok: false, reason: 'limit' }
      if (current.reference) {
        path = [...current.reference.path, ...path.slice(consumed)]
        const id = model.encode(path)
        if (redirects.has(id)) return { ok: false, reason: 'limit' }
        redirects.add(id)
        current = model.root
        consumed = 0
        expand = []
        continue
      }
      if (!current.expandable)
        return { ok: false, reason: current.limited ? 'limit' : 'unavailable' }
      const expected = path.slice(0, consumed + 1),
        ordinal = position(current, path[consumed]!)
      const first = children(current)
      if (!first) return { ok: false, reason: 'limit' }
      const pending = first
        .map((node) => ({ node, chain: [current.address] }))
        .reverse()
      let found: { node: Node; chain: DataPath[] } | undefined,
        limited = false
      while (pending.length) {
        const candidate = pending.pop()!
        if (!candidate.node.synthetic) {
          if (pathEqual(candidate.node.path, expected)) {
            found = candidate
            break
          }
          if (candidate.node.limited) limited = true
          continue
        }
        const range = candidate.node.address.at(-1)
        if (
          ordinal !== undefined &&
          typeof range === 'object' &&
          range.kind === 'range' &&
          (ordinal < range.start || ordinal >= range.end)
        )
          continue
        const page = children(candidate.node)
        if (!page) return { ok: false, reason: 'limit' }
        for (let i = page.length - 1; i >= 0; i--)
          pending.push({
            node: page[i]!,
            chain: [...candidate.chain, candidate.node.address],
          })
      }
      if (!found)
        return { ok: false, reason: limited ? 'limit' : 'unavailable' }
      expand.push(...found.chain)
      current = found.node
      consumed++
    }
    if (current.limited && current.type === 'limit')
      return { ok: false, reason: 'limit' }
    return {
      ok: true,
      node: current,
      expand: expand.filter(
        (p, i) => expand.findIndex((other) => pathEqual(p, other)) === i,
      ),
    }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}
