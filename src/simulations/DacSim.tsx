import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Select, Slider, bin } from './kit';
import { ClockControls } from '../components/Player';
import { useClock } from '../hooks/useStepper';

export default function DacSim(_: SimProps) {
  const [bits, setBits] = useState(4);
  const [code, setCode] = useState(11);
  const [vref, setVref] = useState(3.3);
  const [tableLen, setTableLen] = useState(16);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useClock(playing, speed);
  const max = 2 ** bits - 1;
  const c = Math.min(code, max);
  const vout = (c * vref) / 2 ** bits;

  const table = useMemo(() => Array.from({ length: tableLen }, (_, i) => Math.round(((Math.sin((2 * Math.PI * i) / tableLen) + 1) / 2) * max)), [tableLen, max]);
  const idx = Math.floor(t * 4) % tableLen;
  const W = 600;
  const H = 150;
  let staircase = '';
  table.forEach((v, i) => {
    const x0 = (i / tableLen) * W;
    const x1 = ((i + 1) / tableLen) * W;
    const y = H - 10 - (v / max) * (H - 20);
    staircase += `${i ? 'L' : 'M'}${x0} ${y} L${x1} ${y} `;
  });
  let ideal = '';
  for (let i = 0; i <= 100; i++) ideal += `${i ? 'L' : 'M'}${(i / 100) * W} ${H - 10 - ((Math.sin(2 * Math.PI * (i / 100) - Math.PI / tableLen) + 1) / 2) * (H - 20)} `;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="DAC resolution"
          value={bits}
          options={[
            [3, '3-bit'],
            [4, '4-bit (R-2R demo)'],
            [6, '6-bit'],
            [8, '8-bit'],
            [12, '12-bit'],
          ]}
          onChange={(v) => { setBits(v); setCode((x) => Math.min(x, 2 ** v - 1)); }}
        />
        <Slider label="Digital code" value={c} min={0} max={max} onChange={setCode} />
        <Slider label="V_ref" value={vref} min={1} max={5} step={0.1} unit="V" onChange={setVref} format={(v) => v.toFixed(1)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Readout label="Code (binary)" value={<span className="text-sm">{bin(c, bits)}</span>} tone="ch1" />
        <Readout label="V_out = code × V_ref / 2ⁿ" value={`${vout.toFixed(4)} V`} tone="ok" />
        <Readout label="Resolution (1 LSB)" value={`${((vref / 2 ** bits) * 1000).toFixed(3)} mV`} />
        <Readout label="Full scale" value={`${((max * vref) / 2 ** bits).toFixed(3)} V`} sub="one LSB below V_ref" />
      </div>
      {bits <= 6 && (
        <Panel title="Binary-weighted contributions">
          <div className="flex flex-wrap gap-2 font-mono text-sm">
            {Array.from({ length: bits }, (_, i) => bits - 1 - i).map((b) => {
              const on = ((c >> b) & 1) === 1;
              return (
                <div key={b} className={`rounded border px-2 py-1 ${on ? 'border-ch1 bg-ch1/15' : 'border-line text-dim'}`}>
                  b{b}: {on ? '+' : ' '}
                  {((vref * 2 ** b) / 2 ** bits).toFixed(3)} V
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-dim">An R-2R ladder makes each bit contribute half the weight of the bit above it, using only two resistor values.</p>
        </Panel>
      )}
      <Panel title="Waveform synthesis: a sine look-up table output by a timer interrupt">
        <div className="mb-3 flex flex-wrap items-end gap-4">
          <Select label="Table entries per period" value={tableLen} options={[8, 16, 32, 64].map((v) => [v, String(v)] as [number, string])} onChange={setTableLen} />
          <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => setT(0)} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="DAC staircase approximating a sine wave">
          <path d={ideal} fill="none" stroke="rgb(var(--ch2) / 0.5)" strokeWidth={1.5} strokeDasharray="4 4" />
          <path d={staircase} fill="none" stroke="rgb(var(--ch1))" strokeWidth={2} />
          <rect x={(idx / tableLen) * W} y={0} width={W / tableLen} height={H} fill="rgb(var(--gold) / 0.15)" />
        </svg>
        <p className="mt-2 text-sm">
          ISR call {idx}: <code>DAC_out(sine[{idx}])</code> = {table[idx]} → {((table[idx] * vref) / 2 ** bits).toFixed(3)} V. Output frequency = interrupt rate ÷ {tableLen}. More entries or bits → smoother wave; a low-pass filter removes the steps.
        </p>
      </Panel>
      <p className="text-xs text-dim">The STM32F401 has no on-chip DAC; the textbook (Valvano §10.2) builds one from GPIO pins and a resistor network. Additional syllabus coverage.</p>
    </div>
  );
}
