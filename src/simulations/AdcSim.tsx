import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, Panel, Readout, Select, Slider, Toggle, bin } from './kit';
import { ClockControls } from '../components/Player';
import { useClock } from '../hooks/useStepper';

const SMP: [number, string][] = [
  [3, '000 → 3 cycles'],
  [15, '001 → 15'],
  [28, '010 → 28'],
  [56, '011 → 56'],
  [84, '100 → 84'],
  [112, '101 → 112'],
  [144, '110 → 144'],
  [480, '111 → 480'],
];

export default function AdcSim({ preset }: SimProps) {
  const [vin, setVin] = useState(preset === 'ldr' ? 0.9 : 1.66);
  const [vref, setVref] = useState(3.3);
  const [bits, setBits] = useState(12);
  const [wave, setWave] = useState(false);
  const [fs, setFs] = useState(12); // samples per signal period (sine mode)
  const [smp, setSmp] = useState(3);
  const [pre, setPre] = useState(2);
  const [pclk, setPclk] = useState(16);
  const [lectureConv, setLectureConv] = useState(false);
  const [threshold, setThreshold] = useState(1024);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useClock(playing && wave, speed);

  const levels = 2 ** bits;
  const max = levels - 1;
  const step = lectureConv ? vref / max : vref / levels;
  const signal = (time: number) => (wave ? Math.max(0, Math.min(vref, vref / 2 + (vref / 2.4) * Math.sin(2 * Math.PI * 0.25 * time))) : vin);
  const v = signal(t);
  const code = Math.max(0, Math.min(max, lectureConv ? Math.round((v * max) / vref) : Math.floor((v * levels) / vref)));
  const vq = code * step;
  const err = v - vq;
  const adcclk = pclk / pre;
  const cycles = smp + (bits === 12 ? 12 : bits === 10 ? 10 : bits === 8 ? 8 : 6);
  const tconv = cycles / adcclk; // µs

  // chart
  const W = 640;
  const H = 220;
  const span = 8; // seconds shown
  const xs = (time: number) => ((time - (wave ? t - span : 0)) / span) * W;
  const ys = (volts: number) => H - 10 - (volts / vref) * (H - 20);
  const curve = useMemo(() => {
    let d = '';
    for (let i = 0; i <= 200; i++) {
      const time = (wave ? t - span : 0) + (i / 200) * span;
      d += `${i ? 'L' : 'M'}${xs(time).toFixed(1)} ${ys(signal(time)).toFixed(1)}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, vin, vref, wave]);
  const samples = useMemo(() => {
    const out: { x: number; y: number; yq: number }[] = [];
    const period = 4 / fs; // signal period 4 s
    const start = wave ? Math.ceil((t - span) / period) * period : 0;
    for (let time = start; time <= (wave ? t : span); time += wave ? period : span / 8) {
      const val = signal(time);
      const c = Math.max(0, Math.min(max, lectureConv ? Math.round((val * max) / vref) : Math.floor((val * levels) / vref)));
      out.push({ x: xs(time), y: ys(val), yq: ys(c * step) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, fs, vin, vref, bits, wave, lectureConv]);
  const showLevels = bits <= 4 ? levels : 16;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!wave && <Slider label="Analog input V_in" value={vin} min={0} max={3.6} step={0.01} unit="V" onChange={setVin} format={(x) => x.toFixed(2)} />}
        {wave && <Slider label="Samples per signal period" value={fs} min={2} max={40} onChange={setFs} />}
        <Slider label="Reference V_ref" value={vref} min={1.8} max={3.6} step={0.1} unit="V" onChange={setVref} format={(x) => x.toFixed(1)} />
        <Select
          label="Resolution (ADC_CR1.RES)"
          value={bits}
          options={[
            [12, '12-bit (00)'],
            [10, '10-bit (01)'],
            [8, '8-bit (10)'],
            [6, '6-bit (11)'],
            [3, '3-bit (lecture example)'],
          ]}
          onChange={setBits}
        />
        <div className="flex flex-col justify-end gap-2">
          <Toggle label="Changing (sine) input" checked={wave} onChange={setWave} />
          <Toggle label="Use lecture convention (4095/3.3)" checked={lectureConv} onChange={setLectureConv} />
        </div>
      </div>

      <Panel title={wave ? 'Sampling and quantisation of a changing signal' : 'Quantisation of a DC input'}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Analog signal, samples and quantised levels">
          {Array.from({ length: showLevels + 1 }).map((_, i) => {
            const vv = (i / showLevels) * vref;
            return <line key={i} x1={0} x2={W} y1={ys(vv)} y2={ys(vv)} stroke="rgb(var(--line))" strokeWidth={0.6} strokeDasharray={i % 4 === 0 ? undefined : '2 4'} />;
          })}
          <path d={curve} fill="none" stroke="rgb(var(--ch2))" strokeWidth={2} />
          {samples.map((s, i) => (
            <g key={i}>
              <line x1={s.x} x2={s.x} y1={H - 10} y2={s.y} stroke="rgb(var(--ch1) / 0.35)" />
              <circle cx={s.x} cy={s.y} r={3.5} fill="rgb(var(--ch1))" />
              <rect x={s.x - 6} y={s.yq - 1.5} width={12} height={3} fill="rgb(var(--ch4))" />
            </g>
          ))}
          {!wave && <line x1={0} x2={W} y1={ys(v)} y2={ys(v)} stroke="rgb(var(--ch2))" strokeWidth={2} />}
          <text x={6} y={14} fontSize={11} fill="rgb(var(--dim))">
            {vref.toFixed(1)} V
          </text>
          <text x={6} y={H - 14} fontSize={11} fill="rgb(var(--dim))">
            0 V
          </text>
        </svg>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-dim">
          <span>
            <span className="text-ch2">━</span> analog input
          </span>
          <span>
            <span className="text-ch1">●</span> sample (S/H captures it)
          </span>
          <span>
            <span className="text-ch4">▬</span> quantised level stored
          </span>
          {bits > 4 && <span>gridlines show 16 of {levels} levels</span>}
        </div>
        {wave && (
          <div className="mt-3">
            <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => setT(0)} />
          </div>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Readout label="Sampled voltage" value={`${v.toFixed(3)} V`} tone="ch2" />
        <Readout label="Digital output (ADC_DR)" value={code} tone="ok" sub={`0x${code.toString(16).toUpperCase()}`} />
        <Readout label="Binary (encoding)" value={<span className="text-sm">{bin(code, bits)}</span>} tone="ch1" />
        <Readout label="Step size (1 LSB)" value={`${(step * 1000).toFixed(3)} mV`} sub={lectureConv ? `V_ref / (2^${bits} − 1)` : `V_ref / 2^${bits}`} />
        <Readout label="Quantised voltage" value={`${vq.toFixed(4)} V`} sub="code × step" />
        <Readout label="Quantisation error" value={`${(err * 1000).toFixed(2)} mV`} sub={`max ±${((step * 1000) / (lectureConv ? 2 : 1)).toFixed(2)} mV`} />
        <Readout label="Levels" value={levels} sub={`codes 0 … ${max}`} />
        <Readout label="Conversion time" value={`${tconv.toFixed(2)} µs`} sub={`${cycles} ADCCLK cycles`} />
      </div>

      <Panel title="Show your working">
        <div className="space-y-1 font-mono text-[0.88rem]">
          {lectureConv ? (
            <div>
              code = round(V_in × (2^{bits} − 1) / V_ref) = round({v.toFixed(3)} × {max} / {vref.toFixed(1)}) = <span className="text-ok">{code}</span>
            </div>
          ) : (
            <div>
              code = floor(V_in × 2^{bits} / V_ref) = floor({v.toFixed(3)} × {levels} / {vref.toFixed(1)}) = <span className="text-ok">{code}</span>
            </div>
          )}
          <div>
            V back = code × step = {code} × {(step * 1000).toFixed(4)} mV = {(vq * 1000).toFixed(1)} mV
          </div>
          <div className="text-dim">
            T_conv = (sampling {smp} + {cycles - smp}) cycles ÷ ADCCLK {adcclk} MHz = {tconv.toFixed(3)} µs → max {(1 / tconv).toFixed(2)} MSPS
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="STM32 timing (ADC_SMPRx and ADC_CCR)">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Sampling time SMPx" value={smp} options={SMP} onChange={setSmp} />
            <Select
              label="ADCPRE: PCLK2 ÷"
              value={pre}
              options={[
                [2, '÷2 (00)'],
                [4, '÷4 (01)'],
                [6, '÷6 (10)'],
                [8, '÷8 (11)'],
              ]}
              onChange={setPre}
            />
            <Select
              label="PCLK2"
              value={pclk}
              options={[
                [16, '16 MHz (HSI, lab default)'],
                [84, '84 MHz (PLL, max)'],
              ]}
              onChange={setPclk}
            />
            <Readout label="ADCCLK" value={`${adcclk.toFixed(1)} MHz`} tone={adcclk > 36 ? 'bad' : 'ink'} sub={adcclk > 36 ? 'exceeds 36 MHz max!' : 'must be ≤ 36 MHz'} />
          </div>
        </Panel>
        <Panel title="Lab program behaviour: LED on PC14 when ADC > threshold">
          <div className="flex items-center gap-6">
            <LedBulb on={code > threshold * (levels / 4096)} label="PC14" />
            <div className="flex-1">
              <Slider label="threshold (12-bit scale)" value={threshold} min={0} max={4095} step={1} onChange={setThreshold} />
              <p className="mt-1 text-xs text-dim">
                <code>{'if (adcData > threshold) GPIOC->ODR |= (1U<<14);'}</code> — 1024 ≈ {((1024 / 4096) * 3.3).toFixed(2)} V in the supplied programs.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
