import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/ui/ToastProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './i18n.js'
import { ReactLenis } from 'lenis/react'
import { initSentry } from './config/sentry.js'

// No-op without VITE_SENTRY_DSN; safe to call always.
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ReactLenis root>
            <App />
          </ReactLenis>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
