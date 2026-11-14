import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { useStepper } from '../hooks/useStepper';
import Player from '../components/Player';
import { Panel, Readout, Select, Toggle } from './kit';

type Parity = 'none' | 'even' | 'odd';
interface Bit {
  lv: 0 | 1;
  kind: 'idle' | 'start' | 'data' | 'parity' | 'stop';
  idx?: number;
  ch: number; // character index
}

export function brr(fck: number, baud: number, over8: boolean) {
  const div = fck / ((over8 ? 8 : 16) * baud);
  const mant = Math.floor(div);
  let frac = Math.round((div - mant) * (over8 ? 8 : 16));
  let m = mant;
  if (frac === (over8 ? 8 : 16)) {
    m += 1;
    frac = 0;
  }
  const reg = (m << 4) | (over8 ? frac & 7 : frac & 15);
  const actual = fck / ((over8 ? 8 : 16) * (m + frac / (over8 ? 8 : 16)));
  return { div, mant: m, frac, reg, actual, err: ((actual - baud) / baud) * 100 };
}

export default function UartSim({ preset }: SimProps) {
  const [msg, setMsg] = useState(preset === 'string' ? 'Embedded Systems' : preset === 'char' ? 'V' : 'Hi');
  const [baud, setBaud] = useState(preset === 'echo' ? 9600 : 115200);
  const [parity, setParity] = useState<Parity>('none');
  const [stop, setStop] = useState(1);
  const [over8, setOver8] = useState(false);
  const [fck, setFck] = useState(16_000_000);

  const text = msg.slice(0, 24);
  const bits = useMemo(() => {
    const out: Bit[] = [{ lv: 1, kind: 'idle', ch: -1 }, { lv: 1, kind: 'idle', ch: -1 }];
    [...text].forEach((c, ci) => {
      const code = c.charCodeAt(0) & 0xff;
      out.push({ lv: 0, kind: 'start', ch: ci });
      let ones = 0;
      for (let i = 0; i < 8; i++) {
        const b = ((code >> i) & 1) as 0 | 1;
        ones += b;
        out.push({ lv: b, kind: 'data', idx: i, ch: ci });
      }
      if (parity !== 'none') out.push({ lv: (parity === 'even' ? ones % 2 : (ones + 1) % 2) as 0 | 1, kind: 'parity', ch: ci });
      for (let k = 0; k < stop; k++) out.push({ lv: 1, kind: 'stop', ch: ci });
    });
    out.push({ lv: 1, kind: 'idle', ch: -1 }, { lv: 1, kind: 'idle', ch: -1 });
    return out;
  }, [text, parity, stop]);

  const s = useStepper(bits.length, { interval: 260 });
  const cur = bits[s.step];
  const frameLen = 1 + 8 + (parity !== 'none' ? 1 : 0) + stop;
  const b = brr(fck, baud, over8);
  const bitTime = 1e6 / baud;

  // receiver: characters whose stop bit has passed
  const received = useMemo(() => {
    let r = '';
    for (let ci = 0; ci < text.length; ci++) {
      let lastIdx = -1;
      bits.forEach((x, i) => {
        if (x.ch === ci) lastIdx = i;
      });
      if (lastIdx <= s.step) r += text[ci];
    }
    return r;
  }, [bits, s.step, text]);
  const partial = cur && cur.ch >= 0 ? bits.filter((x, i) => i <= s.step && x.ch === cur.ch && x.kind === 'data') : [];
  const shiftReg = partial.map((x) => x.lv).reverse().join('').padStart(8, '·');

  // visible window of ~28 bits around the cursor
  const winStart = Math.max(0, Math.min(s.step - 10, bits.length - 28));
  const win = bits.slice(winStart, winStart + 28);
  const W = 700;
  const bw = W / 28;
  let d = '';
  win.forEach((x, i) => {
    const y = x.lv ? 18 : 62;
    d += `${i ? 'L' : 'M'}${i * bw} ${y} L${(i + 1) * bw} ${y} `;
  });
  const color = (k: Bit['kind']) => (k === 'start' || k === 'stop' ? 'rgb(var(--gold))' : k === 'parity' ? 'rgb(var(--ch3))' : k === 'data' ? 'rgb(var(--ch1))' : 'rgb(var(--dim))');
  const txe = !cur || cur.kind === 'idle' || cur.kind === 'start' || (cur.kind === 'data' && (cur.idx ?? 0) > 0) || cur.kind === 'parity' || cur.kind === 'stop';
  const tc = !cur || cur.kind === 'idle';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm lg:col-span-2">
          <span className="text-dim">Message to send (USART2-&gt;DR, one byte at a time)</span>
          <input className="input font-mono" value={msg} maxLength={24} onChange={(e) => { setMsg(e.target.value); s.restart(); }} />
        </label>
        <Select
          label="Baud rate"
          value={baud}
          options={[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((v) => [v, String(v)] as [number, string])}
          onChange={setBaud}
        />
        <Select
          label="Parity (CR1.PCE/PS)"
          value={parity}
          options={[
            ['none', 'None'],
            ['even', 'Even'],
            ['odd', 'Odd'],
          ]}
          onChange={(v) => { setParity(v); s.restart(); }}
        />
        <Select
          label="Stop bits (CR2.STOP)"
          value={stop}
          options={[
            [1, '1'],
            [2, '2'],
          ]}
          onChange={(v) => { setStop(v); s.restart(); }}
        />
      </div>
      <Player s={s} label="Bit time" />

      <Panel title="TX line (PA2) → RX of the USB-TTL adapter — slowed down">
        <svg viewBox={`0 0 ${W} 110`} className="h-auto w-full" role="img" aria-label="UART waveform">
          {win.map((x, i) => (
            <g key={i}>
              {winStart + i === s.step && <rect x={i * bw} y={8} width={bw} height={64} fill="rgb(var(--gold) / 0.18)" />}
              <text x={i * bw + bw / 2} y={88} fontSize={9.5} textAnchor="middle" fill={color(x.kind)} fontFamily="monospace">
                {x.kind === 'data' ? `D${x.idx}` : x.kind === 'start' ? 'ST' : x.kind === 'stop' ? 'SP' : x.kind === 'parity' ? 'P' : ''}
              </text>
              {x.kind === 'start' && (
                <text x={i * bw + 2} y={104} fontSize={10} fill="rgb(var(--ink))">
                  '{text[x.ch]}' 0x{text.charCodeAt(x.ch).toString(16).toUpperCase()}
                </text>
              )}
            </g>
          ))}
          <path d={d} fill="none" stroke="rgb(var(--ch1))" strokeWidth={2.2} />
          <text x={2} y={12} fontSize={9} fill="rgb(var(--dim))">
            1
          </text>
          <text x={2} y={70} fontSize={9} fill="rgb(var(--dim))">
            0
          </text>
        </svg>
        <div className="mt-2 grid gap-3 sm:grid-cols-4">
          <Readout label="Current bit" value={cur ? (cur.kind === 'data' ? `D${cur.idx} = ${cur.lv}` : `${cur.kind} = ${cur.lv}`) : '—'} tone="gold" />
          <Readout label="RX shift register" value={<span className="text-sm">{shiftReg}</span>} sub="fills LSB first" />
          <Readout label="Received (RDR → DR)" value={<span className="text-sm">{received || '—'}</span>} tone="ok" />
          <div className="flex flex-col gap-1 rounded border border-line bg-mask/50 px-3 py-2 text-sm">
            <span className={txe ? 'text-ok' : 'text-dim'}>TXE (SR bit 7) = {txe ? 1 : 0}</span>
            <span className={tc ? 'text-ok' : 'text-dim'}>TC (SR bit 6) = {tc ? 1 : 0}</span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Baud-rate register (USART_BRR)">
          <div className="mb-3 flex flex-wrap gap-4">
            <Select
              label="f_ck (APB1)"
              value={fck}
              options={[
                [16_000_000, '16 MHz (HSI)'],
                [42_000_000, '42 MHz'],
              ]}
              onChange={setFck}
            />
            <div className="flex items-end">
              <Toggle label="OVER8 = 1 (oversample ×8)" checked={over8} onChange={setOver8} />
            </div>
          </div>
          <div className="space-y-1 font-mono text-[0.86rem]">
            <div>
              USARTDIV = f_ck / ({over8 ? 8 : 16} × baud) = {fck / 1e6} MHz / ({over8 ? 8 : 16} × {baud}) = {b.div.toFixed(4)}
            </div>
            <div>
              Mantissa = {b.mant} = 0x{b.mant.toString(16).toUpperCase().padStart(3, '0')} (bits 15:4)
            </div>
            <div>
              Fraction = round({(b.div - Math.floor(b.div)).toFixed(4)} × {over8 ? 8 : 16}) = {b.frac} = 0x{b.frac.toString(16).toUpperCase()} ({over8 ? 'bits 2:0, bit 3 = 0' : 'bits 3:0'})
            </div>
            <div className="text-ok">BRR = 0x{b.reg.toString(16).toUpperCase().padStart(4, '0')}</div>
            <div className="text-dim">
              actual baud {b.actual.toFixed(1)} → error {b.err.toFixed(3)} %
            </div>
          </div>
        </Panel>
        <Panel title="Frame timing">
          <div className="grid grid-cols-2 gap-2">
            <Readout label="1 bit time" value={`${bitTime.toFixed(2)} µs`} sub="1 / baud" />
            <Readout label="Bits per character" value={frameLen} sub={`start + 8 data${parity !== 'none' ? ' + parity' : ''} + ${stop} stop`} />
            <Readout label="Time per character" value={`${((frameLen * 1e3) / baud).toFixed(3)} ms`} />
            <Readout label="Max throughput" value={`${Math.floor(baud / frameLen)} char/s`} />
          </div>
          <p className="mt-2 text-xs text-dim">The receiver samples each bit {over8 ? 8 : 16} times and takes a majority vote of the middle samples ({over8 ? '4, 5, 6' : '8, 9, 10'}); disagreement sets the noise flag NE.</p>
        </Panel>
      </div>
    </div>
  );
}
