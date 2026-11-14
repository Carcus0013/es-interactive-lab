import { useState } from 'react';
import type { QA } from '../types';
import Markdown from '../components/Markdown';

type Mark = 'got' | 'partial' | 'missed';

/** Write your answer, reveal the model answer, then mark yourself honestly. */
export default function SelfCheck({ items, kind }: { items: QA[]; kind: 'short' | 'long' }) {
  const [drafts, setDrafts] = useState<string[]>(() => items.map(() => ''));
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false));
  const [marks, setMarks] = useState<(Mark | null)[]>(() => items.map(() => null));
  const got = marks.filter((m) => m === 'got').length;
  const partial = marks.filter((m) => m === 'partial').length;

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-line bg-panel p-4">
          <div className="flex gap-2">
            <span className="font-mono text-sm text-dim">{i + 1}.</span>
            <div className="min-w-0 flex-1">
              <Markdown src={it.q} className="[&>p]:font-medium" />
            </div>
            {it.marks != null && <span className="chip h-fit">{it.marks} marks</span>}
          </div>
          <textarea
            className="input mt-3 w-full font-sans"
            rows={kind === 'long' ? 6 : 3}
            placeholder="Write your answer here first (kept only on this screen)…"
            value={drafts[i]}
            onChange={(e) => setDrafts((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
            aria-label={`Your answer to question ${i + 1}`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" className="btn" onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))} aria-expanded={open[i]}>
              {open[i] ? 'Hide model answer' : 'Show model answer'}
            </button>
            {open[i] && (
              <div className="flex flex-wrap items-center gap-1.5 text-sm" role="group" aria-label="Mark yourself">
                <span className="text-dim">How did you do?</span>
                {(
                  [
                    ['got', 'Got it', 'border-ok text-ok'],
                    ['partial', 'Partly', 'border-warn text-warn'],
                    ['missed', 'Missed it', 'border-bad text-bad'],
                  ] as [Mark, string, string][]
                ).map(([k, l, c]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={marks[i] === k}
                    className={`rounded border px-2 py-0.5 ${marks[i] === k ? c + ' bg-raised' : 'border-line text-dim hover:text-ink'}`}
                    onClick={() => setMarks((m) => m.map((v, j) => (j === i ? k : v)))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          {open[i] && (
            <div className="mt-3 rounded-md border border-line bg-mask/60 p-4">
              <Markdown src={it.a} />
            </div>
          )}
        </div>
      ))}
      {marks.some(Boolean) && (
        <p className="text-sm text-dim">
          Self-assessment: {got} got it, {partial} partly, {marks.filter((m) => m === 'missed').length} missed (of {items.length}).
        </p>
      )}
    </div>
  );
}
