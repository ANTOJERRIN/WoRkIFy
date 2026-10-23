import { Component, type ReactNode } from 'react';

/** Render failures have a recovery screen; operational request errors stay in their features. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main role="alert" className="min-h-screen flex items-center justify-center bg-[#FAFAFC] dark:bg-[#070C1F] px-6 py-12">
      <section className="max-w-lg rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-8">
        <h1 className="text-2xl font-bold mb-4 text-[#070C1F] dark:text-white">Workify encountered a problem</h1>
        <p className="text-sm mb-6 text-[#636875] dark:text-gray-400">Reload the page to try again. If the problem continues, contact support.</p>
        <button onClick={() => window.location.reload()} className="px-5 py-3 rounded-xl bg-[#2F6BFF] text-white text-sm font-semibold">Reload page</button>
      </section>
    </main>;
    return this.props.children;
  }
}
