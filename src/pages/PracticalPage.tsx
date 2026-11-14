import { useEffect, useState } from 'react';
import { PRACTICAL_BY_ID, PRACTICALS } from '../content/practicals';
import { TOPIC_BY_ID } from '../content/topics';
import CodeBlock from '../components/CodeBlock';
import CircuitDiagram from '../components/CircuitDiagram';
import FlowChart from '../components/FlowChart';
import SimFrame from '../components/SimFrame';
import Markdown, { Callout, Inline } from '../components/Markdown';
import { PageHeader, QABlock, Section, Sources, Tabs } from '../components/ui';
import { Link } from '../utils/router';
import { pushRecent, setPracticalDone, useStore, visitPractical } from '../utils/store';
import NotFound from './NotFound';
import type { Program } from '../types';

export default function PracticalPage({ id }: { id: string }) {
  const p = PRACTICAL_BY_ID[id];
  const done = useStore((s) => s.practicals[id]?.done ?? false);
  const [progIdx, setProgIdx] = useState(0);
  const [examTab, setExamTab] = useState<'viva' | 'reg' | 'pin' | 'out' | 'debug'>('viva');

  useEffect(() => {
    if (!p) return;
    visitPractical(p.id);
    pushRecent(`/lab/${p.id}`, `Practical: ${p.title}`);
    setProgIdx(0);
  }, [p]);

  if (!p) return <NotFound what="practical" />;
  const prog = p.programs[Math.min(progIdx, p.programs.length - 1)];
  const idx = PRACTICALS.findIndex((x) => x.id === p.id);
  const prev = PRACTICALS[idx - 1];
  const next = PRACTICALS[idx + 1];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader kicker={<Link to="/lab" className="hover:text-gold">Practical lab, {p.id.slice(0, 3).toUpperCase()}, Unit {p.unit}</Link>} title={p.title} lead={p.objective}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={done} onChange={(e) => setPracticalDone(p.id, e.target.checked)} className="h-4 w-4 accent-[rgb(var(--gold))]" />
          I can explain and rewrite this program
        </label>
      </PageHeader>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Sections of this practical">
        {['Experiment details', 'Circuit diagram', 'Source code', 'Explain the code', 'Execution flow', 'Simulation', 'Practical exam prep', 'Code memorisation'].map((s, i) => (
          <a key={s} href={`#sec-${i + 1}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${i + 1}`)?.scrollIntoView({ behavior: 'smooth' }); }} className="chip hover:border-gold/60 hover:text-ink">
            {i + 1}. {s}
          </a>
        ))}
      </nav>

      <Section id="sec-1" title="1. Experiment details">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Required components</h3>
            <ul className="md list-disc space-y-1 pl-6">
              {p.components.map((c) => (
                <li key={c}>
                  <Inline text={c} />
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-5 font-semibold">Expected output</h3>
            <Markdown src={p.expected} />
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Hardware connections</h3>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {['Pin', 'Connected to', 'Mode'].map((h) => (
                    <th key={h} className="border-b border-line bg-raised px-3 py-2 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.connections.map((c) => (
                  <tr key={c.pin + c.to}>
                    <td className="border-b border-line/60 px-3 py-2 font-mono text-gold">{c.pin}</td>
                    <td className="border-b border-line/60 px-3 py-2">{c.to}</td>
                    <td className="border-b border-line/60 px-3 py-2 text-dim">{c.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <h3 className="mb-2 mt-5 font-semibold">Source files</h3>
            <Sources sources={p.sources} />
          </div>
        </div>
      </Section>

      <Section id="sec-2" title="2. Circuit diagram">
        <div className="rounded-md border border-line bg-panel p-3">
          <CircuitDiagram spec={p.circuit} title={`Circuit for ${p.title}`} />
        </div>
      </Section>

      <Section id="sec-3" title="3. Complete source code">
        {p.programs.length > 1 && (
          <div className="mb-4">
            <Tabs label="Program" value={String(progIdx)} onChange={(v) => setProgIdx(Number(v))} tabs={p.programs.map((g, i) => ({ id: String(i), label: g.title }))} />
          </div>
        )}
        <ProgramView prog={prog} />
      </Section>

      <Section id="sec-4" title="4. Explain the code">
        <p className="mb-4 text-sm text-dim">Click an explanation to highlight its lines, or click a line in the code to jump to its explanation.</p>
        <Explainer prog={prog} />
      </Section>

      <Section id="sec-5" title="5. Execution flow">
        <FlowChart nodes={p.flow} />
      </Section>

      <Section id="sec-6" title="6. Hardware simulation">
        {p.sim ? (
          <SimFrame id={p.sim.id} preset={p.sim.preset} />
        ) : (
          <p className="text-sm text-dim">This program has no interactive simulation; use the flowchart above.</p>
        )}
      </Section>

      <Section id="sec-7" title="7. Practical examination preparation">
        <Tabs
          label="Question type"
          value={examTab}
          onChange={setExamTab}
          tabs={[
            { id: 'viva', label: `Viva (${p.exam.viva.length})` },
            { id: 'reg', label: `Registers (${p.exam.registerQs.length})` },
            { id: 'pin', label: `Pins (${p.exam.pinQs.length})` },
            { id: 'out', label: `Expected output (${p.exam.outputQs.length})` },
            { id: 'debug', label: `Debugging (${p.exam.debugQs.length})` },
          ]}
        />
        <div className="mt-4 space-y-3">
          {(examTab === 'viva' ? p.exam.viva : examTab === 'reg' ? p.exam.registerQs : examTab === 'pin' ? p.exam.pinQs : examTab === 'out' ? p.exam.outputQs : p.exam.debugQs).map((q, i) => (
            <QABlock key={examTab + i} index={i + 1} q={q.q} a={q.a} />
          ))}
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Common errors in the lab</h3>
            <ul className="space-y-2">
              {p.exam.errors.map((e, i) => (
                <li key={i} className="rounded border-l-2 border-bad/70 bg-bad/5 px-3 py-2 text-sm">
                  <Inline text={e} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Modifications the examiner may ask for</h3>
            <ul className="md list-disc space-y-1.5 pl-6 text-[0.95rem]">
              {p.exam.modifications.map((e, i) => (
                <li key={i}>
                  <Inline text={e} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Callout kind="exam" title="How to explain this experiment to the examiner">
          <Markdown src={p.exam.explainToExaminer} bare />
        </Callout>
      </Section>

      <Section id="sec-8" title="8. Code memorisation">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Essential statements, in order</h3>
            <RecallList items={p.memorise.essentials} />
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Skeleton to reproduce</h3>
            <CodeBlock code={p.memorise.skeleton} title="skeleton.c" />
          </div>
        </div>
        <h3 className="mb-2 mt-6 font-semibold">Repeated patterns</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {p.memorise.patterns.map((pt) => (
            <div key={pt.name}>
              <div className="text-sm text-dim">{pt.name}</div>
              <CodeBlock code={pt.code} title={pt.name} showLineNumbers={false} />
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-10">
        <h2 className="mb-2 text-lg font-semibold">Theory behind it</h2>
        <div className="flex flex-wrap gap-2">
          {p.topics.filter((t) => TOPIC_BY_ID[t]).map((t) => (
            <Link key={t} to={`/topic/${t}`} className="btn">
              {TOPIC_BY_ID[t].title}
            </Link>
          ))}
        </div>
      </div>

      <nav className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/lab/${prev.id}`} className="rounded-md border border-line p-3 hover:border-gold/60">
            <span className="text-xs text-dim">Previous practical</span>
            <span className="block font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/lab/${next.id}`} className="rounded-md border border-line p-3 text-right hover:border-gold/60">
            <span className="text-xs text-dim">Next practical</span>
            <span className="block font-medium">{next.title}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

function ProgramView({ prog }: { prog: Program }) {
  const [view, setView] = useState<'orig' | 'fixed'>('orig');
  useEffect(() => setView('orig'), [prog]);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono text-dim">{prog.file}</span>
        {prog.authored ? (
          <span className="chip border-ch3/40 text-ch3">Solution written for this platform (no program was supplied)</span>
        ) : (
          <span className="chip border-gold/40 text-gold">Original code from your materials — unchanged</span>
        )}
        {prog.corrected && (
          <div className="ml-auto flex gap-1" role="group" aria-label="Code version">
            <button type="button" className={view === 'orig' ? 'btn-gold' : 'btn'} onClick={() => setView('orig')}>
              {prog.authored ? 'Solution' : 'Original'}
            </button>
            <button type="button" className={view === 'fixed' ? 'btn-gold' : 'btn'} onClick={() => setView('fixed')}>
              Corrected version
            </button>
          </div>
        )}
      </div>
      <CodeBlock code={view === 'fixed' && prog.corrected ? prog.corrected.code : prog.code} title={view === 'fixed' ? `${prog.file} (corrected)` : prog.file} />
      {prog.corrected && (
        <Callout kind={view === 'fixed' ? 'tip' : 'warning'} title={view === 'fixed' ? 'What was changed and why' : 'This program has issues — see the corrected version'}>
          <ul className="list-disc space-y-1 pl-5">
            {prog.corrected.changes.map((c, i) => (
              <li key={i}>
                <Inline text={c} />
              </li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
}

function Explainer({ prog }: { prog: Program }) {
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [prog]);
  const ex = prog.explain[sel];
  const findFor = (line: number) => prog.explain.findIndex((e) => line >= e.lines[0] && line <= e.lines[1]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <CodeBlock
          code={prog.code}
          title={prog.file}
          highlight={ex ? ex.lines : null}
          maxHeight={560}
          onLineClick={(l) => {
            const i = findFor(l);
            if (i >= 0) setSel(i);
          }}
        />
      </div>
      <ol className="space-y-2">
        {prog.explain.map((e, i) => {
          const on = i === sel;
          return (
            <li key={i}>
              <button type="button" onClick={() => setSel(i)} aria-expanded={on} className={`w-full rounded-md border p-3 text-left transition-colors ${on ? 'border-gold bg-gold/5' : 'border-line bg-panel hover:border-gold/50'}`}>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-dim">
                    L{e.lines[0]}
                    {e.lines[1] !== e.lines[0] ? `–${e.lines[1]}` : ''}
                  </span>
                  <span className="font-medium">
                    <Inline text={e.what} />
                  </span>
                </div>
                {on && (
                  <dl className="mt-3 space-y-2 text-[0.92rem]">
                    <div>
                      <dt className="text-xs text-dim">Why is it required?</dt>
                      <dd>
                        <Inline text={e.why} />
                      </dd>
                    </div>
                    {e.register && (
                      <div>
                        <dt className="text-xs text-dim">Register / peripheral</dt>
                        <dd className="font-mono text-[0.85rem] text-ch2">
                          <Inline text={e.register} />
                        </dd>
                      </div>
                    )}
                    {e.internal && (
                      <div>
                        <dt className="text-xs text-dim">What happens inside the chip</dt>
                        <dd>
                          <Inline text={e.internal} />
                        </dd>
                      </div>
                    )}
                    {e.ifRemoved && (
                      <div>
                        <dt className="text-xs text-dim">If this line is removed</dt>
                        <dd className="text-bad/90">
                          <Inline text={e.ifRemoved} />
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Each essential statement is hidden until you try to recall it. */
function RecallList({ items }: { items: string[] }) {
  const [shown, setShown] = useState<boolean[]>(() => items.map(() => false));
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button type="button" className="btn" onClick={() => setShown(items.map(() => true))}>
          Show all
        </button>
        <button type="button" className="btn" onClick={() => setShown(items.map(() => false))}>
          Hide all (recall drill)
        </button>
      </div>
      <ol className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 font-mono text-xs text-dim">{i + 1}</span>
            <button type="button" onClick={() => setShown((s) => s.map((v, j) => (j === i ? !v : v)))} className={`flex-1 rounded border px-2 py-1 text-left font-mono text-[0.82rem] ${shown[i] ? 'border-line bg-panel text-ink' : 'border-dashed border-line text-dim'}`}>
              {shown[i] ? <Inline text={it} /> : 'Recall this statement, then click to check'}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
