import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import OfflineBanner from './components/ui/OfflineBanner.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // Don't retry auth errors — the Axios interceptor already handles 401 (token
      // refresh + replay). Retrying 403/429 here would cause duplicate requests or
      // trigger another refresh with an already-rotated token.
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 403 || status === 429) return false
        return failureCount < 1
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <OfflineBanner />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
