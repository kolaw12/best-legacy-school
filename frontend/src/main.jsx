import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider, useToast } from './components/ui/ToastProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './i18n.js'
import { ReactLenis } from 'lenis/react'
import { initSentry } from './config/sentry.js'
import { setGlobalToast } from './config/api.js'
import { useEffect } from 'react'

// No-op without VITE_SENTRY_DSN; safe to call always.
initSentry();

// Bridge: connect axios cold-start toast to the ToastProvider
function ToastBridge({ children }) {
  const toast = useToast();
  useEffect(() => { setGlobalToast(toast); }, [toast]);
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ToastBridge>
          <AuthProvider>
            <ReactLenis root>
              <App />
            </ReactLenis>
          </AuthProvider>
        </ToastBridge>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
