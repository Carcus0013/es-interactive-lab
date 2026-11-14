import type { Practical } from '../types';
import { useStepper } from '../hooks/useStepper';
import Player from './Player';
import { Inline } from './Markdown';

type Node = Practical['flow'][number];

/** Animated program flowchart: the highlighted node is what the CPU is doing now. Loop nodes jump back to the first 'loop' node. */
export default function FlowChart({ nodes }: { nodes: Node[] }) {
  // Build an execution trace: run straight through once, then go round the loop twice to show repetition.
  const firstLoop = nodes.findIndex((n) => n.kind === 'loop');
  const trace: number[] = nodes.map((_, i) => i);
  if (firstLoop >= 0) {
    const loopPart = nodes.map((_, i) => i).slice(firstLoop);
    trace.push(...loopPart.filter((i) => nodes[i].kind !== 'end'));
  }
  const s = useStepper(trace.length, { interval: 1300 });
  const current = trace[s.step];
  const W = 540;
  const nodeH = 54;
  const gap = 30;
  const H = nodes.length * (nodeH + gap) + 10;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,540px)_1fr]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Program flowchart">
        <defs>
          <marker id="fc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="rgb(var(--dim))" />
          </marker>
        </defs>
        {nodes.map((n, i) => {
          const y = 5 + i * (nodeH + gap);
          const cx = W / 2;
          const on = i === current;
          const stroke = on ? 'rgb(var(--gold))' : n.kind === 'isr' ? 'rgb(var(--ch3))' : n.kind === 'decision' ? 'rgb(var(--ch2))' : 'rgb(var(--line))';
          const fill = on ? 'rgb(var(--gold) / 0.16)' : 'rgb(var(--raised))';
          const w = 360;
          let shape;
          if (n.kind === 'start' || n.kind === 'end') shape = <rect x={cx - w / 2} y={y} width={w} height={nodeH} rx={nodeH / 2} fill={fill} stroke={stroke} strokeWidth={on ? 2.4 : 1.4} />;
          else if (n.kind === 'decision')
            shape = <polygon points={`${cx},${y - 4} ${cx + w / 2 + 20},${y + nodeH / 2} ${cx},${y + nodeH + 4} ${cx - w / 2 - 20},${y + nodeH / 2}`} fill={fill} stroke={stroke} strokeWidth={on ? 2.4 : 1.4} />;
          else if (n.kind === 'io') shape = <polygon points={`${cx - w / 2 + 16},${y} ${cx + w / 2 + 16},${y} ${cx + w / 2 - 16},${y + nodeH} ${cx - w / 2 - 16},${y + nodeH}`} fill={fill} stroke={stroke} strokeWidth={on ? 2.4 : 1.4} />;
          else shape = <rect x={cx - w / 2} y={y} width={w} height={nodeH} rx={6} fill={fill} stroke={stroke} strokeWidth={on ? 2.4 : 1.4} strokeDasharray={n.kind === 'isr' ? '6 4' : undefined} />;
          return (
            <g key={i}>
              {shape}
              <text x={cx} y={y + nodeH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={on ? 700 : 500} fill="rgb(var(--ink))">
                {n.label.length > 44 ? n.label.slice(0, 43) + '…' : n.label}
              </text>
              {i < nodes.length - 1 && <line x1={cx} y1={y + nodeH + (n.kind === 'decision' ? 4 : 0)} x2={cx} y2={y + nodeH + gap - 2} stroke="rgb(var(--dim))" strokeWidth={1.5} markerEnd="url(#fc-arrow)" />}
              {n.kind === 'isr' && (
                <text x={cx + w / 2 + 8} y={y + 12} fontSize={11} fill="rgb(var(--ch3))">
                  runs on interrupt
                </text>
              )}
            </g>
          );
        })}
        {firstLoop >= 0 && (
          <path
            d={`M${W / 2 + 180} ${5 + (nodes.length - 1) * (nodeH + gap) + nodeH / 2} H${W - 8} V${5 + firstLoop * (nodeH + gap) + nodeH / 2} H${W / 2 + 182}`}
            fill="none"
            stroke="rgb(var(--gold) / 0.7)"
            strokeWidth={1.6}
            strokeDasharray="5 4"
            markerEnd="url(#fc-arrow)"
          />
        )}
      </svg>
      <div className="flex flex-col gap-4">
        <Player s={s} label="Step" />
        <div className="rounded-md border border-gold/40 bg-panel p-4" aria-live="polite">
          <div className="text-xs text-dim">Now executing</div>
          <div className="mt-1 text-lg font-semibold text-gold">{nodes[current].label}</div>
          <p className="mt-2 text-[0.95rem] leading-relaxed">
            <Inline text={nodes[current].detail} />
          </p>
          {s.step >= nodes.length && <p className="mt-3 text-xs text-dim">Second pass through the loop — the super-loop never ends.</p>}
        </div>
      </div>
    </div>
  );
}
