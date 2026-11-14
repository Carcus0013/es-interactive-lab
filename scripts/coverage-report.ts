/**
 * Generates CONTENT_COVERAGE.md from the platform's own content, so the report can never drift
 * from what the app shows. Run with:  npm run coverage:doc
 */
import { writeFileSync } from 'node:fs';
import { TOPICS } from '../src/content/topics';
import { PRACTICALS } from '../src/content/practicals';
import { PAPERS, ALL_PYQ } from '../src/content/pyq';
import { SIMS } from '../src/simulations/registry';
import { DIAGRAMS } from '../src/animations/diagrams';
import { bank, TYPE_LABEL } from '../src/data/bank';
import { UNITS, COURSE } from '../src/data/units';
import type { BankItem } from '../src/types';

const STATUS: Record<string, string> = {
  course: 'Course material',
  textbook: 'Prescribed textbook',
  additional: 'ADDITIONAL SYLLABUS COVERAGE',
};

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const list = (xs: string[]) => (xs.length ? xs.join(', ') : '—');
const base = (f: string) => (f.includes(' / ') ? f : f.split('/').pop()!);

const items = bank();
const bankFor = (topic: string) => items.filter((b) => b.topic === topic).length;
const pyqFor = (topic: string) => {
  const ids = new Set<string>();
  for (const q of ALL_PYQ) if (q.topics.includes(topic)) ids.add(q.id);
  for (const t of TOPICS) if (t.id === topic) (t.pyq ?? []).forEach((id) => ids.add(id));
  return [...ids].sort();
};
const simsFor = (topic: string) => {
  const t = TOPICS.find((x) => x.id === topic)!;
  return [...new Set([...(t.sims ?? []), ...SIMS.filter((s) => s.topics.includes(topic)).map((s) => s.id)])];
};
const practicalsFor = (topic: string) => {
  const t = TOPICS.find((x) => x.id === topic)!;
  return [...new Set([...(t.practicals ?? []), ...PRACTICALS.filter((p) => p.topics.includes(topic)).map((p) => p.id.slice(0, 3).toUpperCase())])]
    .map((id) => (id.startsWith('p') ? id.slice(0, 3).toUpperCase() : id))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
};

const out: string[] = [];
const w = (s = '') => out.push(s);

w('# Content coverage report');
w();
w(`${COURSE.code} ${COURSE.name}. Generated from the platform content by \`npm run coverage:doc\` — do not edit by hand.`);
w();
w('## Totals');
w();
w('| Item | Count |');
w('|---|---|');
w(`| Syllabus units | ${UNITS.length} |`);
w(`| Topic pages (each with Learn, In depth, Visualise, Exam prep and Revise & quiz tabs) | ${TOPICS.length} |`);
w(`| Topics from course material / textbook / additional coverage | ${['course', 'textbook', 'additional'].map((s) => TOPICS.filter((t) => t.status === s).length).join(' / ')} |`);
w(`| Practical experiments | ${PRACTICALS.length} |`);
w(`| Interactive simulations | ${SIMS.length} |`);
w(`| Animated / interactive diagrams | ${DIAGRAMS.length} |`);
w(`| PYQ papers / questions (all solved) | ${PAPERS.length} / ${ALL_PYQ.length} |`);
w(`| Question-bank items (all generated practice questions) | ${items.length} |`);
w();
w('Status meanings: **Course material** = taught in the supplied lectures or labs; **Prescribed textbook** = in the syllabus and taught from Valvano because no slides were supplied; **ADDITIONAL SYLLABUS COVERAGE** = in the syllabus text but with no supplied lecture, so the platform teaches it from the textbook and standard references and labels it as such.');
w();

for (const u of UNITS) {
  w(`## Unit ${u.id}: ${u.title}`);
  w();
  w(`> ${u.syllabus}`);
  w();
  w('| Topic | Status | Sources | Practicals | Simulations | PYQs | Bank items |');
  w('|---|---|---|---|---|---|---|');
  for (const t of TOPICS.filter((x) => x.unit === u.id)) {
    w(
      `| ${cell(t.title)} | ${STATUS[t.status]} | ${cell(list(t.sources.map((s) => base(s.file))))} | ${list(practicalsFor(t.id))} | ${list(simsFor(t.id))} | ${list(pyqFor(t.id))} | ${bankFor(t.id)} |`,
    );
  }
  w();
}

w('## Practical lab');
w();
w('| # | Experiment | Code | Sources | Simulation |');
w('|---|---|---|---|---|');
for (const p of PRACTICALS) {
  const kind = p.programs.every((g) => g.authored) ? 'Solution written for the platform' : p.programs.some((g) => g.corrected) ? 'Verbatim, with corrected version' : 'Verbatim';
  w(`| ${p.id.slice(0, 3).toUpperCase()} | ${cell(p.title)} | ${kind} | ${cell(list(p.sources.map((s) => base(s.file) + (s.detail ? ` (${s.detail})` : ''))))} | ${p.sim?.id ?? '—'} |`);
}
w();
w('Every experiment page has the eight required sections: details, circuit, code, line-by-line explanation, animated flowchart, simulation, practical-exam preparation and memorisation aids.');
w();

w('## Previous-year questions');
w();
w('| Paper | Source file | Questions | Marks |');
w('|---|---|---|---|');
for (const p of PAPERS) w(`| ${p.title} | ${cell(p.file)} | ${p.questions.map((q) => q.number).join(', ')} | ${p.maxMarks} |`);
w();
w('| Question | Marks | Kind | Topics |');
w('|---|---|---|---|');
for (const q of ALL_PYQ) w(`| ${q.id} | ${q.marks} | ${q.kind} | ${list(q.topics)} |`);
w();

w('## Simulations');
w();
w('Each simulation is a simplified model and says so on its page.');
w();
w('| Id | Title | Unit | What the model does not reproduce |');
w('|---|---|---|---|');
for (const s of SIMS) w(`| ${s.id} | ${cell(s.title)} | ${s.unit} | ${cell(s.model)} |`);
w();

w('## Diagrams');
w();
w(list(DIAGRAMS.map((d) => `\`${d.id}\``)));
w();

w('## Question bank by type');
w();
w('| Type | Unit 1 | Unit 2 | Unit 3 | Total |');
w('|---|---|---|---|---|');
for (const type of Object.keys(TYPE_LABEL) as BankItem['type'][]) {
  const of = items.filter((b) => b.type === type);
  w(`| ${TYPE_LABEL[type]} | ${[1, 2, 3].map((u) => of.filter((b) => b.unit === u).length).join(' | ')} | ${of.length} |`);
}
w();

w('## Known gaps in the supplied material');
w();
w('1. The Unit 3 syllabus text is cut off on the official slide; the rest was inferred from the NVIC lecture deck and the lecture sequence.');
w('2. No end-semester papers, online-quiz papers or Lab Evaluation 2 papers were supplied, so most Unit 3 topics (beyond SysTick) have no PYQ evidence.');
w('3. No lectures were supplied for buzzer, seven-segment display, DAC, PWM, RTC, general-purpose timers or SPI; those pages are labelled ADDITIONAL SYLLABUS COVERAGE.');
w('4. Instruction-set topics (addressing modes, instruction classes) have no slides and are taught from the prescribed textbook.');
w('5. The kit\'s LDR divider orientation is not documented; solutions keep the darkness comparison in one clearly marked macro.');
w('6. Mistakes found in the supplied code and question papers are kept verbatim and flagged next to a corrected version (see PROJECT_ANALYSIS.md, section 4).');
w();

writeFileSync(new URL('../CONTENT_COVERAGE.md', import.meta.url), out.join('\n'));
console.log(`CONTENT_COVERAGE.md written: ${TOPICS.length} topics, ${PRACTICALS.length} practicals, ${ALL_PYQ.length} PYQs, ${items.length} bank items.`);
