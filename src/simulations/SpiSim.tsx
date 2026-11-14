import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { useStepper } from '../hooks/useStepper';
import Player from '../components/Player';
import { Panel, Readout, Select } from './kit';

export default function SpiSim(_: SimProps) {
  const [mode, setMode] = useState(0);
  const [mtx, setMtx] = useState(0xa5);
  const [stx, setStx] = useState(0x3c);
  const cpol = (mode >> 1) & 1;
  const cpha = mode & 1;
  // timeline: 0 = CS high idle, 1 = CS low setup, then 16 half-clocks, then CS high
  const N = 2 + 16 + 1;
  const s = useStepper(N, { interval: 600 });

  const sim = useMemo(() => {
    const steps: { cs: 0 | 1; sck: 0 | 1; mosi: 0 | 1; miso: 0 | 1; m: number; sl: number; event: string }[] = [];
    let m = mtx;
    let sl = stx;
    let mosi: 0 | 1 = ((m >> 7) & 1) as 0 | 1;
    let miso: 0 | 1 = ((sl >> 7) & 1) as 0 | 1;
    steps.push({ cs: 1, sck: cpol as 0 | 1, mosi: 1, miso: 1, m, sl, event: 'Idle: CS HIGH, slave ignores the bus.' });
    steps.push({ cs: 0, sck: cpol as 0 | 1, mosi: cpha ? 1 : mosi, miso: cpha ? 1 : miso, m, sl, event: cpha ? 'CS LOW selects the slave. In CPHA = 1 the first bit is put out on the first clock edge.' : 'CS LOW selects the slave; with CPHA = 0 both sides already present their MSB.' });
    let sampledM = 0;
    let sampledS = 0;
    for (let h = 0; h < 16; h++) {
      const sck = ((cpol ^ (h % 2 === 0 ? 1 : 0)) & 1) as 0 | 1; // first edge toggles from idle
      const leading = h % 2 === 0;
      const sampleEdge = cpha === 0 ? leading : !leading;
      let event = '';
      if (sampleEdge) {
        sampledM = (sampledM << 1) | miso;
        sampledS = (sampledS << 1) | mosi;
        event = `${leading ? 'Leading' : 'Trailing'} edge: both sides SAMPLE (master reads MISO = ${miso}, slave reads MOSI = ${mosi}).`;
      } else {
        // shift edge: present next bit
        if (cpha === 1 && leading) {
          // CPHA=1: data changes on leading edge
          const bit = 7 - h / 2;
          mosi = ((mtx >> bit) & 1) as 0 | 1;
          miso = ((stx >> bit) & 1) as 0 | 1;
          event = `${leading ? 'Leading' : 'Trailing'} edge: both sides SHIFT OUT bit ${bit}.`;
        } else {
          const bit = 7 - (h + 1) / 2;
          if (bit >= 0) {
            mosi = ((mtx >> bit) & 1) as 0 | 1;
            miso = ((stx >> bit) & 1) as 0 | 1;
            event = `Trailing edge: both sides SHIFT OUT bit ${bit}.`;
          } else event = 'Last edge.';
        }
      }
      m = ((sampledM & 0xff) | ((mtx << (sampledCount(h, cpha))) & 0xff)) & 0xff;
      sl = ((sampledS & 0xff) | ((stx << sampledCount(h, cpha)) & 0xff)) & 0xff;
      steps.push({ cs: 0, sck, mosi, miso, m: sampledM & 0xff, sl: sampledS & 0xff, event });
    }
    steps.push({ cs: 1, sck: cpol as 0 | 1, mosi: 1, miso: 1, m: sampledM & 0xff, sl: sampledS & 0xff, event: `CS HIGH: transfer complete. Master received 0x${(sampledM & 0xff).toString(16).toUpperCase()}, slave received 0x${(sampledS & 0xff).toString(16).toUpperCase()} — the bytes have swapped.` });
    void m;
    void sl;
    return steps;
  }, [mode, mtx, stx, cpol, cpha]);

  const cur = sim[s.step];
  const W = 720;
  const sw = W / N;
  const wave = (key: 'cs' | 'sck' | 'mosi' | 'miso', y0: number) => {
    let d = '';
    sim.forEach((x, i) => {
      const y = x[key] ? y0 : y0 + 26;
      d += `${i ? 'L' : 'M'}${i * sw} ${y} L${(i + 1) * sw} ${y} `;
    });
    return d;
  };
  const toHex = (v: number) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="SPI mode"
          value={mode}
          options={[
            [0, 'Mode 0: CPOL 0, CPHA 0'],
            [1, 'Mode 1: CPOL 0, CPHA 1'],
            [2, 'Mode 2: CPOL 1, CPHA 0'],
            [3, 'Mode 3: CPOL 1, CPHA 1'],
          ]}
          onChange={(v) => { setMode(v); s.restart(); }}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-dim">Master sends (hex)</span>
          <input className="input font-mono" value={mtx.toString(16).toUpperCase()} onChange={(e) => { const v = parseInt(e.target.value || '0', 16); if (Number.isFinite(v)) { setMtx(v & 0xff); s.restart(); } }} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-dim">Slave sends (hex)</span>
          <input className="input font-mono" value={stx.toString(16).toUpperCase()} onChange={(e) => { const v = parseInt(e.target.value || '0', 16); if (Number.isFinite(v)) { setStx(v & 0xff); s.restart(); } }} />
        </label>
      </div>
      <Player s={s} label="Edge" />
      <Panel title="Bus signals">
        <svg viewBox={`0 0 ${W} 190`} className="h-auto w-full" role="img" aria-label="SPI waveforms">
          <rect x={s.step * sw} y={0} width={sw} height={186} fill="rgb(var(--gold) / 0.16)" />
          {(
            [
              ['cs', 'CS', 'ch4', 8],
              ['sck', 'SCLK', 'ch2', 52],
              ['mosi', 'MOSI', 'ch1', 96],
              ['miso', 'MISO', 'ch3', 140],
            ] as const
          ).map(([k, l, c, y]) => (
            <g key={k}>
              <text x={2} y={y + 6} fontSize={10} fill={`rgb(var(--${c}))`}>
                {l}
              </text>
              <path d={wave(k, y + 10)} fill="none" stroke={`rgb(var(--${c}))`} strokeWidth={2} transform="translate(30 0)" />
            </g>
          ))}
        </svg>
        <p className="mt-2 text-[0.95rem]" aria-live="polite">
          {cur.event}
        </p>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-4">
        <Readout label="Master TX byte" value={toHex(mtx)} tone="ch1" />
        <Readout label="Master RX (shifted in)" value={toHex(cur.m)} tone="ok" />
        <Readout label="Slave TX byte" value={toHex(stx)} tone="ch3" />
        <Readout label="Slave RX (shifted in)" value={toHex(cur.sl)} tone="ok" />
      </div>
      <p className="text-xs text-dim">CPOL sets the idle level of SCLK. CPHA = 0 samples on the first (leading) edge; CPHA = 1 samples on the second (trailing) edge. Master and slave must use the same mode.</p>
    </div>
  );
}

function sampledCount(h: number, cpha: number) {
  return cpha === 0 ? Math.floor(h / 2) + 1 : Math.floor((h + 1) / 2);
}
