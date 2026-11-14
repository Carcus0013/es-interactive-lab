import type { Topic, UnitId } from '../../types';

// Every topic file default-exports one Topic. Vite collects them at build time.
const modules = import.meta.glob<{ default: Topic }>('./unit*/*.ts', { eager: true });

export const TOPICS: Topic[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.unit - b.unit || a.order - b.order);

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export const topicsOfUnit = (u: UnitId) => TOPICS.filter((t) => t.unit === u);

export function neighbours(id: string) {
  const i = TOPICS.findIndex((t) => t.id === id);
  return { prev: i > 0 ? TOPICS[i - 1] : undefined, next: i >= 0 && i < TOPICS.length - 1 ? TOPICS[i + 1] : undefined };
}
