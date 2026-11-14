import { useMemo, useState } from 'react';
import { bank, TYPE_LABEL } from '../data/bank';
import { TOPICS } from '../content/topics';
import BankQuestion, { type Response } from '../quizzes/BankQuestion';
import { PageHeader } from '../components/ui';
import { Callout } from '../components/Markdown';
import type { BankItem } from '../types';

const PAGE = 15;

export default function QuestionBank() {
  const all = bank();
  const [unit, setUnit] = useState('all');
  const [topic, setTopic] = useState('all');
  const [type, setType] = useState('all');
  const [diff, setDiff] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const list = useMemo(
    () =>
      all.filter(
        (b) =>
          (unit === 'all' || String(b.unit) === unit) &&
          (topic === 'all' || b.topic === topic) &&
          (type === 'all' || b.type === type) &&
          (diff === 'all' || b.difficulty === diff) &&
          (!q.trim() || b.q.toLowerCase().includes(q.toLowerCase())),
      ),
    [all, unit, topic, type, diff, q],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of all) m[b.type] = (m[b.type] ?? 0) + 1;
    return m;
  }, [all]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const reset = () => setPage(0);

  const sel = (label: string, value: string, set: (v: string) => void, opts: [string, string][]) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-dim">{label}</span>
      <select
        className="input"
        value={value}
        onChange={(e) => {
          set(e.target.value);
          reset();
        }}
      >
        <option value="all">All</option>
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Question bank" lead={`${all.length} practice questions built from your lectures, lab programs and the syllabus. Objective questions are marked instantly; written answers show a model answer to compare against.`} />
      <Callout kind="note" title="All of these are generated practice questions">
        <p>None of them is a real previous-year question. Real questions live in the PYQ archive with their year and question number.</p>
      </Callout>
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-dim">
        {Object.entries(counts).map(([k, v]) => (
          <span key={k} className="chip">
            {TYPE_LABEL[k as BankItem['type']]} {v}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {sel('Unit', unit, setUnit, [['1', 'Unit 1'], ['2', 'Unit 2'], ['3', 'Unit 3']])}
        {sel('Topic', topic, setTopic, TOPICS.filter((t) => unit === 'all' || String(t.unit) === unit).map((t) => [t.id, t.title]))}
        {sel('Type', type, setType, Object.entries(TYPE_LABEL).map(([k, v]) => [k, v]))}
        {sel('Difficulty', diff, setDiff, [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']])}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-dim">Contains</span>
          <input
            className="input"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reset();
            }}
            placeholder="e.g. MODER"
          />
        </label>
      </div>
      <p className="mt-4 text-sm text-dim">
        {list.length} questions, page {page + 1} of {pages}
      </p>
      <ol className="mt-3 space-y-4">
        {shown.map((b, i) => (
          <li key={b.id}>
            <BankQuestion item={b} index={page * PAGE + i + 1} response={responses[b.id]} onResponse={(r) => setResponses((s) => ({ ...s, [b.id]: r }))} reviewed={!!checked[b.id]} />
            <button type="button" className="btn mt-2" onClick={() => setChecked((c) => ({ ...c, [b.id]: !c[b.id] }))}>
              {checked[b.id] ? 'Try again' : 'Check / show answer'}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center justify-between">
        <button type="button" className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          Previous page
        </button>
        <button type="button" className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
          Next page
        </button>
      </div>
    </div>
  );
}
