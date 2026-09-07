import introduction from './docs/introduction.md?raw'
import installation from './docs/installation.md?raw'
import expansion from './docs/expansion.md?raw'
import selection from './docs/selection.md?raw'
import search from './docs/search.md?raw'
import copying from './docs/copying.md?raw'
import objectGraphs from './docs/object-graphs.md?raw'
import paths from './docs/paths.md?raw'
import safeInspection from './docs/safe-inspection.md?raw'
import customization from './docs/customization.md?raw'
import customTypes from './docs/custom-types.md?raw'
import largeData from './docs/large-data.md?raw'
import api from '../docs/api.md?raw'
import types from './docs/types.md?raw'
import performance from './docs/performance.md?raw'
import accessibility from './docs/accessibility.md?raw'
import limitations from './docs/limitations.md?raw'
import migrateReact18 from './docs/migrate-react18-json-view.md?raw'
import migrateLite from './docs/migrate-react-json-view-lite.md?raw'
import migrateUiw from './docs/migrate-uiw-react-json-view.md?raw'

export interface Article {
  path: string
  title: string
  description: string
  group: string
  content: string
}

export const articles: readonly Article[] = [
  {
    path: '/docs',
    title: 'Introduction',
    description: 'Inspect application-owned JavaScript values in React.',
    group: 'Docs',
    content: introduction,
  },
  {
    path: '/docs/installation',
    title: 'Installation',
    description: 'Build, install, import, and style the package.',
    group: 'Docs',
    content: installation,
  },
  {
    path: '/docs/expansion',
    title: 'Expansion',
    description: 'Use controlled or uncontrolled expansion paths.',
    group: 'Docs',
    content: expansion,
  },
  {
    path: '/docs/selection',
    title: 'Selection',
    description: 'Coordinate focus, selection, and details views.',
    group: 'Docs',
    content: selection,
  },
  {
    path: '/docs/search',
    title: 'Search',
    description: 'Search collapsed data with explicit work limits.',
    group: 'Docs',
    content: search,
  },
  {
    path: '/docs/copying',
    title: 'Copying',
    description: 'Copy values and paths without silent data loss.',
    group: 'Docs',
    content: copying,
  },
  {
    path: '/concepts/object-graphs',
    title: 'Object graphs',
    description: 'Understand cycles, sharing, and canonical targets.',
    group: 'Concepts',
    content: objectGraphs,
  },
  {
    path: '/concepts/paths',
    title: 'Paths',
    description: 'Address ordinary and rich JavaScript data.',
    group: 'Concepts',
    content: paths,
  },
  {
    path: '/concepts/safe-inspection',
    title: 'Safe inspection',
    description: 'Know what inspection executes and avoids.',
    group: 'Concepts',
    content: safeInspection,
  },
  {
    path: '/guides/customization',
    title: 'Customization',
    description: 'Apply themes, slots, actions, and controlled state.',
    group: 'Guides',
    content: customization,
  },
  {
    path: '/guides/custom-types',
    title: 'Custom types',
    description: 'Teach the inspector about domain values.',
    group: 'Guides',
    content: customTypes,
  },
  {
    path: '/guides/large-data',
    title: 'Large data',
    description: 'Use grouping, limits, and virtualization deliberately.',
    group: 'Guides',
    content: largeData,
  },
  {
    path: '/guides/migrate-from-react18-json-view',
    title: 'Migrate from react18-json-view',
    description: 'Translate display and collapse behavior.',
    group: 'Migration',
    content: migrateReact18,
  },
  {
    path: '/guides/migrate-from-react-json-view-lite',
    title: 'Migrate from react-json-view-lite',
    description: 'Move from its compact JSON tree API.',
    group: 'Migration',
    content: migrateLite,
  },
  {
    path: '/guides/migrate-from-uiw-react-json-view',
    title: 'Migrate from @uiw/react-json-view',
    description: 'Translate the v2 alpha component API.',
    group: 'Migration',
    content: migrateUiw,
  },
  {
    path: '/reference/api',
    title: 'API reference',
    description: 'Complete public exports, props, and defaults.',
    group: 'Reference',
    content: api,
  },
  {
    path: '/reference/types',
    title: 'Type support',
    description: 'Exact behavior for JavaScript value categories.',
    group: 'Reference',
    content: types,
  },
  {
    path: '/performance',
    title: 'Performance',
    description: 'Reproduce and interpret the benchmark evidence.',
    group: 'Project',
    content: performance,
  },
  {
    path: '/accessibility',
    title: 'Accessibility',
    description: 'Keyboard behavior, semantics, and audit status.',
    group: 'Project',
    content: accessibility,
  },
  {
    path: '/limitations',
    title: 'Limitations',
    description: 'Current product and inspection boundaries.',
    group: 'Project',
    content: limitations,
  },
]
