import type { Stepper } from '../hooks/useStepper';
import { IconPause, IconPlay, IconRestart, IconStep, IconStepBack } from './Icons';

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

/** Standard play / pause / restart / step / speed controls used by every animation. */
export default function Player({ s, label, compact }: { s: Stepper; label?: string; compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Animation controls">
      <button type="button" className="btn" onClick={s.restart} aria-label="Restart">
        <IconRestart size={15} />
        {!compact && 'Restart'}
      </button>
      <button type="button" className="btn" onClick={s.prev} disabled={s.step === 0} aria-label="Previous step">
        <IconStepBack size={15} />
      </button>
      <button type="button" className="btn-gold min-w-[5.5rem] justify-center" onClick={s.toggle} aria-label={s.playing ? 'Pause' : 'Play'}>
        {s.playing ? <IconPause size={15} /> : <IconPlay size={15} />}
        {s.playing ? 'Pause' : s.atEnd ? 'Replay' : 'Play'}
      </button>
      <button type="button" className="btn" onClick={s.next} disabled={s.atEnd} aria-label="Next step">
        <IconStep size={15} />
        {!compact && 'Step'}
      </button>
      <label className="ml-1 flex items-center gap-1.5 text-dim">
        Speed
        <select className="input py-0.5" value={s.speed} onChange={(e) => s.setSpeed(Number(e.target.value))}>
          {SPEEDS.map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
      <span className="ml-auto font-mono text-xs text-dim">
        {label ?? 'Step'} {s.step + 1}/{s.total}
      </span>
    </div>
  );
}

/** Lightweight controls for continuous (clock-driven) animations. */
export function ClockControls({
  playing,
  setPlaying,
  speed,
  setSpeed,
  onRestart,
  onStep,
}: {
  playing: boolean;
  setPlaying: (p: boolean) => void;
  speed: number;
  setSpeed: (s: number) => void;
  onRestart: () => void;
  onStep?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Animation controls">
      <button type="button" className="btn" onClick={onRestart}>
        <IconRestart size={15} /> Restart
      </button>
      <button type="button" className="btn-gold min-w-[5.5rem] justify-center" onClick={() => setPlaying(!playing)}>
        {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
        {playing ? 'Pause' : 'Play'}
      </button>
      {onStep && (
        <button type="button" className="btn" onClick={onStep} disabled={playing}>
          <IconStep size={15} /> Step
        </button>
      )}
      <label className="ml-1 flex items-center gap-1.5 text-dim">
        Speed
        <select className="input py-0.5" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
