import type { ReactNode } from 'react';

export function Slider({ label, value, min, max, step = 1, unit, onChange, format }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between gap-2">
        <span className="text-dim">{label}</span>
        <span className="font-mono text-ink">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-[rgb(var(--gold))]" />
    </label>
  );
}

export function NumberField({ label, value, onChange, min, max, step = 1, unit, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-dim">
        {label}
        {unit ? ` (${unit})` : ''}
      </span>
      <input
        className="input font-mono"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)));
        }}
      />
      {hint && <span className="text-xs text-dim">{hint}</span>}
    </label>
  );
}

export function Select<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-dim">{label}</span>
      <select className="input" value={String(value)} onChange={(e) => onChange((typeof value === 'number' ? Number(e.target.value) : e.target.value) as T)}>
        {options.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--gold))]" />
      {label}
    </label>
  );
}

export function Readout({ label, value, tone = 'ink', sub }: { label: string; value: ReactNode; tone?: 'ink' | 'gold' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ok' | 'bad'; sub?: ReactNode }) {
  const cls = { ink: 'text-ink', gold: 'text-gold', ch1: 'text-ch1', ch2: 'text-ch2', ch3: 'text-ch3', ch4: 'text-ch4', ok: 'text-ok', bad: 'text-bad' }[tone];
  return (
    <div className="rounded border border-line bg-mask/50 px-3 py-2">
      <div className="text-xs text-dim">{label}</div>
      <div className={`font-mono text-lg ${cls}`}>{value}</div>
      {sub && <div className="text-xs text-dim">{sub}</div>}
    </div>
  );
}

export const hex = (v: number, digits = 8) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(digits, '0');
export const hexSpaced = (v: number) => {
  const h = (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `0x${h.slice(0, 4)} ${h.slice(4)}`;
};
export const bin = (v: number, bits = 32) => (v >>> 0).toString(2).padStart(bits, '0').slice(-bits);

/** 32-bit register shown bit by bit, MSB left. `fields` groups bits (e.g. MODER pairs). */
export function RegBits({
  name,
  value,
  bits = 32,
  highlight = [],
  changed = [],
  onToggle,
  groupSize,
  labels,
}: {
  name: string;
  value: number;
  bits?: number;
  highlight?: number[];
  changed?: number[];
  onToggle?: (bit: number) => void;
  groupSize?: number;
  labels?: (bit: number) => string | undefined;
}) {
  const idx = Array.from({ length: bits }, (_, i) => bits - 1 - i);
  return (
    <div className="overflow-x-auto">
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-ch2">{name}</span>
        <span className="font-mono text-dim">{hexSpaced(value)}</span>
      </div>
      <div className="flex min-w-max gap-px">
        {idx.map((b) => {
          const on = ((value >>> b) & 1) === 1;
          const hot = highlight.includes(b);
          const ch = changed.includes(b);
          const groupEdge = groupSize ? b % groupSize === 0 && b !== 0 : b % 4 === 0 && b !== 0;
          return (
            <div key={b} className={`flex flex-col items-center ${groupEdge ? 'mr-1' : ''}`}>
              <button
                type="button"
                disabled={!onToggle}
                onClick={() => onToggle?.(b)}
                title={`bit ${b}${labels?.(b) ? ' — ' + labels(b) : ''}`}
                className={`h-6 w-[1.15rem] rounded-sm border font-mono text-[0.68rem] transition-colors ${
                  ch ? 'border-ch3 bg-ch3/30 text-ink' : hot ? 'border-gold bg-gold/25 text-ink' : on ? 'border-ch2/60 bg-ch2/20 text-ink' : 'border-line bg-raised text-dim'
                } ${onToggle ? 'cursor-pointer hover:border-gold' : 'cursor-default'}`}
              >
                {on ? 1 : 0}
              </button>
              <span className="mt-0.5 font-mono text-[0.55rem] text-dim">{b % 4 === 0 || hot ? b : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-line bg-mask/40 p-3 ${className}`}>
      {title && <div className="mb-2 text-sm font-semibold">{title}</div>}
      {children}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-dim">{children}</p>;
}

export function LedBulb({ on, color = 'led', size = 34, label, brightness }: { on: boolean; color?: 'led' | 'ch1' | 'ch4' | 'ch2'; size?: number; label?: string; brightness?: number }) {
  const b = brightness ?? (on ? 1 : 0);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 1.3} viewBox="0 0 34 44" aria-label={`${label ?? 'LED'} ${b > 0.02 ? 'on' : 'off'}`} role="img">
        <defs>
          <radialGradient id={`glow-${color}`}>
            <stop offset="0%" stopColor={`rgb(var(--${color}))`} stopOpacity="0.9" />
            <stop offset="100%" stopColor={`rgb(var(--${color}))`} stopOpacity="0" />
          </radialGradient>
        </defs>
        {b > 0.02 && <circle cx="17" cy="16" r="17" fill={`url(#glow-${color})`} opacity={b} />}
        <path d="M7 18 a10 10 0 0 1 20 0 v10 h-20 z" fill={`rgb(var(--${color}) / ${0.18 + 0.82 * b})`} stroke={`rgb(var(--${color}))`} strokeWidth="1.5" />
        <rect x="5" y="28" width="24" height="3" fill="rgb(var(--dim))" />
        <path d="M12 31 v12 M22 31 v9" stroke="rgb(var(--dim))" strokeWidth="1.5" />
      </svg>
      {label && <span className="font-mono text-[0.7rem] text-dim">{label}</span>}
    </div>
  );
}

export function PushButton({ pressed, onDown, onUp, label }: { pressed: boolean; onDown: () => void; onUp: () => void; label: string }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          onDown();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') onUp();
      }}
      aria-pressed={pressed}
      className="flex select-none flex-col items-center gap-1 touch-none"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-md border-2 transition-transform ${pressed ? 'translate-y-0.5 border-gold bg-gold/30' : 'border-line bg-raised'}`}>
        <span className={`h-6 w-6 rounded-full ${pressed ? 'bg-gold' : 'bg-dim/60'}`} />
      </span>
      <span className="font-mono text-[0.7rem] text-dim">{label}</span>
    </button>
  );
}
