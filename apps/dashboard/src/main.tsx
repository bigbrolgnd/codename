import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { TRPCProvider } from './lib/TRPCProvider.tsx'
import { TenantProvider } from './contexts/TenantContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TRPCProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </TRPCProvider>
  </React.StrictMode>,
)
