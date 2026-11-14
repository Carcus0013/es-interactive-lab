import { useState } from 'react';
import type { MCQ } from '../types';
import Markdown, { Inline } from '../components/Markdown';
import { IconCheck, IconClose } from '../components/Icons';

/** Answer all, submit, see score and per-question explanations. */
export default function McqQuiz({ items, onScore, title = 'Multiple-choice check' }: { items: MCQ[]; onScore?: (score: number) => void; title?: string }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = picked.reduce<number>((s, p, i) => s + (p === items[i].answer ? 1 : 0), 0);
  const answered = picked.filter((p) => p !== null).length;

  const submit = () => {
    setSubmitted(true);
    onScore?.(score);
  };
  const reset = () => {
    setPicked(items.map(() => null));
    setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="chip border-ch3/40 text-ch3">Generated practice questions</span>
        {submitted && (
          <span className={`ml-auto font-mono text-sm ${score === items.length ? 'text-ok' : score >= items.length / 2 ? 'text-warn' : 'text-bad'}`}>
            Score {score}/{items.length}
          </span>
        )}
      </div>
      <ol className="space-y-4">
        {items.map((m, qi) => (
          <li key={qi} className="rounded-md border border-line bg-panel p-4">
            <p className="font-medium">
              <span className="mr-2 font-mono text-sm text-dim">{qi + 1}.</span>
              <Inline text={m.q} />
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {m.options.map((o, oi) => {
                const chosen = picked[qi] === oi;
                const correct = submitted && oi === m.answer;
                const wrong = submitted && chosen && oi !== m.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={chosen}
                    disabled={submitted}
                    onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    className={`flex items-start gap-2 rounded border px-3 py-2 text-left text-sm transition-colors ${
                      correct ? 'border-ok bg-ok/10' : wrong ? 'border-bad bg-bad/10' : chosen ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/50'
                    }`}
                  >
                    <span className="mt-px font-mono text-xs text-dim">{String.fromCharCode(65 + oi)}</span>
                    <span className="flex-1">
                      <Inline text={o} />
                    </span>
                    {correct && <IconCheck size={16} className="text-ok" />}
                    {wrong && <IconClose size={16} className="text-bad" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className={`mt-3 rounded border-l-2 px-3 py-2 text-sm ${picked[qi] === m.answer ? 'border-ok bg-ok/5' : 'border-bad bg-bad/5'}`}>
                <span className="font-semibold">{picked[qi] === m.answer ? 'Correct. ' : picked[qi] === null ? 'Not answered. ' : 'Not quite. '}</span>
                <Markdown src={m.explain} bare />
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3">
        {!submitted ? (
          <button type="button" className="btn-gold" onClick={submit} disabled={answered === 0}>
            Check answers ({answered}/{items.length} answered)
          </button>
        ) : (
          <button type="button" className="btn" onClick={reset}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
