import { useEffect, useMemo, useState } from 'react';
import { TOPIC_BY_ID, neighbours } from '../content/topics';
import { PRACTICAL_BY_ID } from '../content/practicals';
import { pyqForTopic } from '../content/pyq';
import { UNITS } from '../data/units';
import Markdown, { Callout, Inline } from '../components/Markdown';
import { Importance, PageHeader, PyqTag, QABlock, Section, SourceBadge, Sources, StatusDot, Tabs } from '../components/ui';
import McqQuiz from '../quizzes/McqQuiz';
import SelfCheck from '../quizzes/SelfCheck';
import NumericalCard from '../quizzes/NumericalCard';
import { Link, navigate, useRoute } from '../utils/router';
import { pushRecent, recordQuiz, setNote, setTopicStatus, useStore, visitTopic, type TopicStatus } from '../utils/store';
import NotFound from './NotFound';
import { SIM_BY_ID } from '../simulations/registry';

type Tab = 'learn' | 'deep' | 'visual' | 'exam' | 'revise';
const TABS: { id: Tab; label: string }[] = [
  { id: 'learn', label: '1 Fundamentals' },
  { id: 'deep', label: '2 In depth' },
  { id: 'visual', label: '3 Visualise' },
  { id: 'exam', label: '4 Exam prep' },
  { id: 'revise', label: '5 Revise & quiz' },
];

const headings = (src: string) =>
  src
    .split('\n')
    .map((l) => l.trim().match(/^(##|###)\s+(.*)$/))
    .filter(Boolean)
    .map((m) => ({ level: m![1].length, text: m![2], id: m![2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));

export default function TopicPage({ id }: { id: string }) {
  const t = TOPIC_BY_ID[id];
  const route = useRoute();
  const tab = (route.query.get('tab') as Tab) || 'learn';
  const st = useStore((s) => s.topics[id]);
  const note = useStore((s) => s.notes[id] ?? '');
  const [noteDraft, setNoteDraft] = useState(note);
  const pyqs = useMemo(() => (t ? pyqForTopic(t.id) : []), [t]);

  useEffect(() => {
    if (!t) return;
    visitTopic(t.id);
    pushRecent(`/topic/${t.id}`, t.title);
  }, [t]);
  useEffect(() => setNoteDraft(note), [id, note]);

  const setTab = (v: Tab) => navigate(`/topic/${id}${v === 'learn' ? '' : `?tab=${v}`}`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const { prev, next } = neighbours(id);
      if (e.key === '[' && prev) navigate(`/topic/${prev.id}`);
      if (e.key === ']' && next) navigate(`/topic/${next.id}`);
      const n = Number(e.key);
      if (n >= 1 && n <= 5) setTab(TABS[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!t) return <NotFound what="topic" />;
  const unit = UNITS.find((u) => u.id === t.unit)!;
  const { prev, next } = neighbours(id);
  const status: TopicStatus = st?.status ?? 'new';

  const outline =
    tab === 'learn'
      ? ['What is it?', 'Why is it required?', 'What problem does it solve?', 'How does it work?', 'Where is it used?'].map((x) => ({ level: 2, text: x, id: x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
      : tab === 'deep'
        ? headings(t.detailed)
        : tab === 'visual'
          ? headings(t.visual)
          : tab === 'exam'
            ? ['Definitions', 'Formulas', 'Frequently tested', 'Common mistakes', 'Diagrams to reproduce', 'Short-answer questions', 'Long-answer questions', 'Numerical problems', 'Previous-year questions'].map((x) => ({ level: 2, text: x, id: x.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
            : ['Quick revision notes', 'Formula sheet', 'Key takeaways', 'Five MCQs', 'Three short answers', 'Two long answers'].map((x) => ({ level: 2, text: x, id: x.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));

  return (
    <div className="mx-auto flex max-w-[1400px] gap-10">
      <article className="min-w-0 flex-1">
        <PageHeader
          kicker={
            <span>
              <Link to={`/unit/${unit.id}`} className="hover:text-gold">
                Unit {unit.id} — {unit.title}
              </Link>
            </span>
          }
          title={t.title}
          lead={t.short}
        >
          <SourceBadge status={t.status} />
          <Importance level={t.importance} />
          {pyqs.length > 0 && <PyqTag>{pyqs.length} PYQ{pyqs.length > 1 ? 's' : ''}</PyqTag>}
        </PageHeader>

        {t.status === 'additional' && (
          <Callout kind="additional" title="Additional syllabus coverage">
            <p>This topic is listed in the official syllabus but is not covered by your supplied lecture or lab material. It is written from general technical knowledge (and the prescribed textbook where noted). Verify emphasis with your faculty.</p>
          </Callout>
        )}
        {t.externalNote && (
          <Callout kind="external">
            <Markdown src={t.externalNote} bare />
          </Callout>
        )}

        <div className="sticky top-14 z-20 -mx-1 bg-mask/95 px-1 pt-1 backdrop-blur">
          <Tabs tabs={TABS} value={tab} onChange={setTab} label="Topic sections" />
        </div>

        <div className="pt-6">
          {tab === 'learn' && (
            <div className="space-y-8">
              {(
                [
                  ['What is it?', t.fundamentals.what],
                  ['Why is it required?', t.fundamentals.why],
                  ['What problem does it solve?', t.fundamentals.problem],
                  ['How does it work?', t.fundamentals.how],
                  ['Where is it used?', t.fundamentals.where],
                ] as [string, string][]
              ).map(([h, body]) => (
                <section key={h} id={h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} className="scroll-mt-28">
                  <h2 className="mb-2 text-xl font-semibold text-gold">{h}</h2>
                  <Markdown src={body} />
                </section>
              ))}
              <div className="flex flex-wrap gap-2 border-t border-line pt-6">
                <button type="button" className="btn-gold" onClick={() => setTab('deep')}>
                  Continue to the detailed explanation
                </button>
              </div>
            </div>
          )}
          {tab === 'deep' && <Markdown src={t.detailed} />}
          {tab === 'visual' && (
            <div>
              <Markdown src={t.visual} />
              {(t.sims ?? []).length > 0 && (
                <p className="mt-6 text-sm text-dim">
                  Related simulations:{' '}
                  {(t.sims ?? []).map((s, i) => (
                    <span key={s}>
                      {i > 0 && ', '}
                      <Link to={`/sims/${s}`} className="text-gold hover:underline">
                        {SIM_BY_ID[s]?.title ?? s}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
          {tab === 'exam' && <ExamPrep id={id} />}
          {tab === 'revise' && (
            <div>
              <Section id="quick-revision-notes" title="Quick revision notes">
                <ul className="md list-disc space-y-1.5 pl-6">
                  {t.revision.notes.map((n, i) => (
                    <li key={i}>
                      <Inline text={n} />
                    </li>
                  ))}
                </ul>
              </Section>
              <Section id="formula-sheet" title="Formula sheet">
                {(t.exam.formulas ?? []).length === 0 ? (
                  <p className="text-sm text-dim">This topic has no formulas to memorise — focus on definitions and diagrams.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {t.exam.formulas!.map((f) => (
                      <div key={f.name} className="rounded-md border border-ch1/30 bg-panel p-3">
                        <div className="text-sm font-semibold">{f.name}</div>
                        <div className="mt-1 font-mono text-[0.9rem] text-ch1">
                          <Inline text={f.expr} />
                        </div>
                        {f.example && (
                          <div className="mt-1 text-xs text-dim">
                            e.g. <Inline text={f.example} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
              <Section id="key-takeaways" title="Key takeaways">
                <ul className="md list-disc space-y-1.5 pl-6">
                  {t.revision.takeaways.map((n, i) => (
                    <li key={i}>
                      <Inline text={n} />
                    </li>
                  ))}
                </ul>
              </Section>
              <Section id="five-mcqs" title="Five MCQs" aside={st?.quizBest != null ? <span className="text-sm text-dim">Best: {st.quizBest}/5</span> : undefined}>
                <McqQuiz items={t.revision.mcqs} onScore={(s) => recordQuiz(t.id, s)} title="Check your understanding" />
              </Section>
              <Section id="three-short-answers" title="Three short answers">
                <SelfCheck items={t.exam.shortQs.slice(0, 3)} kind="short" />
              </Section>
              <Section id="two-long-answers" title="Two long answers">
                <SelfCheck items={t.exam.longQs.slice(0, 2)} kind="long" />
              </Section>
            </div>
          )}
        </div>

        <nav className="mt-14 grid gap-3 border-t border-line pt-6 sm:grid-cols-2" aria-label="Topic navigation">
          {prev ? (
            <Link to={`/topic/${prev.id}`} className="rounded-md border border-line p-3 hover:border-gold/60">
              <span className="text-xs text-dim">Previous ( [ )</span>
              <span className="block font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/topic/${next.id}`} className="rounded-md border border-line p-3 text-right hover:border-gold/60">
              <span className="text-xs text-dim">Next ( ] )</span>
              <span className="block font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      {/* right rail */}
      <aside className="hidden w-72 shrink-0 xl:block" aria-label="Topic tools">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-6 overflow-y-auto pb-6 text-sm">
          <div>
            <h3 className="mb-2 font-semibold">Revision status</h3>
            <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Set revision status">
              {(
                [
                  ['learning', 'Learning'],
                  ['revise', 'Revise again'],
                  ['done', 'Completed'],
                  ['new', 'Not started'],
                ] as [TopicStatus, string][]
              ).map(([s, l]) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setTopicStatus(t.id, s)}
                  className={`flex items-center gap-2 rounded border px-2 py-1.5 text-left ${status === s ? 'border-gold bg-gold/10 text-ink' : 'border-line text-dim hover:text-ink'}`}
                >
                  <StatusDot status={s} /> {l}
                </button>
              ))}
            </div>
            {st && <p className="mt-2 text-xs text-dim">Visited {st.visits}×, last on {new Date(st.lastVisit).toLocaleDateString()}</p>}
          </div>
          {outline.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">On this tab</h3>
              <ul className="space-y-1 border-l border-line">
                {outline.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className={`-ml-px block border-l border-transparent py-0.5 text-dim hover:border-gold hover:text-ink ${h.level === 3 ? 'pl-6' : 'pl-3'}`}>
                      <Inline text={h.text} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(t.exam.formulas ?? []).length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Important formulas</h3>
              <ul className="space-y-2">
                {t.exam.formulas!.map((f) => (
                  <li key={f.name} className="rounded border border-ch1/25 bg-panel p-2">
                    <div className="text-xs text-dim">{f.name}</div>
                    <div className="font-mono text-[0.78rem] text-ch1">
                      <Inline text={f.expr} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="mb-2 font-semibold">Key concepts</h3>
            <ul className="flex flex-wrap gap-1.5">
              {t.exam.definitions.map((d) => (
                <li key={d.term} className="chip" title={d.def}>
                  {d.term}
                </li>
              ))}
            </ul>
          </div>
          {(t.practicals ?? []).length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Related practicals</h3>
              <ul className="space-y-1">
                {t.practicals!.map((p) => (
                  <li key={p}>
                    <Link to={`/lab/${p}`} className="text-gold hover:underline">
                      {PRACTICAL_BY_ID[p]?.title ?? p}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(t.related ?? []).length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Related topics</h3>
              <ul className="space-y-1">
                {t.related!.filter((r) => TOPIC_BY_ID[r]).map((r) => (
                  <li key={r}>
                    <Link to={`/topic/${r}`} className="text-dim hover:text-gold">
                      {TOPIC_BY_ID[r].title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="mb-2 font-semibold">Sources</h3>
            <Sources sources={t.sources} />
          </div>
          <div>
            <h3 className="mb-2 font-semibold">My notes</h3>
            <textarea
              className="input w-full"
              rows={4}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => noteDraft !== note && setNote(t.id, noteDraft)}
              placeholder="Saved in this browser when you click away."
              aria-label="Personal notes for this topic"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function ExamPrep({ id }: { id: string }) {
  const t = TOPIC_BY_ID[id];
  const pyqs = pyqForTopic(id);
  return (
    <div>
      <Section id="definitions" title="Definitions">
        <dl className="space-y-3">
          {t.exam.definitions.map((d) => (
            <div key={d.term} className="rounded-md border border-line bg-panel p-3">
              <dt className="font-semibold text-gold">{d.term}</dt>
              <dd className="mt-1 text-ink/90">
                <Inline text={d.def} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="formulas" title="Formulas">
        {(t.exam.formulas ?? []).length === 0 ? (
          <p className="text-sm text-dim">No formulas in this topic.</p>
        ) : (
          <div className="space-y-3">
            {t.exam.formulas!.map((f) => (
              <div key={f.name} className="rounded-md border border-ch1/30 bg-panel p-3">
                <div className="font-semibold">{f.name}</div>
                <div className="mt-1 font-mono text-ch1">
                  <Inline text={f.expr} />
                </div>
                {f.vars && (
                  <p className="mt-1 text-sm text-dim">
                    <Inline text={f.vars} />
                  </p>
                )}
                {f.example && (
                  <p className="mt-1 text-sm">
                    Example: <Inline text={f.example} />
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section id="frequently-tested" title="Frequently tested">
        <ul className="md list-disc space-y-1.5 pl-6">
          {t.exam.frequent.map((f, i) => (
            <li key={i}>
              <Inline text={f} />
            </li>
          ))}
        </ul>
      </Section>
      <Section id="common-mistakes" title="Common mistakes">
        <ul className="space-y-2">
          {t.exam.mistakes.map((m, i) => (
            <li key={i} className="rounded border-l-2 border-bad/70 bg-bad/5 px-3 py-2 text-[0.95rem]">
              <Inline text={m} />
            </li>
          ))}
        </ul>
      </Section>
      <Section id="diagrams-to-reproduce" title="Diagrams to reproduce">
        <ul className="md list-disc space-y-1.5 pl-6">
          {t.exam.diagrams.map((d, i) => (
            <li key={i}>
              <Inline text={d} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <Link to="/revision/diagrams" className="text-gold hover:underline">
            Open the diagram gallery
          </Link>{' '}
          <span className="text-dim">for drawable versions with exam tips.</span>
        </p>
      </Section>
      <Section id="short-answer-questions" title="Short-answer questions" aside={<span className="chip border-ch3/40 text-ch3">Generated practice</span>}>
        <div className="space-y-3">
          {t.exam.shortQs.map((q, i) => (
            <QABlock key={i} index={i + 1} q={q.q} a={q.a} marks={q.marks} />
          ))}
        </div>
      </Section>
      <Section id="long-answer-questions" title="Long-answer questions" aside={<span className="chip border-ch3/40 text-ch3">Generated practice</span>}>
        <div className="space-y-3">
          {t.exam.longQs.map((q, i) => (
            <QABlock key={i} index={i + 1} q={q.q} a={q.a} marks={q.marks} />
          ))}
        </div>
      </Section>
      <Section id="numerical-problems" title="Numerical problems">
        {(t.exam.numericals ?? []).length === 0 ? (
          <p className="text-sm text-dim">This topic is descriptive; numerical practice lives in the related topics.</p>
        ) : (
          <div className="space-y-4">
            {t.exam.numericals!.map((n, i) => (
              <NumericalCard key={i} n={n} index={i + 1} />
            ))}
          </div>
        )}
      </Section>
      <Section id="previous-year-questions" title="Previous-year questions">
        {pyqs.length === 0 ? (
          <p className="text-sm text-dim">No question on this topic appears in the four supplied mid-term papers or the lab-evaluation papers. No end-semester papers were supplied.</p>
        ) : (
          <ul className="space-y-2">
            {pyqs.map((q) => (
              <li key={q.id} className="rounded-md border border-gold/30 bg-panel p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <PyqTag>
                    {q.paper.title}, Q{q.number}
                  </PyqTag>
                  <span className="chip">{q.marks} marks</span>
                  <Link to={`/pyq/paper/${q.paper.id}#${q.id}`} className="ml-auto text-gold hover:underline">
                    Full solution
                  </Link>
                </div>
                <div className="mt-2 text-[0.95rem]">
                  <Markdown src={q.text.length > 420 ? q.text.slice(0, 420) + '…' : q.text} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
