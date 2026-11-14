import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Slider } from './kit';

export default function FlashAdcSim(_: SimProps) {
  const [vref, setVref] = useState(8);
  const [vin, setVin] = useState(5.2);
  const n = 3;
  const comps = 2 ** n - 1; // 7 comparators
  const step = vref / 2 ** n;
  const thresholds = Array.from({ length: comps }, (_, i) => (i + 1) * step);
  const outs = thresholds.map((th) => (vin >= th ? 1 : 0));
  const count = outs.reduce<number>((a, b) => a + b, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="V_in" value={vin} min={0} max={vref} step={0.05} unit="V" onChange={setVin} format={(v) => v.toFixed(2)} />
        <Slider label="V_ref" value={vref} min={1} max={10} step={0.5} unit="V" onChange={setVref} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel title="Resistor ladder → 7 comparators → priority encoder (3-bit)">
          <svg viewBox="0 0 560 330" className="h-auto w-full" role="img" aria-label="Flash ADC comparators">
            <text x={60} y={16} fontSize={11} fill="rgb(var(--ch1))" textAnchor="middle">
              V_ref = {vref} V
            </text>
            <line x1={60} x2={60} y1={22} y2={320} stroke="rgb(var(--line))" strokeWidth={2} />
            {thresholds
              .map((th, i) => ({ th, i }))
              .reverse()
              .map(({ th, i }, k) => {
                const y = 40 + k * 40;
                const on = outs[i] === 1;
                return (
                  <g key={i}>
                    <rect x={52} y={y - 14} width={16} height={12} fill="rgb(var(--raised))" stroke="rgb(var(--ink))" />
                    <line x1={60} x2={180} y1={y + 6} y2={y + 6} stroke="rgb(var(--dim))" />
                    <text x={80} y={y + 2} fontSize={10} fill="rgb(var(--dim))">
                      {th.toFixed(2)} V
                    </text>
                    <polygon points={`180,${y - 8} 180,${y + 20} 220,${y + 6}`} fill={on ? 'rgb(var(--ch4) / 0.3)' : 'rgb(var(--raised))'} stroke={on ? 'rgb(var(--ch4))' : 'rgb(var(--line))'} />
                    <line x1={140} x2={180} y1={y - 2} y2={y - 2} stroke="rgb(var(--ch2))" />
                    <text x={232} y={y + 10} fontSize={13} fontFamily="monospace" fill={on ? 'rgb(var(--ch4))' : 'rgb(var(--dim))'}>
                      C{i + 1} = {outs[i]}
                    </text>
                  </g>
                );
              })}
            <text x={140} y={322} fontSize={11} fill="rgb(var(--ch2))">
              V_in = {vin.toFixed(2)} V to every + input
            </text>
            <rect x={340} y={110} width={150} height={110} rx={6} fill="rgb(var(--raised))" stroke="rgb(var(--gold))" />
            <text x={415} y={150} textAnchor="middle" fontSize={13} fill="rgb(var(--ink))" fontWeight={600}>
              Priority encoder
            </text>
            <text x={415} y={180} textAnchor="middle" fontSize={18} fontFamily="monospace" fill="rgb(var(--ok))">
              {count.toString(2).padStart(3, '0')}
            </text>
            <line x1={300} x2={340} y1={165} y2={165} stroke="rgb(var(--dim))" />
          </svg>
        </Panel>
        <div className="space-y-3">
          <Readout label="Thermometer code (C7…C1)" value={[...outs].reverse().join('')} tone="ch4" />
          <Readout label="Number of 1s" value={count} />
          <Readout label="Binary output" value={count.toString(2).padStart(3, '0')} tone="ok" sub={`quantised ${(count * step).toFixed(2)} V, error ${(vin - count * step).toFixed(2)} V`} />
          <p className="text-xs text-dim">All comparisons happen at once → fastest ADC type, but an n-bit flash needs 2ⁿ − 1 comparators (4095 for 12 bits), so it is large and power-hungry.</p>
        </div>
      </div>
    </div>
  );
}
