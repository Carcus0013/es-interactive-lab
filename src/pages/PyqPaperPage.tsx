import { useEffect, useState } from 'react';
import { PAPER_BY_ID } from '../content/pyq';
import { TOPIC_BY_ID } from '../content/topics';
import Markdown, { Callout } from '../components/Markdown';
import { PageHeader, PyqTag } from '../components/ui';
import { Link, useRoute } from '../utils/router';
import { pushRecent, setPyqSelf, useStore } from '../utils/store';
import NotFound from './NotFound';
import type { PyqQuestion } from '../types';

export default function PyqPaperPage({ id }: { id?: string }) {
  const p = id ? PAPER_BY_ID[id] : undefined;
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (p) pushRecent(`/pyq/paper/${p.id}`, `PYQ: ${p.title}`);
  }, [p]);
  const { anchor } = useRoute();
  useEffect(() => {
    // scroll to #question after render (hash routing puts it after the path)
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [id, anchor]);
  if (!p) return <NotFound what="paper" />;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader kicker={<Link to="/pyq" className="hover:text-gold">PYQ archive</Link>} title={p.title} lead={`${p.exam}, ${p.month ? `${p.month} ${p.year}` : p.year}. ${p.duration ? `${p.duration}, maximum` : 'Maximum'} ${p.maxMarks} marks.`}>
        <span className="font-mono text-xs text-dim">{p.file}</span>
        <button type="button" className="btn ml-auto" onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Hide all solutions' : 'Show all solutions'}
        </button>
        <Link to={`/pyq/practice?paper=${p.id}`} className="btn-gold">
          Sit this paper (timed)
        </Link>
      </PageHeader>
      {p.notes && (
        <Callout kind="note" title="About this paper">
          <Markdown src={p.notes} bare />
        </Callout>
      )}
      <ol className="space-y-6">
        {p.questions.map((q) => (
          <QuestionCard key={q.id + String(showAll)} q={q} defaultOpen={showAll} />
        ))}
      </ol>
    </div>
  );
}

export function QuestionCard({ q, defaultOpen }: { q: PyqQuestion; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const self = useStore((s) => s.pyqSelf[q.id]);
  return (
    <li id={q.id} className="scroll-mt-24 rounded-md border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5 text-sm">
        <span className="font-mono font-semibold text-gold">Q{q.number}</span>
        <span className="chip">{q.marks} marks</span>
        {q.co && <span className="chip">{q.co}</span>}
        {q.btl && <span className="chip">{q.btl}</span>}
        <span className="chip">Unit {q.unit}</span>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {q.topics
            .filter((t) => TOPIC_BY_ID[t])
            .map((t) => (
              <Link key={t} to={`/topic/${t}`} className="chip hover:border-gold/50 hover:text-ink">
                {TOPIC_BY_ID[t].title}
              </Link>
            ))}
        </span>
      </div>
      <div className="p-4">
        <PyqTag>Actual question, as printed</PyqTag>
        <div className="mt-3">
          <Markdown src={q.text} />
        </div>
        {q.sourceNote && (
          <Callout kind="warning" title="Note on the printed question">
            <Markdown src={q.sourceNote} bare />
          </Callout>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={open ? 'btn' : 'btn-gold'} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Hide solution' : 'Attempt it, then show the solution'}
          </button>
          <div className="flex items-center gap-1.5 text-sm" role="group" aria-label="Self-assessment">
            <span className="text-dim">I</span>
            {(
              [
                ['got', 'got it', 'border-ok text-ok'],
                ['partial', 'partly got it', 'border-warn text-warn'],
                ['missed', 'missed it', 'border-bad text-bad'],
              ] as const
            ).map(([k, l, c]) => (
              <button key={k} type="button" aria-pressed={self === k} onClick={() => setPyqSelf(q.id, self === k ? null : k)} className={`rounded border px-2 py-0.5 ${self === k ? c + ' bg-raised' : 'border-line text-dim hover:text-ink'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {open && (
          <div className="mt-4 rounded-md border border-ok/30 bg-mask/50 p-4">
            <div className="mb-2 text-sm font-semibold text-ok">Solution</div>
            <Markdown src={q.solution} />
          </div>
        )}
      </div>
    </li>
  );
}
