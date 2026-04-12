import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './providers/AuthProvider'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    {/* AuthProvider initialises the Firebase listener exactly once */}
    <AuthProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#191919',
            color: '#e6e4de',
            border: '1px solid #242424',
            borderRadius: '10px',
            fontSize: '12px',
            fontFamily: 'Sora, sans-serif',
          },
          success: { iconTheme: { primary: '#6ee7b7', secondary: '#000' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
)
