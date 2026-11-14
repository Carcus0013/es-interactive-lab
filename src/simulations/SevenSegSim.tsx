import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Select, bin } from './kit';

// segment bits: a=0 … g=6, dp=7 (common-cathode, 1 = ON)
const DIGITS = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71];
const SEG = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export default function SevenSegSim(_: SimProps) {
  const [digit, setDigit] = useState(2);
  const [type, setType] = useState<'cc' | 'ca'>('cc');
  const [custom, setCustom] = useState<number | null>(null);
  const [dp, setDp] = useState(false);
  const pattern = ((custom ?? DIGITS[digit]) | (dp ? 0x80 : 0)) & 0xff;
  const out = type === 'cc' ? pattern : ~pattern & 0xff;
  const on = (b: number) => ((pattern >> b) & 1) === 1;
  const toggle = (b: number) => setCustom((c) => ((c ?? DIGITS[digit]) ^ (1 << b)) & 0x7f);
  const segPaths: [number, string][] = [
    [0, 'M22 8 h56 l-8 10 h-40 z'],
    [1, 'M82 12 l8 8 v52 l-8 6 l-8 -6 v-50 z'],
    [2, 'M82 86 l8 6 v52 l-8 8 l-8 -8 v-52 z'],
    [3, 'M22 156 h56 l-8 -10 h-40 z'],
    [4, 'M18 86 l8 6 v52 l-8 8 l-8 -8 v-52 z'],
    [5, 'M18 12 l8 8 v50 l-8 6 l-8 -6 v-52 z'],
    [6, 'M26 82 l6 -6 h36 l6 6 l-6 6 h-36 z'],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <Panel title="Display (click a segment)">
        <svg viewBox="0 0 110 170" className="mx-auto h-56 w-auto" role="img" aria-label="Seven-segment display">
          <rect x="0" y="0" width="110" height="170" rx="8" fill="rgb(var(--mask))" />
          {segPaths.map(([b, d]) => (
            <path key={b} d={d} fill={on(b) ? 'rgb(var(--led))' : 'rgb(var(--led) / 0.1)'} stroke="rgb(var(--led) / 0.5)" onClick={() => toggle(b)} style={{ cursor: 'pointer' }}>
              <title>segment {SEG[b]}</title>
            </path>
          ))}
          <circle cx="98" cy="154" r="6" fill={dp ? 'rgb(var(--led))' : 'rgb(var(--led) / 0.1)'} onClick={() => setDp((v) => !v)} style={{ cursor: 'pointer' }} />
        </svg>
      </Panel>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Digit" value={digit} options={DIGITS.map((_, i) => [i, i.toString(16).toUpperCase()] as [number, string])} onChange={(v) => { setDigit(v); setCustom(null); }} />
          <Select
            label="Display type"
            value={type}
            options={[
              ['cc', 'Common cathode (1 = ON)'],
              ['ca', 'Common anode (0 = ON)'],
            ]}
            onChange={setType}
          />
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={dp} onChange={(e) => setDp(e.target.checked)} /> decimal point
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Readout label="Segments lit" value={<span className="text-sm">{SEG.filter((_, b) => on(b)).join(' ') || 'none'}</span>} />
          <Readout label="Byte to output (dp g f e d c b a)" value={bin(out, 8)} tone="ch1" />
          <Readout label="Hex" value={`0x${out.toString(16).toUpperCase().padStart(2, '0')}`} tone="ok" />
        </div>
        <Panel title="Driving it from GPIO (e.g. PB0–PB7)">
          <pre className="overflow-x-auto font-mono text-[0.82rem] text-ink">
            {`const uint8_t seg[16] = {0x3F,0x06,0x5B,0x4F,0x66,0x6D,0x7D,0x07,
                         0x7F,0x6F,0x77,0x7C,0x39,0x5E,0x79,0x71};
GPIOB->ODR = (GPIOB->ODR & ~0xFFU) | ${type === 'cc' ? 'seg[d]' : '(~seg[d] & 0xFF)'};   // = 0x${out.toString(16).toUpperCase().padStart(2, '0')} for '${(custom === null ? digit : '?').toString(16).toUpperCase()}'`}
          </pre>
          <p className="mt-2 text-xs text-dim">Each segment needs its own current-limiting resistor. For several digits, segment lines are shared and each digit's common pin is enabled in turn quickly (multiplexing) — persistence of vision makes all digits appear lit.</p>
        </Panel>
      </div>
    </div>
  );
}
