import { useState } from 'react';
import type { Numerical } from '../types';
import { Inline } from '../components/Markdown';
import { numericMatches } from '../utils/grading';

/** Worked numerical: given → find → formula → steps revealed one at a time → answer. */
export default function NumericalCard({ n, index }: { n: Numerical; index?: number }) {
  const [shown, setShown] = useState(0); // number of steps revealed
  const [guess, setGuess] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const total = n.steps.length;
  const done = shown > total;

  const check = () => {
    if (n.value == null) return;
    setChecked(numericMatches(guess, n.value, n.tolerance) === true);
  };

  return (
    <div className="rounded-md border border-ch1/30 bg-panel p-4">
      <p className="font-medium">
        {index != null && <span className="mr-2 font-mono text-sm text-dim">N{index}.</span>}
        <Inline text={n.q} />
      </p>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <div className="mb-1 text-dim">1. Given</div>
          <ul className="space-y-0.5">
            {n.given.map((g, i) => (
              <li key={i} className="font-mono text-[0.85rem]">
                <Inline text={g} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-dim">2. Required</div>
          <p>
            <Inline text={n.find} />
          </p>
          <div className="mb-1 mt-3 text-dim">3. Formula</div>
          <p className="rounded bg-ch1/10 px-2 py-1 font-mono text-[0.85rem]">
            <Inline text={n.formula} />
          </p>
        </div>
      </div>

      {n.value != null && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <label className="text-dim" htmlFor={`num-${n.q.length}-${index}`}>
            Your answer{n.unit ? ` (${n.unit})` : ''}:
          </label>
          <input
            id={`num-${n.q.length}-${index}`}
            className="input w-40 font-mono"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setChecked(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            placeholder="e.g. 0x1F or 2.5"
          />
          <button type="button" className="btn" onClick={check}>
            Check
          </button>
          {checked === true && <span className="text-ok">Correct.</span>}
          {checked === false && <span className="text-bad">Not yet — compare with the steps.</span>}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1 text-sm text-dim">4–5. Substitute and calculate</div>
        <ol className="space-y-1.5">
          {n.steps.slice(0, shown).map((s, i) => (
            <li key={i} className="flex gap-2 font-mono text-[0.85rem]">
              <span className="text-dim">{i + 1}.</span>
              <span>
                <Inline text={s} />
              </span>
            </li>
          ))}
        </ol>
        {done && (
          <div className="mt-3 rounded border border-ok/50 bg-ok/10 px-3 py-2">
            <span className="text-sm text-dim">6. Answer: </span>
            <span className="font-mono font-semibold text-ok">
              <Inline text={n.answer} />
            </span>
            {n.concept && (
              <p className="mt-1 text-sm text-dim">
                7. Concept: <Inline text={n.concept} />
              </p>
            )}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          {!done ? (
            <>
              <button type="button" className="btn" onClick={() => setShown((s) => s + 1)}>
                {shown === 0 ? 'Show first step' : shown < total ? 'Next step' : 'Show answer'}
              </button>
              <button type="button" className="btn" onClick={() => setShown(total + 1)}>
                Show full solution
              </button>
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setShown(0)}>
              Hide solution
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
