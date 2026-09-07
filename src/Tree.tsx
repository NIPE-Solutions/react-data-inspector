import {
  useEffect,
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
  const virtual =
    mounted && props.virtualization !== false && rows.length > threshold
  const from = virtual
      ? Math.max(0, Math.floor(scroll / height) - overscan)
      : 0,
    to = virtual
      ? Math.min(
          rows.length,
          Math.ceil((scroll + viewport) / height) + overscan,
        )
      : rows.length
  const activeIndex = Math.max(0, rows.indexOf(active))
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
  }, [activeIndex, height, treeRef])
  const children = new Map<string | null, Node[]>(),
    indices = new Map<string, number>(),
    ends = new Map<string, number>(),
    stack: Node[] = []
  rows.forEach((node, index) => {
    while (stack.length && stack[stack.length - 1]!.depth >= node.depth)
      ends.set(stack.pop()!.id, index)
    stack.push(node)
    indices.set(node.id, index)
    const list = children.get(node.parentId) ?? []
    list.push(node)
    children.set(node.parentId, list)
  })
  while (stack.length) ends.set(stack.pop()!.id, rows.length)
  const typeAhead = useRef({ text: '', time: 0 })
  function keyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    const current = rows.indexOf(active)
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
      else next = rows.find((n) => n.id === active.parentId)
    } else if (e.key === 'Enter' || e.key === ' ') select(active)
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
        containsActive = index <= activeIndex && end > activeIndex
      if (virtual && (end <= from || index >= to) && !containsActive) {
        gap += end - index
        continue
      }
      flush()
      const rowVisible =
        index === 0 ||
        !virtual ||
        (index >= from && index < to) ||
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
        : m.summary(node)
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
              <span data-rdi-key>
                <SlotBoundary
                  fallback={m.rendererFailed}
                  resetKey={[node, Key]}
                >
                  {Key ? <Key {...slot} /> : m.nodeLabel(node)}
                </SlotBoundary>
              </span>
              <span data-rdi-separator aria-hidden="true">
                :
              </span>
              <span data-rdi-value>
                <SlotBoundary
                  fallback={m.rendererFailed}
                  resetKey={[node, node.reference ? Reference : Value]}
                >
                  {node.reference ? (
                    <span data-rdi-reference>
                      {Reference ? <Reference {...slot} /> : text}
                    </span>
                  ) : Value ? (
                    <Value {...slot} />
                  ) : (
                    text
                  )}
                </SlotBoundary>
              </span>
            </div>
          ) : (
            <div aria-hidden="true" style={{ height }} />
          )}
          {children.has(node.id) && (
            <div role="group">{renderList(node.id)}</div>
          )}
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
