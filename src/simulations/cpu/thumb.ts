// A small, honest interpreter for a subset of Armv7-M Thumb-2 assembly used in Valvano Ch. 3.
// Correct 32-bit arithmetic and NZCV flag rules; no pipeline timing, no encodings, no exceptions.

export interface Flags {
  N: boolean;
  Z: boolean;
  C: boolean;
  V: boolean;
}

export interface CpuState {
  r: number[]; // R0..R15 (R13 SP, R14 LR, R15 PC)
  f: Flags;
  mem: Map<number, number>; // byte-addressed, little-endian
  pcIndex: number; // index of next instruction to execute
  halted: boolean;
  steps: number;
  lastWrites: { reg: number[]; mem: number[] };
  note: string;
}

export interface Instr {
  op: string; // mnemonic without condition/S
  cond: string; // '' or EQ, NE...
  s: boolean; // S suffix
  args: string[];
  line: number;
  text: string;
  size: string; // b / h / '' for loads/stores
}

export interface Program {
  instrs: Instr[];
  labels: Record<string, number>;
  data: { label: string; addr: number; words: number[] }[];
  errors: string[];
}

export const CODE_BASE = 0x08000000;
export const INSTR_BYTES = 4; // simplification: every instruction treated as 4 bytes
export const SP_INIT = 0x20001000;
export const DATA_BASE = 0x20000000;

const u32 = (v: number) => v >>> 0;
const REG_ALIASES: Record<string, number> = { sp: 13, lr: 14, pc: 15 };
const CONDS = ['eq', 'ne', 'cs', 'hs', 'cc', 'lo', 'mi', 'pl', 'vs', 'vc', 'hi', 'ls', 'ge', 'lt', 'gt', 'le', 'al'];
const OPS = ['mov', 'mvn', 'add', 'adc', 'sub', 'rsb', 'mul', 'mla', 'udiv', 'sdiv', 'and', 'orr', 'eor', 'bic', 'lsl', 'lsr', 'asr', 'ror', 'cmp', 'cmn', 'tst', 'teq', 'ldr', 'str', 'push', 'pop', 'b', 'bl', 'bx', 'nop', 'neg'];

export function regIndex(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (t in REG_ALIASES) return REG_ALIASES[t];
  const m = t.match(/^r(\d{1,2})$/);
  if (m && Number(m[1]) <= 15) return Number(m[1]);
  return null;
}

function parseImm(s: string): number | null {
  const t = s.trim().replace(/^#/, '').toLowerCase();
  if (/^-?0x[0-9a-f]+$/.test(t)) return u32(parseInt(t, 16));
  if (/^0b[01]+$/.test(t)) return parseInt(t.slice(2), 2);
  if (/^-?\d+$/.test(t)) return u32(parseInt(t, 10));
  if (/^'.'$/.test(t)) return t.charCodeAt(1);
  return null;
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '[' || ch === '{') depth++;
    if (ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function decodeMnemonic(m: string): { op: string; cond: string; s: boolean; size: string } | null {
  const t = m.toLowerCase();
  // try longest op match
  for (const op of [...OPS].sort((a, b) => b.length - a.length)) {
    if (!t.startsWith(op)) continue;
    let rest = t.slice(op.length);
    let size = '';
    if ((op === 'ldr' || op === 'str') && /^(sb|sh|b|h)/.test(rest)) {
      size = rest.match(/^(sb|sh|b|h)/)![0];
      rest = rest.slice(size.length);
    }
    let s = false;
    if (rest.startsWith('s') && !['b', 'bl', 'bx', 'ldr', 'str', 'cmp', 'cmn', 'tst', 'teq', 'push', 'pop'].includes(op) && !CONDS.includes(rest)) {
      s = true;
      rest = rest.slice(1);
    }
    if (rest === '' || CONDS.includes(rest)) {
      if (op === 'bl' && rest === '' ) return { op, cond: '', s, size };
      return { op, cond: rest === 'al' ? '' : rest, s, size };
    }
  }
  return null;
}

export function assemble(src: string): Program {
  const lines = src.replace(/\r/g, '').split('\n');
  const instrs: Instr[] = [];
  const labels: Record<string, number> = {};
  const data: Program['data'] = [];
  const errors: string[] = [];
  let dataAddr = DATA_BASE;
  lines.forEach((raw, i) => {
    let text = raw.replace(/(;|\/\/|@).*$/, '').trim();
    if (!text) return;
    const lm = text.match(/^([A-Za-z_]\w*)\s*:?\s*(.*)$/);
    // label forms: "loop:" or "loop:  ADD ..." ; data: "array: .word 1,2,3" / "DCD"
    const colon = text.match(/^([A-Za-z_]\w*):\s*(.*)$/);
    if (colon) {
      const [, name, rest] = colon;
      const dm = rest.match(/^(\.word|dcd)\s+(.+)$/i);
      if (dm) {
        const words = dm[2].split(',').map((x) => parseImm(x) ?? 0);
        data.push({ label: name, addr: dataAddr, words });
        labels[name.toLowerCase()] = -1 - data.length; // marker for data label
        dataAddr += words.length * 4;
        return;
      }
      labels[name.toLowerCase()] = instrs.length;
      text = rest.trim();
      if (!text) return;
    }
    void lm;
    const sp = text.search(/\s/);
    const mn = sp < 0 ? text : text.slice(0, sp);
    const argStr = sp < 0 ? '' : text.slice(sp + 1);
    const d = decodeMnemonic(mn);
    if (!d) {
      errors.push(`Line ${i + 1}: unknown instruction “${mn}”.`);
      return;
    }
    instrs.push({ ...d, args: splitArgs(argStr), line: i + 1, text: raw.trim() });
  });
  return { instrs, labels, data, errors };
}

export function initialState(p: Program): CpuState {
  const mem = new Map<number, number>();
  for (const d of p.data) d.words.forEach((w, k) => writeMem(mem, d.addr + 4 * k, w, 4));
  const r = Array(16).fill(0);
  r[13] = SP_INIT;
  r[14] = 0xffffffff;
  r[15] = CODE_BASE;
  return { r, f: { N: false, Z: false, C: false, V: false }, mem, pcIndex: 0, halted: p.instrs.length === 0, steps: 0, lastWrites: { reg: [], mem: [] }, note: 'Reset: SP = initial MSP, PC = reset vector, LR = 0xFFFFFFFF.' };
}

export function readMem(mem: Map<number, number>, addr: number, bytes: number) {
  let v = 0;
  for (let i = bytes - 1; i >= 0; i--) v = (v << 8) | (mem.get(u32(addr + i)) ?? 0);
  return u32(v);
}
export function writeMem(mem: Map<number, number>, addr: number, v: number, bytes: number) {
  for (let i = 0; i < bytes; i++) mem.set(u32(addr + i), (v >>> (8 * i)) & 0xff);
}

function condPass(c: string, f: Flags) {
  switch (c) {
    case '':
      return true;
    case 'eq':
      return f.Z;
    case 'ne':
      return !f.Z;
    case 'cs':
    case 'hs':
      return f.C;
    case 'cc':
    case 'lo':
      return !f.C;
    case 'mi':
      return f.N;
    case 'pl':
      return !f.N;
    case 'vs':
      return f.V;
    case 'vc':
      return !f.V;
    case 'hi':
      return f.C && !f.Z;
    case 'ls':
      return !f.C || f.Z;
    case 'ge':
      return f.N === f.V;
    case 'lt':
      return f.N !== f.V;
    case 'gt':
      return !f.Z && f.N === f.V;
    case 'le':
      return f.Z || f.N !== f.V;
  }
  return true;
}

export function addWithFlags(a: number, b: number, carryIn = 0) {
  const r = u32(a + b + carryIn);
  const C = a + b + carryIn > 0xffffffff;
  const V = (((a ^ r) & (b ^ r)) >>> 31) === 1;
  return { r, C, V };
}
export function subWithFlags(a: number, b: number) {
  const r = u32(a - b);
  const C = u32(a) >= u32(b); // no borrow
  const V = (((a ^ b) & (a ^ r)) >>> 31) === 1;
  return { r, C, V };
}

function shiftOp(op: string, v: number, n: number, carry: boolean): { r: number; C: boolean } {
  n = n & 0xff;
  if (n === 0) return { r: u32(v), C: carry };
  switch (op) {
    case 'lsl':
      return n >= 33 ? { r: 0, C: false } : { r: n === 32 ? 0 : u32(v << n), C: ((v >>> (32 - n)) & 1) === 1 };
    case 'lsr':
      return n >= 33 ? { r: 0, C: false } : { r: n === 32 ? 0 : v >>> n, C: ((v >>> (n - 1)) & 1) === 1 };
    case 'asr': {
      const s = v | 0;
      if (n >= 32) return { r: s < 0 ? 0xffffffff : 0, C: s < 0 };
      return { r: u32(s >> n), C: ((s >> (n - 1)) & 1) === 1 };
    }
    case 'ror': {
      const k = n % 32;
      const r = k === 0 ? u32(v) : u32((v >>> k) | (v << (32 - k)));
      return { r, C: (r >>> 31) === 1 };
    }
  }
  return { r: v, C: carry };
}

export const pcAddr = (index: number) => CODE_BASE + index * INSTR_BYTES;

/** Execute one instruction; returns a new state (does not mutate input). */
export function step(p: Program, st: CpuState): CpuState {
  if (st.halted) return st;
  const s: CpuState = { ...st, r: [...st.r], f: { ...st.f }, mem: new Map(st.mem), lastWrites: { reg: [], mem: [] }, steps: st.steps + 1, note: '' };
  const ins = p.instrs[s.pcIndex];
  if (!ins) {
    s.halted = true;
    s.note = 'End of program.';
    return s;
  }
  let next = s.pcIndex + 1;
  const R = (x: string) => {
    const i = regIndex(x);
    if (i === null) throw new Error(`“${x}” is not a register`);
    return i;
  };
  const opnd = (x: string) => {
    const imm = x.trim().startsWith('#') ? parseImm(x) : null;
    if (imm !== null) return imm;
    const sh = x.match(/^(\w+)\s*,?\s*(lsl|lsr|asr|ror)\s*#?(\d+)$/i);
    if (sh) return shiftOp(sh[2].toLowerCase(), s.r[R(sh[1])], Number(sh[3]), s.f.C).r;
    return s.r[R(x)];
  };
  const setR = (i: number, v: number) => {
    s.r[i] = u32(v);
    s.lastWrites.reg.push(i);
  };
  const nz = (v: number) => {
    s.f.N = (v >>> 31) === 1;
    s.f.Z = u32(v) === 0;
  };
  const label = (name: string) => {
    const k = name.trim().toLowerCase();
    if (!(k in p.labels) || p.labels[k] < 0) throw new Error(`unknown label “${name}”`);
    return p.labels[k];
  };

  try {
    if (!condPass(ins.cond, s.f)) {
      s.note = `Condition ${ins.cond.toUpperCase()} is false → instruction skipped.`;
    } else {
      const a = ins.args;
      switch (ins.op) {
        case 'nop':
          s.note = 'No operation.';
          break;
        case 'mov':
        case 'mvn': {
          const v = opnd(a[1]);
          const res = ins.op === 'mvn' ? ~v : v;
          setR(R(a[0]), res);
          if (ins.s) nz(res);
          s.note = `${a[0].toUpperCase()} ← ${ins.op === 'mvn' ? 'NOT ' : ''}${a[1]} = 0x${u32(res).toString(16).toUpperCase()}${ins.s ? ' (N, Z updated)' : ''}${a[1].startsWith('#') ? ' — immediate addressing' : ''}`;
          break;
        }
        case 'neg': {
          const v = s.r[R(a[1] ?? a[0])];
          const o = subWithFlags(0, v);
          setR(R(a[0]), o.r);
          if (ins.s) Object.assign(s.f, { C: o.C, V: o.V }), nz(o.r);
          break;
        }
        case 'add':
        case 'adc':
        case 'sub':
        case 'rsb':
        case 'cmp':
        case 'cmn': {
          const three = a.length >= 3;
          const isCmp = ins.op === 'cmp' || ins.op === 'cmn';
          const d = isCmp ? -1 : R(a[0]);
          const x = isCmp ? s.r[R(a[0])] : three ? s.r[R(a[1])] : s.r[d];
          const y = opnd(isCmp ? a[1] : three ? a[2] : a[1]);
          let o: { r: number; C: boolean; V: boolean };
          if (ins.op === 'add' || ins.op === 'cmn') o = addWithFlags(x, y);
          else if (ins.op === 'adc') o = addWithFlags(x, y, s.f.C ? 1 : 0);
          else if (ins.op === 'rsb') o = subWithFlags(y, x);
          else o = subWithFlags(x, y);
          if (!isCmp) setR(d, o.r);
          if (ins.s || isCmp) {
            nz(o.r);
            s.f.C = o.C;
            s.f.V = o.V;
          }
          const sym = ins.op === 'add' || ins.op === 'adc' || ins.op === 'cmn' ? '+' : '−';
          s.note = isCmp
            ? `${ins.op.toUpperCase()}: computes ${u32(x)} ${sym} ${u32(y)} = 0x${o.r.toString(16).toUpperCase()} and only sets flags: N=${+s.f.N} Z=${+s.f.Z} C=${+s.f.C} V=${+s.f.V}.`
            : `${a[0].toUpperCase()} ← ${ins.op === 'rsb' ? `${u32(y)} − ${u32(x)}` : `${u32(x)} ${sym} ${u32(y)}`} = ${o.r} (0x${o.r.toString(16).toUpperCase()})${ins.s ? `; flags N=${+s.f.N} Z=${+s.f.Z} C=${+s.f.C} V=${+s.f.V}` : ' (flags unchanged — no S suffix)'}`;
          break;
        }
        case 'mul':
        case 'mla': {
          const three = a.length >= 3;
          const x = s.r[R(three ? a[1] : a[0])];
          const y = s.r[R(three ? a[2] : a[1])];
          let v = Math.imul(x, y);
          if (ins.op === 'mla') v = v + s.r[R(a[3])];
          setR(R(a[0]), v);
          if (ins.s) nz(u32(v));
          s.note = `${a[0].toUpperCase()} ← low 32 bits of ${x} × ${y}${ins.op === 'mla' ? ' + ' + a[3] : ''} = ${u32(v)}`;
          break;
        }
        case 'udiv':
        case 'sdiv': {
          const x = s.r[R(a.length >= 3 ? a[1] : a[0])];
          const y = s.r[R(a.length >= 3 ? a[2] : a[1])];
          const v = y === 0 ? 0 : ins.op === 'udiv' ? Math.floor(u32(x) / u32(y)) : Math.trunc((x | 0) / (y | 0));
          setR(R(a[0]), v);
          s.note = y === 0 ? 'Division by zero returns 0 on Cortex-M4 (unless DIV_0_TRP is set).' : `${a[0].toUpperCase()} ← ${ins.op === 'udiv' ? u32(x) : x | 0} / ${ins.op === 'udiv' ? u32(y) : y | 0} = ${v} (hardware divide, 2–12 cycles)`;
          break;
        }
        case 'and':
        case 'orr':
        case 'eor':
        case 'bic':
        case 'tst':
        case 'teq': {
          const isTest = ins.op === 'tst' || ins.op === 'teq';
          const three = a.length >= 3;
          const x = isTest ? s.r[R(a[0])] : three ? s.r[R(a[1])] : s.r[R(a[0])];
          const y = opnd(isTest ? a[1] : three ? a[2] : a[1]);
          const v = ins.op === 'and' || ins.op === 'tst' ? x & y : ins.op === 'orr' ? x | y : ins.op === 'eor' || ins.op === 'teq' ? x ^ y : x & ~y;
          if (!isTest) setR(R(a[0]), v);
          if (ins.s || isTest) nz(u32(v));
          s.note = `${isTest ? ins.op.toUpperCase() + ' (flags only)' : a[0].toUpperCase()} ← 0x${u32(x).toString(16).toUpperCase()} ${ins.op === 'and' || ins.op === 'tst' ? 'AND' : ins.op === 'orr' ? 'OR' : ins.op === 'bic' ? 'AND NOT' : 'XOR'} 0x${u32(y).toString(16).toUpperCase()} = 0x${u32(v).toString(16).toUpperCase()}`;
          break;
        }
        case 'lsl':
        case 'lsr':
        case 'asr':
        case 'ror': {
          const three = a.length >= 3;
          const x = s.r[R(three ? a[1] : a[0])];
          const nArg = three ? a[2] : a[1];
          const n = nArg.trim().startsWith('#') ? parseImm(nArg)! : s.r[R(nArg)];
          const o = shiftOp(ins.op, x, n, s.f.C);
          setR(R(a[0]), o.r);
          if (ins.s) {
            nz(o.r);
            s.f.C = o.C;
          }
          s.note = `${a[0].toUpperCase()} ← 0x${u32(x).toString(16).toUpperCase()} ${ins.op.toUpperCase()} ${n} = 0x${o.r.toString(16).toUpperCase()}${ins.s ? `; C = last bit shifted out = ${+o.C}` : ''}${ins.op === 'lsl' ? ` (× ${2 ** (n & 31)})` : ins.op === 'lsr' ? ` (unsigned ÷ ${2 ** (n & 31)})` : ins.op === 'asr' ? ' (signed ÷, sign bit copied)' : ''}`;
          break;
        }
        case 'ldr':
        case 'str': {
          const rt = R(a[0]);
          const bytes = ins.size === 'b' || ins.size === 'sb' ? 1 : ins.size === 'h' || ins.size === 'sh' ? 2 : 4;
          const src = a[1];
          if (ins.op === 'ldr' && src.trim().startsWith('=')) {
            const name = src.trim().slice(1);
            const imm = parseImm(name);
            let v: number;
            if (imm !== null) v = imm;
            else {
              const d = p.data.find((x) => x.label.toLowerCase() === name.toLowerCase());
              if (!d) throw new Error(`unknown symbol “${name}”`);
              v = d.addr;
            }
            setR(rt, v);
            s.note = `${a[0].toUpperCase()} ← 0x${u32(v).toString(16).toUpperCase()} (assembler puts the constant in a literal pool and loads it PC-relative)`;
            break;
          }
          const m = src.match(/^\[\s*(\w+)\s*(?:,\s*([^\]]+))?\]\s*(!)?$/);
          if (!m) throw new Error(`bad address “${src}”`);
          const base = R(m[1]);
          let off = 0;
          let offTxt = '';
          if (m[2]) {
            const reg = regIndex(m[2].split(',')[0]);
            if (reg !== null) {
              const sh = m[2].match(/lsl\s*#(\d+)/i);
              off = s.r[reg] << (sh ? Number(sh[1]) : 0);
              offTxt = `${m[2]}`;
            } else {
              off = parseImm(m[2]) ?? 0;
              offTxt = m[2];
            }
          }
          const post = a[2];
          const pre = !!m[3];
          const addr = u32(s.r[base] + (post ? 0 : off));
          if (ins.op === 'ldr') {
            let v = readMem(s.mem, addr, bytes);
            if (ins.size === 'sb') v = u32((v << 24) >> 24);
            if (ins.size === 'sh') v = u32((v << 16) >> 16);
            setR(rt, v);
            s.note = `${a[0].toUpperCase()} ← mem[0x${addr.toString(16).toUpperCase()}] (${bytes} byte${bytes > 1 ? 's' : ''}) = 0x${v.toString(16).toUpperCase()} — ${post ? 'post-indexed' : pre ? 'pre-indexed with write-back' : m[2] ? 'indexed with offset ' + offTxt : 'indexed (register pointer)'}`;
          } else {
            writeMem(s.mem, addr, s.r[rt], bytes);
            for (let k = 0; k < bytes; k++) s.lastWrites.mem.push(u32(addr + k));
            s.note = `mem[0x${addr.toString(16).toUpperCase()}] ← ${a[0].toUpperCase()} (${bytes} byte${bytes > 1 ? 's' : ''}) = 0x${(s.r[rt] & (bytes === 4 ? 0xffffffff : (1 << (8 * bytes)) - 1)).toString(16).toUpperCase()}, stored little-endian`;
          }
          if (pre) setR(base, addr);
          if (post) setR(base, s.r[base] + (parseImm(post) ?? s.r[R(post)]));
          break;
        }
        case 'push':
        case 'pop': {
          const list = a.join(',').replace(/[{}]/g, '');
          const regs: number[] = [];
          for (const part of list.split(',')) {
            const rg = part.trim().split('-');
            if (rg.length === 2) for (let k = R(rg[0]); k <= R(rg[1]); k++) regs.push(k);
            else if (part.trim()) regs.push(R(part));
          }
          regs.sort((x, y) => x - y);
          if (ins.op === 'push') {
            let sp = s.r[13] - 4 * regs.length;
            setR(13, sp);
            for (const rg of regs) {
              const v = rg === 15 ? pcAddr(s.pcIndex + 1) : s.r[rg];
              writeMem(s.mem, sp, v, 4);
              for (let k = 0; k < 4; k++) s.lastWrites.mem.push(sp + k);
              sp += 4;
            }
            s.note = `SP −= ${4 * regs.length}; store {${regs.map(regName).join(', ')}} — lowest register at the lowest address. Full-descending stack.`;
          } else {
            let sp = s.r[13];
            for (const rg of regs) {
              const v = readMem(s.mem, sp, 4);
              if (rg === 15) {
                const idx = (u32(v & ~1) - CODE_BASE) / INSTR_BYTES;
                if (v === 0xffffffff || idx < 0 || idx > p.instrs.length) {
                  s.halted = true;
                  s.note = 'POP {PC} with LR = 0xFFFFFFFF: returned from main — program finished.';
                } else next = idx;
              } else setR(rg, v);
              sp += 4;
            }
            setR(13, sp);
            if (!s.halted) s.note = `Load {${regs.map(regName).join(', ')}} from the stack; SP += ${4 * regs.length}.${regs.includes(15) ? ' Loading PC returns from the function.' : ''}`;
          }
          break;
        }
        case 'b':
          next = label(a[0]);
          s.note = `${ins.cond ? `Condition ${ins.cond.toUpperCase()} true → ` : ''}branch to ${a[0]} (PC-relative addressing).`;
          break;
        case 'bl':
          setR(14, pcAddr(s.pcIndex + 1) | 1);
          next = label(a[0]);
          s.note = `BL: LR ← return address 0x${(pcAddr(s.pcIndex + 1) | 1).toString(16).toUpperCase()} (bit 0 = 1 marks Thumb state), PC ← ${a[0]}.`;
          break;
        case 'bx': {
          const t = s.r[R(a[0])];
          if (t === 0xffffffff) {
            s.halted = true;
            s.note = 'BX LR with LR = 0xFFFFFFFF: main returned — program finished.';
          } else {
            next = (u32(t & ~1) - CODE_BASE) / INSTR_BYTES;
            s.note = `BX ${a[0].toUpperCase()}: PC ← 0x${u32(t & ~1).toString(16).toUpperCase()} — return to the caller.`;
          }
          break;
        }
        default:
          throw new Error(`“${ins.op}” not supported`);
      }
    }
  } catch (e) {
    s.halted = true;
    s.note = `Error on line ${ins.line}: ${(e as Error).message}`;
    return s;
  }
  s.pcIndex = next;
  s.r[15] = pcAddr(next);
  if (next >= p.instrs.length) {
    s.halted = true;
    s.note += ' — end of program.';
  }
  return s;
}

export const regName = (i: number) => (i === 13 ? 'SP' : i === 14 ? 'LR' : i === 15 ? 'PC' : `R${i}`);
