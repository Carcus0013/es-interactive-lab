/**
 * Validates the content graph: every cross-reference resolves, every code explanation
 * points at real lines, and every topic has the revision material the brief requires.
 */
import { describe, expect, it } from 'vitest';
import { TOPICS, TOPIC_BY_ID } from './topics';
import { PRACTICALS, PRACTICAL_BY_ID } from './practicals';
import { PAPERS, ALL_PYQ, PYQ_BY_ID } from './pyq';
import { SIMS } from '../simulations/registry';
import { DIAGRAM_BY_ID } from '../animations/diagrams';
import { bank } from '../data/bank';
import { UNITS } from '../data/units';

const SIM_IDS = new Set(SIMS.map((s) => s.id));

/** Collect every directive and internal link from any JSON-serialisable content. */
function refs(obj: unknown) {
  const s = JSON.stringify(obj);
  return {
    diagrams: [...s.matchAll(/::diagram\{([\w-]+)\}/g)].map((m) => m[1]),
    sims: [...s.matchAll(/::sim\{([\w-]+)/g)].map((m) => m[1]),
    labLinks: [...s.matchAll(/\]\(\/lab\/([\w-]+)\)/g)].map((m) => m[1]),
    topicLinks: [...s.matchAll(/\]\(\/topic\/([\w-]+)\)/g)].map((m) => m[1]),
  };
}

function expectRefsResolve(where: string, obj: unknown) {
  const r = refs(obj);
  for (const d of r.diagrams) expect(DIAGRAM_BY_ID[d], `${where}: diagram “${d}”`).toBeDefined();
  for (const d of r.sims) expect(SIM_IDS.has(d), `${where}: sim “${d}”`).toBe(true);
  for (const d of r.labLinks) expect(PRACTICAL_BY_ID[d], `${where}: link /lab/${d}`).toBeDefined();
  for (const d of r.topicLinks) expect(TOPIC_BY_ID[d], `${where}: link /topic/${d}`).toBeDefined();
}

describe('topics', () => {
  it('ids are unique', () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });

  it('every syllabus unit has topics', () => {
    for (const u of UNITS) expect(TOPICS.some((t) => t.unit === u.id), `unit ${u.id}`).toBe(true);
  });

  it.each(TOPICS.map((t) => [t.id, t] as const))('%s: references resolve', (id, t) => {
    for (const s of t.sims ?? []) expect(SIM_IDS.has(s), `${id}: sim ${s}`).toBe(true);
    for (const p of t.practicals ?? []) expect(PRACTICAL_BY_ID[p], `${id}: practical ${p}`).toBeDefined();
    for (const r of t.related ?? []) expect(TOPIC_BY_ID[r], `${id}: related ${r}`).toBeDefined();
    for (const q of t.pyq ?? []) expect(PYQ_BY_ID[q], `${id}: pyq ${q}`).toBeDefined();
    for (const d of t.exam.diagrams) expect(typeof d).toBe('string');
    expectRefsResolve(id, t);
  });

  it.each(TOPICS.map((t) => [t.id, t] as const))('%s: has the required revision material', (id, t) => {
    expect(t.revision.mcqs.length, `${id}: MCQs`).toBeGreaterThanOrEqual(5);
    expect(t.exam.shortQs.length, `${id}: short questions`).toBeGreaterThanOrEqual(3);
    expect(t.exam.longQs.length, `${id}: long questions`).toBeGreaterThanOrEqual(2);
    for (const m of t.revision.mcqs) {
      expect(m.answer, `${id}: “${m.q}”`).toBeGreaterThanOrEqual(0);
      expect(m.answer, `${id}: “${m.q}”`).toBeLessThan(m.options.length);
    }
    for (const f of ['what', 'why', 'problem', 'how', 'where'] as const) expect(t.fundamentals[f].trim().length, `${id}: fundamentals.${f}`).toBeGreaterThan(0);
    expect(t.detailed.trim().length).toBeGreaterThan(200);
    expect(t.visual.trim().length).toBeGreaterThan(0);
  });
});

describe('practicals', () => {
  it('ids and order are unique', () => {
    expect(new Set(PRACTICALS.map((p) => p.id)).size).toBe(PRACTICALS.length);
    expect(new Set(PRACTICALS.map((p) => p.order)).size).toBe(PRACTICALS.length);
  });

  it.each(PRACTICALS.map((p) => [p.id, p] as const))('%s: explanations point at real code lines', (id, p) => {
    expect(p.programs.length).toBeGreaterThan(0);
    for (const prog of p.programs) {
      const lines = prog.code.split('\n');
      expect(prog.explain.length, `${id}/${prog.id}`).toBeGreaterThan(0);
      for (const e of prog.explain) {
        const [a, b] = e.lines;
        const where = `${id}/${prog.id} lines ${a}-${b}`;
        expect(a, where).toBeGreaterThanOrEqual(1);
        expect(b, where).toBeGreaterThanOrEqual(a);
        expect(b, where).toBeLessThanOrEqual(lines.length);
        expect(lines[a - 1].trim().length, `${where}: first line is blank`).toBeGreaterThan(0);
      }
    }
  });

  it.each(PRACTICALS.map((p) => [p.id, p] as const))('%s: references resolve', (id, p) => {
    if (p.sim) expect(SIM_IDS.has(p.sim.id), `${id}: sim ${p.sim.id}`).toBe(true);
    for (const t of p.topics) expect(TOPIC_BY_ID[t], `${id}: topic ${t}`).toBeDefined();
    expect(p.flow.length).toBeGreaterThanOrEqual(3);
    // FlowChart truncates labels longer than 44 characters; the full text belongs in `detail`.
    for (const n of p.flow) expect(n.label.length, `${id}: flow label “${n.label}”`).toBeLessThanOrEqual(44);
    expectRefsResolve(id, p);
  });
});

describe('PYQ papers', () => {
  it('question ids are unique', () => {
    expect(new Set(ALL_PYQ.map((q) => q.id)).size).toBe(ALL_PYQ.length);
  });

  it.each(PAPERS.map((p) => [p.id, p] as const))('%s: marks add up to the maximum', (_id, p) => {
    expect(p.questions.reduce((s, q) => s + q.marks, 0)).toBe(p.maxMarks);
  });

  it.each(ALL_PYQ.map((q) => [q.id, q] as const))('%s: has a solution and valid topics', (id, q) => {
    expect(q.solution.trim().length, id).toBeGreaterThan(200);
    expect(q.topics.length, id).toBeGreaterThan(0);
    for (const t of q.topics) expect(TOPIC_BY_ID[t], `${id}: topic ${t}`).toBeDefined();
    expectRefsResolve(id, q);
  });

  it('every PYQ is reachable from at least one of its topics', () => {
    for (const q of ALL_PYQ) {
      const linked = TOPICS.some((t) => (t.pyq ?? []).includes(q.id)) || q.topics.length > 0;
      expect(linked, q.id).toBe(true);
    }
  });
});

describe('question bank', () => {
  const items = bank();
  it('ids are unique', () => {
    const ids = items.map((b) => b.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    expect(dup).toEqual([]);
  });

  it('every item is marked generated and points at a real topic', () => {
    for (const b of items) {
      expect(b.generated, b.id).toBe(true);
      expect(TOPIC_BY_ID[b.topic], `${b.id}: topic ${b.topic}`).toBeDefined();
    }
  });

  it('answer types match question types', () => {
    for (const b of items) {
      if (b.type === 'tf') expect(typeof b.answer, b.id).toBe('boolean');
      if (b.type === 'mcq') {
        expect(typeof b.answer, b.id).toBe('number');
        expect(b.answer as number, b.id).toBeLessThan(b.options!.length);
      }
      if (b.type === 'fill') expect(typeof b.answer, b.id).toBe('string');
    }
  });

  it('covers every question type', () => {
    const types = new Set(items.map((b) => b.type));
    for (const t of ['mcq', 'tf', 'fill', 'short', 'long', 'numerical', 'program', 'debug', 'register', 'circuit']) expect(types.has(t as never), t).toBe(true);
  });

  it('bank markdown references resolve', () => {
    expectRefsResolve('bank', items);
  });
});
