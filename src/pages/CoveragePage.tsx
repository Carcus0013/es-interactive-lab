import { TOPICS } from '../content/topics';
import { PRACTICALS } from '../content/practicals';
import { PAPERS, ALL_PYQ } from '../content/pyq';
import { SIMS } from '../simulations/registry';
import { DIAGRAMS } from '../animations/diagrams';
import { PageHeader, SourceBadge } from '../components/ui';
import { Callout } from '../components/Markdown';
import { Link } from '../utils/router';

const INVENTORY: [string, string][] = [
  ['EMBEDDED_THEORY_MATERIALS/', '28 lecture decks (Day01–Day10 series, GPIO, ADC, SysTick, NVIC, UART, I²C), bit-band notes, register-level programming notes, RM0368 and the STM32F401 datasheet. Root-folder copies are duplicates or older revisions.'],
  ['EMBEDDED_LAB_MATERIALS/Lab_1 … Lab_7', 'LED, blink, button, switch, ADC, SysTick, GPIO-interrupt, ADC-interrupt and USART programs; lab kit manual.'],
  ['EMBEDDED_LAB_MATERIALS/USART, I2C', 'UART TX / string / echo programs; I²C LCD + ADC program.'],
  ['EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS', 'Lab Evaluation-1 Set 1 (photo storage) and Set 2 (parking).'],
  ['EMBEDDED_LAB_MATERIALS/Data_Sheet', 'STM32F401CC datasheet, RM0368 reference manual, PM0214 programming manual, DUI0553 Cortex-M4 generic user guide, WeAct Black Pill schematics.'],
  ["EMBEDDED_PYQ'S/", 'Mid-term papers: Aug 2025 (two sets in one PDF), Aug 2026 Slot 1 Set 1 and Set 2.'],
  ['EMBEDDED_TEXTBOOK/', 'Valvano, Embedded Systems: Introduction to ARM Cortex-M Microcontrollers, Vol. 1, 5th ed.'],
  ['EMBEDDED_CASE_STUDY/', 'Case-study guidelines 2026-27 and the topic-allocation list (contains other students’ names — not reproduced here).'],
];

export default function CoveragePage() {
  const byStatus = (s: string) => TOPICS.filter((t) => t.status === s);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Sources & coverage" lead="Where every part of this platform comes from, and what is not in your materials." />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['course', 'Taught from your lectures and labs'],
          ['textbook', 'From the prescribed textbook only'],
          ['additional', 'Additional syllabus coverage'],
        ].map(([s, l]) => (
          <div key={s} className="rounded-md border border-line bg-panel p-4">
            <SourceBadge status={s as 'course'} />
            <div className="silk mt-2 font-mono text-3xl font-semibold">{byStatus(s).length}</div>
            <div className="text-sm text-dim">{l}</div>
          </div>
        ))}
      </section>

      <Callout kind="additional" title="Topics not covered by your materials">
        <ul className="list-disc space-y-1 pl-5">
          {byStatus('additional').map((t) => (
            <li key={t.id}>
              <Link to={`/topic/${t.id}`}>{t.title}</Link> — written from general technical knowledge{t.sources.length ? ` (${t.sources.map((s) => s.file).join('; ')})` : ''}.
            </li>
          ))}
        </ul>
      </Callout>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Material inventory</h2>
        <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {INVENTORY.map(([k, v]) => (
              <tr key={k}>
                <td className="w-72 border-b border-line/60 py-2 pr-4 align-top font-mono text-xs text-gold">{k}</td>
                <td className="border-b border-line/60 py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="mt-3 text-sm text-dim">
          The full file-by-file inventory, syllabus analysis and list of issues found in the supplied code is in <code>PROJECT_ANALYSIS.md</code> in the project folder.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">What the platform contains</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li>{TOPICS.length} topic lessons, each with fundamentals, detail, visuals, exam prep and a quiz</li>
          <li>{PRACTICALS.length} practicals covering {PRACTICALS.reduce((s, p) => s + p.programs.length, 0)} programs</li>
          <li>
            {PAPERS.length} papers, {ALL_PYQ.length} solved questions
          </li>
          <li>{SIMS.length} interactive simulations</li>
          <li>{DIAGRAMS.length} exam diagrams</li>
          <li>{TOPICS.reduce((s, t) => s + t.revision.mcqs.length, 0)} topic MCQs</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Labels used across the site</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="inline font-semibold text-gold">Actual question, as printed — </dt>
            <dd className="inline">copied from a supplied paper, with year, set and question number.</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ch3">Generated practice question — </dt>
            <dd className="inline">written for practice from your material; never presented as a PYQ.</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ch3">External knowledge — </dt>
            <dd className="inline">an explanation that goes beyond your slides (from Arm/ST documentation or general practice).</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Educational model — </dt>
            <dd className="inline">each simulation states what it reproduces exactly and what it simplifies.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
