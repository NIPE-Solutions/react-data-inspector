import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
const Playground = lazy(() =>
  import('./playground/Playground').then((module) => ({
    default: module.Playground,
  })),
)
import '../src/styles.css'
import './style.css'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {location.pathname.replace(/\/$/, '') === '/playground' ? (
      <Suspense fallback={<p>Loading playground…</p>}>
        <Playground />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
