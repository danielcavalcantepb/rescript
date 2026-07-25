import { Component, type ErrorInfo, type ReactNode } from 'react'
import { errorReporter } from '#/platform/observability/noop'
import { UnexpectedErrorState } from '#/platform/errors/states'

type Props = {
  children: ReactNode
  fallback?: ReactNode
  onRecover?: () => void
}

type State = {
  error: Error | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    errorReporter.capture({
      error,
      context: { componentStack: info.componentStack },
      tags: { boundary: 'global' },
    })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <UnexpectedErrorState
          description={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
          onRecover={this.props.onRecover}
        />
      )
    }
    return this.props.children
  }
}
