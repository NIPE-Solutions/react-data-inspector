import type { ReactNode } from 'react'
import type { Node } from './model/types'

// Syntax never adds model nodes, graph reads, or accessible tree items.
// Expanded closing lines have explicit visual offsets in Tree.
export function Delimiter({
  kind,
  children,
}: {
  kind: 'open' | 'close' | 'comma' | 'quote' | 'index'
  children: ReactNode
}) {
  return (
    <span data-rdi-delimiter={kind} aria-hidden="true">
      {children}
    </span>
  )
}

export function ClassicKey({ node, label }: { node: Node; label: string }) {
  if (node.synthetic || !node.path.length) return label
  const segment = node.path[node.path.length - 1]
  if (
    typeof segment === 'string' ||
    (typeof segment === 'object' && segment.kind === 'custom')
  ) {
    return (
      <>
        <Delimiter kind="quote">"</Delimiter>
        {JSON.stringify(label).slice(1, -1)}
        <Delimiter kind="quote">"</Delimiter>
      </>
    )
  }
  if (
    typeof segment === 'number' ||
    (typeof segment === 'object' && segment.kind === 'symbol')
  ) {
    return (
      <>
        <Delimiter kind="index">[</Delimiter>
        {label}
        <Delimiter kind="index">]</Delimiter>
      </>
    )
  }
  return label
}

export function ClassicSummary({
  node,
  text,
  empty,
  multiline,
}: {
  node: Node
  text: string
  empty: boolean
  multiline: boolean
}) {
  // Consumer localization and custom summaries are complete replacements.
  if (text !== node.summary || node.limited) return text
  if (node.type === 'date' || node.type === 'url') {
    return (
      <>
        {node.type === 'date' ? 'Date' : 'URL'}
        <Delimiter kind="open">(</Delimiter>
        {JSON.stringify(text)}
        <Delimiter kind="close">)</Delimiter>
      </>
    )
  }
  const delimiters = classicDelimiters(node, text)
  if (!delimiters) return text
  const [open, close] = delimiters
  const syntax = (
    <>
      <Delimiter kind="open">{open}</Delimiter>
      {!multiline && (
        <>
          <span data-rdi-annotation aria-hidden="true">
            {empty ? '' : ' … '}
          </span>
          <Delimiter kind="close">{close}</Delimiter>
        </>
      )}
    </>
  )
  if (node.type === 'object') return syntax
  if (node.type === 'array' && multiline) return syntax
  if (node.type === 'array')
    return (
      <>
        {syntax}
        <span data-rdi-annotation> {text}</span>
      </>
    )
  return (
    <>
      {text} {syntax}
    </>
  )
}

export function classicDelimiters(
  node: Node,
  text: string,
): readonly [string, string] | undefined {
  if (
    node.customType ||
    node.limited ||
    node.reference ||
    text !== node.summary
  )
    return undefined
  if (['array', 'typedarray', 'arraybuffer', 'dataview'].includes(node.type))
    return ['[', ']']
  if (['object', 'map', 'set', 'error'].includes(node.type)) return ['{', '}']
  return undefined
}

export function classicHidesKey(node: Node): boolean {
  if (node.synthetic) return false
  if (!node.path.length) return true
  const segment = node.path[node.path.length - 1]
  return (
    typeof segment === 'number' ||
    (typeof segment === 'object' && segment.kind === 'set-value')
  )
}
