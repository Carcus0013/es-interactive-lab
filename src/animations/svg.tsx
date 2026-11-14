import { createContext, useContext, useId, type ReactNode } from 'react';

// Theme-aware SVG primitives shared by diagrams and simulations.
export const col = {
  ink: 'rgb(var(--ink))',
  dim: 'rgb(var(--dim))',
  line: 'rgb(var(--line))',
  mask: 'rgb(var(--mask))',
  panel: 'rgb(var(--panel))',
  raised: 'rgb(var(--raised))',
  gold: 'rgb(var(--gold))',
  ch1: 'rgb(var(--ch1))',
  ch2: 'rgb(var(--ch2))',
  ch3: 'rgb(var(--ch3))',
  ch4: 'rgb(var(--ch4))',
  led: 'rgb(var(--led))',
  bad: 'rgb(var(--bad))',
  ok: 'rgb(var(--ok))',
};
export type Tone = 'ink' | 'dim' | 'gold' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'led' | 'bad' | 'ok' | 'line';
export const tone = (t: Tone = 'line') => col[t];
export const alpha = (t: Tone, a: number) => `rgb(var(--${t === 'line' ? 'line' : t}) / ${a})`;

const MarkerCtx = createContext('m');

export function Svg({ w, h, title, children, className = '', maxW }: { w: number; h: number; title: string; children: ReactNode; className?: string; maxW?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title} className={`mx-auto block h-auto w-full ${className}`} style={{ maxWidth: maxW ?? w }} fontFamily="'Archivo Variable', Archivo, sans-serif">
      <title>{title}</title>
      <defs>
        {(['ink', 'dim', 'gold', 'ch1', 'ch2', 'ch3', 'ch4', 'line', 'bad', 'led', 'ok'] as Tone[]).map((t) => (
          <marker key={t} id={`${id}-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill={tone(t)} />
          </marker>
        ))}
      </defs>
      <MarkerCtx.Provider value={id}>{children}</MarkerCtx.Provider>
    </svg>
  );
}

export function useMarker(t: Tone = 'dim') {
  const id = useContext(MarkerCtx);
  return `url(#${id}-${t})`;
}

export function T({
  x,
  y,
  children,
  size = 13,
  anchor = 'middle',
  t = 'ink',
  mono,
  weight,
  italic,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  t?: Tone;
  mono?: boolean;
  weight?: number;
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      dominantBaseline="middle"
      fill={tone(t)}
      fontFamily={mono ? "'JetBrains Mono Variable', monospace" : undefined}
      fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined}
    >
      {children}
    </text>
  );
}

export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  t = 'line',
  fill,
  size = 13,
  rx = 4,
  dashed,
  strong,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: ReactNode;
  sub?: ReactNode;
  t?: Tone;
  fill?: string;
  size?: number;
  rx?: number;
  dashed?: boolean;
  strong?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={fill ?? (strong ? alpha(t, 0.14) : col.raised)}
        stroke={tone(t)}
        strokeWidth={strong ? 1.8 : 1.2}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {label != null && (
        <T x={x + w / 2} y={y + h / 2 - (sub ? 8 : 0)} size={size} weight={600}>
          {label}
        </T>
      )}
      {sub != null && (
        <T x={x + w / 2} y={y + h / 2 + 10} size={size - 2.5} t="dim">
          {sub}
        </T>
      )}
    </g>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  t = 'dim',
  both,
  label,
  lx,
  ly,
  dashed,
  width = 1.5,
  flow,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  t?: Tone;
  both?: boolean;
  label?: ReactNode;
  lx?: number;
  ly?: number;
  dashed?: boolean;
  width?: number;
  flow?: boolean;
}) {
  const m = useMarker(t);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={tone(t)}
        strokeWidth={width}
        markerEnd={m}
        markerStart={both ? m : undefined}
        strokeDasharray={flow ? '6 6' : dashed ? '4 4' : undefined}
        className={flow ? 'animate-flow' : undefined}
      />
      {label != null && (
        <T x={lx ?? (x1 + x2) / 2} y={ly ?? (y1 + y2) / 2 - 9} size={11} t="dim">
          {label}
        </T>
      )}
    </g>
  );
}

/** Polyline path with optional arrowhead. */
export function Wire({ d, t = 'dim', arrow, width = 1.5, flow, dashed }: { d: string; t?: Tone; arrow?: boolean; width?: number; flow?: boolean; dashed?: boolean }) {
  const m = useMarker(t);
  return (
    <path
      d={d}
      fill="none"
      stroke={tone(t)}
      strokeWidth={width}
      markerEnd={arrow ? m : undefined}
      strokeDasharray={flow ? '6 6' : dashed ? '4 4' : undefined}
      className={flow ? 'animate-flow' : undefined}
      strokeLinejoin="round"
    />
  );
}

/** Digital waveform from a list of levels (0/1 or null for high-Z). */
export function Waveform({
  x,
  y,
  w,
  h,
  levels,
  t = 'ch1',
  label,
  highlight,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  levels: (0 | 1 | null)[];
  t?: Tone;
  label?: string;
  highlight?: number;
}) {
  const n = levels.length;
  const step = w / n;
  let d = '';
  levels.forEach((lv, i) => {
    const yy = lv === null ? y + h / 2 : lv ? y : y + h;
    const xx = x + i * step;
    d += i === 0 ? `M${xx} ${yy}` : ` L${xx} ${yy}`;
    d += ` L${xx + step} ${yy}`;
  });
  return (
    <g>
      {label && (
        <T x={x - 8} y={y + h / 2} anchor="end" size={12} mono t={t}>
          {label}
        </T>
      )}
      {highlight != null && highlight >= 0 && highlight < n && <rect x={x + highlight * step} y={y - 4} width={step} height={h + 8} fill={alpha('gold', 0.15)} />}
      <path d={d} fill="none" stroke={tone(t)} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}
