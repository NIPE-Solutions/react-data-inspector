import type { ReactNode } from 'react'
import type { Node } from './model/types'

// Syntax is an inline rendering detail. It never adds model nodes, graph reads,
// virtual offsets, or content to the treeitem's accessible name.
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
}: {
  node: Node
  text: string
  empty: boolean
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
  const brackets =
    node.type === 'array' ||
    node.type === 'typedarray' ||
    node.type === 'arraybuffer' ||
    node.type === 'dataview'
  const braces =
    node.type === 'object' ||
    node.type === 'map' ||
    node.type === 'set' ||
    node.type === 'error'
  if (!brackets && !braces) return text
  const syntax = (
    <>
      <Delimiter kind="open">{brackets ? '[' : '{'}</Delimiter>
      <span data-rdi-annotation aria-hidden="true">
        {empty ? '' : ' … '}
      </span>
      <Delimiter kind="close">{brackets ? ']' : '}'}</Delimiter>
    </>
  )
  if (node.type === 'object') return syntax
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
