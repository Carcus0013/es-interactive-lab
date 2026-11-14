import { useEffect, useState } from 'react';
import type { SimProps } from './registry';
import { NumberField, Panel, Readout } from './kit';

export default function RtcSim(_: SimProps) {
  const [prediva, setPrediva] = useState(127);
  const [predivs, setPredivs] = useState(255);
  const [speedUp, setSpeedUp] = useState(600);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  });
  const fck_apre = 32768 / (prediva + 1);
  const fck_spre = fck_apre / (predivs + 1);
  const exact = Math.abs(fck_spre - 1) < 1e-9;

  useEffect(() => {
    const id = window.setInterval(() => setTime((t) => (t + fck_spre * (speedUp / 10)) % 86400), 100);
    return () => window.clearInterval(id);
  }, [fck_spre, speedUp]);

  const hh = Math.floor(time / 3600);
  const mm = Math.floor((time % 3600) / 60);
  const ss = Math.floor(time % 60);
  const bcd = (v: number) => `${Math.floor(v / 10).toString(2).padStart(3, '0')} ${(v % 10).toString(2).padStart(4, '0')}`;

  return (
    <div className="space-y-4">
      <Panel title="Clock chain">
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className="rounded border border-ch1 px-2 py-1 text-ch1">LSE crystal 32.768 kHz</span>
          <span className="text-dim">→ ÷ (PREDIV_A + 1)</span>
          <span className="rounded border border-line px-2 py-1">{fck_apre.toFixed(2)} Hz</span>
          <span className="text-dim">→ ÷ (PREDIV_S + 1)</span>
          <span className={`rounded border px-2 py-1 ${exact ? 'border-ok text-ok' : 'border-bad text-bad'}`}>{fck_spre.toFixed(4)} Hz</span>
          <span className="text-dim">→ calendar</span>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField label="PREDIV_A (7-bit)" value={prediva} min={0} max={127} onChange={setPrediva} hint="default 127" />
        <NumberField label="PREDIV_S (15-bit)" value={predivs} min={0} max={32767} onChange={setPredivs} hint="default 255" />
        <NumberField label="Demo speed-up ×" value={speedUp} min={1} max={3600} onChange={setSpeedUp} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Calendar time" value={`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`} tone="ok" />
        <Readout label="RTC_TR (BCD)" value={<span className="text-sm">{bcd(hh)} : {bcd(mm)} : {bcd(ss)}</span>} sub="hours tens/units : minutes : seconds" />
        <Readout label="Tick accuracy" value={exact ? 'exactly 1 Hz' : `${((fck_spre - 1) * 86400).toFixed(0)} s/day error`} tone={exact ? 'ok' : 'bad'} />
      </div>
      <p className="text-xs text-dim">32 768 = 2¹⁵, so dividing by 128 × 256 gives exactly 1 Hz. The RTC keeps running from V_BAT when main power is off. Values follow the STM32 RTC prescaler scheme; additional syllabus coverage (not in your lectures).</p>
    </div>
  );
}
