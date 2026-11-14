import type { PyqPaper, PyqQuestion } from '../../types';

const modules = import.meta.glob<{ default: PyqPaper }>('./paper-*.ts', { eager: true });

export const PAPERS: PyqPaper[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

export const PAPER_BY_ID: Record<string, PyqPaper> = Object.fromEntries(PAPERS.map((p) => [p.id, p]));

export interface PyqRef extends PyqQuestion {
  paper: PyqPaper;
}

export const ALL_PYQ: PyqRef[] = PAPERS.flatMap((p) => p.questions.map((q) => ({ ...q, paper: p })));

export const PYQ_BY_ID: Record<string, PyqRef> = Object.fromEntries(ALL_PYQ.map((q) => [q.id, q]));

export const pyqForTopic = (topicId: string) => ALL_PYQ.filter((q) => q.topics.includes(topicId));
