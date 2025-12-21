import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PurchaseTracker from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
  <PurchaseTracker />
</AuthProvider>

  </StrictMode>,
)
