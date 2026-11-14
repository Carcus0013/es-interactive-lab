import { Component, Suspense, useState, type ReactNode } from 'react';
import { SIM_BY_ID } from '../simulations/registry';
import { Link } from '../utils/router';

export class ErrorBoundary extends Component<{ children: ReactNode; label?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="rounded-md border border-bad/50 bg-bad/5 p-4 text-sm">
          <p className="font-semibold text-bad">{this.props.label ?? 'This panel'} stopped because of an error.</p>
          <p className="mt-1 font-mono text-xs text-dim">{this.state.error.message}</p>
          <button type="button" className="btn mt-3" onClick={() => this.setState({ error: null })}>
            Reload panel
          </button>
        </div>
      );
    return this.props.children;
  }
}

export function Loading({ label = 'Loading simulation' }: { label?: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-dim" role="status">
      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
      {label}…
    </div>
  );
}

export default function SimFrame({ id, preset, standalone }: { id: string; preset?: string; standalone?: boolean }) {
  const meta = SIM_BY_ID[id];
  const [showModel, setShowModel] = useState(false);
  if (!meta)
    return (
      <div className="rounded-md border border-bad/50 p-3 text-sm text-bad">
        Unknown simulation “{id}”.
      </div>
    );
  const C = meta.Component;
  return (
    <section className="not-prose my-6 rounded-md border border-line bg-panel" aria-label={meta.title}>
      {!standalone && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-ch4" aria-hidden />
          <h4 className="text-base font-semibold">{meta.title}</h4>
          <button type="button" className="chip hover:border-gold/60" onClick={() => setShowModel((v) => !v)} aria-expanded={showModel}>
            Educational model {showModel ? '▴' : '▾'}
          </button>
          <Link to={`/sims/${meta.id}${preset ? `?preset=${preset}` : ''}`} className="ml-auto text-xs text-dim hover:text-gold">
            Open full size
          </Link>
        </header>
      )}
      {showModel && !standalone && <p className="border-b border-line bg-raised/40 px-4 py-2 text-xs leading-relaxed text-dim">{meta.model}</p>}
      <div className="p-3 sm:p-4">
        <ErrorBoundary label={meta.title}>
          <Suspense fallback={<Loading />}>
            <C preset={preset} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </section>
  );
}
