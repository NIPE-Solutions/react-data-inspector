import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Site } from './Site'
import { metadata } from './site/metadata'
import '../src/styles.css'
import './style.css'
import './story.css'
const path = location.pathname.replace(/\/$/, '') || '/'
const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <Site path={path} />
  </StrictMode>
)
if (root.hasChildNodes()) hydrateRoot(root, app)
else {
  document.title = metadata(path).title
  createRoot(root).render(app)
}
