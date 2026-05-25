import { Component, type ReactNode } from "react";

interface S { hasError: boolean; error?: Error }
export default class ErrorBoundary extends Component<{ children: ReactNode }, S> {
  state: S = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: any) { console.error("[SmartPOS]", error, info); }
  reset = () => { this.setState({ hasError: false, error: undefined }); };
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1020] p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-500/30 shadow-lg p-6">
          <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center mb-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Something went wrong</h2>
          <p className="text-sm text-slate-500 mt-1">An unexpected error occurred. You can try reloading or returning to the dashboard.</p>
          <pre className="mt-3 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-32 text-slate-700 dark:text-slate-300">{String(this.state.error?.message || this.state.error)}</pre>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { window.location.hash = "dashboard"; this.reset(); }}
              className="flex-1 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700">
              Go to Dashboard
            </button>
            <button onClick={() => window.location.reload()}
              className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
              Reload App
            </button>
          </div>
        </div>
      </div>
    );
  }
}
