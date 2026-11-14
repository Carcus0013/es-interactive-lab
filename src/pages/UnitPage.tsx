import { useEffect } from 'react';
import { UNITS } from '../data/units';
import { topicsOfUnit } from '../content/topics';
import { PRACTICALS } from '../content/practicals';
import { ALL_PYQ } from '../content/pyq';
import { SIMS } from '../simulations/registry';
import { Bar, Importance, PageHeader, SourceBadge, StatusDot } from '../components/ui';
import { Link } from '../utils/router';
import { pushRecent, useStore } from '../utils/store';
import NotFound from './NotFound';
import type { UnitId } from '../types';

export default function UnitPage({ id }: { id: number }) {
  const unit = UNITS.find((u) => u.id === id);
  const topicState = useStore((s) => s.topics);
  useEffect(() => {
    if (unit) pushRecent(`/unit/${unit.id}`, `Unit ${unit.id}: ${unit.title}`);
  }, [unit]);
  if (!unit) return <NotFound what="unit" />;
  const topics = topicsOfUnit(unit.id as UnitId);
  const done = topics.filter((t) => topicState[t.id]?.status === 'done').length;
  const pracs = PRACTICALS.filter((p) => p.unit === unit.id);
  const sims = SIMS.filter((s) => s.unit === unit.id);
  const pyqs = ALL_PYQ.filter((q) => q.unit === unit.id);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader kicker={`Unit ${unit.id}`} title={unit.title} lead={unit.blurb}>
        <span className="text-sm text-dim">
          {done} of {topics.length} topics completed
        </span>
        <Bar value={done} max={topics.length} className="w-40" tone="ok" />
      </PageHeader>
      <details className="mb-8 rounded-md border border-line bg-panel p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Official syllabus text</summary>
        <p className="mt-2 italic text-ink/80">{unit.syllabus}</p>
      </details>

      <ol className="space-y-2">
        {topics.map((t, i) => {
          const s = topicState[t.id];
          return (
            <li key={t.id}>
              <Link to={`/topic/${t.id}`} className="group flex items-start gap-4 rounded-md border border-line bg-panel p-4 hover:border-gold/60">
                <span className="font-mono text-sm text-dim">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold group-hover:text-gold">{t.title}</span>
                    {t.status !== 'course' && <SourceBadge status={t.status} />}
                  </div>
                  <p className="mt-1 text-sm text-dim">{t.short}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <Importance level={t.importance} />
                    {s?.quizBest != null && <span className="text-xs text-dim">Quiz best {s.quizBest}/5</span>}
                  </div>
                </div>
                <StatusDot status={s?.status ?? 'new'} className="mt-2" />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Practicals</h2>
          {pracs.length === 0 ? (
            <p className="text-sm text-dim">No lab programs belong to this unit.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pracs.map((p) => (
                <li key={p.id}>
                  <Link to={`/lab/${p.id}`} className="hover:text-gold">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Simulations</h2>
          <ul className="space-y-1 text-sm">
            {sims.map((s) => (
              <li key={s.id}>
                <Link to={`/sims/${s.id}`} className="hover:text-gold">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Previous-year questions</h2>
          {pyqs.length === 0 ? (
            <p className="text-sm text-dim">None of the supplied papers tests this unit.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pyqs.map((q) => (
                <li key={q.id}>
                  <Link to={`/pyq/paper/${q.paper.id}#${q.id}`} className="hover:text-gold">
                    {q.paper.title}, Q{q.number}
                  </Link>{' '}
                  <span className="text-dim">({q.marks} m)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
