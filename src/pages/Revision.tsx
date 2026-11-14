import { useEffect, useMemo, useState } from 'react';
import { TOPICS, TOPIC_BY_ID, topicsOfUnit } from '../content/topics';
import { REGISTERS } from '../content/registers';
import { PRACTICALS } from '../content/practicals';
import { ALL_PYQ } from '../content/pyq';
import { DIAGRAMS } from '../animations/diagrams';
import { UNITS } from '../data/units';
import CodeBlock from '../components/CodeBlock';
import DiagramFrame from '../components/DiagramFrame';
import { Callout, Inline } from '../components/Markdown';
import { Importance, PageHeader, PyqTag, StatusDot } from '../components/ui';
import { Link, useRoute } from '../utils/router';
import { useStore } from '../utils/store';

const SECTIONS = [
  ['formulas', 'Formula book', 'Every formula with its variables and a worked example.'],
  ['registers', 'Register reference', 'Purpose, important bits, configuration and code for every register used in the course.'],
  ['diagrams', 'Important diagrams', 'Exam-ready diagrams with tips on how to draw each one.'],
  ['programs', 'Important programs', 'The lab programs that Part-B questions are built from.'],
  ['last-minute', 'Last-minute revision', 'Unit-wise one-page notes.'],
  ['important', 'Important questions', 'Prioritised by how often each topic appears in the supplied papers.'],
] as const;

export default function Revision({ section }: { section?: string }) {
  if (!section)
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Quick revision" lead="Condensed material for the days before the exam. Everything here links back to the full lesson." />
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map(([id, t, d]) => (
            <li key={id}>
              <Link to={`/revision/${id}`} className="group block h-full rounded-md border border-line bg-panel p-5 hover:border-gold/60">
                <span className="text-lg font-semibold group-hover:text-gold">{t}</span>
                <span className="mt-1 block text-sm text-dim">{d}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  const meta = SECTIONS.find((s) => s[0] === section);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader kicker={<Link to="/revision" className="hover:text-gold">Quick revision</Link>} title={meta?.[1] ?? 'Revision'} lead={meta?.[2]} />
      {section === 'formulas' && <Formulas />}
      {section === 'registers' && <Registers />}
      {section === 'diagrams' && <Diagrams />}
      {section === 'programs' && <Programs />}
      {section === 'last-minute' && <LastMinute />}
      {section === 'important' && <Important />}
      {!meta && <p className="text-dim">Unknown section.</p>}
    </div>
  );
}

function Formulas() {
  return (
    <div className="space-y-10">
      {UNITS.map((u) => {
        const items = topicsOfUnit(u.id).flatMap((t) => (t.exam.formulas ?? []).map((f) => ({ ...f, t })));
        if (!items.length) return null;
        return (
          <section key={u.id}>
            <h2 className="mb-3 text-xl font-semibold">
              Unit {u.id}: {u.title}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((f) => (
                <div key={f.t.id + f.name} className="rounded-md border border-ch1/30 bg-panel p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{f.name}</span>
                    <Link to={`/topic/${f.t.id}?tab=exam`} className="ml-auto text-xs text-dim hover:text-gold">
                      {f.t.title}
                    </Link>
                  </div>
                  <div className="mt-2 rounded bg-ch1/10 px-3 py-2 font-mono text-[0.92rem] text-ink">
                    <Inline text={f.expr} />
                  </div>
                  {f.vars && (
                    <p className="mt-2 text-sm text-dim">
                      <Inline text={f.vars} />
                    </p>
                  )}
                  {f.example && (
                    <p className="mt-1 text-sm">
                      <span className="text-dim">Example: </span>
                      <Inline text={f.example} />
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Registers() {
  const { query } = useRoute();
  const [filter, setFilter] = useState(query.get('r') ?? '');
  const [periph, setPeriph] = useState('all');
  const periphs = [...new Set(REGISTERS.map((r) => r.periph))];
  const list = REGISTERS.filter((r) => (periph === 'all' || r.periph === periph) && (!filter || (r.name + r.purpose).toLowerCase().includes(filter.toLowerCase())));
  useEffect(() => {
    const r = query.get('r');
    if (r) setTimeout(() => document.getElementById('reg-' + r)?.scrollIntoView({ block: 'start' }), 100);
  }, [query]);
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-3">
        <input className="input w-64" placeholder="Filter, e.g. EOC or BRR" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter registers" />
        <select className="input" value={periph} onChange={(e) => setPeriph(e.target.value)} aria-label="Peripheral">
          <option value="all">All peripherals</option>
          {periphs.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="space-y-5">
        {list.map((r) => (
          <article key={r.name} id={'reg-' + r.name} className="scroll-mt-24 rounded-md border border-line bg-panel p-4">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-mono text-lg font-semibold text-ch2">{r.name}</h2>
              <span className="chip">{r.periph}</span>
              <span className="font-mono text-xs text-dim">{r.address}</span>
            </header>
            <p className="mt-2">{r.purpose}</p>
            <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Bits', 'Field', 'Meaning'].map((h) => (
                    <th key={h} className="border-b border-line bg-raised px-3 py-1.5 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.bits.map((b) => (
                  <tr key={b.name + b.bits}>
                    <td className="border-b border-line/60 px-3 py-1.5 font-mono text-xs">{b.bits}</td>
                    <td className="border-b border-line/60 px-3 py-1.5 font-mono text-gold">{b.name}</td>
                    <td className="border-b border-line/60 px-3 py-1.5">{b.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-dim">Configuration: </span>
              {r.config}
            </p>
            <CodeBlock code={r.code} title="usage" showLineNumbers={false} />
            <p className="text-xs text-dim">
              Source: {r.source} ·{' '}
              {r.topics.filter((t) => TOPIC_BY_ID[t]).map((t, i) => (
                <span key={t}>
                  {i > 0 && ', '}
                  <Link to={`/topic/${t}`} className="hover:text-gold">
                    {TOPIC_BY_ID[t].title}
                  </Link>
                </span>
              ))}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Diagrams() {
  const { anchor } = useRoute();
  const [unit, setUnit] = useState<'all' | number>('all');
  useEffect(() => {
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 150);
  }, [anchor]);
  return (
    <div>
      <div className="mb-6 flex gap-2">
        {(['all', 1, 2, 3] as const).map((u) => (
          <button key={u} type="button" className={unit === u ? 'btn-gold' : 'btn'} onClick={() => setUnit(u)}>
            {u === 'all' ? 'All' : `Unit ${u}`}
          </button>
        ))}
      </div>
      <div className="space-y-8">
        {DIAGRAMS.filter((d) => unit === 'all' || d.unit === unit).map((d) => (
          <section key={d.id} id={d.id} className="scroll-mt-24">
            <DiagramFrame d={d} />
            <p className="-mt-3 rounded-b-md border border-t-0 border-line bg-gold/5 px-4 py-2 text-sm">
              <span className="font-semibold text-gold">How to draw it: </span>
              {d.examTip}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

function Programs() {
  const keyIds = ['p03-button-led', 'p07-adc-threshold', 'p08-systick-polling', 'p10-gpio-interrupts', 'p13-uart-echo', 'p15-eval-photo-storage', 'p16-eval-parking'];
  const list = keyIds.map((id) => PRACTICALS.find((p) => p.id === id)).filter(Boolean) as typeof PRACTICALS;
  return (
    <div>
      <Callout kind="exam" title="Why these programs">
        <p>Every Part-B question in the supplied papers combines GPIO input, GPIO output and ADC at register level. These programs contain every building block you need; the two lab-evaluation solutions show how to combine them with counters and edge detection.</p>
      </Callout>
      <div className="space-y-8">
        {list.map((p) => (
          <section key={p.id}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-xl font-semibold">{p.title}</h2>
              <Link to={`/lab/${p.id}`} className="ml-auto text-sm text-gold hover:underline">
                Full walkthrough
              </Link>
            </div>
            <p className="mt-1 text-sm text-dim">{p.objective}</p>
            <CodeBlock code={p.programs[0].corrected?.code ?? p.programs[0].code} title={p.programs[0].file + (p.programs[0].corrected ? ' (corrected)' : '')} maxHeight={420} />
          </section>
        ))}
      </div>
    </div>
  );
}

function LastMinute() {
  const st = useStore((s) => s.topics);
  return (
    <div className="space-y-12">
      {UNITS.map((u) => (
        <section key={u.id}>
          <h2 className="mb-4 border-b border-line pb-2 text-2xl font-semibold">
            Unit {u.id}: {u.title}
          </h2>
          <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
            {topicsOfUnit(u.id).map((t) => (
              <div key={t.id}>
                <h3 className="flex items-center gap-2 font-semibold">
                  <StatusDot status={st[t.id]?.status ?? 'new'} />
                  <Link to={`/topic/${t.id}?tab=revise`} className="hover:text-gold">
                    {t.title}
                  </Link>
                </h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-6 text-[0.92rem] text-ink/90 marker:text-gold/60">
                  {t.revision.notes.map((n, i) => (
                    <li key={i}>
                      <Inline text={n} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Important() {
  const freq = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of ALL_PYQ) for (const t of q.topics) m[t] = (m[t] ?? 0) + q.marks;
    return m;
  }, []);
  const ranked = [...TOPICS].sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0) || b.importance - a.importance);
  return (
    <div>
      <Callout kind="note" title="How this is ranked">
        <p>Topics are ordered by total marks they carried across the supplied papers, then by how heavily the lectures cover them. This reflects past papers only — it does not predict or guarantee what will be asked. No end-semester paper was supplied.</p>
      </Callout>
      <ol className="space-y-3">
        {ranked
          .filter((t) => t.importance >= 2 || freq[t.id])
          .map((t, i) => {
            const qs = ALL_PYQ.filter((q) => q.topics.includes(t.id));
            return (
              <li key={t.id} className="rounded-md border border-line bg-panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm text-dim">{i + 1}</span>
                  <Link to={`/topic/${t.id}?tab=exam`} className="text-lg font-semibold hover:text-gold">
                    {t.title}
                  </Link>
                  <Importance level={t.importance} />
                  {freq[t.id] ? <PyqTag>{freq[t.id]} marks in PYQs</PyqTag> : <span className="chip">no PYQ yet</span>}
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {qs.slice(0, 4).map((q) => (
                    <li key={q.id}>
                      <Link to={`/pyq/paper/${q.paper.id}#${q.id}`} className="text-dim hover:text-gold">
                        {q.paper.title} Q{q.number} ({q.marks} m)
                      </Link>
                    </li>
                  ))}
                  {qs.length === 0 &&
                    t.exam.longQs.slice(0, 2).map((q, j) => (
                      <li key={j} className="text-dim">
                        Practice: <Inline text={q.q.length > 140 ? q.q.slice(0, 140) + '…' : q.q} />
                      </li>
                    ))}
                </ul>
              </li>
            );
          })}
      </ol>
    </div>
  );
}
