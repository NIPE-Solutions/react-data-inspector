import type { DataPath } from './path'
export interface InspectorChild {
  readonly key: string
  readonly value: unknown
}
export interface InspectorChildSource {
  readonly count: number
  getPage(offset: number, limit: number): readonly InspectorChild[]
}
export interface InspectorType<T = unknown> {
  readonly id: string
  matches(value: unknown): value is T
  summary(value: T): string
  children?(value: T): InspectorChildSource
  searchText?(value: T): string
}
export interface RegisteredInspectorType {
  readonly id: string
  inspect(
    value: unknown,
  ):
    | { summary: string; children?: InspectorChildSource; searchText?: string }
    | undefined
}
export function defineInspectorType<T>(
  definition: InspectorType<T>,
): RegisteredInspectorType {
  return {
    id: definition.id,
    inspect(value) {
      if (!definition.matches(value)) return undefined
      const createChildren = definition.children
      let resolved: InspectorChildSource | undefined
      const getSource = () => resolved ?? (resolved = createChildren!(value))
      const children: InspectorChildSource | undefined = createChildren
        ? {
            get count() {
              return getSource().count
            },
            getPage(offset, limit) {
              return getSource().getPage(offset, limit)
            },
          }
        : undefined
      return {
        summary: definition.summary(value),
        ...(children ? { children } : {}),
        ...(definition.searchText
          ? { searchText: definition.searchText(value) }
          : {}),
      }
    },
  }
}
export interface InspectionOptions {
  readonly includeNonEnumerable?: boolean
  readonly includeSymbols?: boolean
  readonly sortKeys?: boolean | ((a: string, b: string) => number)
  readonly maxDepth?: number
  readonly stringLimit?: number
  readonly onInspectionError?: (error: unknown, path: DataPath) => void
}
export interface ModelOptions extends InspectionOptions {
  readonly types?: readonly RegisteredInspectorType[]
  readonly arrayGrouping?: {
    readonly threshold?: number
    readonly size?: number
  }
}
export interface InspectorNodeContext {
  readonly path: DataPath
  readonly label: string
  readonly value: unknown
  readonly type: string
  readonly summary: string
  readonly depth: number
  readonly expandable: boolean
  readonly reference?: {
    readonly kind: 'circular' | 'shared'
    readonly path: DataPath
  }
}
export interface Node extends InspectorNodeContext {
  /** Internal provenance; a registered ID alone does not imply a match. */
  readonly customType?: boolean
  readonly id: string
  readonly parentId: string | null
  readonly address: DataPath
  readonly position: number
  readonly setSize: number
  readonly synthetic: boolean
  readonly limited: boolean
  readonly searchText: string
  children(offset?: number, limit?: number): readonly Node[]
}
