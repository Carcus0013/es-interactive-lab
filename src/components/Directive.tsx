import SimFrame from './SimFrame';
import { DIAGRAM_BY_ID } from '../animations/diagrams';
import DiagramFrame from './DiagramFrame';

/** Renders `::sim{id preset=x}` and `::diagram{id}` blocks inside markdown content. */
export default function Directive({ name, arg }: { name: string; arg: string }) {
  const [id, ...rest] = arg.trim().split(/\s+/);
  const params = Object.fromEntries(rest.map((p) => p.split('=') as [string, string]));
  if (name === 'sim' || name === 'anim') return <SimFrame id={id} preset={params.preset} />;
  if (name === 'diagram') {
    const d = DIAGRAM_BY_ID[id];
    if (!d) return <p className="text-sm text-bad">Unknown diagram “{id}”.</p>;
    return <DiagramFrame d={d} />;
  }
  return <p className="text-sm text-bad">Unknown block “{name}”.</p>;
}
