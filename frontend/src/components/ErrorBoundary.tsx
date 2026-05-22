import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to Serilog via the browser console so Seq/application logs can
    // correlate the component stack with any concurrent backend errors.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-border shadow-lg max-w-md w-full p-8 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error occurred. Your session is intact — click below to reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reload page
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 overflow-auto max-h-48">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
