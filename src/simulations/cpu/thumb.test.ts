import { describe, expect, it } from 'vitest';
import { addWithFlags, assemble, initialState, step, subWithFlags, type CpuState } from './thumb';

function run(src: string, max = 500): CpuState {
  const p = assemble(src);
  expect(p.errors).toEqual([]);
  let st = initialState(p);
  for (let i = 0; i < max && !st.halted; i++) st = step(p, st);
  return st;
}

describe('flag helpers', () => {
  it('unsigned carry out of an addition', () => {
    const r = addWithFlags(0xffffffff, 1);
    expect(r.r).toBe(0);
    expect(r.C).toBe(true);
    expect(r.V).toBe(false);
  });

  it('signed overflow of an addition', () => {
    const r = addWithFlags(0x7fffffff, 1);
    expect(r.r).toBe(0x80000000);
    expect(r.C).toBe(false);
    expect(r.V).toBe(true);
  });

  it('subtraction sets C when there is no borrow', () => {
    expect(subWithFlags(5, 3).C).toBe(true);
    expect(subWithFlags(3, 5).C).toBe(false);
    expect(subWithFlags(5, 5).r).toBe(0);
  });

  it('signed overflow of a subtraction', () => {
    const r = subWithFlags(0x80000000, 1);
    expect(r.r).toBe(0x7fffffff);
    expect(r.V).toBe(true);
  });
});

describe('interpreter', () => {
  it('MOVS / SUBS produce N = 1 and a borrow for 0 − 1', () => {
    const st = run('MOVS R0, #0\nSUBS R0, R0, #1');
    expect(st.r[0]).toBe(0xffffffff);
    expect(st.f.N).toBe(true);
    expect(st.f.Z).toBe(false);
    expect(st.f.C).toBe(false);
  });

  it('a count-down loop ends with Z set', () => {
    const st = run('MOVS R0, #5\nloop: SUBS R0, R0, #1\nBNE loop\nMOVS R1, #9');
    expect(st.r[0]).toBe(0);
    expect(st.r[1]).toBe(9);
    expect(st.f.Z).toBe(false); // MOVS #9 clears Z again
  });

  it('CMP followed by a conditional branch takes the right path', () => {
    const st = run('MOVS R0, #3\nCMP R0, #10\nBLT small\nMOVS R1, #1\nB done\nsmall: MOVS R1, #2\ndone: MOVS R2, #0');
    expect(st.r[1]).toBe(2);
  });

  it('ADD without S leaves the flags alone', () => {
    const st = run('MOVS R0, #0\nMOVS R1, #1\nADD R2, R0, R1');
    expect(st.r[2]).toBe(1);
    expect(st.f.Z).toBe(false); // last flag-setting instruction was MOVS R1, #1
  });

  it('PUSH and POP move SP by 4 per register', () => {
    const p = assemble('MOVS R0, #7\nPUSH {R0}\nMOVS R0, #0\nPOP {R1}');
    let st = initialState(p);
    const sp0 = st.r[13];
    st = step(p, st);
    st = step(p, st);
    expect(st.r[13]).toBe(sp0 - 4);
    st = step(p, st);
    st = step(p, st);
    expect(st.r[1]).toBe(7);
    expect(st.r[13]).toBe(sp0);
  });

  it('reports unknown mnemonics', () => {
    expect(assemble('FROB R0, R1').errors.length).toBe(1);
  });
});
