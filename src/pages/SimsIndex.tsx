import { useState } from 'react';
import { SIMS } from '../simulations/registry';
import { UNITS } from '../data/units';
import { PageHeader, Tabs } from '../components/ui';
import { Link } from '../utils/router';

export default function SimsIndex() {
  const [unit, setUnit] = useState<'all' | '1' | '2' | '3'>('all');
  const list = SIMS.filter((s) => unit === 'all' || String(s.unit) === unit);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Simulations"
        lead="Working models of the hardware in this course. Every control changes real state — registers, waveforms, flags — so you can predict, test and see. Each one states exactly which parts are simplified."
      />
      <Tabs
        label="Filter by unit"
        value={unit}
        onChange={setUnit}
        tabs={[{ id: 'all', label: `All (${SIMS.length})` }, ...UNITS.map((u) => ({ id: String(u.id) as '1', label: `Unit ${u.id}` }))]}
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <li key={s.id}>
            <Link to={`/sims/${s.id}`} className="group flex h-full flex-col rounded-md border border-line bg-panel p-4 hover:border-gold/60">
              <span className="text-xs text-dim">Unit {s.unit}</span>
              <span className="mt-1 text-lg font-semibold leading-snug group-hover:text-gold">{s.title}</span>
              <span className="mt-2 flex-1 text-sm text-dim">{s.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
