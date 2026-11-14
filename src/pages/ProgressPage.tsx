import { useRef, useState } from 'react';
import { TOPICS, TOPIC_BY_ID, topicsOfUnit } from '../content/topics';
import { PRACTICALS } from '../content/practicals';
import { ALL_PYQ } from '../content/pyq';
import { UNITS } from '../data/units';
import { Bar, Empty, PageHeader, StatusDot } from '../components/ui';
import { Link } from '../utils/router';
import { exportState, importState, resetAll, toggleBookmark, useStore } from '../utils/store';

const labelFor = (route: string) => {
  const [, a, b] = route.split('/');
  if (a === 'topic' && TOPIC_BY_ID[b]) return `Topic: ${TOPIC_BY_ID[b].title}`;
  if (a === 'lab') return `Practical: ${PRACTICALS.find((p) => p.id === b)?.title ?? b}`;
  return route === '/' ? 'Dashboard' : route;
};

export default function ProgressPage() {
  const s = useStore((x) => x);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const counts = { done: 0, learning: 0, revise: 0, new: 0 };
  for (const t of TOPICS) counts[s.topics[t.id]?.status ?? 'new']++;
  const quizzes = TOPICS.filter((t) => s.topics[t.id]?.quizBest != null);
  const avgQuiz = quizzes.length ? quizzes.reduce((a, t) => a + (s.topics[t.id]!.quizBest ?? 0), 0) / quizzes.length : 0;
  const pyqMarked = Object.values(s.pyqSelf);

  const doExport = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `es-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Progress & bookmarks" lead="Everything is stored in this browser only. Export a backup before clearing browser data or switching laptops." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Completed topics', counts.done, TOPICS.length, 'ok'],
          ['Practicals mastered', PRACTICALS.filter((p) => s.practicals[p.id]?.done).length, PRACTICALS.length, 'gold'],
          ['PYQ parts self-marked', pyqMarked.length, ALL_PYQ.length, 'ch2'],
          ['Average topic quiz', Math.round(avgQuiz * 10) / 10, 5, 'gold'],
        ].map(([l, v, m, tone]) => (
          <div key={l as string} className="rounded-md border border-line bg-panel p-4">
            <div className="text-sm text-dim">{l}</div>
            <div className="silk mt-1 font-mono text-3xl font-semibold">
              {v}
              <span className="text-lg text-dim">/{m}</span>
            </div>
            <Bar value={Number(v)} max={Number(m)} className="mt-3" tone={tone as 'ok'} />
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Topic status by unit</h2>
        <p className="mb-4 text-sm text-dim">
          {counts.done} completed, {counts.learning} learning, {counts.revise} marked for revision, {counts.new} not started
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          {UNITS.map((u) => (
            <div key={u.id} className="rounded-md border border-line bg-panel p-4">
              <h3 className="font-semibold">Unit {u.id}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {topicsOfUnit(u.id).map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <StatusDot status={s.topics[t.id]?.status ?? 'new'} />
                    <Link to={`/topic/${t.id}`} className="flex-1 truncate hover:text-gold">
                      {t.title}
                    </Link>
                    {s.topics[t.id]?.quizBest != null && <span className="font-mono text-xs text-dim">{s.topics[t.id]!.quizBest}/5</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Bookmarks</h2>
          {s.bookmarks.length === 0 ? (
            <Empty title="No bookmarks yet">Press b or the bookmark icon on any page to save it here.</Empty>
          ) : (
            <ul className="space-y-1.5">
              {s.bookmarks.map((b) => (
                <li key={b} className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-2 text-sm">
                  <Link to={b} className="flex-1 hover:text-gold">
                    {labelFor(b)}
                  </Link>
                  <button type="button" className="text-xs text-dim hover:text-bad" onClick={() => toggleBookmark(b)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold">Exam attempts</h2>
          {s.attempts.length === 0 ? (
            <Empty title="No saved attempts">
              Sit a <Link to="/pyq/practice" className="text-gold">timed PYQ paper</Link> or a <Link to="/mock" className="text-gold">mock exam</Link> and save the result.
            </Empty>
          ) : (
            <ul className="space-y-2">
              {s.attempts.map((a) => (
                <li key={a.id} className="rounded border border-line bg-panel px-3 py-2 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-auto font-mono text-gold">
                      {a.score}/{a.max}
                    </span>
                  </div>
                  <div className="text-xs text-dim">
                    {new Date(a.ts).toLocaleString()}
                    {a.weakTopics.length > 0 && `; weak topics: ${a.weakTopics.map((t) => TOPIC_BY_ID[t]?.title ?? t).join(', ')}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Recently visited</h2>
        {s.recent.length === 0 ? (
          <p className="text-sm text-dim">Nothing yet.</p>
        ) : (
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {s.recent.map((r) => (
              <li key={r.route}>
                <Link to={r.route} className="hover:text-gold">
                  {r.title}
                </Link>{' '}
                <span className="text-xs text-dim">{new Date(r.ts).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-md border border-line bg-panel p-5">
        <h2 className="text-xl font-semibold">Backup</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={doExport}>
            Export progress file
          </button>
          <button type="button" className="btn" onClick={() => file.current?.click()}>
            Import progress file
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg(importState(await f.text()) ? 'Progress imported.' : 'That file is not a progress export from this site.');
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn ml-auto border-bad/50 text-bad"
            onClick={() => {
              if (window.confirm('Erase all progress, bookmarks, notes and attempts stored in this browser? This cannot be undone.')) {
                resetAll();
                setMsg('All progress erased.');
              }
            }}
          >
            Erase all progress
          </button>
        </div>
        {msg && (
          <p className="mt-3 text-sm text-dim" role="status">
            {msg}
          </p>
        )}
      </section>
    </div>
  );
}
