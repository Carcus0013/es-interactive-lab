import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { useStepper } from '../hooks/useStepper';
import Player from '../components/Player';
import { Panel, Toggle } from './kit';

const PROG = ['MOVS R0, #0', 'ADDS R0, #1', 'CMP  R0, #3', 'BNE  loop', 'MOVS R1, #5', 'NOP', 'loop: ADDS R2, #1', 'SUBS R3, #1'];
const BRANCH = 3;
const TARGET = 6;

interface Row {
  F: string | null;
  D: string | null;
  E: string | null;
  flushed: boolean;
  note: string;
}

export default function PipelineSim(_: SimProps) {
  const [taken, setTaken] = useState(true);
  const table = useMemo(() => {
    const name = (i: number | null) => (i === null ? null : i === BRANCH && !taken ? 'BNE  loop (not taken)' : PROG[i]);
    const out: Row[] = [];
    let F: number | null = null;
    let D: number | null = null;
    let E: number | null = null;
    let pc = 0;
    for (let cycle = 0; cycle < 11; cycle++) {
      E = D;
      D = F;
      F = pc < PROG.length ? pc : null;
      pc++;
      if (taken && E === BRANCH) {
        out.push({ F: name(F), D: name(D), E: name(E), flushed: true, note: 'BNE executes and is taken: the instructions in Fetch and Decode are wrong-path and are flushed. Fetch restarts at “loop”, so two cycles produce no result.' });
        F = null;
        D = null;
        pc = TARGET;
        continue;
      }
      const note = E === null && D === null ? 'Pipeline filling: nothing has reached Execute yet.' : E === null ? 'Still filling (or refilling after a flush).' : F === null ? 'Pipeline draining: no more instructions to fetch.' : 'Pipeline full: while one instruction executes, the next is decoded and the one after is fetched.';
      out.push({ F: name(F), D: name(D), E: name(E), flushed: false, note });
    }
    return out;
  }, [taken]);
  const s = useStepper(table.length, { interval: 1100 });
  const row = table[s.step];
  return (
    <div className="space-y-4">
      <Toggle label="Branch is taken (flushes the pipeline)" checked={taken} onChange={(v) => { setTaken(v); s.restart(); }} />
      <Player s={s} label="Clock cycle" />
      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel title="Cycle by cycle">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[0.8rem]">
              <thead>
                <tr>
                  <th className="border-b border-line px-2 py-1 text-left text-dim">Cycle</th>
                  <th className="border-b border-line px-2 py-1 text-left text-ch2">Fetch</th>
                  <th className="border-b border-line px-2 py-1 text-left text-ch1">Decode</th>
                  <th className="border-b border-line px-2 py-1 text-left text-ch4">Execute</th>
                </tr>
              </thead>
              <tbody>
                {table.slice(0, s.step + 1).map((r, i) => (
                  <tr key={i} className={i === s.step ? 'bg-gold/10' : ''}>
                    <td className="border-b border-line/50 px-2 py-1 text-dim">{i + 1}</td>
                    <td className={`border-b border-line/50 px-2 py-1 ${r.flushed && r.F ? 'text-bad line-through' : ''}`}>{r.F ?? <span className="text-dim/50">—</span>}</td>
                    <td className={`border-b border-line/50 px-2 py-1 ${r.flushed && r.D ? 'text-bad line-through' : ''}`}>{r.D ?? <span className="text-dim/50">—</span>}</td>
                    <td className="border-b border-line/50 px-2 py-1">{r.E ?? <span className="text-dim/50">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="What happens now">
          <p className="text-[0.95rem]" aria-live="polite">
            {row.note}
          </p>
          <p className="mt-3 text-xs text-dim">The real Cortex-M4 also prefetches from the likely branch target (branch speculation) to shorten this penalty. This idealised model shows the basic 3-stage behaviour from the lecture.</p>
        </Panel>
      </div>
    </div>
  );
}
