import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { Site } from './Site'
export { routes, metadata } from './site/metadata'
export function render(path: string) {
  return renderToString(
    <StrictMode>
      <Site path={path} />
    </StrictMode>,
  )
}
