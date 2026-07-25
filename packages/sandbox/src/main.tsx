import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createApplication } from '@geaac/engine'

import { App } from '#sandbox/App'
import '#sandbox/index.css'

const application = createApplication({
  name: 'GEAAC Sandbox',
})

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <App application={application} />
  </StrictMode>,
)
