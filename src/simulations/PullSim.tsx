import { useEffect, useState } from 'react';
import type { SimProps } from './registry';
import { Panel, PushButton, Readout, Select } from './kit';

type Pull = 'none' | 'up' | 'down';
type Wiring = 'gnd' | 'vcc';

export default function PullSim(_: SimProps) {
  const [pull, setPull] = useState<Pull>('none');
  const [wiring, setWiring] = useState<Wiring>('gnd');
  const [pressed, setPressed] = useState(false);
  const [hist, setHist] = useState<number[]>(() => Array(80).fill(1.65));
  const [rnd, setRnd] = useState(0);

  const volts = (): number => {
    if (pressed) return wiring === 'gnd' ? 0 : 3.3;
    if (pull === 'up') return 3.3;
    if (pull === 'down') return 0;
    return Math.max(0, Math.min(3.3, 1.65 + Math.sin(rnd * 1.7) * 0.9 + (Math.random() - 0.5) * 1.6)); // floating: picks up noise
  };
  useEffect(() => {
    const id = window.setInterval(() => {
      setRnd((r) => r + 1);
      setHist((h) => [...h.slice(1), volts()]);
    }, 80);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pull, wiring, pressed]);

  const v = hist[hist.length - 1];
  const VIH = 0.7 * 3.3; // ≈ 2.31 V (datasheet: 0.7 VDD)
  const VIL = 0.3 * 3.3; // ≈ 0.99 V
  const logic = v >= VIH ? '1' : v <= VIL ? '0' : 'undefined';
  const W = 600;
  const H = 140;
  const y = (x: number) => H - 10 - (x / 3.3) * (H - 20);
  let d = '';
  hist.forEach((x, i) => (d += `${i ? 'L' : 'M'}${(i / (hist.length - 1)) * W} ${y(x)} `));
  const proper = (wiring === 'gnd' && pull === 'up') || (wiring === 'vcc' && pull === 'down');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Internal resistor (GPIOx_PUPDR)"
          value={pull}
          options={[
            ['none', '00 — none (floating)'],
            ['up', '01 — pull-up'],
            ['down', '10 — pull-down'],
          ]}
          onChange={setPull}
        />
        <Select
          label="Switch wiring"
          value={wiring}
          options={[
            ['gnd', 'Switch between pin and GND (lab kit)'],
            ['vcc', 'Switch between pin and 3.3 V'],
          ]}
          onChange={setWiring}
        />
        <div className="flex items-end">
          <PushButton pressed={pressed} onDown={() => setPressed(true)} onUp={() => setPressed(false)} label="press & hold" />
        </div>
      </div>
      <Panel title="Pin voltage and the input thresholds (V_DD = 3.3 V)">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Input voltage over time">
          <rect x={0} y={y(VIH)} width={W} height={y(VIL) - y(VIH)} fill="rgb(var(--warn) / 0.12)" />
          <line x1={0} x2={W} y1={y(VIH)} y2={y(VIH)} stroke="rgb(var(--ok))" strokeDasharray="4 4" />
          <line x1={0} x2={W} y1={y(VIL)} y2={y(VIL)} stroke="rgb(var(--bad))" strokeDasharray="4 4" />
          <text x={W - 4} y={y(VIH) - 4} textAnchor="end" fontSize={10} fill="rgb(var(--ok))">
            V_IH ≈ 2.31 V: reads 1 above this
          </text>
          <text x={W - 4} y={y(VIL) + 12} textAnchor="end" fontSize={10} fill="rgb(var(--bad))">
            V_IL ≈ 0.99 V: reads 0 below this
          </text>
          <text x={6} y={(y(VIH) + y(VIL)) / 2 + 4} fontSize={10} fill="rgb(var(--warn))">
            undefined region
          </text>
          <path d={d} fill="none" stroke="rgb(var(--ch1))" strokeWidth={2} />
        </svg>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Pin voltage" value={`${v.toFixed(2)} V`} tone="ch1" />
        <Readout label="IDR bit reads" value={logic === 'undefined' ? '0 or 1 (random)' : logic} tone={logic === 'undefined' ? 'bad' : 'ok'} />
        <Readout label="Configuration" value={proper ? 'correct' : pull === 'none' ? 'floating!' : 'switch has no effect'} tone={proper ? 'ok' : 'bad'} sub={proper ? (wiring === 'gnd' ? 'released 1, pressed 0' : 'released 0, pressed 1') : undefined} />
      </div>
      <p className="text-xs text-dim">Thresholds use the STM32F401 datasheet’s CMOS levels (V_IL ≤ 0.3 V_DD, V_IH ≥ 0.7 V_DD); the lecture’s 0.8 V / 2 V example is for 5 V TTL logic. The floating trace is illustrative noise, not a measured waveform.</p>
    </div>
  );
}
