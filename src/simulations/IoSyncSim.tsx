import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Select, Slider } from './kit';

type Method = 'blind' | 'busy' | 'interrupt' | 'periodic';
const SLOTS = 100; // time units

/** Same random event stream handled four ways; CPU time is coloured by what it is doing. */
export default function IoSyncSim(_: SimProps) {
  const [method, setMethod] = useState<Method>('interrupt');
  const [rate, setRate] = useState(6); // events per 100 units
  const [period, setPeriod] = useState(10);
  const [seed, setSeed] = useState(3);

  const events = useMemo(() => {
    const out: number[] = [];
    let s = seed * 9973;
    for (let i = 0; i < rate; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out.push(5 + (s % (SLOTS - 10)));
    }
    return [...new Set(out)].sort((a, b) => a - b);
  }, [rate, seed]);

  const sim = useMemo(() => {
    const cpu: ('work' | 'wait' | 'service' | 'check')[] = Array(SLOTS).fill('work');
    const latency: number[] = [];
    let missed = 0;
    if (method === 'busy') {
      // CPU spins waiting for each event; can do no other work
      let t = 0;
      for (const e of events) {
        for (; t < e && t < SLOTS; t++) cpu[t] = 'wait';
        for (let k = 0; k < 2 && t < SLOTS; k++, t++) cpu[t] = 'service';
        latency.push(0);
      }
      for (; t < SLOTS; t++) cpu[t] = 'wait';
    } else if (method === 'interrupt') {
      for (const e of events) {
        for (let k = 1; k <= 3 && e + k < SLOTS; k++) cpu[e + k] = 'service'; // 1 unit entry latency
        latency.push(1);
      }
    } else if (method === 'periodic') {
      const served = new Set<number>();
      for (let t = 0; t < SLOTS; t += period) {
        cpu[t] = 'check';
        for (const e of events) if (e <= t && !served.has(e)) {
          served.add(e);
          latency.push(t - e);
          if (t + 1 < SLOTS) cpu[t + 1] = 'service';
        }
      }
      missed = events.filter((e) => !served.has(e)).length;
    } else {
      // blind cycle: software starts device, waits a fixed time, reads — works only for devices with known timing
      for (let t = 0; t < SLOTS; t += 12) {
        for (let k = 0; k < 8 && t + k < SLOTS; k++) cpu[t + k] = 'wait';
        if (t + 8 < SLOTS) cpu[t + 8] = 'service';
      }
    }
    const busy = cpu.filter((c) => c !== 'work').length;
    return { cpu, latency, missed, freePct: Math.round(((SLOTS - busy) / SLOTS) * 100) };
  }, [method, events, period]);

  const col = { work: 'rgb(var(--ch4) / 0.5)', wait: 'rgb(var(--bad) / 0.55)', service: 'rgb(var(--ch3) / 0.8)', check: 'rgb(var(--ch2) / 0.8)' };
  const avgLat = sim.latency.length ? (sim.latency.reduce((a, b) => a + b, 0) / sim.latency.length).toFixed(1) : '—';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Select
          label="Synchronisation method"
          value={method}
          options={[
            ['blind', 'Blind cycle'],
            ['busy', 'Busy-wait (polling)'],
            ['interrupt', 'Interrupt'],
            ['periodic', 'Periodic polling'],
          ]}
          onChange={setMethod}
        />
        <Slider label="Events in the window" value={rate} min={1} max={15} onChange={setRate} />
        {method === 'periodic' && <Slider label="Polling period" value={period} min={2} max={30} onChange={setPeriod} />}
        <button type="button" className="btn self-end" onClick={() => setSeed((s) => s + 1)}>
          New event pattern
        </button>
      </div>
      <Panel title="Device events (top) and what the CPU spends each time unit on (bottom)">
        <svg viewBox="0 0 600 90" className="h-auto w-full" role="img" aria-label="CPU time line">
          {events.map((e) => (
            <g key={e}>
              <line x1={(e / SLOTS) * 600} x2={(e / SLOTS) * 600} y1={4} y2={30} stroke="rgb(var(--ch1))" strokeWidth={2} />
              <circle cx={(e / SLOTS) * 600} cy={6} r={3} fill="rgb(var(--ch1))" />
            </g>
          ))}
          {sim.cpu.map((c, i) => (
            <rect key={i} x={(i / SLOTS) * 600} y={42} width={600 / SLOTS - 0.5} height={30} fill={col[c]} />
          ))}
          <text x={0} y={86} fontSize={10} fill="rgb(var(--dim))">
            green = free for other work, red = waiting, magenta = servicing, cyan = checking status
          </text>
        </svg>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="CPU free for other work" value={`${sim.freePct} %`} tone={sim.freePct > 70 ? 'ok' : 'bad'} />
        <Readout label="Average latency" value={method === 'blind' ? 'fixed delay' : `${avgLat} units`} />
        <Readout label="Events missed / late" value={method === 'periodic' ? sim.missed : 0} sub={method === 'periodic' ? 'served at the next poll' : undefined} />
      </div>
      <p className="text-sm text-dim">
        {method === 'blind' && 'Blind cycle: trigger the device, wait a fixed time, then read. No status flag is checked — fine only when the device time is short and predictable (e.g. an LCD command).'}
        {method === 'busy' && 'Busy-wait: loop on a status flag (like while(!(ADC1->SR & EOC))). Lowest latency, but the CPU can do nothing else — exactly what the lab ADC and UART programs do.'}
        {method === 'interrupt' && 'Interrupt: hardware requests service when the device is ready. The CPU runs other code meanwhile; latency is small and bounded (the EXTI and ADC_IRQHandler labs).'}
        {method === 'periodic' && 'Periodic polling: a timer interrupt (e.g. SysTick) checks the status every period. Latency up to one period; useful when the device cannot raise interrupts.'}
      </p>
    </div>
  );
}
