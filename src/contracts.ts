import type { ComponentType, CSSProperties } from 'react'
import type { DataPath } from './model/path'
import type {
  InspectionOptions,
  InspectorNodeContext,
  RegisteredInspectorType,
} from './model/types'
import type { SearchOptions } from './model/search'
import type { SerializationResult } from './model/serialize'
import type { InspectorMessages } from './messages'
export interface InspectorAction {
  readonly id: string
  readonly label: string
  readonly when?: (node: InspectorNodeContext) => boolean
  readonly onAction: (node: InspectorNodeContext) => void | Promise<void>
}
export interface InspectorSlotProps {
  readonly node: InspectorNodeContext
  readonly selected: boolean
  readonly focused: boolean
  readonly expanded: boolean
}
export interface InspectorActionsSlotProps extends InspectorSlotProps {
  readonly actions: readonly {
    readonly id: string
    readonly label: string
    readonly run: () => void
  }[]
}
export interface InspectorComponents {
  readonly Toggle?: ComponentType<InspectorSlotProps>
  readonly Key?: ComponentType<InspectorSlotProps>
  readonly Value?: ComponentType<InspectorSlotProps>
  readonly Reference?: ComponentType<InspectorSlotProps>
  readonly Actions?: ComponentType<InspectorActionsSlotProps>
}
export interface DataInspectorProps {
  readonly value: unknown
  readonly defaultExpandedDepth?: number
  readonly defaultExpandedPaths?: readonly DataPath[]
  readonly expandedPaths?: readonly DataPath[]
  readonly onExpandedPathsChange?: (paths: readonly DataPath[]) => void
  readonly defaultSelectedPath?: DataPath | null
  readonly selectedPath?: DataPath | null
  readonly onSelectedPathChange?: (
    path: DataPath | null,
    node: InspectorNodeContext,
  ) => void
  readonly searchable?: boolean
  readonly searchQuery?: string
  readonly onSearchQueryChange?: (query: string) => void
  readonly searchOptions?: SearchOptions
  readonly copyable?: boolean
  readonly serialize?: (
    value: unknown,
    node: InspectorNodeContext,
  ) => SerializationResult | Promise<SerializationResult>
  readonly types?: readonly RegisteredInspectorType[]
  readonly components?: InspectorComponents
  readonly actions?: readonly InspectorAction[]
  readonly messages?: Partial<InspectorMessages>
  readonly className?: string
  readonly style?: CSSProperties
  readonly theme?: 'light' | 'dark' | 'system'
  readonly density?: 'compact' | 'comfortable'
  readonly unstyled?: boolean
  readonly inspectionOptions?: InspectionOptions
  readonly arrayGrouping?: {
    readonly threshold?: number
    readonly size?: number
  }
  readonly virtualization?:
    'auto' | false | { readonly threshold?: number; readonly overscan?: number }
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
}
