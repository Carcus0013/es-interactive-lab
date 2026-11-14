import { useEffect, useMemo, useState } from 'react';
import type { SimProps } from './registry';
import { assemble, initialState, readMem, regName, step as cpuStep, pcAddr, SP_INIT, type CpuState } from './cpu/thumb';
import { Panel, Select, hex } from './kit';
import { ClockControls } from '../components/Player';

const EXAMPLES: Record<string, { title: string; src: string }> = {
  flags: {
    title: 'Condition flags N Z C V',
    src: `; Watch the APSR flags after each S-suffixed instruction
    MOVS R0, #5
    SUBS R1, R0, #5        ; 5 - 5 = 0      -> Z = 1, C = 1 (no borrow)
    SUBS R2, R0, #6        ; 5 - 6 = -1     -> N = 1, C = 0 (borrow)
    LDR  R3, =0x7FFFFFFF   ; largest positive signed int
    ADDS R4, R3, #1        ; 0x80000000    -> N = 1, V = 1 (signed overflow)
    LDR  R5, =0xFFFFFFFF
    ADDS R6, R5, #1        ; 0             -> Z = 1, C = 1 (unsigned carry)
    ADD  R7, R0, R0        ; no S suffix   -> flags unchanged
    CMP  R0, #3            ; 5 - 3 > 0     -> N = 0, Z = 0, C = 1
    BGT  done              ; taken because Z = 0 and N = V
    MOVS R0, #0            ; skipped
done:
    NOP`,
  },
  array: {
    title: 'Sum an array — indexed addressing',
    src: `; Sum four 32-bit numbers stored in SRAM
    LDR  R1, =array        ; R1 = pointer (PC-relative literal load)
    MOVS R0, #0            ; sum = 0
    MOVS R2, #4            ; count = 4
loop:
    LDR  R3, [R1], #4      ; post-indexed: R3 = *R1; R1 += 4
    ADDS R0, R0, R3        ; sum += R3
    SUBS R2, R2, #1        ; count-- (sets Z when it reaches 0)
    BNE  loop              ; repeat while count != 0
    LDR  R4, =result
    STR  R0, [R4]          ; store the sum to memory
    NOP
array:  .word 10, 20, 30, 40
result: .word 0`,
  },
  call: {
    title: 'Subroutine call, LR and the stack',
    src: `; BL saves the return address in LR; nested calls must PUSH LR
    MOVS R0, #3
    BL   square            ; LR <- address of next instruction
    MOVS R5, R0            ; execution resumes here: R5 = 9
    B    end
square:
    PUSH {R4, LR}          ; save LR because we could call again
    MOV  R4, R0
    MULS R0, R4, R0        ; R0 = R0 * R0
    POP  {R4, PC}          ; restore R4 and return (PC <- saved LR)
end:
    NOP`,
  },
  gpio: {
    title: 'Set / clear / toggle bits (like GPIO ODR)',
    src: `; A fake ODR word in SRAM so you can watch read-modify-write
    LDR  R1, =odr          ; R1 points to the register image
    LDR  R0, [R1]          ; READ
    ORR  R0, R0, #0x2000   ; MODIFY: set bit 13   (ODR |= 1<<13)
    STR  R0, [R1]          ; WRITE
    LDR  R0, [R1]
    BIC  R0, R0, #0x4000   ; clear bit 14         (ODR &= ~(1<<14))
    STR  R0, [R1]
    LDR  R0, [R1]
    EOR  R0, R0, #0x0200   ; toggle bit 9         (ODR ^= 1<<9)
    STR  R0, [R1]
    MOVS R2, #1
    LSLS R2, R2, #13       ; build the mask 1<<13 with a shift
    TST  R0, R2            ; test bit 13 -> Z = 0 means it is set
    NOP
odr: .word 0x4200`,
  },
  shifts: {
    title: 'Shift and rotate',
    src: `    LDR  R0, =0x80000011
    LSLS R1, R0, #1        ; << 1 : bit 31 goes to C
    LSRS R2, R0, #4        ; logical  >> 4 : zeros enter from the left
    ASRS R3, R0, #4        ; arithmetic >> 4 : sign bit copied (signed /16)
    RORS R4, R0, #4        ; rotate right 4 : bits wrap round
    MOVS R5, #7
    LSLS R6, R5, #3        ; 7 * 8 = 56
    UDIV R7, R6, R5        ; 56 / 7 = 8 (hardware divide)
    NOP`,
  },
};

export default function CpuSim({ preset }: SimProps) {
  const [ex, setEx] = useState(preset && EXAMPLES[preset] ? preset : 'flags');
  const [src, setSrc] = useState(EXAMPLES[ex].src);
  const prog = useMemo(() => assemble(src), [src]);
  const [hist, setHist] = useState<CpuState[]>(() => [initialState(prog)]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const st = hist[hist.length - 1];
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;

  useEffect(() => {
    setSrc(EXAMPLES[ex].src);
  }, [ex]);
  useEffect(() => {
    setHist([initialState(prog)]);
    setPlaying(false);
  }, [prog]);

  const doStep = () => setHist((h) => (h[h.length - 1].halted ? h : [...h, cpuStep(prog, h[h.length - 1])].slice(-400)));
  useEffect(() => {
    if (!playing) return;
    if (st.halted) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(doStep, 900 / speed);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, st, speed]);

  const cur = prog.instrs[st.pcIndex];
  const flagChanged = (k: 'N' | 'Z' | 'C' | 'V') => prev && prev.f[k] !== st.f[k];
  const stackWords = [];
  for (let a = st.r[13]; a < SP_INIT && stackWords.length < 8; a += 4) stackWords.push(a);
  const dataWords = prog.data.flatMap((d) => d.words.map((_, k) => ({ addr: d.addr + 4 * k, label: k === 0 ? d.label : '' })));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem]">
          <Select label="Example program" value={ex} options={Object.entries(EXAMPLES).map(([k, v]) => [k, v.title] as [string, string])} onChange={setEx} />
        </div>
        <ClockControls playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} onRestart={() => { setHist([initialState(prog)]); setPlaying(false); }} onStep={doStep} />
        <button type="button" className="btn" disabled={hist.length < 2} onClick={() => setHist((h) => h.slice(0, -1))}>
          Undo step
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Program (editable Thumb-2 assembly)">
          <div className="relative">
            <ol className="max-h-[22rem] overflow-auto rounded border border-line bg-mask/70 py-1 font-mono text-[0.8rem]">
              {prog.instrs.map((ins, i) => (
                <li key={i} className={`flex gap-3 px-2 ${i === st.pcIndex && !st.halted ? 'bg-gold/20 text-gold' : ''}`}>
                  <span className="w-20 shrink-0 text-dim/70">{hex(pcAddr(i)).slice(2)}</span>
                  <span className="whitespace-pre">{ins.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-dim">Edit the source</summary>
            <textarea className="input mt-2 h-60 w-full font-mono text-[0.8rem]" value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} aria-label="Assembly source" />
          </details>
          {prog.errors.length > 0 && (
            <ul className="mt-2 text-sm text-bad">
              {prog.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 rounded border border-gold/30 bg-gold/5 p-2 text-sm" aria-live="polite">
            <span className="text-dim">{st.steps === 0 ? 'Ready.' : `After step ${st.steps}:`} </span>
            {st.note}
          </p>
          {!st.halted && cur && (
            <p className="mt-1 text-xs text-dim">
              Next: <code className="text-ch2">{cur.text}</code>
            </p>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Register bank">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[0.82rem] sm:grid-cols-4">
              {st.r.map((v, i) => {
                const changed = st.lastWrites.reg.includes(i);
                return (
                  <div key={i} className={`flex justify-between gap-2 rounded px-1 ${changed ? 'bg-ch3/20' : ''}`}>
                    <span className={i >= 13 ? 'text-gold' : i >= 8 ? 'text-ch4' : 'text-ch2'}>{regName(i)}</span>
                    <span>{hex(v).slice(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-dim">APSR</span>
              {(['N', 'Z', 'C', 'V'] as const).map((k) => (
                <span key={k} className={`rounded border px-2 py-0.5 font-mono text-sm ${st.f[k] ? 'border-ch1 bg-ch1/20 text-ch1' : 'border-line text-dim'} ${flagChanged(k) ? 'ring-2 ring-ch3' : ''}`}>
                  {k}={st.f[k] ? 1 : 0}
                </span>
              ))}
              <span className="ml-auto font-mono text-xs text-dim">T = 1, Thread mode, MSP</span>
            </div>
            <p className="mt-2 text-xs text-dim">Low registers R0–R7 (blue), high R8–R12 (green). Changed registers are highlighted.</p>
          </Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title="Stack (MSP grows down)">
              {stackWords.length === 0 ? (
                <p className="text-xs text-dim">Empty: SP = {hex(st.r[13])}</p>
              ) : (
                <ol className="font-mono text-[0.75rem]">
                  {stackWords.map((a) => (
                    <li key={a} className={`flex justify-between ${st.lastWrites.mem.includes(a) ? 'text-ch3' : ''}`}>
                      <span className="text-dim">{hex(a).slice(2)}</span>
                      <span>{hex(readMem(st.mem, a, 4)).slice(2)}</span>
                      {a === st.r[13] && <span className="text-gold">← SP</span>}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
            <Panel title="Data memory">
              {dataWords.length === 0 ? (
                <p className="text-xs text-dim">No .word data in this program.</p>
              ) : (
                <ol className="font-mono text-[0.75rem]">
                  {dataWords.map((w) => (
                    <li key={w.addr} className={`flex justify-between gap-2 ${st.lastWrites.mem.includes(w.addr) ? 'text-ch3' : ''}`}>
                      <span className="text-dim">{hex(w.addr).slice(2)}</span>
                      <span className="text-gold">{w.label}</span>
                      <span>{hex(readMem(st.mem, w.addr, 4)).slice(2)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </div>
      </div>
      <p className="text-xs text-dim">
        Supported: MOV(S) MVN ADD(S) ADC SUB(S) RSB NEG MUL(S) MLA UDIV SDIV AND ORR EOR BIC TST TEQ LSL LSR ASR ROR CMP CMN LDR/STR(B/H/SB/SH) with offset, pre- and post-indexing, LDR =const, PUSH POP B Bcc BL BX NOP, labels and “.word” data. Addresses assume 4 bytes per instruction for readability (real Thumb-2 mixes 16- and 32-bit encodings), and condition suffixes are accepted without an IT block.
      </p>
    </div>
  );
}
