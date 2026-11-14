import { useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout } from './kit';

interface S {
  handler: boolean;
  nPRIV: 0 | 1;
  SPSEL: 0 | 1;
  saved: { nPRIV: 0 | 1; SPSEL: 0 | 1 } | null;
  ipsr: number;
}

export default function ModesSim(_: SimProps) {
  const [s, setS] = useState<S>({ handler: false, nPRIV: 0, SPSEL: 0, saved: null, ipsr: 0 });
  const [log, setLog] = useState<string[]>(['Reset → Thread mode, privileged (CONTROL = 0), using MSP.']);
  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 10));
  const privileged = s.handler || s.nPRIV === 0;
  const sp = s.handler ? 'MSP' : s.SPSEL ? 'PSP' : 'MSP';

  const writeControl = (field: 'nPRIV' | 'SPSEL', v: 0 | 1) => {
    if (!privileged) {
      say(`MSR CONTROL ignored: unprivileged thread code cannot change CONTROL (the write has no effect).`);
      return;
    }
    if (s.handler) {
      say(`In Handler mode CONTROL.${field} can be written; it takes effect for Thread mode after exception return.`);
      setS({ ...s, saved: { ...(s.saved ?? { nPRIV: s.nPRIV, SPSEL: s.SPSEL }), [field]: v } });
      return;
    }
    setS({ ...s, [field]: v });
    say(field === 'nPRIV' ? (v ? 'CONTROL.nPRIV = 1 → Thread mode is now UNPRIVILEGED.' : 'CONTROL.nPRIV = 0 → privileged.') : v ? 'CONTROL.SPSEL = 1 → Thread mode now uses the PSP.' : 'CONTROL.SPSEL = 0 → Thread mode uses the MSP.');
  };
  const exception = (name: string, num: number) => {
    if (s.handler) {
      say(`${name} while already in Handler mode → nested exception (if higher priority). Still Handler, still MSP.`);
      setS({ ...s, ipsr: num });
      return;
    }
    say(`${name} → stack frame pushed on ${sp}; Handler mode, privileged, MSP; IPSR = ${num}; LR = ${s.SPSEL ? '0xFFFFFFFD (return to Thread, PSP)' : '0xFFFFFFF9 (return to Thread, MSP)'}.`);
    setS({ ...s, handler: true, ipsr: num, saved: { nPRIV: s.nPRIV, SPSEL: s.SPSEL } });
  };
  const ret = () => {
    if (!s.handler) return;
    const back = s.saved ?? { nPRIV: s.nPRIV, SPSEL: s.SPSEL };
    say(`Exception return (BX LR with EXC_RETURN) → back to Thread mode, ${back.nPRIV ? 'unprivileged' : 'privileged'}, ${back.SPSEL ? 'PSP' : 'MSP'}.`);
    setS({ handler: false, nPRIV: back.nPRIV, SPSEL: back.SPSEL, saved: null, ipsr: 0 });
  };
  const tryPrivileged = () => {
    if (privileged) say('Access to NVIC / SysTick / CONTROL allowed: software is privileged.');
    else say('Unprivileged access to a system register (e.g. NVIC_ISER) → BusFault/HardFault. Use SVC to ask the OS (privileged handler) to do it.');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Readout label="Mode" value={s.handler ? 'Handler' : 'Thread'} tone={s.handler ? 'ch3' : 'ch2'} />
        <Readout label="Privilege" value={privileged ? 'Privileged' : 'Unprivileged'} tone={privileged ? 'ok' : 'bad'} />
        <Readout label="Stack pointer in use" value={sp} />
        <Readout label="CONTROL / IPSR" value={`nPRIV=${s.nPRIV} SPSEL=${s.SPSEL}`} sub={`IPSR = ${s.ipsr}`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Software actions">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => writeControl('nPRIV', 1)}>
              MSR CONTROL: nPRIV = 1
            </button>
            <button type="button" className="btn" onClick={() => writeControl('nPRIV', 0)}>
              MSR CONTROL: nPRIV = 0
            </button>
            <button type="button" className="btn" onClick={() => writeControl('SPSEL', 1)}>
              SPSEL = 1 (PSP)
            </button>
            <button type="button" className="btn" onClick={() => writeControl('SPSEL', 0)}>
              SPSEL = 0 (MSP)
            </button>
            <button type="button" className="btn" onClick={tryPrivileged}>
              Access NVIC register
            </button>
          </div>
        </Panel>
        <Panel title="Exceptions">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => exception('SVC (SVC #0)', 11)}>
              Execute SVC
            </button>
            <button type="button" className="btn" onClick={() => exception('SysTick', 15)}>
              SysTick interrupt
            </button>
            <button type="button" className="btn" onClick={() => exception('EXTI0 IRQ', 22)}>
              EXTI0 interrupt
            </button>
            <button type="button" className="btn-gold" disabled={!s.handler} onClick={ret}>
              Return from exception
            </button>
          </div>
        </Panel>
      </div>
      <Panel title="What happened">
        <ol className="space-y-1 text-sm">
          {log.map((l, i) => (
            <li key={i} className={i === 0 ? 'text-gold' : 'text-dim'}>
              {l}
            </li>
          ))}
        </ol>
      </Panel>
      <p className="text-xs text-dim">Exam answer in one line: unprivileged software cannot make itself privileged by writing CONTROL; it must cause an exception (typically SVC), and the privileged handler may clear nPRIV before returning.</p>
    </div>
  );
}
