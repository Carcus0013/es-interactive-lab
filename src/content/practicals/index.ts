import type { Practical } from '../../types';

const modules = import.meta.glob<{ default: Practical }>('./p*.ts', { eager: true });

export const PRACTICALS: Practical[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

export const PRACTICAL_BY_ID: Record<string, Practical> = Object.fromEntries(PRACTICALS.map((p) => [p.id, p]));
