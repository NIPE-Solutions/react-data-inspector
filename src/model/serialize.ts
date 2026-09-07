import { primitive, prototypeName } from './safe'
export type SerializationResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: string }
export function serializeValue(value: unknown): SerializationResult {
  const unavailable = (reason: string): SerializationResult => ({
    ok: false,
    reason,
  })
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function')
      return unavailable('Functions cannot be copied as values')
    if (typeof value === 'string' && value.length > 1000000)
      return unavailable('Copy size limit reached')
    return {
      ok: true,
      text: typeof value === 'string' ? value : primitive(value),
    }
  }
  try {
    if (prototypeName(value) === 'Date')
      return { ok: true, text: Date.prototype.toISOString.call(value) }
    const seen = new WeakSet<object>()
    let count = 0,
      characters = 0,
      descriptors = 0
    const wrap: { value?: unknown } = {}
    const stack: {
      value: unknown
      assign: (v: unknown) => void
      depth: number
    }[] = [
      {
        value,
        assign: (v) => {
          wrap.value = v
        },
        depth: 0,
      },
    ]
    while (stack.length) {
      const task = stack.pop()!,
        v = task.value
      if (++count > 10000 || task.depth > 100)
        return unavailable('Copy traversal limit reached')
      if (v === null || typeof v === 'boolean') {
        task.assign(v)
        continue
      }
      if (typeof v === 'string') {
        characters += v.length
        if (characters > 1000000) return unavailable('Copy size limit reached')
        task.assign(v)
        continue
      }
      if (typeof v === 'number' && Number.isFinite(v) && !Object.is(v, -0)) {
        task.assign(v)
        continue
      }
      if (typeof v !== 'object')
        return unavailable('Value is not losslessly JSON-compatible')
      if (seen.has(v))
        return unavailable('Graph contains circular or shared references')
      seen.add(v)
      const array = Array.isArray(v)
      if (!array && prototypeName(v) !== 'Object')
        return unavailable('Special values require a custom serializer')
      const keys = Reflect.ownKeys(v)
      const length = array
        ? (Object.getOwnPropertyDescriptor(v, 'length')?.value as number)
        : 0
      if (array && length > 10000)
        return unavailable('Copy traversal limit reached')
      const target: unknown[] | Record<string, unknown> = array
        ? []
        : (Object.create(null) as Record<string, unknown>)
      // JSON.stringify performs an inherited toJSON lookup even on arrays we create.
      if (array) Object.setPrototypeOf(target, null)
      let indices = 0
      for (const key of keys) {
        if (++descriptors > 10000 || count + stack.length >= 10000)
          return unavailable('Copy traversal limit reached')
        const d = Object.getOwnPropertyDescriptor(v, key)
        if (!d?.enumerable) continue
        if (typeof key === 'symbol' || !('value' in d))
          return unavailable(
            'Symbols and accessors require a custom serializer',
          )
        if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= length))
          return unavailable('Array has extra properties')
        if (array) indices++
        characters += key.length
        if (characters > 1000000) return unavailable('Copy size limit reached')
        Object.defineProperty(target, key, {
          value: undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        })
        stack.push({
          value: d.value,
          depth: task.depth + 1,
          assign: (next) => {
            Object.defineProperty(target, key, {
              value: next,
              writable: true,
              enumerable: true,
              configurable: true,
            })
          },
        })
      }
      if (array && indices !== length)
        return unavailable('Sparse arrays require a custom serializer')
      task.assign(target)
    }
    const text = JSON.stringify(wrap.value, null, 2)
    return text.length > 1000000
      ? unavailable('Copy size limit reached')
      : { ok: true, text }
  } catch {
    return unavailable('Unable to serialize this value safely')
  }
}
