import { useEffect, useRef, useState } from 'react'
import type { DataInspectorProps, InspectorSlotProps } from './contracts'
import type { InspectorMessages } from './messages'
import { formatPath, toJsonPointer } from './model/path'
import { serializeValue } from './model/serialize'
import { SlotBoundary } from './SlotBoundary'
interface Props {
  props: DataInspectorProps
  slot: InspectorSlotProps
  messages: InspectorMessages
  close: () => void
  jump: () => void
}
export function Actions({ props, slot, messages: m, close, jump }: Props) {
  const [status, setStatus] = useState(''),
    [fallback, setFallback] = useState(''),
    [pending, setPending] = useState(false)
  const panel = useRef<HTMLDivElement>(null),
    alive = useRef(true),
    busy = useRef(false)
  useEffect(() => {
    alive.current = true
    panel.current?.querySelector('button')?.focus()
    return () => {
      alive.current = false
    }
  }, [])
  const execute = async (action: () => void | Promise<void>) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setStatus('')
    try {
      await action()
    } catch {
      if (alive.current) setStatus(m.actionFailed)
    } finally {
      busy.current = false
      if (alive.current) setPending(false)
    }
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (alive.current) setStatus(m.copied)
    } catch {
      if (alive.current) {
        setStatus(m.copyFailed)
        setFallback(text)
      }
    }
  }
  const actions: { id: string; label: string; run: () => void }[] = []
  const add = (id: string, label: string, fn: () => void | Promise<void>) =>
    actions.push({
      id,
      label,
      run: () => {
        void execute(fn)
      },
    })
  if (props.copyable !== false && slot.node.type !== 'range') {
    if (
      !['accessor', 'empty', 'inspection-error', 'limit'].includes(
        slot.node.type,
      )
    )
      add('copy-value', m.copyValue, async () => {
        const result = await (props.serialize ?? serializeValue)(
          slot.node.value,
          slot.node,
        )
        if (result.ok) await copy(result.text)
        else if (alive.current) setStatus(m.copyUnavailable(result.reason))
      })
    const segment = slot.node.path[slot.node.path.length - 1]
    if (
      segment !== undefined &&
      (typeof segment !== 'object' || segment.kind === 'symbol')
    )
      add('copy-key', m.copyKey, () =>
        copy(
          typeof segment === 'object' ? String(segment.key) : String(segment),
        ),
      )
    add('copy-path', m.copyPath, () => copy(formatPath(slot.node.path)))
    const pointer = toJsonPointer(slot.node.path)
    if (pointer !== undefined)
      add('copy-pointer', m.copyPointer, () => copy(pointer))
  }
  if (slot.node.reference) {
    add('jump', m.jump, jump)
    if (props.copyable !== false)
      add('copy-target', m.copyReferencePath, () =>
        copy(formatPath(slot.node.reference!.path)),
      )
  }
  if (typeof slot.node.value === 'string' && slot.node.value.length > 200)
    add('full-string', m.showString, () => {
      setFallback((slot.node.value as string).slice(0, 100000))
      if ((slot.node.value as string).length > 100000)
        setStatus(m.stringTooLarge)
    })
  let predicateFailed = false
  for (const action of props.actions ?? []) {
    try {
      if (!action.when || action.when(slot.node))
        add(action.id, action.label, () => action.onAction(slot.node))
    } catch {
      predicateFailed = true
    }
  }
  const Custom = props.components?.Actions
  return (
    <div
      data-rdi-actions
      ref={panel}
      role="group"
      aria-label={m.nodeActions}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          close()
        }
      }}
    >
      {Custom ? (
        <SlotBoundary
          fallback={m.rendererFailed}
          resetKey={[slot.node, Custom]}
        >
          <Custom {...slot} actions={actions} />
        </SlotBoundary>
      ) : (
        actions.map((action) => (
          <button
            type="button"
            key={action.id}
            disabled={pending}
            onClick={action.run}
          >
            {action.label}
          </button>
        ))
      )}
      <button type="button" onClick={close}>
        {m.close}
      </button>
      <span role="status">
        {status || (predicateFailed ? m.actionUnavailable : '')}
      </span>
      {fallback && (
        <textarea
          aria-label={m.copyValue}
          readOnly
          value={fallback}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  )
}
