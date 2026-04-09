import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClinicalScribeProvider } from './context/ClinicalScribeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClinicalScribeProvider>
      <App />
    </ClinicalScribeProvider>
  </StrictMode>,
)
