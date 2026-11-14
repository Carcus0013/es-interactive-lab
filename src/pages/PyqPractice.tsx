import { useEffect, useMemo, useState } from 'react';
import { ALL_PYQ, PAPERS, PAPER_BY_ID, type PyqRef } from '../content/pyq';
import { TOPIC_BY_ID } from '../content/topics';
import Markdown, { Callout } from '../components/Markdown';
import { PageHeader, PyqTag } from '../components/ui';
import { Link, useRoute } from '../utils/router';
import { addAttempt } from '../utils/store';

type Phase = 'setup' | 'running' | 'review';

export function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && left === 0) onEnd();
  }, [left, running, onEnd]);
  return left;
}

export const fmtTime = (s: number) => `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function PyqPractice() {
  const { query } = useRoute();
  const [paperId, setPaperId] = useState(query.get('paper') ?? PAPERS[0]?.id ?? '');
  const [mode, setMode] = useState<'paper' | 'unit'>('paper');
  const [unit, setUnit] = useState('1');
  const [minutes, setMinutes] = useState(120);
  const [phase, setPhase] = useState<Phase>('setup');
  const [qs, setQs] = useState<PyqRef[]>([]);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [awarded, setAwarded] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const paper = PAPER_BY_ID[paperId];
  useEffect(() => {
    if (paper) setMinutes(paper.exam.startsWith('Lab') ? 60 : 120);
  }, [paper]);

  const pool = useMemo(() => (mode === 'paper' ? (paper?.questions.map((q) => ({ ...q, paper })) ?? []) : ALL_PYQ.filter((q) => String(q.unit) === unit)), [mode, paper, unit]);
  const maxMarks = qs.reduce((s, q) => s + q.marks, 0);
  const left = useCountdown(minutes * 60, phase === 'running', () => setPhase('review'));

  const start = () => {
    setQs(pool as PyqRef[]);
    setCur(0);
    setAnswers({});
    setFlags({});
    setAwarded({});
    setSaved(false);
    setPhase('running');
  };

  const score = Object.values(awarded).reduce((s, v) => s + v, 0);
  const allMarked = qs.every((q) => awarded[q.id] != null);
  const weak = [...new Set(qs.filter((q) => (awarded[q.id] ?? 0) < q.marks / 2).flatMap((q) => q.topics))].filter((t) => TOPIC_BY_ID[t]);

  const save = () => {
    addAttempt({ id: String(Date.now()), kind: 'pyq', title: mode === 'paper' ? paper?.title ?? 'Paper' : `All Unit ${unit} PYQs`, ts: Date.now(), score, max: maxMarks, weakTopics: weak });
    setSaved(true);
  };

  if (phase === 'setup')
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader kicker={<Link to="/pyq" className="hover:text-gold">PYQ archive</Link>} title="Timed exam simulation" lead="Sit a real paper against the clock. Write your answers, submit, then compare with the model solutions and award yourself marks honestly — theory answers cannot be auto-graded fairly." />
        <div className="space-y-5 rounded-md border border-line bg-panel p-5">
          <fieldset className="flex flex-wrap gap-4 text-sm">
            <legend className="mb-2 text-dim">What to attempt</legend>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'paper'} onChange={() => setMode('paper')} /> A complete paper
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'unit'} onChange={() => setMode('unit')} /> Every PYQ from one unit
            </label>
          </fieldset>
          {mode === 'paper' ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-dim">Paper</span>
              <select className="input" value={paperId} onChange={(e) => setPaperId(e.target.value)}>
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.maxMarks} marks)
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-dim">Unit</span>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {['1', '2', '3'].map((u) => (
                  <option key={u} value={u}>
                    Unit {u} ({ALL_PYQ.filter((q) => String(q.unit) === u).length} questions)
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-dim">Time limit (minutes)</span>
            <input className="input w-32" type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 5))} />
          </label>
          <p className="text-sm text-dim">
            {pool.length} questions, {pool.reduce((s, q) => s + q.marks, 0)} marks.
          </p>
          <button type="button" className="btn-gold" onClick={start} disabled={pool.length === 0}>
            Start the clock
          </button>
        </div>
      </div>
    );

  const q = qs[cur];

  if (phase === 'running')
    return (
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-14 z-20 -mx-2 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-mask/95 px-2 py-3 backdrop-blur">
          <span className="font-semibold">{mode === 'paper' ? paper?.title : `Unit ${unit} PYQs`}</span>
          <span className={`ml-auto font-mono text-xl ${left < 300 ? 'text-bad' : 'text-gold'}`} aria-live="polite" aria-label="Time left">
            {fmtTime(left)}
          </span>
          <button type="button" className="btn-gold" onClick={() => setPhase('review')}>
            Submit paper
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
          <nav aria-label="Questions" className="flex flex-wrap gap-1.5 lg:flex-col">
            {qs.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setCur(i)}
                aria-current={i === cur}
                className={`flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-left text-sm ${i === cur ? 'border-gold bg-gold/10' : 'border-line'} `}
              >
                <span className="font-mono">Q{x.number}</span>
                <span className="text-xs text-dim">
                  {answers[x.id]?.trim() ? '✎' : ''} {flags[x.id] ? '⚑' : ''} {x.marks}m
                </span>
              </button>
            ))}
          </nav>
          <div>
            <div className="rounded-md border border-line bg-panel p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <PyqTag>
                  {q.paper.title}, Q{q.number}
                </PyqTag>
                <span className="chip">{q.marks} marks</span>
                <button type="button" className="btn ml-auto" aria-pressed={!!flags[q.id]} onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}>
                  {flags[q.id] ? 'Unflag' : 'Flag for review'}
                </button>
              </div>
              <Markdown src={q.text} />
              <textarea
                className="input mt-4 min-h-[14rem] w-full font-mono text-[0.85rem]"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Write your answer / code here. Draw diagrams on paper."
                aria-label="Your answer"
              />
            </div>
            <div className="mt-3 flex justify-between">
              <button type="button" className="btn" disabled={cur === 0} onClick={() => setCur((c) => c - 1)}>
                Previous
              </button>
              <button type="button" className="btn" disabled={cur === qs.length - 1} onClick={() => setCur((c) => c + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Review and mark your paper" lead="Compare each answer with the model solution and give yourself the marks an examiner would. Your total and weak topics update as you go.">
        <span className="font-mono text-2xl text-gold">
          {score}/{maxMarks}
        </span>
        <button type="button" className="btn" onClick={() => setPhase('setup')}>
          New attempt
        </button>
        <button type="button" className="btn-gold" onClick={save} disabled={!allMarked || saved}>
          {saved ? 'Saved to progress' : allMarked ? 'Save result to progress' : 'Mark every question to save'}
        </button>
      </PageHeader>
      {allMarked && (
        <Callout kind={weak.length ? 'warning' : 'tip'} title={weak.length ? 'Topics to revise' : 'Strong attempt'}>
          {weak.length ? (
            <p>
              {weak.map((t, i) => (
                <span key={t}>
                  {i > 0 && ', '}
                  <Link to={`/topic/${t}?tab=revise`}>{TOPIC_BY_ID[t].title}</Link>
                </span>
              ))}
              . You scored under half the marks on questions from these topics.
            </p>
          ) : (
            <p>You scored at least half the marks on every question.</p>
          )}
        </Callout>
      )}
      <ol className="space-y-5">
        {qs.map((x) => (
          <li key={x.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono font-semibold text-gold">Q{x.number}</span>
              <span className="chip">{x.marks} marks</span>
              <label className="ml-auto flex items-center gap-2">
                <span className="text-dim">Marks awarded</span>
                <input type="range" min={0} max={x.marks} step={0.5} value={awarded[x.id] ?? 0} onChange={(e) => setAwarded((a) => ({ ...a, [x.id]: Number(e.target.value) }))} aria-label={`Marks for Q${x.number}`} />
                <span className="w-12 font-mono">{awarded[x.id] != null ? awarded[x.id] : '—'}</span>
              </label>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-dim">Question</summary>
              <Markdown src={x.text} />
            </details>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-dim">Your answer</div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded border border-line bg-mask/60 p-3 font-mono text-[0.8rem]">{answers[x.id]?.trim() || '(no answer written)'}</pre>
              </div>
              <div>
                <div className="mb-1 text-sm text-ok">Model solution</div>
                <div className="max-h-[28rem] overflow-auto rounded border border-ok/30 bg-mask/60 p-3">
                  <Markdown src={x.solution} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
