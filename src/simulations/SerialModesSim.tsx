import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Select } from './kit';
import { ClockControls } from '../components/Player';
import { useClock } from '../hooks/useStepper';

type Mode = 'serial' | 'parallel' | 'simplex' | 'half' | 'full';

export default function SerialModesSim(_: SimProps) {
  const [mode, setMode] = useState<Mode>('serial');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useClock(playing, speed);
  const byte = [0, 1, 0, 0, 0, 0, 0, 1]; // 'A' LSB first for serial display
  const phase = (t * 0.5) % 1;
  const halfDir = Math.floor(t * 0.5) % 2 === 0;

  const lineY = (i: number) => 60 + i * 26;
  const dot = (x: number, y: number, v: number, c: string, key: string | number) => (
    <g key={key}>
      <circle cx={x} cy={y} r={9} fill={`rgb(var(--${c}) / ${v ? 0.85 : 0.2})`} stroke={`rgb(var(--${c}))`} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill="rgb(var(--ink))" fontFamily="monospace">
        {v}
      </text>
    </g>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Select
          label="Show"
          value={mode}
          options={[
            ['serial', 'Serial: one wire, bit after bit'],
            ['parallel', 'Parallel: 8 wires, whole byte at once'],
            ['simplex', 'Simplex: one direction only'],
            ['half', 'Half duplex: take turns'],
            ['full', 'Full duplex: both at once'],
          ]}
          onChange={setMode}
        />
        <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => setT(0)} />
      </div>
      <Panel title="Device A ⇄ Device B">
        <svg viewBox="0 0 600 290" className="h-auto w-full" role="img" aria-label="Transmission mode animation">
          <rect x={10} y={40} width={90} height={220} rx={8} fill="rgb(var(--raised))" stroke="rgb(var(--gold))" />
          <text x={55} y={30} textAnchor="middle" fontSize={13} fill="rgb(var(--ink))">
            Device A
          </text>
          <rect x={500} y={40} width={90} height={220} rx={8} fill="rgb(var(--raised))" stroke="rgb(var(--ch2))" />
          <text x={545} y={30} textAnchor="middle" fontSize={13} fill="rgb(var(--ink))">
            Device B
          </text>
          {mode === 'parallel' &&
            byte.map((b, i) => (
              <g key={i}>
                <line x1={100} x2={500} y1={lineY(i)} y2={lineY(i)} stroke="rgb(var(--line))" />
                {dot(110 + phase * 380, lineY(i), b, 'ch1', i)}
                <text x={92} y={lineY(i) + 4} textAnchor="end" fontSize={9} fill="rgb(var(--dim))">
                  D{i}
                </text>
              </g>
            ))}
          {mode === 'serial' && (
            <g>
              <line x1={100} x2={500} y1={150} y2={150} stroke="rgb(var(--line))" strokeWidth={2} />
              {byte.map((b, i) => {
                const x = 110 + ((phase * 8 + i) % 8) * 48;
                return dot(x, 150, b, 'ch1', i);
              })}
              <text x={300} y={190} textAnchor="middle" fontSize={11} fill="rgb(var(--dim))">
                one data line (+ ground): bits follow each other in time
              </text>
            </g>
          )}
          {(mode === 'simplex' || mode === 'half' || mode === 'full') && (
            <g>
              <line x1={100} x2={500} y1={110} y2={110} stroke="rgb(var(--line))" strokeWidth={2} />
              {mode === 'full' && <line x1={100} x2={500} y1={190} y2={190} stroke="rgb(var(--line))" strokeWidth={2} />}
              {mode !== 'half' || halfDir ? dot(110 + phase * 380, 110, 1, 'ch1', 'ab') : dot(490 - phase * 380, 110, 0, 'ch2', 'ba1')}
              {mode === 'full' && dot(490 - phase * 380, 190, 0, 'ch2', 'ba')}
              <text x={300} y={240} textAnchor="middle" fontSize={11} fill="rgb(var(--dim))">
                {mode === 'simplex' && 'Only A → B, e.g. a sensor that only transmits (UART TX-only lab program).'}
                {mode === 'half' && `Shared line, one direction at a time — now ${halfDir ? 'A → B' : 'B → A'} (walkie-talkie, I²C SDA).`}
                {mode === 'full' && 'Separate TX and RX lines: both directions at once (UART, SPI).'}
              </text>
            </g>
          )}
        </svg>
      </Panel>
    </div>
  );
}
