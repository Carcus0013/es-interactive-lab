import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { NumberField, Panel, PushButton, Readout } from './kit';

/** 1 sample = 1 ms. A press/release produces 2–10 ms of random bouncing. */
export default function DebounceSim(_: SimProps) {
  const [pressed, setPressed] = useState(false);
  const [need, setNeed] = useState(5); // consecutive stable samples required
  const [raw, setRaw] = useState<number[]>(() => Array(120).fill(1));
  const [clean, setClean] = useState<number[]>(() => Array(120).fill(1));
  const [rawCount, setRawCount] = useState(0);
  const [cleanCount, setCleanCount] = useState(0);
  const st = useRef({ bounceLeft: 0, level: 1, stable: 1, cnt: 0, lastRaw: 1, lastClean: 1 });
  const pressedRef = useRef(pressed);
  const needRef = useRef(need);
  needRef.current = need;

  useEffect(() => {
    if (pressedRef.current !== pressed) {
      st.current.bounceLeft = 2 + Math.floor(Math.random() * 9);
      pressedRef.current = pressed;
    }
  }, [pressed]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = st.current;
      const target = pressedRef.current ? 0 : 1;
      let r: number;
      if (s.bounceLeft > 0) {
        s.bounceLeft--;
        r = Math.random() < 0.5 ? 0 : 1;
      } else r = target;
      // counter debouncer: accept a new level only after `need` identical samples
      if (r !== s.stable) {
        s.cnt++;
        if (s.cnt >= needRef.current) {
          s.stable = r;
          s.cnt = 0;
        }
      } else s.cnt = 0;
      if (s.lastRaw === 1 && r === 0) setRawCount((c) => c + 1);
      if (s.lastClean === 1 && s.stable === 0) setCleanCount((c) => c + 1);
      s.lastRaw = r;
      s.lastClean = s.stable;
      setRaw((a) => [...a.slice(1), r]);
      setClean((a) => [...a.slice(1), s.stable]);
    }, 25);
    return () => window.clearInterval(id);
  }, []);

  const W = 600;
  const wave = (arr: number[], y0: number) => {
    let d = '';
    arr.forEach((v, i) => {
      const y = v ? y0 : y0 + 34;
      d += `${i ? 'L' : 'M'}${(i / arr.length) * W} ${y} L${((i + 1) / arr.length) * W} ${y} `;
    });
    return d;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-6">
        <PushButton pressed={pressed} onDown={() => setPressed(true)} onUp={() => setPressed(false)} label="switch (pull-up)" />
        <NumberField label="Stable samples required (1 sample = 1 ms)" value={need} min={1} max={20} onChange={setNeed} />
        <button type="button" className="btn" onClick={() => { setRawCount(0); setCleanCount(0); }}>
          Reset counters
        </button>
      </div>
      <Panel title="Raw input (IDR) vs debounced value — 120 ms window, time slowed ×25">
        <svg viewBox={`0 0 ${W} 120`} className="h-auto w-full" role="img" aria-label="Raw and debounced switch signal">
          <text x={2} y={10} fontSize={10} fill="rgb(var(--ch1))">
            raw IDR
          </text>
          <path d={wave(raw, 12)} fill="none" stroke="rgb(var(--ch1))" strokeWidth={1.8} />
          <text x={2} y={70} fontSize={10} fill="rgb(var(--ch4))">
            debounced
          </text>
          <path d={wave(clean, 72)} fill="none" stroke="rgb(var(--ch4))" strokeWidth={1.8} />
        </svg>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Readout label="Presses counted from raw edges" value={rawCount} tone={rawCount > cleanCount ? 'bad' : 'ink'} sub="bounces look like extra presses" />
        <Readout label="Presses counted after debouncing" value={cleanCount} tone="ok" />
      </div>
      <p className="text-xs text-dim">This is why a lab-evaluation program that increments a counter on every falling edge must debounce (or wait for release): one physical press can otherwise count as several uploads or vehicles.</p>
    </div>
  );
}
