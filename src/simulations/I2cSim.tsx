import { useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { useStepper } from '../hooks/useStepper';
import Player from '../components/Player';
import { NumberField, Panel, Readout, Select, Toggle } from './kit';

interface Slot {
  scl: [0 | 1, 0 | 1]; // low half, high half (for idle/START/STOP both may be 1)
  sda: [0 | 1, 0 | 1];
  label: string;
  kind: 'idle' | 'start' | 'addr' | 'rw' | 'ack' | 'nack' | 'data' | 'stop';
  who: 'master' | 'slave' | 'bus';
  flags: string;
  explain: string;
}

const SLAVES: { addr: number; name: string }[] = [
  { addr: 0x27, name: 'PCF8574 LCD backpack' },
  { addr: 0x50, name: '24C02 EEPROM' },
  { addr: 0x68, name: 'DS1307 RTC' },
];

export default function I2cSim({ preset }: SimProps) {
  const [addr, setAddr] = useState(0x27);
  const [rw, setRw] = useState<0 | 1>(0);
  const [dataStr, setDataStr] = useState(preset === 'lcd' ? '0C 08' : '48');
  const [nackLast, setNackLast] = useState(true);
  const [pclk, setPclk] = useState(16);
  const [fscl, setFscl] = useState(100);

  const present = SLAVES.find((s) => s.addr === addr);
  const bytes = dataStr
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((h) => parseInt(h, 16) & 0xff)
    .filter((v) => Number.isFinite(v))
    .slice(0, 4);

  const slots = useMemo(() => {
    const out: Slot[] = [];
    out.push({ scl: [1, 1], sda: [1, 1], label: 'idle', kind: 'idle', who: 'bus', flags: 'SR2.BUSY = 0', explain: 'Bus free: both lines released and pulled HIGH by the pull-up resistors.' });
    out.push({ scl: [1, 1], sda: [1, 0], label: 'S', kind: 'start', who: 'master', flags: 'CR1.START = 1 → SR1.SB = 1', explain: 'START: master pulls SDA LOW while SCL is HIGH. Every slave starts listening. Software then writes the address byte to DR.' });
    const addrByte = (addr << 1) | rw;
    for (let i = 7; i >= 1; i--) {
      const b = ((addr >> (i - 1)) & 1) as 0 | 1;
      out.push({ scl: [0, 1], sda: [b, b], label: `A${i - 1}`, kind: 'addr', who: 'master', flags: `DR = 0x${addrByte.toString(16).toUpperCase()}`, explain: `Address bit A${i - 1} = ${b}. SDA changes while SCL is LOW and is sampled by the slaves while SCL is HIGH (MSB first).` });
    }
    out.push({ scl: [0, 1], sda: [rw, rw], label: rw ? 'R' : 'W', kind: 'rw', who: 'master', flags: '', explain: `R/W bit = ${rw}: ${rw ? 'master wants to READ from the slave' : 'master will WRITE to the slave'}. Address byte on the wire = 0x${addrByte.toString(16).toUpperCase()} (${addr.toString(16).toUpperCase()}h << 1 | ${rw}).` });
    if (!present) {
      out.push({ scl: [0, 1], sda: [1, 1], label: 'NACK', kind: 'nack', who: 'bus', flags: 'SR1.AF = 1 (acknowledge failure)', explain: `No device has address 0x${addr.toString(16).toUpperCase()}, so nobody pulls SDA LOW: NACK. The master must send STOP. (The supplied lab code waits for ADDR forever here — it would hang.)` });
    } else {
      out.push({ scl: [0, 1], sda: [0, 0], label: 'ACK', kind: 'ack', who: 'slave', flags: 'SR1.ADDR = 1 → read SR1 then SR2 to clear', explain: `${present.name} recognises its address and pulls SDA LOW during the 9th clock: ACK.` });
      bytes.forEach((byte, bi) => {
        for (let i = 7; i >= 0; i--) {
          const b = ((byte >> i) & 1) as 0 | 1;
          out.push({ scl: [0, 1], sda: [b, b], label: `D${i}`, kind: 'data', who: rw ? 'slave' : 'master', flags: rw ? 'SR1.RxNE when complete' : 'SR1.TXE → write next byte', explain: `${rw ? 'Slave' : 'Master'} sends data byte ${bi + 1} (0x${byte.toString(16).toUpperCase().padStart(2, '0')}) bit ${i} = ${b}.` });
        }
        const last = bi === bytes.length - 1;
        const nack = rw === 1 && last && nackLast;
        out.push({
          scl: [0, 1],
          sda: nack ? [1, 1] : [0, 0],
          label: nack ? 'NACK' : 'ACK',
          kind: nack ? 'nack' : 'ack',
          who: rw ? 'master' : 'slave',
          flags: rw ? (nack ? 'CR1.ACK = 0 before last byte' : 'CR1.ACK = 1') : 'SR1.BTF = 1 after last byte',
          explain: nack ? 'Master NACKs the last byte it reads to tell the slave to stop sending.' : `${rw ? 'Master' : 'Slave'} ACKs byte ${bi + 1}.`,
        });
      });
    }
    out.push({ scl: [0, 1], sda: [0, 0], label: '', kind: 'stop', who: 'master', flags: 'CR1.STOP = 1', explain: 'Before STOP, SDA is brought LOW while SCL is LOW…' });
    out.push({ scl: [1, 1], sda: [0, 1], label: 'P', kind: 'stop', who: 'master', flags: 'SR2.BUSY → 0', explain: 'STOP: SDA goes LOW → HIGH while SCL is HIGH. The bus is free again.' });
    out.push({ scl: [1, 1], sda: [1, 1], label: 'idle', kind: 'idle', who: 'bus', flags: '', explain: 'Idle.' });
    return out;
  }, [addr, rw, present, bytes.join(','), nackLast]);

  const s = useStepper(slots.length, { interval: 700 });
  const W = 760;
  const sw = W / slots.length;
  const path = (sel: (x: Slot) => [0 | 1, 0 | 1], y0: number) => {
    let d = '';
    slots.forEach((x, i) => {
      const [a, b] = sel(x);
      const ya = a ? y0 : y0 + 36;
      const yb = b ? y0 : y0 + 36;
      d += `${i ? 'L' : 'M'}${i * sw} ${ya} L${i * sw + sw / 2} ${ya} L${i * sw + sw / 2} ${yb} L${(i + 1) * sw} ${yb} `;
    });
    return d;
  };
  const cur = slots[s.step];
  const ccr = Math.round((pclk * 1000) / (2 * fscl));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Slave address (7-bit)" value={addr} options={[...SLAVES.map((x) => [x.addr, `0x${x.addr.toString(16).toUpperCase()} — ${x.name}`] as [number, string]), [0x3c, '0x3C — nobody (NACK)']]} onChange={(v) => { setAddr(v); s.restart(); }} />
        <Select
          label="Direction"
          value={rw}
          options={[
            [0, 'Write (R/W = 0)'],
            [1, 'Read (R/W = 1)'],
          ]}
          onChange={(v) => { setRw(v); s.restart(); }}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-dim">Data bytes (hex, up to 4)</span>
          <input className="input font-mono" value={dataStr} onChange={(e) => { setDataStr(e.target.value); s.restart(); }} />
        </label>
        <div className="flex items-end">{rw === 1 && <Toggle label="Master NACKs last byte" checked={nackLast} onChange={setNackLast} />}</div>
      </div>
      <Player s={s} label="Half-clock" />
      <Panel title="SDA and SCL">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} 150`} className="h-auto w-full min-w-[640px]" role="img" aria-label="I2C waveform">
            <rect x={s.step * sw} y={0} width={sw} height={130} fill="rgb(var(--gold) / 0.16)" />
            <path d={path((x) => x.sda, 10)} fill="none" stroke="rgb(var(--ch1))" strokeWidth={2} />
            <path d={path((x) => x.scl, 72)} fill="none" stroke="rgb(var(--ch2))" strokeWidth={2} />
            {slots.map((x, i) => (
              <text key={i} x={i * sw + sw / 2} y={142} fontSize={9} textAnchor="middle" fontFamily="monospace" fill={x.kind === 'ack' ? 'rgb(var(--ok))' : x.kind === 'nack' ? 'rgb(var(--bad))' : x.kind === 'start' || x.kind === 'stop' ? 'rgb(var(--gold))' : 'rgb(var(--dim))'}>
                {x.label}
              </text>
            ))}
            <text x={2} y={8} fontSize={10} fill="rgb(var(--ch1))">
              SDA
            </text>
            <text x={2} y={70} fontSize={10} fill="rgb(var(--ch2))">
              SCL
            </text>
          </svg>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_16rem]">
          <p className="text-[0.95rem] leading-relaxed" aria-live="polite">
            <span className={`mr-2 rounded px-1.5 py-0.5 text-xs ${cur.who === 'slave' ? 'bg-ch4/20 text-ch4' : cur.who === 'master' ? 'bg-gold/20 text-gold' : 'bg-raised text-dim'}`}>{cur.who} drives SDA</span>
            {cur.explain}
          </p>
          <Readout label="STM32 I2C1 flags / action" value={<span className="text-sm">{cur.flags || '—'}</span>} />
        </div>
      </Panel>
      <Panel title="SCL speed: I2C_CCR and I2C_TRISE (standard mode)">
        <div className="grid gap-3 sm:grid-cols-4">
          <NumberField label="PCLK1" unit="MHz" value={pclk} min={2} max={42} onChange={setPclk} />
          <NumberField label="SCL" unit="kHz" value={fscl} min={10} max={100} onChange={setFscl} />
          <Readout label="CCR = PCLK1 / (2 × f_SCL)" value={ccr} tone="ok" sub={`T_high = T_low = ${((ccr * 1000) / pclk).toFixed(0)} ns`} />
          <Readout label="TRISE = 1000 ns / T_PCLK1 + 1" value={Math.floor(pclk) + 1} sub={`T_PCLK1 = ${(1000 / pclk).toFixed(1)} ns`} />
        </div>
        <p className="mt-2 text-xs text-dim">Lecture form: CCR = (T_r(SCL) + T_w(SCLH)) / T_PCLK1 = (1000 + 4000) ns / 62.5 ns = 80 for 16 MHz and 100 kHz.</p>
      </Panel>
    </div>
  );
}
