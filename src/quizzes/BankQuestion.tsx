import type { BankItem } from '../types';
import Markdown, { Inline } from '../components/Markdown';
import { TYPE_LABEL, gradeObjective, isAutoGraded } from '../data/bank';
import { TOPIC_BY_ID } from '../content/topics';
import { Link } from '../utils/router';

export type Response = string | number | boolean | undefined;
export type SelfMark = number | undefined; // marks the learner awards themselves for subjective items

/**
 * One question in answer mode or review mode.
 * Objective items (MCQ, T/F, fill, numerical with a value) are auto-graded; others are self-marked against the model answer.
 */
export default function BankQuestion({
  item,
  index,
  response,
  onResponse,
  reviewed,
  selfMark,
  onSelfMark,
}: {
  item: BankItem;
  index?: number;
  response: Response;
  onResponse: (r: Response) => void;
  reviewed: boolean;
  selfMark?: SelfMark;
  onSelfMark?: (m: number) => void;
}) {
  const auto = isAutoGraded(item);
  const verdict = reviewed && auto ? gradeObjective(item, response) : null;
  const topic = TOPIC_BY_ID[item.topic];

  return (
    <div className={`rounded-md border bg-panel p-4 ${reviewed && auto ? (verdict ? 'border-ok/60' : 'border-bad/60') : 'border-line'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        {index != null && <span className="font-mono text-sm text-dim">{index}.</span>}
        <span className="chip">{TYPE_LABEL[item.type]}</span>
        <span className="chip">{item.marks} mark{item.marks > 1 ? 's' : ''}</span>
        <span className="chip capitalize">{item.difficulty}</span>
        <span className="chip border-ch3/40 text-ch3">Generated practice question</span>
        {topic && (
          <Link to={`/topic/${topic.id}`} className="ml-auto text-dim hover:text-gold">
            {topic.title}
          </Link>
        )}
      </div>
      <Markdown src={item.q} className="[&>p]:font-medium" />

      <div className="mt-3">
        {item.type === 'mcq' && (
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {item.options!.map((o, i) => {
              const chosen = response === i;
              const correct = reviewed && i === item.answer;
              const wrong = reviewed && chosen && i !== item.answer;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  disabled={reviewed}
                  onClick={() => onResponse(i)}
                  className={`rounded border px-3 py-2 text-left text-sm ${correct ? 'border-ok bg-ok/10' : wrong ? 'border-bad bg-bad/10' : chosen ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/50'}`}
                >
                  <span className="mr-2 font-mono text-xs text-dim">{String.fromCharCode(65 + i)}</span>
                  <Inline text={o} />
                </button>
              );
            })}
          </div>
        )}
        {item.type === 'tf' && (
          <div className="flex gap-2" role="radiogroup">
            {[true, false].map((v) => {
              const chosen = response === v;
              const correct = reviewed && v === item.answer;
              const wrong = reviewed && chosen && v !== item.answer;
              return (
                <button key={String(v)} type="button" role="radio" aria-checked={chosen} disabled={reviewed} onClick={() => onResponse(v)} className={`rounded border px-4 py-1.5 text-sm ${correct ? 'border-ok bg-ok/10' : wrong ? 'border-bad bg-bad/10' : chosen ? 'border-gold bg-gold/10' : 'border-line'}`}>
                  {v ? 'True' : 'False'}
                </button>
              );
            })}
          </div>
        )}
        {(item.type === 'fill' || (item.type === 'numerical' && typeof item.answer === 'number')) && (
          <input className="input w-full max-w-xs font-mono" value={(response as string) ?? ''} disabled={reviewed} onChange={(e) => onResponse(e.target.value)} placeholder={item.type === 'numerical' ? 'Number (hex like 0x1F is fine)' : 'Your answer'} aria-label="Your answer" />
        )}
        {!auto && (
          <textarea className="input min-h-[6rem] w-full font-mono text-[0.85rem]" value={(response as string) ?? ''} disabled={reviewed} onChange={(e) => onResponse(e.target.value)} placeholder="Write your answer…" aria-label="Your answer" />
        )}
      </div>

      {reviewed && (
        <div className="mt-4 space-y-3">
          {auto ? (
            <p className={`text-sm font-semibold ${verdict ? 'text-ok' : 'text-bad'}`}>
              {verdict ? `Correct (+${item.marks})` : response === undefined || response === '' ? 'Not answered (0)' : 'Incorrect (0)'}
              {item.type === 'fill' && !verdict && (
                <span className="ml-2 font-normal text-dim">
                  Expected: <code>{String(item.answer)}</code>
                </span>
              )}
              {item.type === 'numerical' && !verdict && (
                <span className="ml-2 font-normal text-dim">
                  Expected: <code>{String(item.answer)}</code>
                </span>
              )}
            </p>
          ) : (
            onSelfMark && (
              <label className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-dim">Compare with the model answer and award yourself:</span>
                <input type="range" min={0} max={item.marks} step={0.5} value={selfMark ?? 0} onChange={(e) => onSelfMark(Number(e.target.value))} aria-label="Self-awarded marks" />
                <span className="font-mono">
                  {selfMark ?? '—'}/{item.marks}
                </span>
              </label>
            )
          )}
          <div className="rounded border border-line bg-mask/50 p-3 text-[0.95rem]">
            <div className="mb-1 text-xs text-dim">{auto ? 'Explanation' : 'Model answer'}</div>
            <Markdown src={item.explain} />
          </div>
        </div>
      )}
    </div>
  );
}
