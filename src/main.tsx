import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PurchaseTracker from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PurchaseTracker />
  </StrictMode>,
)
