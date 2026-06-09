import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[var(--sg-bg)] p-6 text-center">
          <h1 className="text-lg font-extrabold text-[var(--sg-navy)]">Something went wrong</h1>
          <p className="max-w-md text-sm text-[var(--sg-muted)]">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="sg-btn sg-btn-navy !w-auto"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
