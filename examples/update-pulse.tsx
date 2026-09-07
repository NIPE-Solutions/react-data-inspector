import { createContext, useContext } from 'react'
import {
  DataInspector,
  toJsonPointer,
  type DataInspectorProps,
  type DataPath,
  type InspectorSlotProps,
} from '../src'
export const ChangedPaths = createContext<{
  tick: number
  paths: ReadonlySet<string>
}>({ tick: 0, paths: new Set() })
export function UpdatingValue({ node }: InspectorSlotProps) {
  const changed = useContext(ChangedPaths)
  const pointer = toJsonPointer(node.path)
  const updated = pointer !== undefined && changed.paths.has(pointer)
  return (
    <span
      key={updated ? changed.tick : 'stable'}
      data-stress-updated={updated || undefined}
    >
      {node.summary}
    </span>
  )
}

// Application wrapper: update paths come from the application, not a deep scan.
export function ChangeAwareInspector({
  updatedPaths,
  revision,
  highlightUpdates = true,
  ...props
}: DataInspectorProps & {
  updatedPaths: readonly DataPath[]
  revision: number
  highlightUpdates?: boolean
}) {
  const paths = new Set<string>()
  if (highlightUpdates)
    for (const path of updatedPaths) {
      const pointer = toJsonPointer(path)
      if (pointer !== undefined) paths.add(pointer)
    }
  return (
    <ChangedPaths.Provider value={{ tick: revision, paths }}>
      <DataInspector
        {...props}
        components={{ ...props.components, Value: UpdatingValue }}
      />
    </ChangedPaths.Provider>
  )
}
