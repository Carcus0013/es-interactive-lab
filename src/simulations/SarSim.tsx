import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { useStepper } from '../hooks/useStepper';
import Player from '../components/Player';
import { NumberField, Panel, Readout, Select } from './kit';

interface Trial {
  bit: number;
  trial: number;
  vdac: number;
  keep: boolean;
  code: number;
}

export default function SarSim({ preset }: SimProps) {
  const [vref, setVref] = useState(preset === 'lecture2' ? 10 : 8);
  const [vin, setVin] = useState(preset === 'lecture2' ? 5.8 : 5.2);
  const [n, setN] = useState(preset === 'lecture2' ? 4 : 3);

  const trials = useMemo(() => {
    const out: Trial[] = [];
    let code = 0;
    for (let b = n - 1; b >= 0; b--) {
      const trial = code | (1 << b);
      const vdac = (trial * vref) / 2 ** n;
      const keep = vin >= vdac;
      if (keep) code = trial;
      out.push({ bit: b, trial, vdac, keep, code });
    }
    return out;
  }, [vref, vin, n]);
  const s = useStepper(trials.length + 1, { interval: 1400 });
  const shown = trials.slice(0, s.step);
  const final = trials[trials.length - 1]?.code ?? 0;
  const cur = s.step > 0 ? trials[s.step - 1] : null;
  const binStr = (v: number) => v.toString(2).padStart(n, '0');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="V_ref" unit="V" value={vref} step={0.1} min={1} max={20} onChange={setVref} />
        <NumberField label="V_in" unit="V" value={vin} step={0.1} min={0} max={vref} onChange={setVin} />
        <Select
          label="Bits"
          value={n}
          options={[
            [3, '3-bit (Day08_2 example 1)'],
            [4, '4-bit (example 2)'],
            [8, '8-bit'],
            [12, '12-bit (STM32)'],
          ]}
          onChange={setN}
        />
      </div>
      <Player s={s} label="Comparison" />
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Panel title="Successive approximation register">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: n }, (_, i) => n - 1 - i).map((b) => {
              const decided = shown.find((t) => t.bit === b);
              const testing = cur && cur.bit === b;
              const val = decided ? (decided.keep ? 1 : 0) : testing ? 1 : 0;
              return (
                <div key={b} className={`flex w-10 flex-col items-center rounded border py-1 ${testing ? 'border-gold bg-gold/15' : decided ? 'border-ch4/60 bg-ch4/10' : 'border-line bg-raised'}`}>
                  <span className="font-mono text-lg">{decided || testing ? val : '–'}</span>
                  <span className="font-mono text-[0.6rem] text-dim">b{b}</span>
                </div>
              );
            })}
          </div>
          <svg viewBox="0 0 600 160" className="mt-4 h-auto w-full" role="img" aria-label="DAC trial voltages compared to the input">
            <line x1={0} x2={600} y1={150 - (vin / vref) * 140} y2={150 - (vin / vref) * 140} stroke="rgb(var(--ch2))" strokeWidth={2} />
            <text x={596} y={146 - (vin / vref) * 140} textAnchor="end" fontSize={11} fill="rgb(var(--ch2))">
              V_in = {vin} V
            </text>
            {shown.map((t, i) => {
              const x = 20 + i * (560 / Math.max(1, n));
              const y = 150 - (t.vdac / vref) * 140;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={560 / Math.max(1, n) - 8} height={150 - y} fill={t.keep ? 'rgb(var(--ch4) / 0.35)' : 'rgb(var(--bad) / 0.25)'} stroke={t.keep ? 'rgb(var(--ch4))' : 'rgb(var(--bad))'} />
                  {n <= 8 && (
                    <text x={x + 4} y={y - 4} fontSize={10} fill="rgb(var(--dim))">
                      {t.vdac.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </Panel>
        <div className="space-y-3">
          <Readout label="Step size V_ref / 2ⁿ" value={`${(vref / 2 ** n).toFixed(4)} V`} />
          <Readout label="Result" value={s.step >= trials.length ? `${binStr(final)} = ${final}` : '…'} tone="ok" sub={s.step >= trials.length ? `quantised ${((final * vref) / 2 ** n).toFixed(3)} V, error ${(vin - (final * vref) / 2 ** n).toFixed(3)} V` : undefined} />
        </div>
      </div>
      <Panel title="Iteration log">
        {shown.length === 0 ? (
          <p className="text-sm text-dim">Press Play or Step. All bits start at 0.</p>
        ) : (
          <ol className="space-y-1 font-mono text-[0.85rem]">
            {shown.map((t, i) => (
              <li key={i}>
                Iteration {i + 1}: try {binStr(t.trial)} → V_DAC = {t.vdac.toFixed(3)} V; {t.vdac.toFixed(3)} {t.keep ? '≤' : '>'} {vin} →{' '}
                <span className={t.keep ? 'text-ok' : 'text-bad'}>{t.keep ? `keep b${t.bit} = 1` : `reset b${t.bit} = 0`}</span> → {binStr(t.code)}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
