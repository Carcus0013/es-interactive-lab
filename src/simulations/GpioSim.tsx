import { useEffect, useMemo, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, Panel, PushButton, RegBits, Select, Toggle } from './kit';
import CodeBlock from '../components/CodeBlock';

type Port = 'A' | 'B' | 'C';
interface PortRegs {
  MODER: number;
  OTYPER: number;
  PUPDR: number;
  ODR: number;
}
interface Pin {
  port: Port;
  n: number;
  device: 'led-low' | 'led-high' | 'switch';
  label: string;
}

const PINS: Pin[] = [
  { port: 'C', n: 13, device: 'led-low', label: 'USER LED (PC13, active-low)' },
  { port: 'C', n: 14, device: 'led-high', label: 'LED1 (PC14)' },
  { port: 'B', n: 9, device: 'led-high', label: 'LED2 (PB9)' },
  { port: 'A', n: 0, device: 'switch', label: 'USER KEY (PA0)' },
  { port: 'B', n: 10, device: 'switch', label: 'S1 (PB10)' },
  { port: 'A', n: 6, device: 'switch', label: 'S2 (PA6)' },
];
const PORT_BIT: Record<Port, number> = { A: 0, B: 1, C: 2 };

// Reset values from RM0368 §8.4
const RESET: Record<Port, PortRegs> = {
  A: { MODER: 0xa8000000, OTYPER: 0, PUPDR: 0x64000000, ODR: 0 },
  B: { MODER: 0x00000280, OTYPER: 0, PUPDR: 0x00000100, ODR: 0 },
  C: { MODER: 0, OTYPER: 0, PUPDR: 0, ODR: 0 },
};

type Program = 'manual' | 'exp1' | 'button' | 'lab4' | 'dual' | 'blink';
const PROGRAMS: [Program, string][] = [
  ['manual', 'Manual — you write the registers'],
  ['exp1', 'EXP_1_LED_PC_13 — LED ON'],
  ['blink', 'blink.txt — blink PC13'],
  ['button', 'Button_LED.txt — PA0 key → PC13'],
  ['lab4', 'Lab 4 — PB10 switch → PC14'],
  ['dual', 'Kit manual — PB10 → PC14, PA6 → PB9'],
];

const u = (v: number) => v >>> 0;
const field = (reg: number, n: number, w: number) => (reg >>> (n * w)) & ((1 << w) - 1);

export default function GpioSim({ preset }: SimProps) {
  const [rcc, setRcc] = useState(0);
  const [regs, setRegs] = useState<Record<Port, PortRegs>>(() => structuredClone(RESET));
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<string>('C13');
  const [log, setLog] = useState<string[]>([]);
  const [warn, setWarn] = useState('');
  const [program, setProgram] = useState<Program>((['exp1', 'button', 'lab4', 'dual', 'blink'] as Program[]).includes(preset as Program) ? (preset as Program) : 'manual');
  const [noise, setNoise] = useState(0);
  const regsRef = useRef(regs);
  regsRef.current = regs;
  const rccRef = useRef(rcc);
  rccRef.current = rcc;
  const pressedRef = useRef(pressed);
  pressedRef.current = pressed;

  const pin = PINS.find((p) => p.port + p.n === sel)!;

  /* ---------- electrical model ---------- */
  const level = (p: Pin, rs = regs, pr = pressed): 0 | 1 | null => {
    const r = rs[p.port];
    const mode = field(r.MODER, p.n, 2);
    const pull = field(r.PUPDR, p.n, 2);
    if (mode === 1) {
      const out = (r.ODR >>> p.n) & 1;
      if (r.OTYPER & (1 << p.n)) return out ? (pull === 1 ? 1 : null) : 0; // open-drain: 1 = released
      return out as 0 | 1;
    }
    if (mode === 3) return null;
    if (p.device === 'switch' && pr[p.port + p.n]) return 0; // switch shorts pin to GND
    if (pull === 1) return 1;
    if (pull === 2) return 0;
    return null; // floating
  };
  const idrBit = (p: Pin, rs = regs, pr = pressed): 0 | 1 => {
    const mode = field(rs[p.port].MODER, p.n, 2);
    if (mode === 3) return 0; // analog: Schmitt trigger disabled, IDR reads 0
    const l = level(p, rs, pr);
    if (l === null) return (((noise + p.n) * 7919) % 3 === 0 ? 1 : 0) as 0 | 1; // floating: unpredictable
    return l;
  };
  const ledOn = (p: Pin, rs = regs) => {
    const r = rs[p.port];
    const mode = field(r.MODER, p.n, 2);
    if (mode !== 1) return false;
    const out = (r.ODR >>> p.n) & 1;
    const od = (r.OTYPER >>> p.n) & 1;
    if (p.device === 'led-low') return out === 0; // sinks current when low (push-pull or open-drain)
    return out === 1 && !od; // needs to source current: push-pull high
  };
  const idrOf = (port: Port) => PINS.filter((p) => p.port === port).reduce((v, p) => (idrBit(p) ? v | (1 << p.n) : v), 0);

  /* ---------- register writes (with clock gating) ---------- */
  const write = (port: Port, reg: keyof PortRegs | 'BSRR', value: (old: number) => number, code: string) => {
    if (!(rccRef.current & (1 << PORT_BIT[port]))) {
      setWarn(`GPIO${port} clock is OFF (RCC->AHB1ENR bit ${PORT_BIT[port]} = 0), so “${code}” had no effect. This is the most common reason an LED never lights.`);
      setLog((l) => [`${code}   // ignored: GPIO${port} clock off`, ...l].slice(0, 40));
      return;
    }
    setWarn('');
    setRegs((rs) => {
      const r = { ...rs[port] };
      if (reg === 'BSRR') {
        const v = u(value(0));
        r.ODR = u((r.ODR | (v & 0xffff)) & ~((v >>> 16) & ~(v & 0xffff) & 0xffff));
      } else r[reg] = u(value(r[reg]));
      return { ...rs, [port]: r };
    });
    setLog((l) => [code, ...l].slice(0, 40));
  };
  const enableClock = (port: Port, on: boolean) => {
    setRcc((v) => (on ? v | (1 << PORT_BIT[port]) : v & ~(1 << PORT_BIT[port])));
    setLog((l) => [on ? `RCC->AHB1ENR |= (1U << ${PORT_BIT[port]});   // GPIO${port} clock on` : `RCC->AHB1ENR &= ~(1U << ${PORT_BIT[port]});`, ...l].slice(0, 40));
    if (on) setWarn('');
  };
  const reset = () => {
    setRcc(0);
    setRegs(structuredClone(RESET));
    setLog([]);
    setWarn('');
  };

  /* ---------- lab programs ---------- */
  const runInit = (p: Program) => {
    reset();
    const lines: string[] = [];
    let r = structuredClone(RESET);
    let c = 0;
    const en = (port: Port) => {
      c |= 1 << PORT_BIT[port];
      lines.push(`RCC->AHB1ENR |= (1U<<${PORT_BIT[port]});`);
    };
    const out = (port: Port, n: number) => {
      r[port].MODER = u((r[port].MODER & ~(3 << (2 * n))) | (1 << (2 * n)));
      lines.push(`GPIO${port}->MODER |= (1U<<${2 * n});   // P${port}${n} output`);
    };
    const inp = (port: Port, n: number) => {
      r[port].MODER = u(r[port].MODER & ~(3 << (2 * n)));
      r[port].PUPDR = u((r[port].PUPDR & ~(3 << (2 * n))) | (1 << (2 * n)));
      lines.push(`GPIO${port}->MODER &= ~(3U<<${2 * n}); GPIO${port}->PUPDR |= (1U<<${2 * n});   // P${port}${n} input, pull-up`);
    };
    if (p === 'exp1') {
      en('C');
      out('C', 13);
      r.C.ODR &= ~(1 << 13);
      lines.push('GPIOC->ODR &= ~(1<<13);   // LED ON (active-low)');
    }
    if (p === 'blink') {
      en('C');
      out('C', 13);
    }
    if (p === 'button') {
      en('A');
      en('C');
      inp('A', 0);
      out('C', 13);
    }
    if (p === 'lab4') {
      en('B');
      en('C');
      inp('B', 10);
      out('C', 14);
    }
    if (p === 'dual') {
      en('A');
      en('B');
      en('C');
      inp('B', 10);
      inp('A', 6);
      out('C', 14);
      out('B', 9);
    }
    r = { A: { ...r.A }, B: { ...r.B }, C: { ...r.C } };
    setRcc(c);
    setRegs(r);
    setLog(lines.reverse());
  };

  useEffect(() => {
    if (program !== 'manual') runInit(program);
    else reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  // super-loop: evaluate the selected program every 60 ms
  useEffect(() => {
    if (program === 'manual' || program === 'exp1') return;
    let tick = 0;
    const id = window.setInterval(() => {
      tick++;
      const rs = regsRef.current;
      const pr = pressedRef.current;
      const get = (port: Port, n: number) => {
        const p = PINS.find((x) => x.port === port && x.n === n)!;
        return idrBit(p, rs, pr);
      };
      setRegs((cur) => {
        const next = { A: { ...cur.A }, B: { ...cur.B }, C: { ...cur.C } };
        const set = (port: Port, n: number, v: boolean) => (next[port].ODR = u(v ? next[port].ODR | (1 << n) : next[port].ODR & ~(1 << n)));
        if (program === 'blink') set('C', 13, Math.floor(tick / 8) % 2 === 0);
        if (program === 'button') set('C', 13, !get('A', 0)); // IDR high → ODR13 = 0 (LED ON); pressed → LED OFF
        if (program === 'lab4') set('C', 14, !get('B', 10));
        if (program === 'dual') {
          set('C', 14, !get('B', 10));
          set('B', 9, !get('A', 6));
        }
        return next;
      });
    }, 60);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program]);

  // floating inputs flicker
  useEffect(() => {
    const id = window.setInterval(() => setNoise((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, []);

  const r = regs[pin.port];
  const mode = field(r.MODER, pin.n, 2);
  const pull = field(r.PUPDR, pin.n, 2);
  const od = (r.OTYPER >>> pin.n) & 1;
  const odr = (r.ODR >>> pin.n) & 1;
  const lv = level(pin);
  const P = `GPIO${pin.port}`;
  const n = pin.n;

  const programCode = useMemo(() => {
    switch (program) {
      case 'button':
        return 'while (1) {\n  if (GPIOA->IDR & (1U << 0))   // key released (pull-up → 1)\n    GPIOC->ODR &= ~(1U << 13);  // LED ON\n  else\n    GPIOC->ODR |=  (1U << 13);  // LED OFF\n}';
      case 'lab4':
        return 'while (1) {\n  if (GPIOB->IDR & (1U << 10))  // S1 released\n    GPIOC->ODR &= ~(1U << 14);  // LED1 OFF\n  else\n    GPIOC->ODR |=  (1U << 14);  // LED1 ON\n}';
      case 'dual':
        return 'while (1) {\n  if (GPIOB->IDR & (1U<<10)) GPIOC->ODR &= ~(1U<<14); else GPIOC->ODR |= (1U<<14);\n  if (GPIOA->IDR & (1U<<6))  GPIOB->ODR &= ~(1U<<9);  else GPIOB->ODR |= (1U<<9);\n}';
      case 'blink':
        return 'while (1) {\n  GPIOC->ODR |= (1U<<13);   // LED OFF\n  for (int i = 0; i < 180000; i++) {}\n  GPIOC->ODR &= ~(1U<<13);  // LED ON\n  for (int i = 0; i < 180000; i++) {}\n}';
      case 'exp1':
        return '// main() ends after one write — the LED simply stays ON';
      default:
        return '';
    }
  }, [program]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <Select label="Running program" value={program} options={PROGRAMS} onChange={setProgram} />
        </div>
        <button type="button" className="btn" onClick={() => (program === 'manual' ? reset() : runInit(program))}>
          Reset MCU
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* board */}
        <Panel title="Black Pill + lab kit (click a pin to inspect it)">
          <div className="grid grid-cols-3 gap-3">
            {PINS.map((p) => {
              const id = p.port + p.n;
              const isSel = id === sel;
              const l = level(p);
              return (
                <div key={id} className={`flex flex-col items-center gap-2 rounded-md border p-2 ${isSel ? 'border-gold bg-gold/5' : 'border-line'}`}>
                  <button type="button" onClick={() => setSel(id)} className="font-mono text-sm font-semibold hover:text-gold" aria-pressed={isSel}>
                    P{id}
                  </button>
                  {p.device === 'switch' ? (
                    <PushButton
                      pressed={!!pressed[id]}
                      onDown={() => setPressed((s) => ({ ...s, [id]: true }))}
                      onUp={() => setPressed((s) => ({ ...s, [id]: false }))}
                      label={p.label.split(' (')[0]}
                    />
                  ) : (
                    <LedBulb on={ledOn(p)} label={p.label.split(' (')[0]} color={p.device === 'led-low' ? 'ch2' : 'led'} />
                  )}
                  <span className={`font-mono text-xs ${l === null ? 'text-warn' : l ? 'text-ch1' : 'text-dim'}`}>{l === null ? (field(regs[p.port].MODER, p.n, 2) === 3 ? 'analog' : 'floating') : l ? 'HIGH' : 'LOW'}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {(['A', 'B', 'C'] as Port[]).map((p) => (
              <Toggle key={p} label={<span className="font-mono">GPIO{p} clock</span>} checked={!!(rcc & (1 << PORT_BIT[p]))} onChange={(v) => enableClock(p, v)} />
            ))}
          </div>
        </Panel>

        {/* pin configuration */}
        <Panel title={`Configure P${sel} — ${pin.label}`}>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={`MODER${n} (bits ${2 * n + 1}:${2 * n})`}
              value={mode}
              options={[
                [0, '00 Input'],
                [1, '01 Output'],
                [2, '10 Alternate fn'],
                [3, '11 Analog'],
              ]}
              onChange={(v) => write(pin.port, 'MODER', (o) => (o & ~(3 << (2 * n))) | (v << (2 * n)), `${P}->MODER = (${P}->MODER & ~(3U<<${2 * n})) | (${v}U<<${2 * n});`)}
            />
            <Select
              label={`PUPDR${n}`}
              value={pull}
              options={[
                [0, '00 No pull'],
                [1, '01 Pull-up'],
                [2, '10 Pull-down'],
              ]}
              onChange={(v) => write(pin.port, 'PUPDR', (o) => (o & ~(3 << (2 * n))) | (v << (2 * n)), `${P}->PUPDR = (${P}->PUPDR & ~(3U<<${2 * n})) | (${v}U<<${2 * n});`)}
            />
            <Select
              label={`OTYPER${n}`}
              value={od}
              options={[
                [0, '0 Push-pull'],
                [1, '1 Open-drain'],
              ]}
              onChange={(v) => write(pin.port, 'OTYPER', (o) => (v ? o | (1 << n) : o & ~(1 << n)), v ? `${P}->OTYPER |= (1U<<${n});` : `${P}->OTYPER &= ~(1U<<${n});`)}
            />
            <div className="text-sm">
              <div className="text-dim">Pin state</div>
              <div className="mt-1 font-mono">
                ODR{n} = {odr}, IDR{n} = {idrBit(pin)}, pin {lv === null ? 'floating' : lv ? 'HIGH' : 'LOW'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => write(pin.port, 'ODR', (o) => o | (1 << n), `${P}->ODR |= (1U<<${n});`)}>
              ODR |= set
            </button>
            <button type="button" className="btn" onClick={() => write(pin.port, 'ODR', (o) => o & ~(1 << n), `${P}->ODR &= ~(1U<<${n});`)}>
              ODR &= ~ clear
            </button>
            <button type="button" className="btn" onClick={() => write(pin.port, 'ODR', (o) => o ^ (1 << n), `${P}->ODR ^= (1U<<${n});`)}>
              ODR ^= toggle
            </button>
            <button type="button" className="btn" onClick={() => write(pin.port, 'BSRR', () => 1 << n, `${P}->BSRR = (1U<<${n});        // atomic set`)}>
              BSRR set
            </button>
            <button type="button" className="btn" onClick={() => write(pin.port, 'BSRR', () => 1 << (n + 16), `${P}->BSRR = (1U<<${n + 16});       // atomic reset`)}>
              BSRR reset
            </button>
          </div>
          {program !== 'manual' && <p className="mt-2 text-xs text-warn">A program is running its super-loop and will overwrite ODR. Choose “Manual” to drive pins yourself.</p>}
          {warn && <p className="mt-3 rounded border border-bad/50 bg-bad/10 p-2 text-sm text-bad">{warn}</p>}
          <p className="mt-3 text-xs leading-relaxed text-dim">
            {pin.device === 'led-low' && 'PC13 LED: 3.3 V → resistor → LED → pin. It lights when the pin is driven LOW (sinks current).'}
            {pin.device === 'led-high' && 'Kit LED: pin → resistor → LED → GND. It lights only when the pin is a push-pull output driven HIGH.'}
            {pin.device === 'switch' && 'Switch: pressing it connects the pin to GND. Without a pull-up, a released switch leaves the input floating (IDR flickers).'}
          </p>
        </Panel>
      </div>

      <Panel title={`GPIO${pin.port} registers — bits for P${sel} highlighted`}>
        <div className="space-y-3">
          <RegBits name={`GPIO${pin.port}_MODER`} value={r.MODER} groupSize={2} highlight={[2 * n, 2 * n + 1]} />
          <RegBits name={`GPIO${pin.port}_PUPDR`} value={r.PUPDR} groupSize={2} highlight={[2 * n, 2 * n + 1]} />
          <RegBits name={`GPIO${pin.port}_ODR`} value={r.ODR} bits={16} highlight={[n]} />
          <RegBits name={`GPIO${pin.port}_IDR (read-only)`} value={idrOf(pin.port)} bits={16} highlight={[n]} />
          <RegBits name="RCC_AHB1ENR" value={rcc} bits={8} highlight={[PORT_BIT[pin.port]]} />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {programCode && <CodeBlock code={programCode} title="super-loop being executed" showLineNumbers={false} />}
        <Panel title="Statements executed (newest first)">
          {log.length === 0 ? (
            <p className="text-sm text-dim">Nothing yet — enable a clock and configure a pin.</p>
          ) : (
            <ol className="max-h-56 space-y-0.5 overflow-auto font-mono text-[0.78rem]">
              {log.map((l, i) => (
                <li key={i} className={l.includes('ignored') ? 'text-bad' : i === 0 ? 'text-gold' : 'text-ink/80'}>
                  {l}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
