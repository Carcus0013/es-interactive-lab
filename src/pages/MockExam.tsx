import { useMemo, useState } from 'react';
import { bank, gradeObjective, isAutoGraded, TYPE_LABEL } from '../data/bank';
import { TOPIC_BY_ID } from '../content/topics';
import BankQuestion, { type Response } from '../quizzes/BankQuestion';
import { PageHeader } from '../components/ui';
import { Callout } from '../components/Markdown';
import { Link } from '../utils/router';
import { addAttempt } from '../utils/store';
import { fmtTime, useCountdown } from './PyqPractice';
import type { BankItem, BankType, Difficulty } from '../types';

type Phase = 'setup' | 'running' | 'review';

function shuffle<T>(a: T[], seed: number): T[] {
  const r = [...a];
  let s = seed;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function buildMock(pool: BankItem[], target: number, seed: number): BankItem[] {
  const picked: BankItem[] = [];
  let total = 0;
  // spread across topics: round-robin over shuffled topic buckets
  const buckets = new Map<string, BankItem[]>();
  for (const b of shuffle(pool, seed)) buckets.set(b.topic, [...(buckets.get(b.topic) ?? []), b]);
  const keys = shuffle([...buckets.keys()], seed + 7);
  let progress = true;
  while (total < target && progress) {
    progress = false;
    for (const k of keys) {
      const list = buckets.get(k)!;
      const idx = list.findIndex((b) => total + b.marks <= target);
      if (idx >= 0) {
        const [b] = list.splice(idx, 1);
        picked.push(b);
        total += b.marks;
        progress = true;
        if (total >= target) break;
      }
    }
  }
  // objective first, then short, then long — like a real paper
  const order: BankType[] = ['mcq', 'tf', 'fill', 'numerical', 'register', 'circuit', 'debug', 'short', 'program', 'long'];
  return picked.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
}

export default function MockExam() {
  const all = bank();
  const [minutes, setMinutes] = useState(60);
  const [marks, setMarks] = useState(30);
  const [units, setUnits] = useState<Record<string, boolean>>({ '1': true, '2': true, '3': true });
  const [diffs, setDiffs] = useState<Record<Difficulty, boolean>>({ easy: true, medium: true, hard: true });
  const [types, setTypes] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.keys(TYPE_LABEL).map((k) => [k, true])));
  const [phase, setPhase] = useState<Phase>('setup');
  const [items, setItems] = useState<BankItem[]>([]);
  const [resp, setResp] = useState<Record<string, Response>>({});
  const [selfMarks, setSelfMarks] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const pool = useMemo(() => all.filter((b) => units[String(b.unit)] && diffs[b.difficulty] && types[b.type]), [all, units, diffs, types]);
  const poolMarks = pool.reduce((s, b) => s + b.marks, 0);
  const left = useCountdown(minutes * 60, phase === 'running', () => setPhase('review'));

  const start = () => {
    setItems(buildMock(pool, marks, Date.now() % 100000));
    setResp({});
    setSelfMarks({});
    setSaved(false);
    setPhase('running');
  };

  const max = items.reduce((s, b) => s + b.marks, 0);
  const scoreOf = (b: BankItem) => (isAutoGraded(b) ? (gradeObjective(b, resp[b.id]) ? b.marks : 0) : selfMarks[b.id] ?? 0);
  const score = items.reduce((s, b) => s + scoreOf(b), 0);
  const subjective = items.filter((b) => !isAutoGraded(b));
  const allSelfMarked = subjective.every((b) => selfMarks[b.id] != null);

  const topicStats = useMemo(() => {
    const m: Record<string, { got: number; max: number }> = {};
    for (const b of items) {
      const e = (m[b.topic] ??= { got: 0, max: 0 });
      e.max += b.marks;
      e.got += scoreOf(b);
    }
    return Object.entries(m).sort((a, b) => a[1].got / a[1].max - b[1].got / b[1].max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, resp, selfMarks]);
  const weak = topicStats.filter(([, v]) => v.got / v.max < 0.6).map(([t]) => t);

  const toggle = <K extends string>(set: (f: (r: Record<K, boolean>) => Record<K, boolean>) => void, k: K) => set((r) => ({ ...r, [k]: !r[k] }));

  if (phase === 'setup')
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Mock examination" lead="Build a paper from the question bank with your own time limit, marks, units, difficulty and question types. Objective answers are marked automatically; you mark written answers against the model answers." />
        <div className="grid gap-6 rounded-md border border-line bg-panel p-5 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-dim">Duration (minutes)</span>
            <input className="input" type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 5))} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-dim">Total marks</span>
            <input className="input" type="number" min={5} max={100} value={marks} onChange={(e) => setMarks(Math.max(5, Number(e.target.value) || 5))} />
          </label>
          <fieldset className="text-sm">
            <legend className="mb-2 text-dim">Units</legend>
            <div className="flex gap-4">
              {['1', '2', '3'].map((u) => (
                <label key={u} className="flex items-center gap-2">
                  <input type="checkbox" checked={units[u]} onChange={() => toggle(setUnits, u)} /> Unit {u}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="text-sm">
            <legend className="mb-2 text-dim">Difficulty</legend>
            <div className="flex gap-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <label key={d} className="flex items-center gap-2 capitalize">
                  <input type="checkbox" checked={diffs[d]} onChange={() => toggle(setDiffs, d)} /> {d}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="text-sm md:col-span-2">
            <legend className="mb-2 text-dim">Question types</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(TYPE_LABEL).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={types[k]} onChange={() => toggle(setTypes, k)} /> {l}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <p className="text-sm text-dim">
              {pool.length} questions ({poolMarks} marks) match these settings.
              {poolMarks < marks && <span className="text-warn"> Not enough marks available — the paper will be shorter.</span>}
            </p>
            <button type="button" className="btn-gold mt-3" onClick={start} disabled={pool.length === 0}>
              Generate paper and start
            </button>
          </div>
        </div>
      </div>
    );

  if (phase === 'running')
    return (
      <div className="mx-auto max-w-4xl">
        <div className="sticky top-14 z-20 -mx-2 mb-4 flex items-center gap-3 border-b border-line bg-mask/95 px-2 py-3 backdrop-blur">
          <span className="font-semibold">
            Mock paper: {items.length} questions, {max} marks
          </span>
          <span className={`ml-auto font-mono text-xl ${left < 300 ? 'text-bad' : 'text-gold'}`} aria-live="polite">
            {fmtTime(left)}
          </span>
          <button type="button" className="btn-gold" onClick={() => setPhase('review')}>
            Submit
          </button>
        </div>
        <ol className="space-y-4">
          {items.map((b, i) => (
            <li key={b.id}>
              <BankQuestion item={b} index={i + 1} response={resp[b.id]} onResponse={(r) => setResp((s) => ({ ...s, [b.id]: r }))} reviewed={false} />
            </li>
          ))}
        </ol>
        <button type="button" className="btn-gold mt-6" onClick={() => setPhase('review')}>
          Submit paper
        </button>
      </div>
    );

  const save = () => {
    addAttempt({ id: String(Date.now()), kind: 'mock', title: `Mock paper (${max} marks)`, ts: Date.now(), score, max, weakTopics: weak });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mock exam result" lead={allSelfMarked ? 'Final score, with weak topics and what to revise next.' : `Objective answers are marked. Mark the ${subjective.filter((b) => selfMarks[b.id] == null).length} written answers below to finish.`}>
        <span className="font-mono text-2xl text-gold">
          {score}/{max}
        </span>
        <span className="text-sm text-dim">{max ? Math.round((score / max) * 100) : 0}%</span>
        <button type="button" className="btn" onClick={() => setPhase('setup')}>
          New mock
        </button>
        <button type="button" className="btn-gold" onClick={save} disabled={saved || !allSelfMarked}>
          {saved ? 'Saved' : 'Save to progress'}
        </button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">By topic</h2>
          <ul className="space-y-1.5 text-sm">
            {topicStats.map(([t, v]) => (
              <li key={t} className="flex items-center gap-3">
                <span className="w-48 truncate">{TOPIC_BY_ID[t]?.title ?? t}</span>
                <div className="h-2 flex-1 rounded-full bg-line/60">
                  <div className={`h-2 rounded-full ${v.got / v.max >= 0.6 ? 'bg-ok' : 'bg-bad'}`} style={{ width: `${(v.got / v.max) * 100}%` }} />
                </div>
                <span className="w-14 text-right font-mono text-dim">
                  {v.got}/{v.max}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Callout kind={weak.length ? 'warning' : 'tip'} title={weak.length ? 'Recommended revision' : 'No weak topics'}>
          {weak.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {weak.map((t) => (
                <li key={t}>
                  <Link to={`/topic/${t}?tab=revise`}>{TOPIC_BY_ID[t]?.title ?? t}</Link> — below 60%
                </li>
              ))}
            </ul>
          ) : (
            <p>You scored 60% or more in every topic on this paper.</p>
          )}
        </Callout>
      </div>
      <ol className="mt-8 space-y-4">
        {items.map((b, i) => (
          <li key={b.id}>
            <BankQuestion item={b} index={i + 1} response={resp[b.id]} onResponse={() => {}} reviewed selfMark={selfMarks[b.id]} onSelfMark={(m) => setSelfMarks((s) => ({ ...s, [b.id]: m }))} />
          </li>
        ))}
      </ol>
    </div>
  );
}
