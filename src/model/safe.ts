export function ownValue(value: object, key: PropertyKey): unknown {
  const d = Object.getOwnPropertyDescriptor(value, key)
  return d && 'value' in d ? d.value : undefined
}
export function prototypeName(value: object): string {
  let p: object | null = Object.getPrototypeOf(value)
  let fallback = 'Object'
  for (let i = 0; p && i < 8; i++, p = Object.getPrototypeOf(p)) {
    const ctor = ownValue(p, 'constructor')
    if (typeof ctor === 'function') {
      const name = ownValue(ctor, 'name')
      if (typeof name === 'string' && name !== 'Object') {
        if (fallback === 'Object') fallback = name
        if (
          /^(Date|Map|Set|RegExp|URL|WeakMap|WeakSet|Promise|ArrayBuffer|SharedArrayBuffer|DataView|(?:Uint|Int|Float|BigInt|BigUint)\d+(?:Clamped)?Array|Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|AggregateError|HTML\w+Element|Text|Document)$/.test(
            name,
          )
        )
          return name
      }
    }
  }
  return fallback
}
export function primitive(value: unknown, limit = 200): string {
  if (typeof value === 'string')
    return (
      JSON.stringify(value.slice(0, limit)) +
      (value.length > limit ? `… (${value.length} chars)` : '')
    )
  if (typeof value === 'number' && Object.is(value, -0)) return '-0'
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'function') {
    const name = ownValue(value, 'name')
    return `ƒ ${typeof name === 'string' ? name.slice(0, 80) : ''}()`
  }
  return String(value)
}
export function positive(
  value: number | undefined,
  fallback: number,
  max = 100000,
): number {
  return value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.min(max, Math.floor(value))
    : fallback
}
