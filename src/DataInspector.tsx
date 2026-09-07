import { useEffect, useId, useRef, useState } from 'react'
import type { DataInspectorProps } from './contracts'
import { defaultMessages } from './messages'
import { createModel, buildVisible, type Model } from './model/graph'
import { pathEqual, type DataPath } from './model/path'
import {
  searchValue,
  type SearchResult,
  type SearchMatch,
} from './model/search'
import { resolvePath } from './model/resolve'
import type { Node } from './model/types'
import { Tree } from './Tree'
import { Actions } from './Actions'
export function DataInspector(props: DataInspectorProps) {
  // A parent render is a new inspection generation, even for a mutated same-reference input.
  const model = createModel(props.value, {
    ...props.inspectionOptions,
    ...(props.types ? { types: props.types } : {}),
    ...(props.arrayGrouping ? { arrayGrouping: props.arrayGrouping } : {}),
  })
  return <InspectorView props={props} model={model} />
}
function InspectorView({
  props,
  model,
}: {
  props: DataInspectorProps
  model: Model
}) {
  const id = useId(),
    treeRef = useRef<HTMLDivElement>(null),
    m = { ...defaultMessages, ...props.messages }
  const [opened, setOpened] = useState<readonly DataPath[]>(
      props.defaultExpandedPaths ?? [],
    ),
    [closed, setClosed] = useState<readonly DataPath[]>([])
  const [selection, setSelection] = useState<DataPath | null>(
      props.defaultSelectedPath ?? null,
    ),
    [focused, setFocused] = useState<DataPath>(
      props.selectedPath ?? props.defaultSelectedPath ?? [],
    )
  const [queryState, setQuery] = useState(''),
    [result, setResult] = useState<SearchResult>({
      matches: [],
      scanned: 0,
      limited: false,
    }),
    [searching, setSearching] = useState(false),
    [currentMatch, setCurrentMatch] = useState<{
      query: string
      path: DataPath
    } | null>(null),
    [actionsOpen, setActionsOpen] = useState(false)
  const [pendingReveal, setPendingReveal] = useState<{
      path: DataPath
      expand: readonly DataPath[]
      matchPath: DataPath | null
      query: string
      value: unknown
    } | null>(null),
    [revealStatus, setRevealStatus] = useState('')
  const selected =
      props.selectedPath !== undefined ? props.selectedPath : selection,
    query = props.searchQuery ?? queryState
  const current =
    currentMatch?.query === query
      ? result.matches.findIndex((match) =>
          pathEqual(match.path, currentMatch.path),
        )
      : -1
  const openIds = new Set(opened.map(model.encode))
  const closedIds = new Set(closed.map(model.encode))
  const controlledIds =
    props.expandedPaths === undefined
      ? undefined
      : new Set(props.expandedPaths.map(model.encode))
  const isExpanded = (n: Node) =>
    controlledIds !== undefined
      ? controlledIds.has(n.id)
      : openIds.has(n.id) ||
        (!n.synthetic &&
          n.depth < (props.defaultExpandedDepth ?? 1) &&
          !closedIds.has(n.id))
  const rows = buildVisible(model, isExpanded)
  const active =
    rows.find((n) => pathEqual(n.address, focused)) ??
    [...rows]
      .reverse()
      .find(
        (n) =>
          n.address.length < focused.length &&
          pathEqual(n.address, focused.slice(0, n.address.length)),
      ) ??
    rows[0]!
  function requestExpansion(next: readonly DataPath[]) {
    if (props.expandedPaths === undefined) {
      setOpened(next)
      const nextIds = new Set(next.map(model.encode))
      const visibleIds = new Set(rows.map((node) => node.id))
      setClosed((previous) => [
        ...previous.filter(
          (path) =>
            !nextIds.has(model.encode(path)) &&
            !visibleIds.has(model.encode(path)),
        ),
        ...rows
          .filter((n) => n.expandable && !nextIds.has(n.id))
          .map((n) => n.address),
      ])
    }
    props.onExpandedPathsChange?.(next)
  }
  function toggle(node: Node) {
    if (!node.expandable) return
    const existing = props.expandedPaths ?? [
      ...opened,
      ...rows
        .filter((n) => n.expandable && isExpanded(n) && !openIds.has(n.id))
        .map((n) => n.address),
    ]
    requestExpansion(
      isExpanded(node)
        ? existing.filter((p) => !pathEqual(p, node.address))
        : [...existing, node.address],
    )
  }
  function select(node: Node) {
    if (node.synthetic) return
    if (props.selectedPath === undefined) setSelection(node.path)
    props.onSelectedPathChange?.(node.path, node)
  }
  useEffect(() => {
    const controller = new AbortController()
    setResult({ matches: [], scanned: 0, limited: false })
    if (!query) {
      setSearching(false)
      return () => controller.abort()
    }
    setSearching(true)
    const timer = setTimeout(() => {
      void searchValue(
        props.value,
        query,
        props.searchOptions,
        controller.signal,
        {
          ...props.inspectionOptions,
          ...(props.types ? { types: props.types } : {}),
          ...(props.arrayGrouping
            ? { arrayGrouping: props.arrayGrouping }
            : {}),
        },
      ).then(
        (next) => {
          if (!controller.signal.aborted) {
            setResult(next)
            setCurrentMatch((previous) =>
              previous?.query === query &&
              next.matches.some((match) => pathEqual(match.path, previous.path))
                ? previous
                : null,
            )
            setSearching(false)
          }
        },
        () => {
          if (!controller.signal.aborted) setSearching(false)
        },
      )
    }, props.searchOptions?.debounce ?? 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [model, query])
  useEffect(() => {
    setCurrentMatch(null)
    setPendingReveal(null)
    setRevealStatus('')
  }, [query])
  useEffect(() => {
    if (!pendingReveal) return
    if (pendingReveal.query !== query) return
    if (!Object.is(pendingReveal.value, props.value)) {
      setPendingReveal(null)
      setRevealStatus(m.revealUnavailable)
      return
    }
    const target = rows.find(
      (n) => !n.synthetic && pathEqual(n.path, pendingReveal.path),
    )
    if (!target) {
      const expanded = props.expandedPaths ?? opened
      if (
        pendingReveal.expand.every((path) =>
          expanded.some((p) => pathEqual(p, path)),
        )
      ) {
        setPendingReveal(null)
        setRevealStatus(m.revealUnavailable)
      }
      return
    }
    setPendingReveal(null)
    setRevealStatus('')
    setFocused(target.address)
    if (pendingReveal.matchPath !== null) {
      setCurrentMatch({ query, path: pendingReveal.matchPath })
      if (props.selectedPath === undefined) setSelection(target.path)
      props.onSelectedPathChange?.(target.path, target)
    }
  }, [
    pendingReveal,
    query,
    rows,
    opened,
    props.expandedPaths,
    props.value,
    props.selectedPath,
    props.onSelectedPathChange,
    m.revealUnavailable,
  ])
  function requestReveal(path: DataPath, matchPath: DataPath | null) {
    const resolved = resolvePath(model, path)
    if (!resolved.ok) {
      setPendingReveal(null)
      setRevealStatus(m.revealUnavailable)
      return
    }
    const expanded = props.expandedPaths ?? [
      ...opened,
      ...rows.filter(isExpanded).map((n) => n.address),
    ]
    setPendingReveal({
      path: resolved.node.path,
      expand: resolved.expand,
      matchPath,
      query,
      value: props.value,
    })
    setRevealStatus(m.revealPending)
    requestExpansion([
      ...expanded,
      ...resolved.expand.filter(
        (path) => !expanded.some((p) => pathEqual(p, path)),
      ),
    ])
  }
  function reveal(match: SearchMatch) {
    requestReveal(match.path, match.path)
  }
  function navigate(direction: number) {
    if (!result.matches.length) return
    const index =
      current < 0
        ? direction < 0
          ? result.matches.length - 1
          : 0
        : (current + direction + result.matches.length) % result.matches.length
    reveal(result.matches[index]!)
  }
  function closeActions() {
    setActionsOpen(false)
    treeRef.current?.focus()
  }
  function jump() {
    if (!active.reference) return
    requestReveal(active.reference.path, null)
    closeActions()
  }
  return (
    <div
      data-rdi-root
      data-theme={props.theme ?? 'system'}
      data-density={props.density ?? 'compact'}
      data-rdi-unstyled={props.unstyled || undefined}
      className={props.className}
      style={props.style}
    >
      {props.searchable && (
        <div data-rdi-search>
          <input
            type="search"
            aria-label={m.search}
            placeholder={m.search}
            value={query}
            onChange={(e) => {
              if (props.searchQuery === undefined)
                setQuery(e.currentTarget.value)
              props.onSearchQueryChange?.(e.currentTarget.value)
            }}
          />
          <span role="status">
            {searching
              ? m.searching
              : query
                ? result.matches.length
                  ? m.results(
                      result.matches.length,
                      current + 1,
                      result.limited,
                    )
                  : result.limited
                    ? m.noMatchesLimited
                    : m.noMatches
                : ''}
          </span>
          <button
            type="button"
            aria-label={m.previousResult}
            disabled={!result.matches.length}
            onClick={() => navigate(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={m.nextResult}
            disabled={!result.matches.length}
            onClick={() => navigate(1)}
          >
            ↓
          </button>
        </div>
      )}
      <Tree
        rows={rows}
        props={props}
        messages={m}
        id={id}
        active={active}
        selected={selected}
        isExpanded={isExpanded}
        toggle={toggle}
        select={select}
        focus={(n) => setFocused(n.address)}
        openActions={() => setActionsOpen(true)}
        treeRef={treeRef}
        query={query}
      />
      {revealStatus && <div role="status">{revealStatus}</div>}
      <div data-rdi-footer>
        <span id={`${id}-instructions`}>{m.instructions}</span>
        <button
          type="button"
          aria-label={m.nodeActions}
          aria-expanded={actionsOpen}
          onClick={() => setActionsOpen(!actionsOpen)}
        >
          •••
        </button>
      </div>
      {rows.length >= 10000 && <div role="status">{m.limited}</div>}
      {actionsOpen && (
        <Actions
          key={active.id}
          props={props}
          slot={{
            node: active,
            selected: pathEqual(active.path, selected),
            focused: true,
            expanded: isExpanded(active),
          }}
          messages={m}
          close={closeActions}
          jump={jump}
        />
      )}
    </div>
  )
}
