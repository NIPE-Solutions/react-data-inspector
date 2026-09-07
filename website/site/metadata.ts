import { legalPages } from './Legal'
import { articles } from '../articles'
import { origin } from './Chrome'
export const routes = [
  {
    path: '/',
    title:
      'React Data Inspector — a React inspector for real JavaScript object graphs',
    description:
      'Inspect the object you actually have. A React JSON viewer alternative with real JavaScript types, shared references, cycles, controlled state and deep customization.',
  },
  ...articles,
  ...legalPages,
  {
    path: '/playground',
    title: 'Interactive playground',
    description:
      'Explore real JavaScript values, custom renderers, live updates, large data, search and design-system integration with React Data Inspector.',
  },
]
export function metadata(path: string) {
  const route = routes.find((item) => item.path === path)
  return {
    title: route
      ? path === '/'
        ? route.title
        : `${route.title} · React Data Inspector`
      : 'Page not found · React Data Inspector',
    description:
      route?.description ??
      'Find documentation and examples for React Data Inspector.',
    canonical: origin + (path === '/' ? '' : path),
    index: !!route,
  }
}
