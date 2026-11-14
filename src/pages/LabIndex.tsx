import { PRACTICALS } from '../content/practicals';
import { PageHeader } from '../components/ui';
import { Callout } from '../components/Markdown';
import { Link } from '../utils/router';
import { useStore } from '../utils/store';

export default function LabIndex() {
  const prac = useStore((s) => s.practicals);
  const done = PRACTICALS.filter((p) => prac[p.id]?.done).length;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Practical lab"
        lead="Every program from your lab folders, with its circuit, a line-by-line explanation, an animated flowchart, a simulation and viva preparation. Original code is shown unchanged; fixes are shown separately."
      >
        <span className="text-sm text-dim">
          {done} of {PRACTICALS.length} marked as mastered
        </span>
      </PageHeader>
      <Callout kind="source" title="Lab kit used in every program">
        <p>
          LED1 = PC14 and LED2 = PB9 (active-high), switches S1 = PB10 and S2 = PA6, POT = PA0 (ADC IN0), LDR = PA1 (ADC IN1), on-board USER LED = PC13 (active-low), USER KEY = PA0. System clock: HSI 16 MHz. (From <code>Emb-kit Manual.docx</code>.)
        </p>
      </Callout>
      <ol className="mt-6 grid gap-3 md:grid-cols-2">
        {PRACTICALS.map((p) => (
          <li key={p.id}>
            <Link to={`/lab/${p.id}`} className="group flex h-full gap-4 rounded-md border border-line bg-panel p-4 hover:border-gold/60">
              <span className="font-mono text-sm text-gold">{p.id.slice(0, 3).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold group-hover:text-gold">{p.title}</span>
                <span className="mt-1 block text-sm text-dim">{p.objective}</span>
                <span className="mt-2 block font-mono text-xs text-dim">{p.programs.map((g) => g.file).join(', ')}</span>
              </span>
              {prac[p.id]?.done && <span className="text-ok" aria-label="Mastered">✓</span>}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
