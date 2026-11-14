import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, NumberField, Panel, Readout, Select, Slider } from './kit';
import { ClockControls } from '../components/Player';
import { useClock } from '../hooks/useStepper';

const fmtHz = (f: number) => (f >= 1e6 ? `${(f / 1e6).toFixed(3)} MHz` : f >= 1e3 ? `${(f / 1e3).toFixed(3)} kHz` : `${f.toFixed(3)} Hz`);

export default function PwmSim({ preset }: SimProps) {
  const [fclk, setFclk] = useState(16_000_000);
  const [psc, setPsc] = useState(preset === 'buzzer' ? 15 : 15);
  const [arr, setArr] = useState(preset === 'buzzer' ? 999 : 999);
  const [ccr, setCcr] = useState(250);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useClock(playing, speed);
  const [sound, setSound] = useState(false);
  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  const ftick = fclk / (psc + 1);
  const fpwm = ftick / (arr + 1);
  const duty = Math.min(1, ccr / (arr + 1));
  const period = 1 / fpwm;
  const ton = duty * period;
  const vavg = duty * 3.3;

  // visual time base: always show ~3 periods, slowly scrolling
  const W = 640;
  const H = 150;
  const periodsShown = 3;
  const phase = (t * 0.6) % 1;
  let d = '';
  for (let k = -1; k <= periodsShown; k++) {
    const x0 = ((k + phase) / periodsShown) * W;
    const x1 = x0 + (duty / periodsShown) * W;
    const x2 = x0 + W / periodsShown;
    d += `${k === -1 ? 'M' : 'L'}${x0} ${H - 20} L${x0} 20 L${x1} 20 L${x1} ${H - 20} L${x2} ${H - 20} `;
  }
  // counter sawtooth
  let saw = '';
  for (let k = -1; k <= periodsShown; k++) {
    const x0 = ((k + phase) / periodsShown) * W;
    const x2 = x0 + W / periodsShown;
    saw += `M${x0} ${H - 20} L${x2} 20 `;
  }
  const ccrY = H - 20 - duty * (H - 40);

  useEffect(() => {
    if (!sound) {
      audio.current?.osc.stop();
      audio.current?.ctx.close();
      audio.current = null;
      return;
    }
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    audio.current = { ctx, osc, gain };
    return () => {
      osc.stop();
      ctx.close();
      audio.current = null;
    };
  }, [sound]);
  useEffect(() => {
    if (audio.current) audio.current.osc.frequency.value = Math.min(12000, Math.max(20, fpwm));
  }, [fpwm]);

  const rpm = Math.round(duty * 3000);
  const angle = (t * 360 * duty * 1.5) % 360;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Timer clock"
          value={fclk}
          options={[
            [16_000_000, '16 MHz (HSI)'],
            [84_000_000, '84 MHz (PLL max)'],
            [42_000_000, '42 MHz'],
          ]}
          onChange={setFclk}
        />
        <NumberField label="Prescaler PSC" value={psc} min={0} max={65535} onChange={setPsc} hint="tick = clock / (PSC + 1)" />
        <NumberField label="Auto-reload ARR" value={arr} min={1} max={65535} onChange={(v) => { setArr(v); setCcr((c) => Math.min(c, v + 1)); }} hint="period = ARR + 1 ticks" />
        <NumberField label="Compare CCR" value={ccr} min={0} max={arr + 1} onChange={setCcr} hint="output high while CNT < CCR" />
      </div>
      <Slider label="Duty cycle (drag to change CCR)" value={ccr} min={0} max={arr + 1} onChange={setCcr} format={(v) => `${((v / (arr + 1)) * 100).toFixed(1)}%`} />

      <Panel title="Counter (CNT) and PWM output — PWM mode 1, up-counting">
        <svg viewBox={`0 0 ${W} ${H * 2}`} className="h-auto w-full" role="img" aria-label="Timer counter sawtooth and PWM waveform">
          <text x={4} y={14} fontSize={11} fill="rgb(var(--dim))">
            CNT: 0 → ARR = {arr}
          </text>
          <path d={saw} stroke="rgb(var(--ch2))" strokeWidth={1.6} fill="none" />
          <line x1={0} x2={W} y1={ccrY} y2={ccrY} stroke="rgb(var(--ch3))" strokeDasharray="5 4" />
          <text x={W - 4} y={ccrY - 4} textAnchor="end" fontSize={11} fill="rgb(var(--ch3))">
            CCR = {ccr}
          </text>
          <g transform={`translate(0 ${H})`}>
            <text x={4} y={14} fontSize={11} fill="rgb(var(--dim))">
              PWM pin
            </text>
            <path d={d} stroke="rgb(var(--ch1))" strokeWidth={2.2} fill="none" />
            <line x1={0} x2={W} y1={H - 20 - (duty * (H - 40))} y2={H - 20 - duty * (H - 40)} stroke="rgb(var(--ch4))" strokeDasharray="3 5" />
            <text x={W - 4} y={H - 24 - duty * (H - 40)} textAnchor="end" fontSize={11} fill="rgb(var(--ch4))">
              average {vavg.toFixed(2)} V
            </text>
          </g>
        </svg>
        <div className="mt-2">
          <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => setT(0)} />
        </div>
        <p className="mt-2 text-xs text-dim">The picture is slowed down to show 3 periods; the numbers below are the real values.</p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Readout label="Counter tick" value={fmtHz(ftick)} sub={`${(1e6 / ftick).toFixed(3)} µs per count`} />
        <Readout label="PWM frequency" value={fmtHz(fpwm)} tone="ch1" sub={`period ${(period * 1e3).toFixed(4)} ms`} />
        <Readout label="Duty cycle" value={`${(duty * 100).toFixed(1)} %`} tone="gold" sub={`T_on = ${(ton * 1e3).toFixed(4)} ms`} />
        <Readout label="Average voltage" value={`${vavg.toFixed(2)} V`} sub="duty × 3.3 V" />
      </div>

      <Panel title="Formulas used">
        <div className="space-y-1 font-mono text-[0.88rem]">
          <div>
            f_PWM = f_clk / ((PSC + 1) × (ARR + 1)) = {fclk / 1e6} MHz / ({psc + 1} × {arr + 1}) = <span className="text-ch1">{fmtHz(fpwm)}</span>
          </div>
          <div>
            duty = CCR / (ARR + 1) = {ccr} / {arr + 1} = <span className="text-gold">{(duty * 100).toFixed(2)} %</span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="LED brightness">
          <div className="flex justify-center py-2">
            <LedBulb on={duty > 0} brightness={duty} size={48} label={fpwm < 50 ? 'flickers (f < 50 Hz)' : 'steady to the eye'} />
          </div>
        </Panel>
        <Panel title="DC motor speed">
          <div className="flex items-center justify-center gap-4 py-2">
            <svg width="70" height="70" viewBox="-35 -35 70 70" role="img" aria-label={`Motor at ${rpm} rpm`}>
              <circle r="30" fill="rgb(var(--raised))" stroke="rgb(var(--line))" strokeWidth="2" />
              <g transform={`rotate(${angle})`}>
                {[0, 120, 240].map((a) => (
                  <rect key={a} x="-3" y="-27" width="6" height="22" rx="2" fill="rgb(var(--gold))" transform={`rotate(${a})`} />
                ))}
              </g>
              <circle r="5" fill="rgb(var(--ink))" />
            </svg>
            <span className="font-mono text-lg">≈ {rpm} rpm</span>
          </div>
          <p className="text-xs text-dim">Illustrative: speed ∝ average voltage for a 3000 rpm motor (driven through a transistor/H-bridge, never directly from a pin).</p>
        </Panel>
        <Panel title="Buzzer (passive) — tone = PWM frequency">
          <button type="button" className={sound ? 'btn-gold' : 'btn'} onClick={() => setSound((s) => !s)}>
            {sound ? 'Stop sound' : 'Play this frequency'}
          </button>
          <p className="mt-2 text-xs text-dim">{fpwm < 20 || fpwm > 12000 ? 'Outside the comfortable audio range — the browser clamps it.' : 'Square wave at the PWM frequency, as a passive buzzer would sound.'}</p>
        </Panel>
      </div>
    </div>
  );
}
