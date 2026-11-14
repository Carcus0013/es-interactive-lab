import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Select, hexSpaced } from './kit';

const PORTS: [string, number][] = [
  ['GPIOA', 0x40020000],
  ['GPIOB', 0x40020400],
  ['GPIOC', 0x40020800],
  ['RCC', 0x40023800],
  ['ADC1', 0x40012000],
  ['USART2', 0x40004400],
  ['SRAM variable', 0x20000000],
];
const OFFSETS: [string, number][] = [
  ['MODER (0x00)', 0x00],
  ['OTYPER (0x04)', 0x04],
  ['PUPDR (0x0C)', 0x0c],
  ['IDR (0x10)', 0x10],
  ['ODR (0x14)', 0x14],
  ['BSRR (0x18)', 0x18],
  ['LCKR (0x1C)', 0x1c],
  ['AHB1ENR (0x30)', 0x30],
  ['custom', -1],
];

const PRESETS: Record<string, { base: number; off: number; bit: number }> = {
  pc13: { base: 0x40020800, off: 0x14, bit: 13 },
  mt25a: { base: 0x40020000, off: 0x1c, bit: 5 },
  mt25b: { base: 0x40020000, off: 0x14, bit: 6 },
  mt26s1: { base: 0x40020000, off: 0x14, bit: 7 },
  mt26s2: { base: 0x40020400, off: 0x14, bit: 4 },
};

export default function BitBandSim({ preset }: SimProps) {
  const p = PRESETS[preset ?? 'pc13'] ?? PRESETS.pc13;
  const [mode, setMode] = useState<'pick' | 'raw'>('pick');
  const [base, setBase] = useState(p.base);
  const [off, setOff] = useState(p.off);
  const [raw, setRaw] = useState(hexSpaced(p.base + p.off).replace(' ', ''));
  const [bit, setBit] = useState(p.bit);

  const parsed = parseInt(raw.replace(/\s/g, ''), 16);
  const addr = mode === 'pick' ? base + Math.max(0, off) : Number.isFinite(parsed) ? parsed : 0;
  const isPeri = addr >= 0x40000000 && addr <= 0x400fffff;
  const isSram = addr >= 0x20000000 && addr <= 0x200fffff;
  const regionBase = isPeri ? 0x40000000 : 0x20000000;
  const aliasBase = isPeri ? 0x42000000 : 0x22000000;
  const offset = addr - regionBase;
  const times32 = offset * 32;
  const bit4 = bit * 4;
  const alias = aliasBase + times32 + bit4;
  const valid = isPeri || isSram;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" className={mode === 'pick' ? 'btn-gold' : 'btn'} onClick={() => setMode('pick')}>
          Pick register
        </button>
        <button type="button" className={mode === 'raw' ? 'btn-gold' : 'btn'} onClick={() => setMode('raw')}>
          Type an address
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {mode === 'pick' ? (
          <>
            <Select label="Peripheral (base)" value={base} options={PORTS.map(([n, b]) => [b, `${n} — ${hexSpaced(b)}`] as [number, string])} onChange={setBase} />
            <Select label="Register offset" value={off} options={OFFSETS.filter(([, o]) => o >= 0).map(([n, o]) => [o, n] as [number, string])} onChange={setOff} />
          </>
        ) : (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-dim">Register address (hex)</span>
            <input className="input font-mono" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="0x40020814" />
          </label>
        )}
        <Select label="Bit number" value={bit} options={Array.from({ length: 32 }, (_, i) => [i, String(i)] as [number, string])} onChange={setBit} />
      </div>

      {!valid ? (
        <p className="rounded border border-bad/50 bg-bad/10 p-3 text-sm text-bad">
          {hexSpaced(addr)} is outside both bit-band regions (0x2000 0000–0x200F FFFF and 0x4000 0000–0x400F FFFF), so it has no alias. Registers such as SysTick (0xE000 E010) cannot be bit-banded.
        </p>
      ) : (
        <Panel title="Calculation, exactly as you should write it in the exam">
          <ol className="space-y-2 font-mono text-[0.9rem]">
            <li>
              <span className="text-dim">1. Register address</span> = {mode === 'pick' ? `${hexSpaced(base)} + 0x${off.toString(16).toUpperCase()} = ` : ''}
              <span className="text-gold">{hexSpaced(addr)}</span>
            </li>
            <li>
              <span className="text-dim">2. Region</span> = {isPeri ? 'peripheral' : 'SRAM'} → region base {hexSpaced(regionBase)}, alias base {hexSpaced(aliasBase)}
            </li>
            <li>
              <span className="text-dim">3. Byte offset</span> = {hexSpaced(addr)} − {hexSpaced(regionBase)} = <span className="text-ch2">0x{offset.toString(16).toUpperCase()}</span>
            </li>
            <li>
              <span className="text-dim">4. Offset × 32</span> = 0x{offset.toString(16).toUpperCase()} &lt;&lt; 5 = <span className="text-ch2">0x{times32.toString(16).toUpperCase()}</span>
            </li>
            <li>
              <span className="text-dim">5. Bit × 4</span> = {bit} × 4 = {bit4} = <span className="text-ch2">0x{bit4.toString(16).toUpperCase()}</span>
            </li>
            <li>
              <span className="text-dim">6. Alias</span> = {hexSpaced(aliasBase)} + 0x{times32.toString(16).toUpperCase()} + 0x{bit4.toString(16).toUpperCase()} = <span className="text-lg font-semibold text-ok">{hexSpaced(alias)}</span>
            </li>
          </ol>
        </Panel>
      )}
      {valid && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Readout label="Alias word address" value={hexSpaced(alias)} tone="ok" />
          <Readout label="C to set the bit" value={<span className="text-sm">*(volatile uint32_t*){'0x' + alias.toString(16).toUpperCase()} = 1;</span>} />
          <Readout label="Alias for bit 0 of this word" value={hexSpaced(aliasBase + times32)} sub="each next bit is +4" />
        </div>
      )}
    </div>
  );
}
