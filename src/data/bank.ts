import type { BankItem, Difficulty } from '../types';
import { TOPICS } from '../content/topics';
import { numericMatches } from '../utils/grading';

// Extra question files (fill-in, true/false, debugging, register, circuit, programming) live in src/content/bank/.
const extraModules = import.meta.glob<{ default: BankItem[] }>('../content/bank/*.ts', { eager: true });
const EXTRA: BankItem[] = Object.values(extraModules).flatMap((m) => m.default);

function fromTopics(): BankItem[] {
  const out: BankItem[] = [];
  for (const t of TOPICS) {
    t.revision.mcqs.forEach((m, i) =>
      out.push({
        id: `${t.id}-mcq-${i}`,
        type: 'mcq',
        unit: t.unit,
        topic: t.id,
        difficulty: (i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard') as Difficulty,
        marks: 1,
        q: m.q,
        options: m.options,
        answer: m.answer,
        explain: m.explain,
        generated: true,
      }),
    );
    t.exam.shortQs.forEach((s, i) =>
      out.push({ id: `${t.id}-short-${i}`, type: 'short', unit: t.unit, topic: t.id, difficulty: 'medium', marks: s.marks ?? 2, q: s.q, answer: s.a, explain: s.a, generated: true }),
    );
    t.exam.longQs.forEach((s, i) =>
      out.push({ id: `${t.id}-long-${i}`, type: 'long', unit: t.unit, topic: t.id, difficulty: 'hard', marks: s.marks ?? 6, q: s.q, answer: s.a, explain: s.a, generated: true }),
    );
    (t.exam.numericals ?? []).forEach((n, i) =>
      out.push({
        id: `${t.id}-num-${i}`,
        type: 'numerical',
        unit: t.unit,
        topic: t.id,
        difficulty: 'medium',
        marks: 3,
        q: n.q,
        answer: n.value != null ? n.value : n.answer,
        tolerance: n.tolerance,
        explain: `**Given:** ${n.given.join('; ')}\n\n**Formula:** ${n.formula}\n\n${n.steps.map((s, k) => `${k + 1}. ${s}`).join('\n')}\n\n**Answer:** ${n.answer}`,
        generated: true,
      }),
    );
  }
  return out;
}

let cache: BankItem[] | null = null;
export function bank(): BankItem[] {
  if (!cache) cache = [...fromTopics(), ...EXTRA];
  return cache;
}

export const TYPE_LABEL: Record<BankItem['type'], string> = {
  mcq: 'Multiple choice',
  tf: 'True / false',
  fill: 'Fill in the blank',
  short: 'Short answer',
  long: 'Long answer',
  numerical: 'Numerical',
  program: 'Programming',
  debug: 'Debugging',
  register: 'Register-based',
  circuit: 'Circuit-based',
};

export const isAutoGraded = (b: BankItem) => b.type === 'mcq' || b.type === 'tf' || b.type === 'fill' || (b.type === 'numerical' && typeof b.answer === 'number');

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[“”"'`«»]/g, '').trim();

export function gradeObjective(b: BankItem, response: string | number | boolean | undefined): boolean | null {
  if (response === undefined || response === '') return null;
  switch (b.type) {
    case 'mcq':
      return response === b.answer;
    case 'tf':
      return response === b.answer;
    case 'fill': {
      const r = norm(String(response));
      const ok = [String(b.answer), ...(b.accept ?? [])].map(norm);
      return ok.includes(r) || ok.includes(r.replace(/\s/g, ''));
    }
    case 'numerical': {
      if (typeof b.answer !== 'number') return null;
      return numericMatches(String(response), b.answer, b.tolerance) === true;
    }
    default:
      return null;
  }
}
