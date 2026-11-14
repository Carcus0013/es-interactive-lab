import { useId, useState, type ReactNode } from 'react';
import type { SourceRef, SourceStatus } from '../types';
import type { TopicStatus } from '../utils/store';
import Markdown from './Markdown';

export function StatusDot({ status, className = '' }: { status: TopicStatus; className?: string }) {
  const cls: Record<TopicStatus, string> = {
    new: 'border border-line bg-transparent',
    learning: 'bg-ch2',
    revise: 'bg-warn',
    done: 'bg-ok',
  };
  const label: Record<TopicStatus, string> = { new: 'Not started', learning: 'In progress', revise: 'Needs revision', done: 'Completed' };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls[status]} ${className}`} title={label[status]} aria-label={label[status]} />;
}

export function SourceBadge({ status }: { status: SourceStatus }) {
  if (status === 'course') return <span className="chip border-gold/40 text-gold">Course material</span>;
  if (status === 'textbook') return <span className="chip border-ch2/40 text-ch2">Prescribed textbook</span>;
  return <span className="chip border-ch3/50 text-ch3">Additional syllabus coverage</span>;
}

export function GeneratedTag() {
  return <span className="chip border-ch3/40 text-ch3" title="Written for practice — not taken from a real paper">Generated practice question</span>;
}

export function PyqTag({ children }: { children: ReactNode }) {
  return <span className="chip border-gold/50 bg-gold/10 text-gold">{children}</span>;
}

export function Importance({ level }: { level: 1 | 2 | 3 }) {
  const text = level === 3 ? 'Repeated in PYQs' : level === 2 ? 'In a PYQ or heavily taught' : 'Covered in syllabus';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-dim" title={text}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2.5 w-1 rounded-sm ${i <= level ? 'bg-gold' : 'bg-line'}`} />
        ))}
      </span>
      {text}
    </span>
  );
}

export function Bar({ value, max, className = '', tone = 'gold' }: { value: number; max: number; className?: string; tone?: 'gold' | 'ok' | 'ch2' }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const bg = tone === 'ok' ? 'bg-ok' : tone === 'ch2' ? 'bg-ch2' : 'bg-gold';
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-line/70 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${bg} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({ title, lead, children, kicker }: { title: ReactNode; lead?: ReactNode; children?: ReactNode; kicker?: ReactNode }) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      {kicker && <div className="mb-2 text-sm text-dim">{kicker}</div>}
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 max-w-prose text-lg leading-relaxed text-dim">{lead}</p>}
      {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Section({ id, title, children, aside }: { id?: string; title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 mt-12 flex flex-wrap items-baseline gap-3 border-b border-line pb-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/** Attempt-then-reveal answer block. */
export function Reveal({ label = 'Show answer', children, defaultOpen = false }: { label?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div>
      <button type="button" className="btn mt-2" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide answer' : label}
      </button>
      {open && (
        <div id={id} className="mt-3 rounded-md border border-line bg-mask/60 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function QABlock({ q, a, marks, index, tag }: { q: string; a: string; marks?: number; index?: number; tag?: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start gap-2">
        {index != null && <span className="font-mono text-sm text-dim">Q{index}.</span>}
        <div className="min-w-0 flex-1">
          <Markdown src={q} className="[&>p]:font-medium" />
        </div>
        {marks != null && <span className="chip">{marks} marks</span>}
      </div>
      {tag && <div className="mt-2">{tag}</div>}
      <Reveal label="Attempt it, then show the model answer">
        <Markdown src={a} />
      </Reveal>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${value === t.id ? 'border-gold text-gold' : 'border-transparent text-dim hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Sources({ sources }: { sources: SourceRef[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {sources.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-gold" aria-hidden>
            ▸
          </span>
          <span>
            <span className="font-mono text-[0.8rem] text-ink/90">{s.file}</span>
            {s.detail && <span className="text-dim"> — {s.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line p-6 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-dim">{children}</div>}
    </div>
  );
}

export function Stat({ value, label, sub }: { value: ReactNode; label: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="silk font-mono text-2xl font-semibold text-ink">{value}</span>
      <span className="text-sm text-dim">{label}</span>
      {sub && <span className="mt-0.5 text-xs text-dim/80">{sub}</span>}
    </div>
  );
}
