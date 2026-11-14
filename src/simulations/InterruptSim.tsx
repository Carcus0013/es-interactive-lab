import { useEffect, useRef, useState } from 'react';
import type { SimProps } from './registry';
import { Panel, Readout, Toggle, hex } from './kit';
import { ClockControls } from '../components/Player';

interface Irq {
  id: string;
  name: string;
  exc: number; // exception number (IRQn + 16)
  pri: number; // 0 = highest; NMI fixed at -2
  len: number; // ISR length in ticks
  enabled: boolean;
  tone: string;
  nmi?: boolean;
}
type Ctx = { kind: 'thread'; pc: number } | { kind: 'isr'; irq: string; pc: number };
type Phase = 'run' | 'stacking' | 'unstacking' | 'tailchain';
interface State {
  ctx: Ctx[];
  phase: Phase;
  left: number;
  target: string | null;
  pending: string[];
  timeline: { c: string; label: string }[];
  log: string[];
  t: number;
}

const MAIN = ['count++;', 'if (count > 100)', '  count = 0;', 'readSensors();', 'updateDisplay();', '/* loop */'];
const STACK_T = 3; // ≈ 12 cycles
const TAIL_T = 1; // ≈ 6 cycles

const INITIAL: Irq[] = [
  { id: 'nmi', name: 'NMI', exc: 2, pri: -2, len: 3, enabled: true, tone: 'bad', nmi: true },
  { id: 'systick', name: 'SysTick', exc: 15, pri: 1, len: 4, enabled: true, tone: 'ch4' },
  { id: 'exti0', name: 'EXTI0 (PA0 key)', exc: 22, pri: 2, len: 6, enabled: true, tone: 'ch1' },
  { id: 'adc', name: 'ADC (EOC)', exc: 34, pri: 2, len: 5, enabled: true, tone: 'ch2' },
  { id: 'usart2', name: 'USART2 (RXNE)', exc: 54, pri: 3, len: 5, enabled: true, tone: 'ch3' },
];

const fresh = (): State => ({ ctx: [{ kind: 'thread', pc: 0 }], phase: 'run', left: 0, target: null, pending: [], timeline: [], log: ['Reset: thread mode, privileged, MSP.'], t: 0 });

export default function InterruptSim({ preset }: SimProps) {
  const [irqs, setIrqs] = useState<Irq[]>(INITIAL);
  const [s, setS] = useState<State>(fresh);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [tailChain, setTailChain] = useState(true);
  const irqRef = useRef(irqs);
  irqRef.current = irqs;
  const tcRef = useRef(tailChain);
  tcRef.current = tailChain;

  const byId = (id: string) => irqRef.current.find((q) => q.id === id)!;
  const priOf = (c: Ctx) => (c.kind === 'thread' ? 256 : byId(c.irq).pri);
  const best = (pending: string[], below: number) => {
    const cands = pending.map(byId).filter((q) => (q.enabled || q.nmi) && q.pri < below);
    cands.sort((a, b) => a.pri - b.pri || a.exc - b.exc);
    return cands[0];
  };

  const step = (st: State): State => {
    const n: State = { ...st, ctx: st.ctx.map((c) => ({ ...c })), pending: [...st.pending], log: [...st.log], timeline: [...st.timeline], t: st.t + 1 };
    const top = n.ctx[n.ctx.length - 1];
    const push = (c: string, label: string) => (n.timeline = [...n.timeline, { c, label }].slice(-56));
    const say = (m: string) => (n.log = [`t=${n.t}: ${m}`, ...n.log].slice(0, 14));

    if (n.phase === 'run') {
      const b = best(n.pending, priOf(top));
      if (b) {
        n.phase = 'stacking';
        n.left = STACK_T;
        n.target = b.id;
        say(`${b.name} (priority ${b.pri}) beats current priority ${top.kind === 'thread' ? '— (thread)' : priOf(top)} → finish instruction, push R0–R3, R12, LR, PC, xPSR.`);
        push('ch3', 'stack');
        return n;
      }
      if (top.kind === 'thread') {
        top.pc = (top.pc + 1) % MAIN.length;
        push('dim', 'main');
        return n;
      }
      const q = byId(top.irq);
      top.pc++;
      push(q.tone, q.name);
      if (top.pc >= q.len) {
        const below = n.ctx[n.ctx.length - 2];
        const nb = best(n.pending, priOf(below));
        if (nb && tcRef.current) {
          n.ctx.pop();
          n.phase = 'tailchain';
          n.left = TAIL_T;
          n.target = nb.id;
          say(`${q.name} done; ${nb.name} is pending → tail-chain: skip unstack/restack, fetch new vector.`);
        } else {
          n.phase = 'unstacking';
          n.left = STACK_T;
          say(`${q.name} executes BX LR with EXC_RETURN → pop 8 registers.`);
        }
      }
      return n;
    }
    if (n.phase === 'stacking') {
      // late arrival: a higher-priority request during stacking takes over the vector fetch
      const t = byId(n.target!);
      const la = best(n.pending.filter((p) => p !== t.id), t.pri);
      if (la) {
        say(`Late arrival: ${la.name} (priority ${la.pri}) arrived during stacking → its vector is fetched instead; ${t.name} stays pending.`);
        n.target = la.id;
      }
      n.left--;
      push('ch3', 'stack');
      if (n.left <= 0) {
        const q = byId(n.target!);
        n.pending = n.pending.filter((p) => p !== q.id);
        n.ctx.push({ kind: 'isr', irq: q.id, pc: 0 });
        n.phase = 'run';
        say(`Vector fetched from 0x${(q.exc * 4).toString(16).toUpperCase().padStart(8, '0')} → ${q.name} handler runs (IPSR = ${q.exc}).`);
      }
      return n;
    }
    if (n.phase === 'tailchain') {
      n.left--;
      push('gold', 'tail');
      if (n.left <= 0) {
        const q = byId(n.target!);
        n.pending = n.pending.filter((p) => p !== q.id);
        n.ctx.push({ kind: 'isr', irq: q.id, pc: 0 });
        n.phase = 'run';
        say(`${q.name} handler runs (tail-chained).`);
      }
      return n;
    }
    // unstacking
    const below = n.ctx[n.ctx.length - 2];
    const la = best(n.pending, priOf(below));
    if (la && tcRef.current) {
      n.ctx.pop();
      n.phase = 'tailchain';
      n.left = TAIL_T;
      n.target = la.id;
      say(`${la.name} arrived during unstacking → unstacking abandoned, ${la.name} serviced immediately.`);
      push('gold', 'tail');
      return n;
    }
    n.left--;
    push('ch3', 'unstack');
    if (n.left <= 0) {
      n.ctx.pop();
      n.phase = 'run';
      const back = n.ctx[n.ctx.length - 1];
      say(`Returned to ${back.kind === 'thread' ? 'main program (thread mode)' : byId(back.irq).name + ' (nested return)'}.`);
    }
    return n;
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setS((st) => step(st)), 480 / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const raise = (id: string) =>
    setS((st) => {
      const q = byId(id);
      if (st.pending.includes(id)) return { ...st, log: [`t=${st.t}: ${q.name} already pending — a second request is merged (only one pending bit).`, ...st.log].slice(0, 14) };
      if (!q.enabled && !q.nmi) return { ...st, pending: [...st.pending, id], log: [`t=${st.t}: ${q.name} pending but disabled in NVIC_ISER → ignored until enabled.`, ...st.log].slice(0, 14) };
      return { ...st, pending: [...st.pending, id], log: [`t=${st.t}: ${q.name} request → pending bit set (ISPR).`, ...st.log].slice(0, 14) };
    });

  useEffect(() => {
    if (preset === 'tailchain') {
      setTimeout(() => raise('exti0'), 600);
      setTimeout(() => raise('usart2'), 1600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const top = s.ctx[s.ctx.length - 1];
  const handler = top.kind === 'isr' || s.phase !== 'run';
  const frames = s.ctx.length - 1 + (s.phase === 'stacking' ? 1 : 0);
  const sp = 0x20010000 - frames * 32;
  const interrupted = s.ctx.length >= 2 ? s.ctx[s.ctx.length - 2] : null;
  const excReturn = top.kind === 'isr' ? (interrupted?.kind === 'thread' ? 0xfffffff9 : 0xfffffff1) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => setS(fresh())} onStep={() => setS((st) => step(st))} />
        <Toggle label="Tail-chaining / late-arrival optimisations" checked={tailChain} onChange={setTailChain} />
      </div>

      <Panel title="Interrupt sources — click to request, set priority (0 = highest)">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {irqs.map((q) => {
            const pend = s.pending.includes(q.id);
            const act = s.ctx.some((c) => c.kind === 'isr' && c.irq === q.id);
            return (
              <div key={q.id} className="rounded border border-line bg-raised/50 p-2" style={{ borderColor: act ? `rgb(var(--${q.tone}))` : undefined }}>
                <button type="button" className="btn w-full justify-center" onClick={() => raise(q.id)} style={{ color: `rgb(var(--${q.tone}))` }}>
                  Fire {q.name}
                </button>
                <div className="mt-2 flex items-center justify-between text-xs">
                  {q.nmi ? (
                    <span className="text-dim">priority −2 (fixed)</span>
                  ) : (
                    <label className="flex items-center gap-1 text-dim">
                      prio
                      <select className="input py-0 text-xs" value={q.pri} onChange={(e) => setIrqs((l) => l.map((x) => (x.id === q.id ? { ...x, pri: Number(e.target.value) } : x)))}>
                        {Array.from({ length: 16 }, (_, i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {!q.nmi && (
                    <label className="flex items-center gap-1 text-dim">
                      <input type="checkbox" checked={q.enabled} onChange={(e) => setIrqs((l) => l.map((x) => (x.id === q.id ? { ...x, enabled: e.target.checked } : x)))} /> ISER
                    </label>
                  )}
                </div>
                <div className="mt-1 flex gap-2 font-mono text-[0.68rem]">
                  <span className={pend ? 'text-warn' : 'text-dim/60'}>pending {pend ? 1 : 0}</span>
                  <span className={act ? 'text-ok' : 'text-dim/60'}>active {act ? 1 : 0}</span>
                  <span className="text-dim/60">exc {q.exc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Timeline (newest on the right)">
        <div className="flex h-10 items-stretch gap-px overflow-hidden rounded bg-mask/60 p-1">
          {s.timeline.map((x, i) => (
            <div key={i} title={x.label} className="min-w-[6px] flex-1 rounded-sm" style={{ background: `rgb(var(--${x.c}) / ${x.c === 'dim' ? 0.35 : 0.75})` }} />
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-dim">
          <span>grey = main</span>
          <span className="text-ch3">magenta = stacking / unstacking</span>
          <span className="text-gold">gold = tail-chain</span>
          <span>other colours = that ISR</span>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Now executing">
          {top.kind === 'thread' ? (
            <ol className="font-mono text-[0.82rem]">
              <li className="text-dim">while (1) {'{'}</li>
              {MAIN.map((l, i) => (
                <li key={i} className={`pl-4 ${s.phase === 'run' && i === top.pc ? 'bg-gold/15 text-gold' : ''}`}>
                  {l}
                </li>
              ))}
              <li className="text-dim">{'}'}</li>
            </ol>
          ) : (
            <div className="font-mono text-[0.82rem]">
              <div style={{ color: `rgb(var(--${byId(top.irq).tone}))` }}>void {byId(top.irq).name.split(' ')[0]}_Handler(void)</div>
              <div className="mt-1 h-2 overflow-hidden rounded bg-raised">
                <div className="h-full bg-gold" style={{ width: `${(top.pc / byId(top.irq).len) * 100}%` }} />
              </div>
              <div className="mt-1 text-dim">
                ISR progress {top.pc}/{byId(top.irq).len}
              </div>
            </div>
          )}
          <div className="mt-3 text-sm">
            Phase: <span className="font-semibold text-gold">{s.phase}</span>
            {s.target && s.phase !== 'run' && <span className="text-dim"> → {byId(s.target).name}</span>}
          </div>
        </Panel>
        <Panel title="Core registers">
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Mode" value={handler ? 'Handler' : 'Thread'} tone={handler ? 'ch3' : 'ink'} />
            <Readout label="IPSR (ISR_NUMBER)" value={top.kind === 'isr' ? byId(top.irq).exc : 0} />
            <Readout label="LR" value={excReturn ? hex(excReturn) : '(return addr)'} sub={excReturn ? (excReturn === 0xfffffff9 ? 'return to thread, MSP' : 'return to handler, MSP') : undefined} />
            <Readout label="SP (MSP)" value={hex(sp)} sub={`${frames} frame(s) × 32 B`} />
          </div>
        </Panel>
        <Panel title="Stack frames (top = newest)">
          <div className="flex flex-col-reverse gap-1">
            {s.ctx.slice(0, -1).map((c, i) => (
              <div key={i} className="rounded border border-ch3/50 bg-ch3/10 px-2 py-1 text-xs">
                frame {i + 1}: context of {c.kind === 'thread' ? 'main()' : byId(c.irq).name} — xPSR, PC, LR, R12, R3–R0
              </div>
            ))}
            {s.phase === 'stacking' && <div className="animate-pulse rounded border border-dashed border-ch3 px-2 py-1 text-xs text-ch3">pushing 8 words…</div>}
            {s.ctx.length === 1 && s.phase !== 'stacking' && <div className="text-xs text-dim">empty — main program owns the stack</div>}
          </div>
        </Panel>
      </div>

      <Panel title="What the NVIC just did">
        <ol className="space-y-0.5 font-mono text-[0.78rem]">
          {s.log.map((l, i) => (
            <li key={i} className={i === 0 ? 'text-gold' : 'text-dim'}>
              {l}
            </li>
          ))}
        </ol>
      </Panel>
      <p className="text-xs text-dim">Try: fire USART2, then EXTI0 while it runs (pre-emption). Fire EXTI0 and ADC together (same priority → lower exception number first, no nesting). Fire two quickly with tail-chaining on and off and compare the timeline.</p>
    </div>
  );
}
