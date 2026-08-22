/** Browser entry: mounts the editor shell under Vite's `#root` element. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './client/App.tsx'

const root = document.getElementById('root')
if (root === null) throw new Error('ontology-studio: #root element missing from index.html')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
