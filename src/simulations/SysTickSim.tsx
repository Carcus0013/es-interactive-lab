import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, NumberField, Panel, Readout, RegBits, Select, Toggle, hex } from './kit';
import { ClockControls } from '../components/Player';

/**
 * Register-accurate SysTick: VAL counts LOAD → 0; on the 1 → 0 transition COUNTFLAG is set and,
 * if TICKINT = 1, the SysTick exception is pended. On the next clock VAL reloads from LOAD.
 * Reading CTRL clears COUNTFLAG. Writing VAL clears VAL and COUNTFLAG.
 */
export default function SysTickSim({ preset }: SimProps) {
  const [hclk, setHclk] = useState(16_000_000);
  const [load, setLoad] = useState(preset === 'pyq84' ? 10499 : 15);
  const [val, setVal] = useState(0);
  const [enable, setEnable] = useState(false);
  const [tickint, setTickint] = useState(preset === 'interrupt');
  const [clksrc, setClksrc] = useState(preset === 'pyq84' ? 0 : 1);
  const [countflag, setCountflag] = useState(false);
  const [led, setLed] = useState(false);
  const [isrCount, setIsrCount] = useState(0);
  const [inIsr, setInIsr] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const st = useRef({ val, countflag, enable, tickint, load });
  st.current = { val, countflag, enable, tickint, load };

  // target delay calculator
  const [delayMs, setDelayMs] = useState(1);
  const f = clksrc ? hclk : hclk / 8;
  const n = Math.round((delayMs / 1000) * f);
  const fits = n - 1 <= 0xffffff && n >= 1;

  const ctrl = (enable ? 1 : 0) | (tickint ? 2 : 0) | (clksrc ? 4 : 0) | (countflag ? 1 << 16 : 0);

  const clockTick = () => {
    const s = st.current;
    if (!s.enable) return;
    if (s.val === 0) {
      setVal(s.load); // reload
      return;
    }
    if (s.val === 1) {
      setVal(0);
      setCountflag(true);
      if (s.tickint) {
        setInIsr(true);
        setIsrCount((c) => c + 1);
        setLed((l) => !l);
        setLog((l) => ['SysTick_Handler(): GPIOC->ODR ^= (1<<14);   // exception taken', ...l].slice(0, 12));
        window.setTimeout(() => setInIsr(false), 350);
      }
      return;
    }
    setVal(s.val - 1);
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(clockTick, 260 / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const readCtrl = () => {
    const was = countflag;
    setCountflag(false);
    if (was && !tickint) {
      setLed((l) => !l);
      setLog((l) => ['if (SysTick->CTRL & 0x10000) → COUNTFLAG was 1 (now cleared) → GPIOC->ODR ^= (1<<14);', ...l].slice(0, 12));
    } else setLog((l) => [`read SysTick->CTRL = ${hex(ctrl)} → COUNTFLAG ${was ? 'was 1, now cleared' : '= 0, nothing to do'}`, ...l].slice(0, 12));
  };

  // polling program: main loop reads CTRL continuously when not using the interrupt
  useEffect(() => {
    if (!enable || tickint || !countflag) return;
    const id = window.setTimeout(readCtrl, 120);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countflag, enable, tickint]);

  const init = () => {
    setVal(0);
    setCountflag(false);
    setEnable(true);
    setLog((l) => [`SysTick->LOAD = ${load}; SysTick->VAL = 0; SysTick->CTRL = ${(tickint ? 2 : 0) | (clksrc ? 4 : 0) | 1};`, ...l].slice(0, 12));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="HCLK"
          value={hclk}
          options={[
            [16_000_000, '16 MHz (HSI, lab)'],
            [84_000_000, '84 MHz (PLL)'],
          ]}
          onChange={setHclk}
        />
        <NumberField label="LOAD (RELOAD)" value={load} min={1} max={0xffffff} onChange={setLoad} hint="slow demo: try 15" />
        <div className="flex flex-col justify-end gap-1.5">
          <Toggle label="TICKINT (interrupt)" checked={tickint} onChange={setTickint} />
          <Toggle label="CLKSOURCE = processor clock" checked={!!clksrc} onChange={(v) => setClksrc(v ? 1 : 0)} />
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <button type="button" className="btn-gold" onClick={init}>
            Run init sequence
          </button>
          <button type="button" className="btn" onClick={() => setEnable(false)}>
            ENABLE = 0
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_15rem]">
        <Panel title="24-bit down-counter (slowed down)">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-xs text-dim">
                <span>0</span>
                <span>VAL = {val}</span>
                <span>LOAD = {load}</span>
              </div>
              <div className="h-8 overflow-hidden rounded border border-line bg-raised">
                <div className="h-full bg-ch1/60 transition-[width] duration-200" style={{ width: `${(val / Math.max(1, load)) * 100}%` }} />
              </div>
            </div>
            <div className={`rounded border px-3 py-1 text-sm ${countflag ? 'border-ch3 bg-ch3/20 text-ch3' : 'border-line text-dim'}`}>COUNTFLAG {countflag ? 1 : 0}</div>
          </div>
          <div className="mt-4 space-y-3">
            <RegBits name="STK_CTRL" value={ctrl} bits={17} highlight={[0, 1, 2, 16]} labels={(b) => ({ 0: 'ENABLE', 1: 'TICKINT', 2: 'CLKSOURCE', 16: 'COUNTFLAG' } as Record<number, string>)[b]} />
            <RegBits name="STK_VAL" value={val} bits={24} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => { setVal(0); setCountflag(false); setIsrCount(0); setLog([]); }} onStep={clockTick} />
            <button type="button" className="btn" onClick={readCtrl}>
              Read CTRL (clears COUNTFLAG)
            </button>
          </div>
        </Panel>
        <div className="space-y-3">
          <Panel title="PC14 LED">
            <div className="flex items-center justify-around">
              <LedBulb on={led} label="PC14" />
              <div className={`rounded px-2 py-1 text-xs ${inIsr ? 'bg-ch3/25 text-ch3' : 'text-dim'}`}>{inIsr ? 'in SysTick_Handler' : 'thread mode'}</div>
            </div>
            <p className="mt-2 text-xs text-dim">{tickint ? `ISR ran ${isrCount}×. main() is an empty loop.` : 'Polling: main() reads CTRL and toggles when COUNTFLAG is 1.'}</p>
          </Panel>
          <Readout label="Period" value={`${(((load + 1) / f) * 1000).toFixed(4)} ms`} sub={`(LOAD + 1) / ${(f / 1e6).toFixed(3)} MHz`} />
        </div>
      </div>

      <Panel title="Reload calculator">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Wanted delay" unit="ms" value={delayMs} min={0.001} max={10000} step={0.001} onChange={setDelayMs} />
          <Readout label="Clocks needed N = delay × f" value={n.toLocaleString()} sub={`f = ${clksrc ? 'HCLK' : 'HCLK/8'} = ${(f / 1e6).toFixed(3)} MHz`} />
          <Readout label="LOAD = N − 1" value={fits ? (n - 1).toLocaleString() : 'too large'} tone={fits ? 'ok' : 'bad'} sub={fits ? hex(n - 1, 6) : 'exceeds 0xFFFFFF — use HCLK/8 or count overflows in software'} />
        </div>
      </Panel>
      {log.length > 0 && (
        <Panel title="Events">
          <ol className="space-y-0.5 font-mono text-xs">
            {log.map((l, i) => (
              <li key={i} className={i === 0 ? 'text-gold' : 'text-dim'}>
                {l}
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
