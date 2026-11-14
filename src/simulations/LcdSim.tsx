import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Select } from './kit';

interface Lcd {
  ddram: number[]; // 0x00-0x27 line 1, 0x40-0x67 line 2 (stored as 0..79 compact index)
  ac: number; // address counter (real DDRAM address)
  inc: boolean;
  display: boolean;
  cursor: boolean;
  blink: boolean;
  fourBit: boolean;
  lines2: boolean;
}
const blank = (): Lcd => ({ ddram: Array(80).fill(32), ac: 0, inc: true, display: false, cursor: false, blink: false, fourBit: false, lines2: false });
const idx = (a: number) => (a >= 0x40 ? 40 + (a - 0x40) : a);
const nextAddr = (a: number, inc: boolean) => {
  if (inc) return a === 0x27 ? 0x40 : a === 0x67 ? 0x00 : a + 1;
  return a === 0x00 ? 0x67 : a === 0x40 ? 0x27 : a - 1;
};

function describe(cmd: number): string {
  if (cmd === 0x01) return 'Clear display: fill DDRAM with spaces, cursor home (needs ~1.52 ms).';
  if ((cmd & 0xfe) === 0x02) return 'Return home: address counter = 0.';
  if ((cmd & 0xfc) === 0x04) return `Entry mode: cursor ${cmd & 2 ? 'increments' : 'decrements'} after each character${cmd & 1 ? ', display shifts' : ''}.`;
  if ((cmd & 0xf8) === 0x08) return `Display ${cmd & 4 ? 'ON' : 'OFF'}, cursor ${cmd & 2 ? 'ON' : 'OFF'}, blink ${cmd & 1 ? 'ON' : 'OFF'}.`;
  if ((cmd & 0xe0) === 0x20) return `Function set: ${cmd & 0x10 ? '8-bit' : '4-bit'} interface, ${cmd & 8 ? '2 lines' : '1 line'}, ${cmd & 4 ? '5×10' : '5×8'} font.`;
  if (cmd & 0x80) return `Set DDRAM address 0x${(cmd & 0x7f).toString(16).toUpperCase()} → row ${(cmd & 0x7f) >= 0x40 ? 1 : 0}, column ${(cmd & 0x7f) % 0x40}.`;
  if (cmd === 0x33 || cmd === 0x32) return 'Initialisation nibbles that force the controller into 4-bit mode.';
  return 'Other instruction.';
}

export default function LcdSim({ preset }: SimProps) {
  const [lcd, setLcd] = useState<Lcd>(() => (preset === 'ready' ? { ...blank(), display: true, fourBit: true, lines2: true } : blank()));
  const [text, setText] = useState('Hello STM32');
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [trace, setTrace] = useState<{ label: string; bytes: number[]; note: string }[]>([]);

  const bytesFor = (v: number, rs: 0 | 1) => {
    const hi = v & 0xf0;
    const lo = (v << 4) & 0xf0;
    const en = rs ? 0x0d : 0x0c;
    const dis = rs ? 0x09 : 0x08;
    return [hi | en, hi | dis, lo | en, lo | dis];
  };

  const apply = (l: Lcd, v: number, rs: 0 | 1): Lcd => {
    const n = { ...l, ddram: [...l.ddram] };
    if (rs) {
      n.ddram[idx(n.ac)] = v;
      n.ac = nextAddr(n.ac, n.inc);
      return n;
    }
    if (v === 0x01) {
      n.ddram = Array(80).fill(32);
      n.ac = 0;
      n.inc = true;
    } else if ((v & 0xfe) === 0x02) n.ac = 0;
    else if ((v & 0xfc) === 0x04) n.inc = !!(v & 2);
    else if ((v & 0xf8) === 0x08) {
      n.display = !!(v & 4);
      n.cursor = !!(v & 2);
      n.blink = !!(v & 1);
    } else if ((v & 0xe0) === 0x20) {
      n.fourBit = !(v & 0x10);
      n.lines2 = !!(v & 8);
    } else if (v & 0x80) n.ac = v & 0x7f;
    else if (v === 0x33 || v === 0x32) n.fourBit = v === 0x32;
    return n;
  };

  const send = (items: { v: number; rs: 0 | 1; label?: string }[]) => {
    let l = lcd;
    const tr: typeof trace = [];
    for (const it of items) {
      l = apply(l, it.v, it.rs);
      tr.push({ label: it.label ?? (it.rs ? `LCD_SendData('${String.fromCharCode(it.v)}')` : `LCD_SendCmd(0x${it.v.toString(16).toUpperCase().padStart(2, '0')})`), bytes: bytesFor(it.v, it.rs), note: it.rs ? `write 0x${it.v.toString(16).toUpperCase()} '${String.fromCharCode(it.v)}' to DDRAM, address counter ${l.inc ? '+1' : '−1'}` : describe(it.v) });
    }
    setLcd(l);
    setTrace((t) => [...tr.reverse(), ...t].slice(0, 30));
  };
  const cmd = (v: number) => send([{ v, rs: 0 }]);
  const initSeq = () => send([0x33, 0x32, 0x28, 0x0c, 0x06, 0x01].map((v) => ({ v, rs: 0 as const })));
  const print = (s: string) => send([...s].map((c) => ({ v: c.charCodeAt(0) & 0xff, rs: 1 as const })));
  const labProgram = () => {
    const val = String(Math.floor(Math.random() * 4096));
    send([
      ...[0x33, 0x32, 0x28, 0x0c, 0x06, 0x01].map((v) => ({ v, rs: 0 as const })),
      { v: 0x01, rs: 0 },
      { v: 0x80, rs: 0, label: 'LCD_SetCursor(0,0) → cmd 0x80' },
      ...[...'POT Value:'].map((c) => ({ v: c.charCodeAt(0), rs: 1 as const })),
      { v: 0xc0, rs: 0, label: 'LCD_SetCursor(1,0) → cmd 0xC0' },
      ...[...val].map((c) => ({ v: c.charCodeAt(0), rs: 1 as const })),
    ]);
  };

  const cursorIdx = idx(lcd.ac);
  const cell = (r: number, c: number) => {
    const i = r * 40 + c;
    const ch = lcd.ddram[i];
    const isCur = lcd.display && lcd.cursor && cursorIdx === i;
    return (
      <div key={c} className={`relative flex h-9 w-6 items-center justify-center rounded-[2px] font-mono text-lg sm:w-7 ${lcd.display ? 'bg-[#3b5d1c] text-[#d9f5b0]' : 'bg-[#2a3a1e] text-transparent'}`}>
        {ch !== 32 ? String.fromCharCode(ch) : ''}
        {isCur && <span className="absolute bottom-1 left-1 right-1 h-0.5 bg-[#d9f5b0]" />}
        {lcd.display && lcd.blink && cursorIdx === i && <span className="absolute inset-0.5 animate-blink bg-[#d9f5b0]/60" />}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-4 border-[#1d2a12] bg-[#25361a] p-3">
        {[0, 1].map((r) => (
          <div key={r} className="flex gap-1 overflow-x-auto py-0.5">
            {Array.from({ length: 16 }, (_, c) => cell(r, c))}
          </div>
        ))}
      </div>
      {!lcd.display && <p className="text-sm text-warn">Display is OFF (power-on state). Run the init sequence or send 0x0C.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Commands">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-gold" onClick={initSeq}>
              LCD_Init()
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x01)}>
              0x01 Clear
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x02)}>
              0x02 Home
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x0c)}>
              0x0C On, no cursor
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x0e)}>
              0x0E Cursor on
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x0f)}>
              0x0F Blink
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x08)}>
              0x08 Display off
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x06)}>
              0x06 Increment
            </button>
            <button type="button" className="btn" onClick={() => cmd(0x04)}>
              0x04 Decrement
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Select label="Row" value={row} options={[[0, '0'], [1, '1']]} onChange={setRow} />
            <Select label="Column" value={col} options={Array.from({ length: 16 }, (_, i) => [i, String(i)] as [number, string])} onChange={setCol} />
            <button type="button" className="btn" onClick={() => send([{ v: (row === 0 ? 0x80 : 0xc0) + col, rs: 0, label: `LCD_SetCursor(${row},${col}) → cmd 0x${((row === 0 ? 0x80 : 0xc0) + col).toString(16).toUpperCase()}` }])}>
              LCD_SetCursor
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-dim">Characters</span>
              <input className="input font-mono" value={text} maxLength={40} onChange={(e) => setText(e.target.value)} />
            </label>
            <button type="button" className="btn-gold" onClick={() => print(text)}>
              LCD_Print()
            </button>
          </div>
          <button type="button" className="btn mt-4" onClick={labProgram}>
            Run the lab program once (POT Value)
          </button>
        </Panel>
        <Panel title="Controller state">
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Address counter (DDRAM)" value={`0x${lcd.ac.toString(16).toUpperCase().padStart(2, '0')}`} sub={`row ${lcd.ac >= 0x40 ? 1 : 0}, col ${lcd.ac % 0x40}`} />
            <Readout label="Interface" value={lcd.fourBit ? '4-bit' : '8-bit'} sub={lcd.lines2 ? '2 lines' : '1 line'} />
            <Readout label="Entry mode" value={lcd.inc ? 'increment' : 'decrement'} />
            <Readout label="Display / cursor / blink" value={`${lcd.display ? 'on' : 'off'} / ${lcd.cursor ? 'on' : 'off'} / ${lcd.blink ? 'on' : 'off'}`} />
          </div>
          <p className="mt-3 text-xs text-dim">Line 1 DDRAM starts at 0x00 (command 0x80), line 2 at 0x40 (command 0xC0). PCF8574 bits: P0 RS, P1 RW, P2 EN, P3 backlight, P4–P7 D4–D7.</p>
        </Panel>
      </div>
      <Panel title="I²C traffic (newest first) — each byte is one START, 0x4E, byte, STOP transaction in the lab code">
        {trace.length === 0 ? (
          <p className="text-sm text-dim">Send a command to see the four PCF8574 bytes per LCD byte: high nibble with EN = 1, high nibble with EN = 0, then the low nibble the same way.</p>
        ) : (
          <ol className="max-h-72 space-y-1 overflow-auto font-mono text-[0.78rem]">
            {trace.map((t, i) => (
              <li key={i} className={i === 0 ? 'text-gold' : 'text-ink/80'}>
                <span className="inline-block min-w-[15rem]">{t.label}</span>
                <span className="text-ch2">{t.bytes.map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}</span>
                <span className="ml-2 font-sans text-dim">{t.note}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
