import { createPathEncoder, type DataPath, type DataPathSegment } from './path'
import { ownValue, positive, primitive, prototypeName } from './safe'
import type { ModelOptions, Node } from './types'
export type { Node, ModelOptions } from './types'
type Child = {
  segment: DataPathSegment
  label: string
  value: unknown
  summary?: string
  type?: string
}
interface Source {
  count: number
  read(index: number): Child
  readPage?(offset: number, limit: number): readonly Child[]
}
const getter = (proto: object, key: PropertyKey, value: object): unknown => {
  let current: object | null = proto
  for (
    let i = 0;
    current && i < 8;
    i++, current = Object.getPrototypeOf(current)
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key)
    if (descriptor) return descriptor.get?.call(value)
  }
  return undefined
}
export function createModel(
  value: unknown,
  options: ModelOptions = {},
  revisitShallowerReferences = false,
) {
  const seen = new WeakMap<object, { path: DataPath; depth: number }>()
  const encode = createPathEncoder()
  const size = positive(options.arrayGrouping?.size, 100, 1000)
  const threshold = positive(options.arrayGrouping?.threshold, 1000)
  const maxDepth =
    options.maxDepth === 0 ? 0 : positive(options.maxDepth, 100, 200)
  const stringLimit = positive(options.stringLimit, 200, 100000)
  function node(
    value: unknown,
    path: DataPath,
    label: string,
    parent: Node | null,
    ancestors: readonly object[],
    position = 1,
    setSize = 1,
    override?: { type: string; summary: string },
  ): Node {
    const address = path
    let type = override?.type ?? (value === null ? 'null' : typeof value),
      summary = override?.summary ?? '',
      source: (() => Source) | undefined,
      searchText = ''
    let custom = false
    let reference: Node['reference']
    const object =
      (typeof value === 'object' && value !== null) ||
      typeof value === 'function'
    const depth = parent ? parent.depth + 1 : 0
    try {
      if (!override && object) {
        const obj = value as object
        const first = seen.get(obj)
        const circular = ancestors.includes(obj)
        // A depth-limited encounter must not hide a later inspectable occurrence.
        if (
          first &&
          (circular ||
            (!revisitShallowerReferences && first.depth < maxDepth) ||
            depth >= first.depth)
        )
          reference = {
            kind: circular ? 'circular' : 'shared',
            path: first.path,
          }
        else seen.set(obj, { path, depth })
      }
      if (reference) {
        type = 'reference'
        summary = reference.kind
      } else if (!override) {
        for (const definition of options.types ?? []) {
          const match = definition.inspect(value)
          if (!match) continue
          custom = true
          type = definition.id
          summary = match.summary.slice(0, stringLimit)
          searchText = match.searchText ?? summary
          if (match.children) {
            const children = match.children
            const convert = (
              child: import('./types').InspectorChild | undefined,
            ): Child => {
              if (!child)
                throw Error('Custom child source returned an incomplete page')
              return {
                segment: {
                  kind: 'custom',
                  typeId: definition.id,
                  key: child.key,
                },
                label: child.key,
                value: child.value,
              }
            }
            source = () => ({
              count: positive(children.count, 0, Number.MAX_SAFE_INTEGER),
              read: (index) => convert(children.getPage(index, 1)[0]),
              readPage: (offset, limit) => {
                const page = children.getPage(offset, limit)
                return Array.from({ length: limit }, (_, i) => convert(page[i]))
              },
            })
          }
          break
        }
        if (!custom) {
          if (!object || typeof value === 'function')
            summary = primitive(value, stringLimit)
          else if (Array.isArray(value)) {
            type = 'array'
            const length = ownValue(value, 'length') as number
            summary = `Array(${length}) · indexed items only`
            source = () => ({
              count: length,
              read: (i) => descriptor(value, i, String(i)),
            })
          } else {
            const obj = value as object,
              name = prototypeName(obj)
            type = 'object'
            summary = 'Object'
            source = () => properties(obj)
            if (name === 'Date') {
              type = 'date'
              const time = Date.prototype.getTime.call(obj)
              summary = Number.isNaN(time)
                ? 'Invalid Date'
                : Date.prototype.toISOString.call(obj)
              source = undefined
            } else if (name === 'Map') {
              type = 'map'
              const count = getter(Map.prototype, 'size', obj) as number
              summary = `Map(${count})`
              source = () => {
                const iterator = Map.prototype.entries.call(
                  obj,
                ) as IterableIterator<[unknown, unknown]>
                const cache: [unknown, unknown][] = []
                return {
                  count: count * 2,
                  read: (i) => {
                    if (Math.floor(i / 2) >= 10000)
                      return collectionLimit('map', i)
                    while (cache.length <= Math.floor(i / 2)) {
                      const entry = iterator.next()
                      if (entry.done)
                        throw Error('Map changed during inspection')
                      cache.push(entry.value)
                    }
                    const entry = cache[Math.floor(i / 2)]!
                    return {
                      segment: {
                        kind: i % 2 ? 'map-value' : 'map-key',
                        index: Math.floor(i / 2),
                      },
                      label: `${Math.floor(i / 2)} · ${i % 2 ? 'value' : 'key'}`,
                      value: entry[i % 2],
                    }
                  },
                }
              }
            } else if (name === 'Set') {
              type = 'set'
              const count = getter(Set.prototype, 'size', obj) as number
              summary = `Set(${count})`
              source = () => {
                const iterator = Set.prototype.values.call(
                  obj,
                ) as IterableIterator<unknown>
                const cache: unknown[] = []
                return {
                  count,
                  read: (i) => {
                    if (i >= 10000) return collectionLimit('set', i)
                    while (cache.length <= i) {
                      const entry = iterator.next()
                      if (entry.done)
                        throw Error('Set changed during inspection')
                      cache.push(entry.value)
                    }
                    return {
                      segment: { kind: 'set-value', index: i },
                      label: String(i),
                      value: cache[i],
                    }
                  },
                }
              }
            } else if (name === 'RegExp') {
              type = 'regexp'
              const pattern = getter(RegExp.prototype, 'source', obj)
              const flags = (
                [
                  ['hasIndices', 'd'],
                  ['global', 'g'],
                  ['ignoreCase', 'i'],
                  ['multiline', 'm'],
                  ['dotAll', 's'],
                  ['unicode', 'u'],
                  ['unicodeSets', 'v'],
                  ['sticky', 'y'],
                ] as const
              )
                .filter(([key]) => getter(RegExp.prototype, key, obj))
                .map(([, flag]) => flag)
                .join('')
              summary = `/${String(pattern).slice(0, stringLimit)}/${flags}`
              source = undefined
            } else if (name === 'URL') {
              type = 'url'
              summary = String(getter(URL.prototype, 'href', obj)).slice(
                0,
                stringLimit,
              )
              source = undefined
            } else if (/Error$/.test(name)) {
              type = 'error'
              const message = ownValue(obj, 'message')
              summary = `${name}: ${typeof message === 'string' ? message.slice(0, stringLimit) : ''}`
              source = () => properties(obj, true)
            } else if (
              name === 'WeakMap' ||
              name === 'WeakSet' ||
              name === 'Promise'
            ) {
              if (name === 'WeakMap') WeakMap.prototype.has.call(obj, {})
              if (name === 'WeakSet') WeakSet.prototype.has.call(obj, {})
              type = name.toLowerCase()
              summary = name
              source = undefined
            } else if (ArrayBuffer.isView(obj)) {
              if (name === 'DataView') {
                type = 'dataview'
                const length = getter(
                  DataView.prototype,
                  'byteLength',
                  obj,
                ) as number
                summary = `DataView(${length})`
                source = () => ({
                  count: length,
                  read: (i) => ({
                    segment: {
                      kind: 'custom',
                      typeId: 'dataview-byte',
                      key: String(i),
                    },
                    label: String(i),
                    value: DataView.prototype.getUint8.call(obj, i),
                  }),
                })
              } else {
                type = 'typedarray'
                const proto = Object.getPrototypeOf(
                  Uint8Array.prototype,
                ) as object
                const length = getter(proto, 'length', obj) as number
                summary = `${name}(${length})`
                source = () => ({
                  count: length,
                  read: (i) => descriptor(obj, i, String(i)),
                })
              }
            } else if (name === 'ArrayBuffer') {
              type = 'arraybuffer'
              const length = getter(
                ArrayBuffer.prototype,
                'byteLength',
                obj,
              ) as number
              summary = `ArrayBuffer(${length})`
              source = () => {
                const bytes = new Uint8Array(obj as ArrayBuffer)
                return {
                  count: length,
                  read: (i) => ({
                    segment: {
                      kind: 'custom',
                      typeId: 'arraybuffer-byte',
                      key: String(i),
                    },
                    label: String(i),
                    value: bytes[i],
                  }),
                }
              }
            } else if (name === 'SharedArrayBuffer') {
              type = 'sharedarraybuffer'
              summary = 'SharedArrayBuffer (opaque)'
              source = undefined
            } else if (
              /^HTML\w+Element$/.test(name) ||
              name === 'Text' ||
              name === 'Document'
            ) {
              type = 'dom'
              summary = name
              source = undefined
            } else {
              const tag = ownValue(obj, '$$typeof')
              if (
                tag === Symbol.for('react.element') ||
                tag === Symbol.for('react.transitional.element')
              ) {
                type = 'react-element'
                summary = 'ReactElement'
                source = undefined
              }
            }
          }
        }
      }
    } catch (error) {
      type = 'inspection-error'
      summary = 'Inspection failed'
      source = undefined
      options.onInspectionError?.(error, path)
    }
    const depthLimited = !!source && depth >= maxDepth
    const limited = depthLimited || override?.type === 'limit'
    if (depthLimited) summary += ' · Max depth reached'
    let loadChildren: Node['children'] | undefined
    const current: Node = {
      id: encode(address),
      path,
      address,
      label,
      value,
      type,
      summary,
      depth,
      parentId: parent?.id ?? null,
      position,
      setSize,
      synthetic: false,
      limited,
      searchText: searchText || summary,
      expandable: !!source && !limited,
      ...(reference ? { reference } : {}),
      ...(custom ? { customType: true } : {}),
      children(offset = 0, limit = Infinity) {
        if (!source || limited) return []
        if (!loadChildren) {
          try {
            const children = source()
            loadChildren = pagedChildren(
              children,
              0,
              children.count,
              current,
              [...ancestors, ...(object ? [value as object] : [])],
              path,
            )
          } catch (error) {
            options.onInspectionError?.(error, path)
            const diagnostic = node(
              undefined,
              [
                ...address,
                { kind: 'custom', typeId: 'diagnostic', key: 'error' },
              ],
              'Inspection error',
              current,
              ancestors,
              1,
              1,
              { type: 'inspection-error', summary: 'Unable to read children' },
            )
            loadChildren = (from = 0, count = Infinity) =>
              from === 0 && count > 0 ? [diagnostic] : []
          }
        }
        return loadChildren(offset, limit)
      },
    }
    return current
  }
  function collectionLimit(kind: string, index: number): Child {
    return {
      segment: {
        kind: 'custom',
        typeId: 'diagnostic',
        key: `${kind}-limit-${index}`,
      },
      label: 'Collection traversal limit',
      value: undefined,
      type: 'limit',
      summary:
        'Collection traversal limit reached · only the first 10,000 entries can be inspected',
    }
  }
  function descriptor(obj: object, key: PropertyKey, label: string): Child {
    const segment: DataPathSegment =
      typeof key === 'symbol'
        ? { kind: 'symbol', key }
        : typeof key === 'number'
          ? key
          : String(key)
    try {
      const d = Object.getOwnPropertyDescriptor(obj, key)
      if (!d)
        return {
          segment,
          label,
          value: undefined,
          type: 'empty',
          summary: '<empty>',
        }
      if (!('value' in d))
        return {
          segment,
          label,
          value: undefined,
          type: 'accessor',
          summary: d.get ? (d.set ? 'Getter/Setter' : 'Getter') : 'Setter',
        }
      return { segment, label, value: d.value }
    } catch {
      return {
        segment,
        label,
        value: undefined,
        type: 'inspection-error',
        summary: 'Unable to read property',
      }
    }
  }
  function properties(obj: object, errorDetails = false): Source {
    let keys = Reflect.ownKeys(obj).filter((key) => {
      if (typeof key === 'symbol' && options.includeSymbols === false)
        return false
      if (options.includeNonEnumerable || errorDetails) return true
      try {
        return Object.getOwnPropertyDescriptor(obj, key)?.enumerable ?? false
      } catch {
        return true
      }
    })
    if (options.sortKeys) {
      const cmp =
        typeof options.sortKeys === 'function' ? options.sortKeys : undefined
      keys = [
        ...keys.filter((k): k is string => typeof k === 'string').sort(cmp),
        ...keys.filter((k): k is symbol => typeof k === 'symbol'),
      ]
    }
    return {
      count: keys.length,
      read: (i) => descriptor(obj, keys[i]!, String(keys[i])),
    }
  }
  function pagedChildren(
    source: Source,
    start: number,
    end: number,
    parent: Node,
    ancestors: readonly object[],
    base: DataPath,
  ): Node['children'] {
    const cache: Node[] = []
    let complete = false
    return (offset = 0, limit = Infinity) => {
      const needed = offset + limit - cache.length
      if (!complete && needed > 0) {
        const page = rangeChildren(
          source,
          start,
          end,
          parent,
          ancestors,
          base,
          cache.length,
          needed,
        )
        for (const child of page) cache.push(child)
        complete = page.length < needed
      }
      return offset === 0 && limit >= cache.length
        ? cache
        : cache.slice(offset, offset + limit)
    }
  }
  function rangeChildren(
    source: Source,
    start: number,
    end: number,
    parent: Node,
    ancestors: readonly object[],
    base: DataPath,
    offset = 0,
    limit = Infinity,
  ): Node[] {
    const count = end - start
    const leafSize = Math.min(size, threshold)
    if (count > (parent.synthetic ? leafSize : threshold)) {
      let step = leafSize
      while (Math.ceil(count / step) > 100) step *= 100
      const total = Math.ceil(count / step),
        result: Node[] = []
      for (
        let from = start + offset * step;
        from < Math.min(end, start + (offset + limit) * step);
        from += step
      ) {
        const to = Math.min(end, from + step),
          address = [
            ...parent.address,
            { kind: 'range' as const, start: from, end: to },
          ]
        const range: Node = {
          id: encode(address),
          address,
          path: base,
          label: `[${from} … ${to - 1}]`,
          summary: `${to - from} entries`,
          value: undefined,
          type: 'range',
          depth: parent.depth + 1,
          parentId: parent.id,
          position: Math.floor((from - start) / step) + 1,
          setSize: total,
          synthetic: true,
          limited: false,
          searchText: '',
          expandable: true,
          children: (offset, limit) => read(offset, limit),
        }
        const read = pagedChildren(source, from, to, range, ancestors, base)
        result.push(range)
      }
      return result
    }
    const result: Node[] = []
    const until = Math.min(end, start + offset + limit)
    let page: readonly Child[] | undefined
    let pageStart = start + offset
    for (let i = start + offset; i < until; i++) {
      if (source.readPage && (i - pageStart) % 100 === 0) {
        pageStart = i
        try {
          page = source.readPage(i, Math.min(100, until - i))
        } catch {
          page = undefined
        } // Retry individually so one bad entry cannot hide its siblings.
      }
      try {
        const child = page ? page[i - pageStart]! : source.read(i)
        result.push(
          node(
            child.value,
            [...base, child.segment],
            child.label,
            parent,
            ancestors,
            i - start + 1,
            count,
            child.type
              ? { type: child.type, summary: child.summary ?? '' }
              : undefined,
          ),
        )
      } catch (error) {
        options.onInspectionError?.(error, base)
        result.push(
          node(
            undefined,
            [...base, { kind: 'custom', typeId: 'diagnostic', key: String(i) }],
            String(i),
            parent,
            ancestors,
            i - start + 1,
            count,
            { type: 'inspection-error', summary: 'Unable to read entry' },
          ),
        )
      }
    }
    return result
  }
  return { root: node(value, [], '$', null, []), encode }
}
export type Model = ReturnType<typeof createModel>
export function buildVisible(
  model: Model,
  isExpanded: (node: Node) => boolean,
  limit = 10000,
): Node[] {
  const rows: Node[] = [],
    stack = [model.root]
  while (stack.length && rows.length < limit) {
    const next = stack.pop()!
    rows.push(next)
    if (next.expandable && isExpanded(next)) {
      const children = next.children()
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]!)
    }
  }
  return rows
}
