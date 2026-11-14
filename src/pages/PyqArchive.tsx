import { useMemo, useState } from 'react';
import { ALL_PYQ, PAPERS } from '../content/pyq';
import { TOPIC_BY_ID, TOPICS } from '../content/topics';
import { PageHeader, PyqTag } from '../components/ui';
import Markdown, { Callout } from '../components/Markdown';
import { Link } from '../utils/router';
import { useStore } from '../utils/store';

export default function PyqArchive() {
  const self = useStore((s) => s.pyqSelf);
  const [year, setYear] = useState('all');
  const [exam, setExam] = useState('all');
  const [unit, setUnit] = useState('all');
  const [topic, setTopic] = useState('all');
  const [marks, setMarks] = useState('all');
  const [kind, setKind] = useState('all');

  const years = [...new Set(PAPERS.map((p) => p.year))];
  const exams = [...new Set(PAPERS.map((p) => p.exam))];
  const topicIds = [...new Set(ALL_PYQ.flatMap((q) => q.topics))].filter((t) => TOPIC_BY_ID[t]);
  const markVals = [...new Set(ALL_PYQ.map((q) => q.marks))].sort((a, b) => a - b);

  const list = useMemo(
    () =>
      ALL_PYQ.filter(
        (q) =>
          (year === 'all' || String(q.paper.year) === year) &&
          (exam === 'all' || q.paper.exam === exam) &&
          (unit === 'all' || String(q.unit) === unit) &&
          (topic === 'all' || q.topics.includes(topic)) &&
          (marks === 'all' || String(q.marks) === marks) &&
          (kind === 'all' || q.kind === kind),
      ),
    [year, exam, unit, topic, marks, kind],
  );

  // topic frequency across theory papers
  const freq = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of ALL_PYQ) for (const t of q.topics) m[t] = (m[t] ?? 0) + 1;
    return Object.entries(m)
      .filter(([t]) => TOPIC_BY_ID[t])
      .sort((a, b) => b[1] - a[1]);
  }, []);

  const sel = (label: string, value: string, set: (v: string) => void, opts: [string, string][]) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-dim">{label}</span>
      <select className="input" value={value} onChange={(e) => set(e.target.value)}>
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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="PYQ archive & solutions"
        lead="Every question from the supplied question papers, copied as printed, with a full solution. Filter by year, exam, unit, topic, marks or type, or sit a paper under timed conditions."
      >
        <Link to="/pyq/practice" className="btn-gold">
          Start a timed paper
        </Link>
      </PageHeader>

      <Callout kind="source" title="What was available">
        <p>
          Four mid-term papers (the two unlabelled August 2025 papers in <code>23CSE304_MIDTERM_PYQS.pdf</code>, labelled here as Set A and Set B, plus August 2026 Slot 1 Set 1 and Set 2) and both Lab Evaluation 1 papers. <strong>No end-semester paper was supplied.</strong> The only Unit 3 topic with PYQ evidence is SysTick; for interrupts, NVIC, EXTI, timers, UART, I²C and SPI, practise from the question bank and mock exams.
        </p>
      </Callout>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PAPERS.map((p) => {
          const marked = p.questions.filter((q) => self[q.id]).length;
          return (
            <Link key={p.id} to={`/pyq/paper/${p.id}`} className="rounded-md border border-line bg-panel p-4 hover:border-gold/60">
              <div className="text-xs text-dim">
                {p.exam}, {p.month ? `${p.month} ${p.year}` : p.year}
              </div>
              <div className="mt-1 font-semibold">{p.set}</div>
              <div className="mt-2 text-sm text-dim">
                {p.questions.length} {p.questions.length === 1 ? 'question' : 'questions'}, {p.maxMarks} marks
              </div>
              <div className="mt-1 text-xs text-dim">{marked} self-marked</div>
            </Link>
          );
        })}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Topic frequency in the supplied papers</h2>
        <div className="mt-3 space-y-1.5">
          {freq.map(([t, n]) => (
            <div key={t} className="flex items-center gap-3 text-sm">
              <Link to={`/topic/${t}?tab=exam`} className="w-64 shrink-0 truncate hover:text-gold">
                {TOPIC_BY_ID[t].title}
              </Link>
              <div className="h-2 flex-1 rounded-full bg-line/50">
                <div className="h-2 rounded-full bg-gold" style={{ width: `${(n / freq[0][1]) * 100}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-dim">{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">All questions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sel('Year', year, setYear, years.map((y) => [String(y), String(y)]))}
          {sel('Exam', exam, setExam, exams.map((e) => [e, e]))}
          {sel('Unit', unit, setUnit, [['1', 'Unit 1'], ['2', 'Unit 2'], ['3', 'Unit 3']])}
          {sel('Topic', topic, setTopic, topicIds.sort((a, b) => TOPICS.findIndex((x) => x.id === a) - TOPICS.findIndex((x) => x.id === b)).map((t) => [t, TOPIC_BY_ID[t].title]))}
          {sel('Marks', marks, setMarks, markVals.map((m) => [String(m), `${m} marks`]))}
          {sel('Type', kind, setKind, [['theory', 'Theory'], ['numerical', 'Numerical'], ['program', 'Programming'], ['mixed', 'Mixed']])}
        </div>
        <p className="mt-3 text-sm text-dim">{list.length} questions</p>
        <ul className="mt-3 space-y-3">
          {list.map((q) => (
            <li key={q.id} className="rounded-md border border-line bg-panel p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <PyqTag>
                  {q.paper.title}, Q{q.number}
                </PyqTag>
                <span className="chip">{q.marks} marks</span>
                <span className="chip">Unit {q.unit}</span>
                <span className="chip capitalize">{q.kind}</span>
                {self[q.id] && <span className="chip">self-marked: {self[q.id]}</span>}
                <Link to={`/pyq/paper/${q.paper.id}#${q.id}`} className="ml-auto text-gold hover:underline">
                  Solution
                </Link>
              </div>
              <div className="mt-2">
                <Markdown src={q.text.length > 500 ? q.text.slice(0, 500) + '…' : q.text} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
