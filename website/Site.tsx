import { lazy, Suspense, useEffect, useState } from 'react'
import { Legal } from './site/Legal'
import { App } from './App'
import { articles } from './articles'
import { Documentation } from './site/Documentation'
import { Header, Footer } from './site/Chrome'
const Playground = lazy(() =>
  import('./playground/Playground').then((module) => ({
    default: module.Playground,
  })),
)
function PlaygroundRoute() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const shell = (
    <>
      <Header />
      <main id="main" className="route-loading">
        <h1>React Data Inspector playground</h1>
        <p>
          Inspect real JavaScript values, try custom types and CSS, and measure
          large datasets and changing application state.
        </p>
        <p>Enable JavaScript to use the interactive playground.</p>
        <a href="/docs">Read the documentation</a>
      </main>
      <Footer />
    </>
  )
  return mounted ? (
    <Suspense fallback={shell}>
      <Playground />
    </Suspense>
  ) : (
    shell
  )
}
export function Site({ path }: { path: string }) {
  const route = path.replace(/\/$/, '') || '/'
  if (route === '/') return <App />
  if (route === '/imprint' || route === '/privacy')
    return <Legal kind={route === '/imprint' ? 'imprint' : 'privacy'} />
  if (route === '/playground') return <PlaygroundRoute />
  const article = articles.find((item) => item.path === route)
  if (article) return <Documentation article={article} />
  return (
    <>
      <Header />
      <main id="main" className="route-loading">
        <p>404 / Unknown path</p>
        <h1>This page isn’t here.</h1>
        <p>Return to the documentation or inspect a value in the playground.</p>
        <a href="/docs">Documentation</a>
      </main>
      <Footer />
    </>
  )
}
