import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, Panel, PushButton, Readout, Select, Toggle } from './kit';
import CodeBlock from '../components/CodeBlock';

const PORTS = ['A', 'B', 'C', 'D', 'E', 'H'];
const PORT_CODE: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, H: 7 };

const irqFor = (n: number) => (n <= 4 ? `EXTI${n}_IRQn` : n <= 9 ? 'EXTI9_5_IRQn' : 'EXTI15_10_IRQn');
const handlerFor = (n: number) => (n <= 4 ? `EXTI${n}_IRQHandler` : n <= 9 ? 'EXTI9_5_IRQHandler' : 'EXTI15_10_IRQHandler');

export default function ExtiSim({ preset }: SimProps) {
  const [port, setPort] = useState(preset === 'pb10' ? 'B' : 'A');
  const [pin, setPin] = useState(preset === 'pb10' ? 10 : 6);
  const [rising, setRising] = useState(false);
  const [falling, setFalling] = useState(true);
  const [imr, setImr] = useState(true);
  const [nvic, setNvic] = useState(true);
  const [autoClear, setAutoClear] = useState(true);
  const [pressed, setPressed] = useState(false);
  const [pr, setPr] = useState(false);
  const [trace, setTrace] = useState<{ lv: 0 | 1; edge?: 'r' | 'f'; fired?: boolean }[]>(() => Array(60).fill({ lv: 1 }));
  const [isrRuns, setIsrRuns] = useState(0);
  const [led, setLed] = useState(false);
  const [msg, setMsg] = useState('');
  const last = useRef<0 | 1>(1);
  const cfg = useRef({ rising, falling, imr, nvic, autoClear, pr });
  cfg.current = { rising, falling, imr, nvic, autoClear, pr };
  const pressedRef = useRef(pressed);
  pressedRef.current = pressed;

  useEffect(() => {
    const id = window.setInterval(() => {
      const lv: 0 | 1 = pressedRef.current ? 0 : 1; // switch to GND with pull-up
      let edge: 'r' | 'f' | undefined;
      let fired = false;
      if (lv !== last.current) {
        edge = lv ? 'r' : 'f';
        const c = cfg.current;
        const selected = (edge === 'r' && c.rising) || (edge === 'f' && c.falling);
        if (selected) {
          // RM0368 §10.2.4: with the line unmasked, a selected edge generates the request and sets the pending bit.
          if (c.imr) setPr(true);
          if (c.imr && c.nvic) {
            fired = true;
            setIsrRuns((n) => n + 1);
            setLed((l) => !l);
            setMsg(`${edge === 'f' ? 'Falling' : 'Rising'} edge → PR${pin} = 1 → ${handlerFor(pin)}() runs.`);
            if (c.autoClear) window.setTimeout(() => setPr(false), 250);
          } else setMsg(c.imr ? 'Edge latched in PR, but the IRQ is not enabled in the NVIC — no ISR runs (it stays pending).' : 'Edge detected, but the line is masked in EXTI_IMR — no request is generated and PR stays 0.');
        } else setMsg(`${edge === 'f' ? 'Falling' : 'Rising'} edge ignored (not selected in ${edge === 'f' ? 'FTSR' : 'RTSR'}).`);
        last.current = lv;
      }
      setTrace((t) => [...t.slice(1), { lv, edge, fired }]);
    }, 70);
    return () => window.clearInterval(id);
  }, [pin]);

  const reg = Math.floor(pin / 4);
  const shift = 4 * (pin % 4);
  const code = `RCC->AHB1ENR |= (1U << ${PORT_CODE[port]});         // GPIO${port} clock
RCC->APB2ENR |= (1U << 14);                    // SYSCFG clock
GPIO${port}->MODER &= ~(3U << ${2 * pin});              // P${port}${pin} input
GPIO${port}->PUPDR = (GPIO${port}->PUPDR & ~(3U << ${2 * pin})) | (1U << ${2 * pin}); // pull-up

SYSCFG->EXTICR[${reg}] &= ~(0xF << ${shift});           // EXTICR${reg + 1}, EXTI${pin} field
SYSCFG->EXTICR[${reg}] |=  (0x${PORT_CODE[port].toString(16)} << ${shift});           // ${port} = ${PORT_CODE[port].toString(2).padStart(4, '0')}
${imr ? '' : '// '}EXTI->IMR  |= (1U << ${pin});                  // unmask line ${pin}
${rising ? '' : '// '}EXTI->RTSR |= (1U << ${pin});                  // rising edge
${falling ? '' : '// '}EXTI->FTSR |= (1U << ${pin});                  // falling edge
${nvic ? '' : '// '}NVIC_EnableIRQ(${irqFor(pin)});

void ${handlerFor(pin)}(void) {
    if (EXTI->PR & (1U << ${pin})) {
        EXTI->PR = (1U << ${pin});   // write 1 to clear
        GPIOC->ODR ^= (1U << 14);
    }
}`;

  const W = 600;
  const step = W / trace.length;
  let d = '';
  trace.forEach((x, i) => {
    const y = x.lv ? 12 : 48;
    d += `${i ? 'L' : 'M'}${i * step} ${y} L${(i + 1) * step} ${y} `;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Select label="Port" value={port} options={PORTS.map((p) => [p, `GPIO${p}`] as [string, string])} onChange={setPort} />
        <Select label="Pin / EXTI line" value={pin} options={Array.from({ length: 16 }, (_, i) => [i, String(i)] as [number, string])} onChange={setPin} />
        <div className="flex flex-col justify-end gap-1">
          <Toggle label="RTSR rising" checked={rising} onChange={setRising} />
          <Toggle label="FTSR falling" checked={falling} onChange={setFalling} />
        </div>
        <div className="flex flex-col justify-end gap-1">
          <Toggle label="IMR unmasked" checked={imr} onChange={setImr} />
          <Toggle label="NVIC enabled" checked={nvic} onChange={setNvic} />
        </div>
        <div className="flex flex-col justify-end gap-1 lg:col-span-2">
          <Toggle label="ISR clears PR (EXTI->PR = 1<<n)" checked={autoClear} onChange={setAutoClear} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_14rem]">
        <Panel title={`P${port}${pin} level (switch to GND, internal pull-up) — press and release`}>
          <svg viewBox={`0 0 ${W} 64`} className="h-auto w-full" role="img" aria-label="Pin level over time">
            <path d={d} fill="none" stroke="rgb(var(--ch1))" strokeWidth={2} />
            {trace.map((x, i) =>
              x.edge ? (
                <g key={i}>
                  <line x1={i * step} x2={i * step} y1={2} y2={60} stroke={x.fired ? 'rgb(var(--ok))' : 'rgb(var(--dim))'} strokeDasharray="3 3" />
                  <text x={i * step + 3} y={60} fontSize={10} fill={x.fired ? 'rgb(var(--ok))' : 'rgb(var(--dim))'}>
                    {x.edge === 'f' ? '↓' : '↑'}
                    {x.fired ? ' IRQ' : ''}
                  </text>
                </g>
              ) : null,
            )}
          </svg>
          <div className="mt-3 flex items-center gap-6">
            <PushButton pressed={pressed} onDown={() => setPressed(true)} onUp={() => setPressed(false)} label={`switch on P${port}${pin}`} />
            <LedBulb on={led} label="PC14 (toggled in ISR)" />
            <p className="flex-1 text-sm text-dim" aria-live="polite">
              {msg || 'Press the switch: a press is a falling edge (1 → 0), a release is a rising edge.'}
            </p>
          </div>
        </Panel>
        <div className="space-y-3">
          <Readout label={`EXTI_PR bit ${pin}`} value={pr ? 1 : 0} tone={pr ? 'ch3' : 'ink'} sub={pr && !autoClear ? 'never cleared → ISR would re-enter forever' : undefined} />
          {pr && (
            <button type="button" className="btn w-full" onClick={() => setPr(false)}>
              Write 1 to PR (clear)
            </button>
          )}
          <Readout label="ISR executions" value={isrRuns} />
          <Readout label="NVIC line" value={<span className="text-sm">{irqFor(pin)}</span>} sub={`EXTICR[${reg}] bits ${shift + 3}:${shift}`} />
        </div>
      </div>
      <CodeBlock code={code} title="configuration generated from your settings" />
    </div>
  );
}
