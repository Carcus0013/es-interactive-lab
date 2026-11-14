import { useSyncExternalStore } from 'react';

// Versioned, defensive localStorage store for all learner state.
export type TopicStatus = 'new' | 'learning' | 'done' | 'revise';

export interface TopicState {
  status: TopicStatus;
  visits: number;
  lastVisit: number;
  quizBest?: number; // best MCQ score out of 5
  revisedAt?: number;
}

export interface Recent {
  route: string;
  title: string;
  ts: number;
}

export interface AttemptRecord {
  id: string;
  kind: 'pyq' | 'mock' | 'quiz';
  title: string;
  ts: number;
  score: number;
  max: number;
  weakTopics: string[];
}

export interface StoreState {
  version: 1;
  topics: Record<string, TopicState>;
  practicals: Record<string, { done: boolean; lastVisit: number }>;
  pyqSelf: Record<string, 'got' | 'partial' | 'missed'>; // self-assessment per PYQ question
  bookmarks: string[]; // routes
  recent: Recent[];
  attempts: AttemptRecord[];
  notes: Record<string, string>; // personal notes per topic
}

const KEY = 'esl-state-v1';
const empty = (): StoreState => ({ version: 1, topics: {}, practicals: {}, pyqSelf: {}, bookmarks: [], recent: [], attempts: [], notes: {} });

function load(): StoreState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return empty();
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

let state: StoreState = typeof window === 'undefined' ? empty() : load();
const listeners = new Set<() => void>();
let storageOk = true;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch {
    storageOk = false; // private mode / quota: keep working in memory
  }
}

export function isStorageAvailable() {
  return storageOk;
}

export function getState() {
  return state;
}

export function setState(updater: (s: StoreState) => StoreState) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

if (typeof window !== 'undefined') {
  // keep multiple tabs in sync
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

/* ---------------- actions ---------------- */

export function visitTopic(id: string) {
  setState((s) => {
    const prev = s.topics[id];
    const next: TopicState = prev
      ? { ...prev, visits: prev.visits + 1, lastVisit: Date.now(), status: prev.status === 'new' ? 'learning' : prev.status }
      : { status: 'learning', visits: 1, lastVisit: Date.now() };
    return { ...s, topics: { ...s.topics, [id]: next } };
  });
}

export function setTopicStatus(id: string, status: TopicStatus) {
  setState((s) => {
    const prev = s.topics[id] ?? { status: 'new', visits: 0, lastVisit: Date.now() };
    return { ...s, topics: { ...s.topics, [id]: { ...prev, status, revisedAt: status === 'done' ? Date.now() : prev.revisedAt } } };
  });
}

export function recordQuiz(id: string, score: number) {
  setState((s) => {
    const prev = s.topics[id] ?? { status: 'learning' as TopicStatus, visits: 0, lastVisit: Date.now() };
    return { ...s, topics: { ...s.topics, [id]: { ...prev, quizBest: Math.max(prev.quizBest ?? 0, score) } } };
  });
}

export function visitPractical(id: string) {
  setState((s) => ({ ...s, practicals: { ...s.practicals, [id]: { done: s.practicals[id]?.done ?? false, lastVisit: Date.now() } } }));
}

export function setPracticalDone(id: string, done: boolean) {
  setState((s) => ({ ...s, practicals: { ...s.practicals, [id]: { done, lastVisit: Date.now() } } }));
}

export function toggleBookmark(route: string) {
  setState((s) => ({
    ...s,
    bookmarks: s.bookmarks.includes(route) ? s.bookmarks.filter((b) => b !== route) : [route, ...s.bookmarks],
  }));
}

export function pushRecent(route: string, title: string) {
  setState((s) => {
    if (s.recent[0]?.route === route) return s;
    const rest = s.recent.filter((r) => r.route !== route);
    return { ...s, recent: [{ route, title, ts: Date.now() }, ...rest].slice(0, 12) };
  });
}

export function setPyqSelf(id: string, v: 'got' | 'partial' | 'missed' | null) {
  setState((s) => {
    const next = { ...s.pyqSelf };
    if (v === null) delete next[id];
    else next[id] = v;
    return { ...s, pyqSelf: next };
  });
}

export function addAttempt(a: AttemptRecord) {
  setState((s) => ({ ...s, attempts: [a, ...s.attempts].slice(0, 50) }));
}

export function setNote(id: string, text: string) {
  setState((s) => ({ ...s, notes: { ...s.notes, [id]: text } }));
}

export function resetAll() {
  setState(() => empty());
}

export function exportState(): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || parsed.version !== 1) return false;
    setState(() => ({ ...empty(), ...parsed }));
    return true;
  } catch {
    return false;
  }
}
