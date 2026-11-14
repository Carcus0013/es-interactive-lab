import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, RegBits, Select, bin, hex } from './kit';
import { Callout } from '../components/Markdown';

type Op = 'set' | 'clear' | 'toggle' | 'assign' | 'bsrr-set' | 'bsrr-reset' | 'field';

const OPS: [Op, string][] = [
  ['set', 'REG |= (1U << n)   — set bit n'],
  ['clear', 'REG &= ~(1U << n)  — clear bit n'],
  ['toggle', 'REG ^= (1U << n)   — toggle bit n'],
  ['assign', 'REG = (1U << n)    — direct assignment'],
  ['field', 'REG = (REG & ~(3U << 2n)) | (v << 2n) — write a 2-bit field'],
  ['bsrr-set', 'BSRR = (1U << n)   — atomic set (GPIO only)'],
  ['bsrr-reset', 'BSRR = (1U << (n+16)) — atomic reset (GPIO only)'],
];

export default function BitsSim({ preset }: SimProps) {
  const [reg, setReg] = useState(preset === 'pyq' ? 0x000000f2 : 0x0000_2a64);
  const [n, setN] = useState(preset === 'pyq' ? 5 : 6);
  const [op, setOp] = useState<Op>(preset === 'pyq' ? 'clear' : 'set');
  const [fieldVal, setFieldVal] = useState(1);
  const [history, setHistory] = useState<{ code: string; before: number; after: number }[]>([]);
  const [lastChanged, setLastChanged] = useState<number[]>([]);

  const mask = (1 << n) >>> 0;
  const compute = (): { after: number; code: string; maskShown: number; maskLabel: string } => {
    switch (op) {
      case 'set':
        return { after: (reg | mask) >>> 0, code: `REG |= (1U << ${n});`, maskShown: mask, maskLabel: `(1U << ${n})` };
      case 'clear':
        return { after: (reg & ~mask) >>> 0, code: `REG &= ~(1U << ${n});`, maskShown: ~mask >>> 0, maskLabel: `~(1U << ${n})` };
      case 'toggle':
        return { after: (reg ^ mask) >>> 0, code: `REG ^= (1U << ${n});`, maskShown: mask, maskLabel: `(1U << ${n})` };
      case 'assign':
        return { after: mask, code: `REG = (1U << ${n});`, maskShown: mask, maskLabel: `(1U << ${n})` };
      case 'field': {
        const sh = 2 * (n % 16);
        const m2 = (3 << sh) >>> 0;
        return { after: ((reg & ~m2) | ((fieldVal & 3) << sh)) >>> 0, code: `REG = (REG & ~(3U << ${sh})) | (${fieldVal}U << ${sh});`, maskShown: ~m2 >>> 0, maskLabel: `~(3U << ${sh})` };
      }
      case 'bsrr-set':
        return { after: (reg | ((1 << (n % 16)) >>> 0)) >>> 0, code: `GPIOx->BSRR = (1U << ${n % 16});`, maskShown: (1 << (n % 16)) >>> 0, maskLabel: 'BSRR value' };
      case 'bsrr-reset':
        return { after: (reg & ~((1 << (n % 16)) >>> 0)) >>> 0, code: `GPIOx->BSRR = (1U << ${(n % 16) + 16});`, maskShown: (1 << ((n % 16) + 16)) >>> 0, maskLabel: 'BSRR value' };
    }
  };
  const r = compute();
  const changed = Array.from({ length: 32 }, (_, i) => i).filter((i) => ((reg >>> i) & 1) !== ((r.after >>> i) & 1));

  const apply = () => {
    setHistory((h) => [{ code: r.code, before: reg, after: r.after }, ...h].slice(0, 12));
    setLastChanged(changed);
    setReg(r.after);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Operation" value={op} options={OPS} onChange={setOp} />
        <Select label={op === 'field' ? 'Pin n (field = bits 2n+1:2n)' : 'Bit n'} value={n} options={Array.from({ length: op.startsWith('bsrr') || op === 'field' ? 16 : 32 }, (_, i) => [i, String(i)] as [number, string])} onChange={setN} />
        {op === 'field' && (
          <Select
            label="Field value v"
            value={fieldVal}
            options={[
              [0, '00 input'],
              [1, '01 output'],
              [2, '10 alternate'],
              [3, '11 analog'],
            ]}
            onChange={setFieldVal}
          />
        )}
      </div>
      <Panel title="Before → mask → after (click bits of the register to change its starting value)">
        <div className="space-y-3">
          <RegBits name="REG (before)" value={reg} onToggle={(b) => setReg((v) => (v ^ (1 << b)) >>> 0)} highlight={op === 'field' ? [2 * (n % 16), 2 * (n % 16) + 1] : [op.startsWith('bsrr') ? n % 16 : n]} />
          <RegBits name={`mask ${r.maskLabel}`} value={r.maskShown} />
          <RegBits name="REG (after)" value={r.after} changed={changed} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded bg-raised px-2 py-1 font-mono text-sm text-ch2">{r.code}</code>
          <span className="text-sm text-dim">
            {changed.length === 0 ? 'No bit changes.' : `${changed.length} bit${changed.length > 1 ? 's' : ''} change: ${changed.sort((a, b) => b - a).join(', ')}`}
          </span>
          <button type="button" className="btn-gold ml-auto" onClick={apply}>
            Execute
          </button>
        </div>
        {op === 'assign' && changed.filter((b) => b !== n).length > 0 && (
          <p className="mt-3 rounded border border-bad/50 bg-bad/10 p-2 text-sm text-bad">
            Direct assignment wiped {changed.filter((b) => b !== n).length} other bit(s) that were already set. In a control register those bits enable other hardware features — they would all be switched off.
          </p>
        )}
        {lastChanged.length > 0 && <p className="mt-2 text-xs text-dim">Last executed changed bit(s): {lastChanged.join(', ')}</p>}
      </Panel>
      <Callout kind="exam" title="Read-modify-write in one line">
        <p>
          «REG |= m» is really three steps: read REG, OR with m, write back. OR with 1 forces a bit to 1, AND with 0 forces a bit to 0, XOR with 1 flips it; every other bit is ANDed with 1 / ORed with 0 and stays as it was. «REG = m» skips the read, so every bit not in m becomes 0.
        </p>
      </Callout>
      {history.length > 0 && (
        <Panel title="History">
          <ol className="space-y-1 font-mono text-xs">
            {history.map((h, i) => (
              <li key={i} className="flex flex-wrap gap-x-3">
                <span className="text-ch2">{h.code}</span>
                <span className="text-dim">
                  {hex(h.before)} → {hex(h.after)}
                </span>
                <span className="hidden text-dim/60 md:inline">{bin(h.after, 16)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
