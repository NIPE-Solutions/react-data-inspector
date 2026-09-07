export type DataPathSegment =
  | string
  | number
  | { readonly kind: 'symbol'; readonly key: symbol }
  | {
      readonly kind: 'map-key' | 'map-value' | 'set-value'
      readonly index: number
    }
  | { readonly kind: 'custom'; readonly typeId: string; readonly key: string }
  | { readonly kind: 'range'; readonly start: number; readonly end: number }
export type DataPath = readonly DataPathSegment[]
export function pathEqual(
  a: DataPath | null | undefined,
  b: DataPath | null | undefined,
): boolean {
  if (!a || !b) return a === b
  return (
    a.length === b.length &&
    a.every((s, i) => {
      const t = b[i]
      if (typeof s !== 'object' || typeof t !== 'object') return s === t
      if (s.kind !== t.kind) return false
      if (s.kind === 'symbol' && t.kind === 'symbol') return s.key === t.key
      if (s.kind === 'custom' && t.kind === 'custom')
        return s.typeId === t.typeId && s.key === t.key
      if (s.kind === 'range' && t.kind === 'range')
        return s.start === t.start && s.end === t.end
      return 'index' in s && 'index' in t && s.index === t.index
    })
  )
}
export function toJsonPointer(path: DataPath): string | undefined {
  if (path.some((s) => typeof s === 'object')) return undefined
  return path
    .map((s) => '/' + String(s).replace(/~/g, '~0').replace(/\//g, '~1'))
    .join('')
}
export function toJavaScriptPath(path: DataPath): string | undefined {
  if (path.some((s) => typeof s === 'object')) return undefined
  return (
    path
      .map((s, i) =>
        typeof s === 'number'
          ? `[${s}]`
          : /^[A-Za-z_$][\w$]*$/.test(s as string)
            ? `${i ? '.' : ''}${s}`
            : `[${JSON.stringify(s)}]`,
      )
      .join('') || '$'
  )
}
export function toJsonPath(path: DataPath): string | undefined {
  if (path.some((s) => typeof s === 'object')) return undefined
  return (
    '$' +
    path
      .map((s) => (typeof s === 'number' ? `[${s}]` : `[${JSON.stringify(s)}]`))
      .join('')
  )
}
export function formatPath(path: DataPath): string {
  return (
    '$' +
    path
      .map((s) => {
        if (typeof s === 'number') return `[${s}]`
        if (typeof s === 'string')
          return /^[A-Za-z_$][\w$]*$/.test(s)
            ? '.' + s
            : `[${JSON.stringify(s)}]`
        if (s.kind === 'symbol') return `[${String(s.key)}]`
        if (s.kind === 'custom') return `⟨${s.typeId}:${s.key}⟩`
        if (s.kind === 'range') return `⟨${s.start}…${s.end - 1}⟩`
        return s.kind === 'set-value'
          ? `⟨Set:${s.index}⟩`
          : `⟨Map:${s.index}:${s.kind === 'map-key' ? 'key' : 'value'}⟩`
      })
      .join('')
  )
}
export function createPathEncoder() {
  const symbols = new Map<symbol, number>()
  return (path: DataPath): string =>
    JSON.stringify(
      path.map((s) => {
        if (typeof s !== 'object') return [typeof s, s]
        if (s.kind === 'symbol') {
          if (!symbols.has(s.key)) symbols.set(s.key, symbols.size)
          return ['symbol', symbols.get(s.key)]
        }
        if (s.kind === 'custom') return [s.kind, s.typeId, s.key]
        if (s.kind === 'range') return [s.kind, s.start, s.end]
        return [s.kind, s.index]
      }),
    )
}
