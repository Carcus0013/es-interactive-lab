import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, hexSpaced } from './kit';

interface Region {
  name: string;
  start: number;
  end: number;
  tone: string;
  detail: string;
  children?: { name: string; start: number; size: number; note: string }[];
}

const REGIONS: Region[] = [
  {
    name: 'Code',
    start: 0x00000000,
    end: 0x1fffffff,
    tone: 'gold',
    detail: 'Program memory. On STM32F401 the 256 KB Flash lives at 0x0800 0000 and is aliased to 0x0000 0000 at boot (BOOT0 = 0), so the vector table is fetched from address 0. The I-Code and D-Code buses serve this region.',
    children: [
      { name: 'Boot alias of Flash', start: 0x00000000, size: 0x40000, note: 'vector table: word 0 = initial SP, word 1 = reset vector' },
      { name: 'Flash 256 KB', start: 0x08000000, size: 0x40000, note: 'your compiled program (Keil downloads here)' },
      { name: 'System memory (bootloader)', start: 0x1fff0000, size: 0x7800, note: 'ST factory bootloader' },
    ],
  },
  {
    name: 'SRAM',
    start: 0x20000000,
    end: 0x3fffffff,
    tone: 'ch4',
    detail: 'Data memory: global variables, the stack and the heap. The first 1 MB is bit-band addressable through the alias at 0x2200 0000.',
    children: [
      { name: 'SRAM 64 KB', start: 0x20000000, size: 0x10000, note: 'stack grows down from the top' },
      { name: 'SRAM bit-band alias', start: 0x22000000, size: 0x2000000, note: '32 MB, one word per SRAM bit' },
    ],
  },
  {
    name: 'Peripheral',
    start: 0x40000000,
    end: 0x5fffffff,
    tone: 'ch2',
    detail: 'Memory-mapped peripheral registers. Writing GPIOC->ODR is just a store to 0x4002 0814. The first 1 MB is bit-band addressable through 0x4200 0000.',
    children: [
      { name: 'APB1: USART2', start: 0x40004400, size: 0x400, note: 'SR, DR, BRR, CR1…' },
      { name: 'APB1: I2C1', start: 0x40005400, size: 0x400, note: 'CR1, CR2, DR, SR1, SR2, CCR, TRISE' },
      { name: 'APB2: ADC1', start: 0x40012000, size: 0x400, note: 'SR, CR1, CR2, SMPRx, SQRx, DR (common CCR at 0x4001 2304)' },
      { name: 'APB2: SYSCFG', start: 0x40013800, size: 0x400, note: 'EXTICR1–4' },
      { name: 'APB2: EXTI', start: 0x40013c00, size: 0x400, note: 'IMR, RTSR, FTSR, PR' },
      { name: 'AHB1: GPIOA', start: 0x40020000, size: 0x400, note: 'MODER +0x00 … ODR +0x14' },
      { name: 'AHB1: GPIOB', start: 0x40020400, size: 0x400, note: '' },
      { name: 'AHB1: GPIOC', start: 0x40020800, size: 0x400, note: '' },
      { name: 'AHB1: RCC', start: 0x40023800, size: 0x400, note: 'AHB1ENR +0x30, APB1ENR +0x40, APB2ENR +0x44' },
      { name: 'Peripheral bit-band alias', start: 0x42000000, size: 0x2000000, note: '32 MB, one word per peripheral bit' },
    ],
  },
  { name: 'External RAM', start: 0x60000000, end: 0x9fffffff, tone: 'dim', detail: 'For external memory controllers. Unused on STM32F401 (no FSMC).' },
  { name: 'External device', start: 0xa0000000, end: 0xdfffffff, tone: 'dim', detail: 'External devices. Unused on STM32F401.' },
  {
    name: 'System (PPB)',
    start: 0xe0000000,
    end: 0xffffffff,
    tone: 'ch3',
    detail: 'Private Peripheral Bus inside the Cortex-M4: System Control Space with SysTick, NVIC, SCB, MPU and debug units. Same address on every Cortex-M4 chip. Not bit-band addressable.',
    children: [
      { name: 'SysTick', start: 0xe000e010, size: 0x10, note: 'CTRL, LOAD, VAL, CALIB' },
      { name: 'NVIC', start: 0xe000e100, size: 0x400, note: 'ISER, ICER, ISPR, ICPR, IABR, IPR' },
      { name: 'SCB', start: 0xe000ed00, size: 0x90, note: 'CPUID, ICSR, VTOR, AIRCR, SCR (SLEEPDEEP)…' },
    ],
  },
];

export default function MemMapSim(_: SimProps) {
  const [sel, setSel] = useState(2);
  const [lookup, setLookup] = useState('0x40020814');
  const [endianVal, setEndianVal] = useState('0x12345678');
  const region = REGIONS[sel];
  const a = parseInt(lookup.replace(/\s/g, ''), 16);
  const hit = Number.isFinite(a) ? REGIONS.findIndex((r) => a >= r.start && a <= r.end) : -1;
  const child = hit >= 0 ? REGIONS[hit].children?.find((c) => a >= c.start && a < c.start + c.size) : undefined;
  const ev = (parseInt(endianVal.replace(/\s/g, ''), 16) >>> 0) || 0;
  const bytes = [0, 1, 2, 3].map((i) => (ev >>> (8 * i)) & 0xff);

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div className="flex flex-col-reverse gap-1" role="listbox" aria-label="Memory regions">
        {REGIONS.map((r, i) => (
          <button
            key={r.name}
            type="button"
            role="option"
            aria-selected={i === sel}
            onClick={() => setSel(i)}
            className={`rounded border px-3 text-left transition-colors ${i === sel ? 'border-gold' : 'border-line'} ${r.tone === 'dim' ? 'py-1.5' : 'py-3'}`}
            style={{ background: `rgb(var(--${r.tone === 'dim' ? 'line' : r.tone}) / ${i === sel ? 0.22 : 0.1})` }}
          >
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="font-mono text-[0.7rem] text-dim">
              {hexSpaced(r.start)} – {hexSpaced(r.end)}
            </div>
          </button>
        ))}
        <div className="pb-1 text-xs text-dim">0xFFFF FFFF at the top, 0x0000 0000 at the bottom (4 GB)</div>
      </div>
      <div className="space-y-4">
        <Panel title={region.name}>
          <p className="text-[0.95rem] leading-relaxed">{region.detail}</p>
          {region.children && (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {region.children.map((c) => (
                  <tr key={c.name} className="border-b border-line/50">
                    <td className="py-1.5 pr-3 font-mono text-xs text-gold">{hexSpaced(c.start)}</td>
                    <td className="py-1.5 pr-3 font-medium">{c.name}</td>
                    <td className="py-1.5 text-dim">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Which region is this address in?">
          <input className="input w-56 font-mono" value={lookup} onChange={(e) => setLookup(e.target.value)} aria-label="Address" />
          <p className="mt-2 text-sm">
            {hit < 0 ? (
              <span className="text-bad">Not a valid hexadecimal address.</span>
            ) : (
              <>
                <span className="font-semibold text-gold">{REGIONS[hit].name}</span>
                {child && <span> → {child.name} (offset 0x{(a - child.start).toString(16).toUpperCase()})</span>}
                {((a >= 0x20000000 && a <= 0x200fffff) || (a >= 0x40000000 && a <= 0x400fffff)) && <span className="text-ok">, bit-band addressable</span>}
              </>
            )}
          </p>
        </Panel>
        <Panel title="Little-endian storage (Cortex-M default)">
          <div className="flex flex-wrap items-center gap-3">
            <input className="input w-36 font-mono" value={endianVal} onChange={(e) => setEndianVal(e.target.value)} aria-label="32-bit value" />
            <span className="text-sm text-dim">stored at 0x2000 0850:</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 font-mono text-sm">
            {bytes.map((b, i) => (
              <div key={i} className="rounded border border-line bg-raised p-2 text-center">
                <div className="text-[0.7rem] text-dim">0x2000 085{i}</div>
                <div className={i === 0 ? 'text-ch1' : ''}>0x{b.toString(16).toUpperCase().padStart(2, '0')}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">Least significant byte at the lowest address. A big-endian machine would store 0x{((ev >>> 24) & 0xff).toString(16).toUpperCase().padStart(2, '0')} first. (Valvano §3.1.3)</p>
        </Panel>
      </div>
    </div>
  );
}
