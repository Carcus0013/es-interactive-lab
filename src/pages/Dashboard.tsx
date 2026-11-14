import { useMemo } from 'react';
import BoardHero from '../components/BoardHero';
import { Bar, Importance, StatusDot } from '../components/ui';
import { COURSE, UNITS } from '../data/units';
import { TOPICS, TOPIC_BY_ID, topicsOfUnit } from '../content/topics';
import { PRACTICALS } from '../content/practicals';
import { ALL_PYQ, PAPERS } from '../content/pyq';
import { SIMS } from '../simulations/registry';
import { Link } from '../utils/router';
import { useStore } from '../utils/store';

const DAY = 86_400_000;

export default function Dashboard() {
  const state = useStore((s) => s);
  const done = TOPICS.filter((t) => state.topics[t.id]?.status === 'done').length;
  const started = TOPICS.filter((t) => state.topics[t.id] && state.topics[t.id].status !== 'new').length;
  const pracDone = PRACTICALS.filter((p) => state.practicals[p.id]?.done).length;
  const pyqAttempted = Object.keys(state.pyqSelf).length;

  const pending = useMemo(() => {
    const now = Date.now();
    return TOPICS.filter((t) => {
      const s = state.topics[t.id];
      if (!s) return false;
      if (s.status === 'revise') return true;
      if (s.status === 'learning' && now - s.lastVisit > 2 * DAY) return true;
      if (s.status === 'done' && s.revisedAt && now - s.revisedAt > 7 * DAY) return true;
      return false;
    }).slice(0, 6);
  }, [state.topics]);

  const important = TOPICS.filter((t) => t.importance === 3);
  const recent = state.recent.slice(0, 6);
  const overall = TOPICS.length ? Math.round((done / TOPICS.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="grid gap-8 pb-10 xl:grid-cols-[22rem_1fr]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="font-mono text-sm text-gold">{COURSE.code}</p>
            <h1 className="silk mt-2 text-[2.9rem] font-bold leading-[0.95] tracking-tight sm:text-[3.6rem]">
              Embedded Systems
              <span className="block text-dim">The Interactive Lab</span>
            </h1>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-relaxed text-ink/85">
              Your lectures, lab programs and past papers for the STM32F401 — rebuilt as lessons you can poke at. Every simulation runs the same register logic you write in Keil.
            </p>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-x-4 gap-y-5">
            {[
              [UNITS.length, 'Units'],
              [TOPICS.length, 'Topics'],
              [PRACTICALS.length, 'Practicals'],
              [PAPERS.length, 'Papers'],
              [ALL_PYQ.length, 'PYQs solved'],
              [SIMS.length, 'Simulations'],
            ].map(([v, l]) => (
              <div key={l as string}>
                <dt className="text-sm text-dim">{l}</dt>
                <dd className="silk font-mono text-3xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <div className="flex items-baseline justify-between text-sm">
              <span>Overall progress</span>
              <span className="font-mono text-gold">{overall}%</span>
            </div>
            <Bar value={done} max={TOPICS.length} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-dim">
              {done} topics completed, {started - done} in progress, {pracDone}/{PRACTICALS.length} practicals done, {pyqAttempted} PYQ parts self-marked.
            </p>
          </div>
        </div>
        <BoardHero />
      </section>

      <section className="grid gap-4 border-t border-line pt-8 md:grid-cols-3">
        {UNITS.map((u) => {
          const ts = topicsOfUnit(u.id);
          const d = ts.filter((t) => state.topics[t.id]?.status === 'done').length;
          const firstOpen = ts.find((t) => state.topics[t.id]?.status !== 'done') ?? ts[0];
          return (
            <div key={u.id} className="rounded-md border border-line bg-panel p-5">
              <div className="flex items-baseline justify-between">
                <Link to={`/unit/${u.id}`} className="text-lg font-semibold hover:text-gold">
                  Unit {u.id}
                </Link>
                <span className="font-mono text-sm text-dim">
                  {d}/{ts.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-dim">{u.title}</p>
              <Bar value={d} max={ts.length} className="mt-4" tone="ok" />
              <div className="mt-3 flex flex-wrap gap-1">
                {ts.map((t) => (
                  <Link key={t.id} to={`/topic/${t.id}`} title={t.title} className="p-0.5">
                    <StatusDot status={state.topics[t.id]?.status ?? 'new'} className="h-2.5 w-2.5" />
                  </Link>
                ))}
              </div>
              {firstOpen && (
                <Link to={`/topic/${firstOpen.id}`} className="mt-4 inline-block text-sm text-gold hover:underline">
                  Continue with “{firstOpen.title}”
                </Link>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Important for the exam</h2>
          <p className="mt-1 text-sm text-dim">Ranked from how often each topic appears in the four supplied mid-term papers. No topic is guaranteed to appear.</p>
          <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-panel">
            {important.map((t) => (
              <li key={t.id}>
                <Link to={`/topic/${t.id}?tab=exam`} className="flex items-center gap-3 px-4 py-3 hover:bg-raised">
                  <StatusDot status={state.topics[t.id]?.status ?? 'new'} />
                  <span className="flex-1 font-medium">{t.title}</span>
                  <Importance level={t.importance} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-10">
          <div>
            <h2 className="text-xl font-semibold">Pending revision</h2>
            {pending.length === 0 ? (
              <p className="mt-3 text-sm text-dim">Nothing is waiting. Topics you mark “Revise again”, leave half-done for two days, or completed over a week ago will appear here.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {pending.map((t) => (
                  <li key={t.id}>
                    <Link to={`/topic/${t.id}?tab=revise`} className="flex items-center gap-2 hover:text-gold">
                      <StatusDot status={state.topics[t.id]!.status} />
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Recently studied</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-dim">
                Start with <Link to="/topic/es-intro" className="text-gold hover:underline">What is an embedded system?</Link> or jump to <Link to="/topic/bit-banding" className="text-gold hover:underline">bit-banding</Link>, which appears in every mid-term paper.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {recent.map((r) => (
                  <li key={r.route} className="flex items-baseline gap-3">
                    <Link to={r.route} className="hover:text-gold">
                      {r.title}
                    </Link>
                    <span className="ml-auto shrink-0 text-xs text-dim">{new Date(r.ts).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Practicals</h2>
            <Link to="/lab" className="text-sm text-gold hover:underline">
              All {PRACTICALS.length}
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {PRACTICALS.slice(0, 8).map((p) => (
              <li key={p.id}>
                <Link to={`/lab/${p.id}`} className="flex items-start gap-2 rounded border border-line bg-panel px-3 py-2 text-sm hover:border-gold/60">
                  <span className="font-mono text-xs text-dim">{p.id.slice(0, 3).toUpperCase()}</span>
                  <span className="flex-1">{p.title}</span>
                  {state.practicals[p.id]?.done && <span className="text-ok">✓</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Past papers</h2>
            <Link to="/pyq/practice" className="text-sm text-gold hover:underline">
              Timed practice
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {PAPERS.map((p) => {
              const marked = p.questions.filter((q) => state.pyqSelf[q.id]).length;
              return (
                <li key={p.id}>
                  <Link to={`/pyq/paper/${p.id}`} className="flex items-center gap-3 rounded border border-line bg-panel px-3 py-2 text-sm hover:border-gold/60">
                    <span className="flex-1">{p.title}</span>
                    <span className="text-xs text-dim">
                      {marked}/{p.questions.length} marked
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {TOPIC_BY_ID['bit-banding'] && (
            <p className="mt-3 text-xs text-dim">Every supplied mid-term asks a bit-band calculation and a bit set/clear question.</p>
          )}
        </div>
      </section>
    </div>
  );
}
