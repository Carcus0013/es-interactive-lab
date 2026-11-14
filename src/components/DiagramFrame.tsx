import type { DiagramMeta } from '../animations/diagrams';
import { ErrorBoundary } from './SimFrame';

export default function DiagramFrame({ d, compact }: { d: DiagramMeta; compact?: boolean }) {
  const C = d.Component;
  return (
    <figure className="not-prose my-6 rounded-md border border-line bg-panel">
      <div className="overflow-x-auto p-3 sm:p-4">
        <ErrorBoundary label={d.title}>
          <C />
        </ErrorBoundary>
      </div>
      <figcaption className="border-t border-line px-4 py-2 text-sm text-dim">
        <span className="font-semibold text-ink">{d.title}.</span> {!compact && d.caption}
      </figcaption>
    </figure>
  );
}
