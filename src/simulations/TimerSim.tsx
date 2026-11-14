import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { LedBulb, NumberField, Panel, Readout, Select, Toggle } from './kit';
import { ClockControls } from '../components/Player';

/** STM32 TIMx in up-counting mode: PSC divides the clock, CNT counts 0..ARR, overflow sets UIF (update event). */
export default function TimerSim(_: SimProps) {
  const [fclk, setFclk] = useState(16_000_000);
  const [psc, setPsc] = useState(3);
  const [arr, setArr] = useState(9);
  const [uie, setUie] = useState(true);
  const [pscCnt, setPscCnt] = useState(0);
  const [cnt, setCnt] = useState(0);
  const [uif, setUif] = useState(false);
  const [events, setEvents] = useState(0);
  const [led, setLed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const st = useRef({ psc, arr, pscCnt, cnt, uie });
  st.current = { psc, arr, pscCnt, cnt, uie };

  // target calculator
  const [wantMs, setWantMs] = useState(500);
  const tick = () => {
    const s = st.current;
    if (s.pscCnt < s.psc) {
      setPscCnt(s.pscCnt + 1);
      return;
    }
    setPscCnt(0);
    if (s.cnt < s.arr) setCnt(s.cnt + 1);
    else {
      setCnt(0);
      setUif(true);
      setEvents((e) => e + 1);
      if (s.uie) setLed((l) => !l);
    }
  };
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(tick, 120 / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const fcnt = fclk / (psc + 1);
  const tUpdate = ((psc + 1) * (arr + 1)) / fclk;
  // find PSC/ARR for wanted period: choose PSC giving 10 kHz tick if possible
  const wantTicks = (wantMs / 1000) * fclk;
  const pscSuggest = Math.min(65535, Math.max(0, Math.round(fclk / 10000) - 1));
  const arrSuggest = Math.round(wantTicks / (pscSuggest + 1)) - 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Timer clock (APB×2)"
          value={fclk}
          options={[
            [16_000_000, '16 MHz'],
            [84_000_000, '84 MHz'],
          ]}
          onChange={setFclk}
        />
        <NumberField label="TIMx_PSC" value={psc} min={0} max={65535} onChange={setPsc} hint="slow demo: 3" />
        <NumberField label="TIMx_ARR" value={arr} min={1} max={65535} onChange={setArr} hint="slow demo: 9" />
        <div className="flex flex-col justify-end">
          <Toggle label="UIE: update interrupt enabled" checked={uie} onChange={setUie} />
        </div>
      </div>
      <Panel title="Clock → prescaler → counter → update event (slowed down)">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-dim">Prescaler counter (0…PSC)</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from({ length: Math.min(psc + 1, 32) }).map((_, i) => (
                <span key={i} className={`h-4 w-4 rounded-sm ${i <= pscCnt ? 'bg-ch2' : 'bg-raised'}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-dim">every {psc + 1} input clocks → 1 count</p>
          </div>
          <div>
            <div className="text-xs text-dim">TIMx_CNT (0…ARR)</div>
            <div className="mt-1 h-6 overflow-hidden rounded border border-line bg-raised">
              <div className="h-full bg-ch1/60" style={{ width: `${(cnt / Math.max(1, arr)) * 100}%` }} />
            </div>
            <p className="mt-1 font-mono text-sm">
              CNT = {cnt} / ARR = {arr}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setUif(false)} className={`rounded border px-3 py-1 text-sm ${uif ? 'border-ch3 bg-ch3/20 text-ch3' : 'border-line text-dim'}`} title="Click to clear UIF (TIMx->SR &= ~1) like the ISR does">
              UIF {uif ? 1 : 0}
            </button>
            <LedBulb on={led} label="ISR toggles LED" />
          </div>
        </div>
        <div className="mt-3">
          <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => { setCnt(0); setPscCnt(0); setUif(false); setEvents(0); }} onStep={tick} />
        </div>
        <p className="mt-2 text-xs text-dim">Update events so far: {events}. In the ISR you must clear UIF, otherwise the interrupt fires again immediately.</p>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Counter clock" value={`${(fcnt / 1e3).toFixed(3)} kHz`} sub="f_clk / (PSC + 1)" />
        <Readout label="Update period" value={`${(tUpdate * 1000).toFixed(4)} ms`} tone="ch1" sub="(PSC + 1)(ARR + 1) / f_clk" />
        <Readout label="Update frequency" value={`${(1 / tUpdate).toFixed(3)} Hz`} />
      </div>
      <Panel title="Find PSC and ARR for a delay">
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Wanted period" unit="ms" value={wantMs} min={0.01} max={60000} step={0.01} onChange={setWantMs} />
          <Readout label="PSC (10 kHz tick)" value={pscSuggest} sub={`${fclk / 1e6} MHz / ${pscSuggest + 1} = ${(fclk / (pscSuggest + 1) / 1000).toFixed(1)} kHz`} />
          <Readout label="ARR" value={arrSuggest >= 0 && arrSuggest <= 65535 ? arrSuggest : 'out of range'} tone={arrSuggest >= 0 && arrSuggest <= 65535 ? 'ok' : 'bad'} sub="period × tick − 1" />
        </div>
      </Panel>
    </div>
  );
}
