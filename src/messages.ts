import type { InspectorNodeContext } from './model/types'
export const defaultMessages = {
  summary: (node: InspectorNodeContext) => node.summary,
  nodeLabel: (node: InspectorNodeContext) => node.label,
  copyUnavailable: (reason: string) => reason,
  noMatchesLimited: 'No matches within the search limits.',
  revealUnavailable:
    'This result cannot be revealed within the inspection limits.',
  revealPending: 'Waiting for the requested path to become visible.',
  treeLabel: 'Data inspector',
  search: 'Search data',
  previousResult: 'Previous result',
  nextResult: 'Next result',
  searching: 'Searching…',
  noMatches: 'No matches',
  nodeActions: 'Node actions',
  close: 'Close actions',
  copyValue: 'Copy value',
  copyKey: 'Copy key',
  copyPath: 'Copy path',
  copyPointer: 'Copy JSON Pointer',
  copied: 'Copied',
  copyFailed: 'Copy failed. Select the text below to copy manually.',
  jump: 'Jump to original',
  showString: 'Show full string',
  stringTooLarge: 'String preview limited to 100,000 characters',
  copyReferencePath: 'Copy reference target path',
  actionUnavailable: 'Action unavailable',
  actionFailed: 'Action failed',
  rendererFailed: 'Custom renderer failed',
  limited:
    'Visible row limit reached. Collapse a branch to inspect other nodes.',
  instructions:
    'Arrow keys navigate. Enter opens branches or follows references. Space selects. F2 opens actions.',
  expand: (label: string) => `Expand ${label}`,
  collapse: (label: string) => `Collapse ${label}`,
  circular: (path: string) => `↩ circular reference to ${path}`,
  shared: (path: string) => `↗ same reference as ${path}`,
  results: (count: number, current: number, limited: boolean) =>
    `${current ? `${current} of ` : ''}${count}${limited ? ' or more' : ''} matches`,
}
export type InspectorMessages = typeof defaultMessages
