import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import type { Node } from './model/types'
import type { DataInspectorProps, InspectorSlotProps } from './contracts'
import type { InspectorMessages } from './messages'
import { formatPath, pathEqual } from './model/path'
import { SlotBoundary } from './SlotBoundary'
import {
  ClassicKey,
  ClassicSummary,
  Delimiter,
  classicDelimiters,
  classicHidesKey,
} from './presentation'
interface Props {
  rows: readonly Node[]
  props: DataInspectorProps
  messages: InspectorMessages
  id: string
  active: Node
  selected: DataInspectorProps['selectedPath']
  isExpanded: (n: Node) => boolean
  toggle: (n: Node) => void
  select: (n: Node) => void
  focus: (n: Node) => void
  jump: (n: Node) => void
  openActions: () => void
  treeRef: React.RefObject<HTMLDivElement | null>
  query: string
}
export function Tree({
  rows,
  props,
  messages: m,
  id,
  active,
  selected,
  isExpanded,
  toggle,
  select,
  focus,
  openActions,
  jump,
  treeRef,
  query,
}: Props) {
  const [scroll, setScroll] = useState(0),
    [viewport, setViewport] = useState(400),
    [height, setHeight] = useState(28),
    [mounted, setMounted] = useState(false)
  const firstRow = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setMounted(true)
    const measure = () => {
      if (treeRef.current) setViewport(treeRef.current.clientHeight || 400)
      if (firstRow.current)
        setHeight(firstRow.current.getBoundingClientRect().height || 28)
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure)
    if (treeRef.current) observer?.observe(treeRef.current)
    if (firstRow.current) observer?.observe(firstRow.current)
    return () => observer?.disconnect()
  }, [treeRef, props.density, props.style, props.className])
  const threshold =
    typeof props.virtualization === 'object'
      ? (props.virtualization.threshold ?? 200)
      : 200
  const overscan =
    typeof props.virtualization === 'object'
      ? (props.virtualization.overscan ?? 8)
      : 8
  const classic = props.presentation === 'classic'
  const {
    children,
    indices,
    ends,
    starts,
    visualEnds,
    closing,
    visualCount,
    summaries,
  } = useMemo(() => {
    const children = new Map<string | null, Node[]>(),
      indices = new Map<string, number>(),
      ends = new Map<string, number>(),
      starts = new Map<string, number>(),
      visualEnds = new Map<string, number>(),
      closing = new Map<string, { offset: number; character: string }>(),
      summaries = new Map<string, string>()
    rows.forEach((node, index) => {
      indices.set(node.id, index)
      const list = children.get(node.parentId) ?? []
      list.push(node)
      children.set(node.parentId, list)
    })
    let visualCount = 0
    const stack: Node[] = []
    const finish = (node: Node, index: number) => {
      if (
        classic &&
        !props.components?.Value &&
        isExpanded(node) &&
        children.has(node.id)
      ) {
        const text = m.summary(node)
        summaries.set(node.id, text)
        const delimiters = classicDelimiters(node, text)
        if (delimiters)
          closing.set(node.id, {
            offset: visualCount++,
            character: delimiters[1],
          })
      }
      ends.set(node.id, index)
      visualEnds.set(node.id, visualCount)
    }
    rows.forEach((node, index) => {
      while (stack.length && stack[stack.length - 1]!.depth >= node.depth)
        finish(stack.pop()!, index)
      starts.set(node.id, visualCount++)
      stack.push(node)
    })
    while (stack.length) finish(stack.pop()!, rows.length)
    return {
      children,
      indices,
      ends,
      starts,
      visualEnds,
      closing,
      visualCount,
      summaries,
    }
  }, [rows, classic, isExpanded, props.components?.Value, m.summary])
  const virtual =
    mounted && props.virtualization !== false && visualCount > threshold
  const from = virtual ? Math.max(0, Math.floor(scroll / height) - overscan) : 0
  const to = virtual
    ? Math.min(visualCount, Math.ceil((scroll + viewport) / height) + overscan)
    : visualCount
  const activeIndex = indices.get(active.id) ?? 0
  useEffect(() => {
    const tree = treeRef.current
    if (!tree) return
    const row = tree.querySelector<HTMLElement>('[data-focused=true]')
    if (!row || !tree.clientHeight) return
    const bounds = row.getBoundingClientRect(),
      frame = tree.getBoundingClientRect()
    if (bounds.top < frame.top) tree.scrollTop += bounds.top - frame.top
    else if (bounds.bottom > frame.top + tree.clientHeight)
      tree.scrollTop += bounds.bottom - frame.top - tree.clientHeight
  }, [activeIndex, starts.get(active.id), height, treeRef, classic])
  const typeAhead = useRef({ text: '', time: 0 })
  function keyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    const current = activeIndex
    let next: Node | undefined
    if (e.key === 'ArrowDown')
      next = rows[Math.min(rows.length - 1, current + 1)]
    else if (e.key === 'ArrowUp') next = rows[Math.max(0, current - 1)]
    else if (e.key === 'Home') next = rows[0]
    else if (e.key === 'End') next = rows[rows.length - 1]
    else if (e.key === 'ArrowRight') {
      if (active.expandable && !isExpanded(active)) toggle(active)
      else if (rows[current + 1]?.parentId === active.id)
        next = rows[current + 1]
    } else if (e.key === 'ArrowLeft') {
      if (active.expandable && isExpanded(active)) toggle(active)
      else if (active.parentId !== null)
        next = rows[indices.get(active.parentId) ?? -1]
    } else if (e.key === 'Enter') {
      if (active.reference) jump(active)
      else {
        select(active)
        if (active.expandable) toggle(active)
      }
    } else if (e.key === ' ') select(active)
    else if (e.key === 'F2') openActions()
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now()
      typeAhead.current.text =
        (now - typeAhead.current.time < 700 ? typeAhead.current.text : '') +
        e.key.toLowerCase()
      typeAhead.current.time = now
      next = [...rows.slice(current + 1), ...rows.slice(0, current + 1)].find(
        (n) => n.label.toLowerCase().startsWith(typeAhead.current.text),
      )
    } else return
    e.preventDefault()
    if (next) focus(next)
  }
  function renderList(parentId: string | null): React.ReactNode {
    const list = children.get(parentId) ?? [],
      output: React.ReactNode[] = []
    let gap = 0
    const flush = () => {
      if (gap) {
        output.push(
          <div
            key={`gap-${output.length}`}
            role="presentation"
            aria-hidden="true"
            style={{ height: gap * height }}
          />,
        )
        gap = 0
      }
    }
    for (const node of list) {
      const index = indices.get(node.id)!,
        end = ends.get(node.id)!,
        visualStart = starts.get(node.id)!,
        visualEnd = visualEnds.get(node.id)!,
        close = closing.get(node.id),
        containsActive = index <= activeIndex && end > activeIndex
      if (
        virtual &&
        (visualEnd <= from || visualStart >= to) &&
        !containsActive
      ) {
        gap += visualEnd - visualStart
        continue
      }
      flush()
      const rowVisible =
        index === 0 ||
        !virtual ||
        (visualStart >= from && visualStart < to) ||
        index === activeIndex
      const slot: InspectorSlotProps = {
        node,
        selected: !node.synthetic && pathEqual(node.path, selected),
        focused: node.id === active.id,
        expanded: isExpanded(node),
      }
      const { Toggle, Key, Value, Reference } = props.components ?? {}
      const text = node.reference
        ? m[node.reference.kind](formatPath(node.reference.path))
        : (summaries.get(node.id) ?? m.summary(node))
      const matches =
        !!query &&
        (node.label + ' ' + node.searchText)
          .toLowerCase()
          .includes(query.toLowerCase())
      output.push(
        <div
          key={node.id}
          id={`${id}-n-${index}`}
          role="treeitem"
          aria-label={`${m.nodeLabel(node)}: ${text}`}
          aria-level={node.depth + 1}
          aria-posinset={node.position}
          aria-setsize={node.setSize}
          aria-expanded={node.expandable ? slot.expanded : undefined}
          aria-selected={node.synthetic ? undefined : slot.selected}
        >
          {rowVisible ? (
            <div
              ref={index === 0 ? firstRow : undefined}
              data-rdi-node
              data-type={node.type}
              data-depth={node.depth}
              data-expanded={slot.expanded}
              data-selected={slot.selected}
              data-focused={slot.focused}
              data-rdi-match={matches || undefined}
              style={{ '--rdi-depth': node.depth } as CSSProperties}
              onClick={() => {
                focus(node)
                select(node)
                treeRef.current?.focus()
              }}
            >
              <button
                type="button"
                data-rdi-toggle
                tabIndex={-1}
                aria-label={
                  slot.expanded
                    ? m.collapse(m.nodeLabel(node))
                    : m.expand(m.nodeLabel(node))
                }
                aria-hidden={!node.expandable || undefined}
                disabled={!node.expandable}
                onClick={(e) => {
                  e.stopPropagation()
                  focus(node)
                  toggle(node)
                  treeRef.current?.focus()
                }}
              >
                {node.expandable ? (
                  <SlotBoundary
                    fallback={m.rendererFailed}
                    resetKey={[node, Toggle]}
                  >
                    {Toggle ? (
                      <Toggle {...slot} />
                    ) : (
                      <span aria-hidden="true">
                        {slot.expanded ? '⌄' : '›'}
                      </span>
                    )}
                  </SlotBoundary>
                ) : null}
              </button>
              {(!classic || Key || !classicHidesKey(node)) && (
                <>
                  <span data-rdi-key>
                    <SlotBoundary
                      fallback={m.rendererFailed}
                      resetKey={[node, Key]}
                    >
                      {Key ? (
                        <Key {...slot} />
                      ) : classic ? (
                        <ClassicKey node={node} label={m.nodeLabel(node)} />
                      ) : (
                        m.nodeLabel(node)
                      )}
                    </SlotBoundary>
                  </span>
                  <span data-rdi-separator aria-hidden="true">
                    :
                  </span>
                </>
              )}
              <span data-rdi-value>
                <SlotBoundary
                  fallback={m.rendererFailed}
                  resetKey={[node, node.reference ? Reference : Value]}
                >
                  {node.reference ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-rdi-reference
                      aria-label={`${m.jump}: ${formatPath(node.reference.path)}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        jump(node)
                      }}
                    >
                      {Reference ? <Reference {...slot} /> : text}
                    </button>
                  ) : Value ? (
                    <Value {...slot} />
                  ) : classic && !node.customType ? (
                    <ClassicSummary
                      node={node}
                      text={text}
                      multiline={!!close}
                      empty={
                        slot.expanded &&
                        !children.has(node.id) &&
                        // The final row at the traversal budget may have
                        // children that did not fit in the visible row set.
                        (index < rows.length - 1 || rows.length < 10000)
                      }
                    />
                  ) : (
                    text
                  )}
                </SlotBoundary>
                {classic &&
                  !close &&
                  !node.synthetic &&
                  node.position < node.setSize && (
                    <Delimiter kind="comma">,</Delimiter>
                  )}
              </span>
            </div>
          ) : (
            <div aria-hidden="true" style={{ height }} />
          )}
          {children.has(node.id) && (
            <div role="group">{renderList(node.id)}</div>
          )}
          {close &&
            (!virtual || (close.offset >= from && close.offset < to) ? (
              <div
                data-rdi-closing
                aria-hidden="true"
                style={{ '--rdi-depth': node.depth } as CSSProperties}
              >
                <Delimiter kind="close">{close.character}</Delimiter>
                {!node.synthetic && node.position < node.setSize && (
                  <Delimiter kind="comma">,</Delimiter>
                )}
              </div>
            ) : (
              <div aria-hidden="true" style={{ height }} />
            ))}
        </div>,
      )
    }
    flush()
    return output
  }
  return (
    <div
      ref={treeRef}
      data-rdi-tree
      role="tree"
      tabIndex={0}
      aria-label={props['aria-label'] ?? m.treeLabel}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={`${id}-instructions`}
      aria-activedescendant={`${id}-n-${activeIndex}`}
      onKeyDown={keyDown}
      onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
    >
      {renderList(null)}
    </div>
  )
}
