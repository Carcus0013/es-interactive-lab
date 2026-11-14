import { TOPICS } from '../content/topics';
import { PRACTICALS } from '../content/practicals';
import { ALL_PYQ } from '../content/pyq';
import { REGISTERS } from '../content/registers';
import { SIMS } from '../simulations/registry';
import { DIAGRAMS } from '../animations/diagrams';

export type SearchKind = 'Topic' | 'Practical' | 'Simulation' | 'PYQ' | 'Register' | 'Diagram' | 'Page' | 'Formula';

export interface SearchDoc {
  kind: SearchKind;
  title: string;
  route: string;
  snippet: string;
  keys: string; // high-weight text
  body: string; // low-weight text
}

const strip = (s: string) =>
  s
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/[#>*|«»`$]/g, ' ')
    .replace(/::\w+\{[^}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const PAGES: SearchDoc[] = [
  ['Dashboard', '/'],
  ['Syllabus', '/syllabus'],
  ['Practical lab', '/lab'],
  ['Simulations', '/sims'],
  ['PYQ archive & solutions', '/pyq'],
  ['PYQ exam simulation', '/pyq/practice'],
  ['Question bank', '/bank'],
  ['Mock exam', '/mock'],
  ['Quick revision', '/revision'],
  ['Formula book', '/revision/formulas'],
  ['Register reference', '/revision/registers'],
  ['Important diagrams', '/revision/diagrams'],
  ['Important programs', '/revision/programs'],
  ['Last-minute revision', '/revision/last-minute'],
  ['Important questions', '/revision/important'],
  ['Progress & bookmarks', '/progress'],
  ['Sources & coverage', '/coverage'],
].map(([title, route]) => ({ kind: 'Page' as const, title, route, snippet: '', keys: title.toLowerCase(), body: '' }));

let cache: SearchDoc[] | null = null;

export function searchIndex(): SearchDoc[] {
  if (cache) return cache;
  const docs: SearchDoc[] = [...PAGES];
  for (const t of TOPICS) {
    docs.push({
      kind: 'Topic',
      title: t.title,
      route: `/topic/${t.id}`,
      snippet: t.short,
      keys: `${t.title} ${t.keywords.join(' ')} unit ${t.unit}`.toLowerCase(),
      body: strip(
        [t.short, ...Object.values(t.fundamentals), t.detailed, t.exam.definitions.map((d) => d.term + ' ' + d.def).join(' '), t.revision.notes.join(' ')].join(' '),
      ),
    });
    for (const f of t.exam.formulas ?? [])
      docs.push({ kind: 'Formula', title: f.name, route: `/topic/${t.id}?tab=exam`, snippet: f.expr, keys: f.name.toLowerCase(), body: strip(`${f.expr} ${f.vars ?? ''}`) });
  }
  for (const p of PRACTICALS)
    docs.push({
      kind: 'Practical',
      title: `${p.id.slice(0, 3).toUpperCase()} ${p.title}`,
      route: `/lab/${p.id}`,
      snippet: p.objective,
      keys: `${p.title} ${p.programs.map((g) => g.file).join(' ')}`.toLowerCase(),
      body: strip(`${p.objective} ${p.components.join(' ')} ${p.programs.map((g) => g.code).join(' ')}`),
    });
  for (const s of SIMS) docs.push({ kind: 'Simulation', title: s.title, route: `/sims/${s.id}`, snippet: s.summary, keys: s.title.toLowerCase(), body: strip(s.summary) });
  for (const d of DIAGRAMS) docs.push({ kind: 'Diagram', title: d.title, route: `/revision/diagrams#${d.id}`, snippet: d.caption, keys: d.title.toLowerCase(), body: strip(d.caption) });
  for (const r of REGISTERS)
    docs.push({
      kind: 'Register',
      title: r.name,
      route: `/revision/registers?r=${encodeURIComponent(r.name)}`,
      snippet: r.purpose,
      keys: `${r.name} ${r.periph}`.toLowerCase(),
      body: strip(`${r.purpose} ${r.bits.map((b) => b.name + ' ' + b.meaning).join(' ')} ${r.address}`),
    });
  for (const q of ALL_PYQ)
    docs.push({
      kind: 'PYQ',
      title: `${q.paper.title} — Q${q.number}`,
      route: `/pyq/paper/${q.paper.id}#${q.id}`,
      snippet: strip(q.text).slice(0, 140),
      keys: q.topics.join(' '),
      body: strip(q.text),
    });
  cache = docs;
  return docs;
}

export function search(query: string, limit = 30): SearchDoc[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  const scored: { d: SearchDoc; s: number }[] = [];
  for (const d of searchIndex()) {
    let s = 0;
    const title = d.title.toLowerCase();
    let all = true;
    for (const t of terms) {
      let hit = 0;
      if (title.includes(t)) hit += title.startsWith(t) ? 12 : 8;
      if (d.keys.includes(t)) hit += 4;
      if (d.body.includes(t)) hit += 1 + Math.min(3, d.body.split(t).length - 2);
      if (!hit) all = false;
      s += hit;
    }
    if (s > 0 && all) scored.push({ d, s: s + (d.kind === 'Topic' ? 2 : 0) + (d.kind === 'Page' ? 1 : 0) });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.d);
}
