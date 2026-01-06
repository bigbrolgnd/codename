import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { TRPCProvider } from './lib/TRPCProvider.tsx'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </React.StrictMode>
  );
} catch (e) {
  console.error('React Render Error:', e);
}