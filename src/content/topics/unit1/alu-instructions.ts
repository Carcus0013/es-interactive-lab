import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'alu-instructions',
  unit: 1,
  order: 14,
  title: 'Logical, shift and arithmetic instructions',
  short: 'AND, ORR, EOR, BIC; LSL, LSR, ASR, ROR; ADD, SUB, RSB, MUL, divide and compare — what each does to the result and to the N Z C V flags.',
  status: 'textbook',
  sources: [{ file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.3.4 Logical, §3.3.5 Shift, §3.3.6 Arithmetic Operations' }, { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slide 32 (flags), 15 (hardware divide, MAC)' }],
  externalNote: md`Taught from the prescribed textbook (Valvano Ch. 3) and the flag definitions on your Day04 slides.`,
  keywords: ['AND', 'ORR', 'EOR', 'BIC', 'ORN', 'LSL', 'LSR', 'ASR', 'ROR', 'ADD', 'ADDS', 'SUB', 'RSB', 'CMP', 'MUL', 'MLA', 'UDIV', 'SDIV', 'S suffix', 'flags', 'mask'],
  importance: 2,
  sims: ['cpu', 'bits'],
  related: ['m4-registers', 'bit-manipulation', 'memory-instructions'],
  fundamentals: {
    what: md`Data-processing instructions operate on registers: **logical** instructions (AND, ORR, EOR, BIC) work bit by bit; **shift** instructions (LSL, LSR, ASR, ROR) move bits left or right; **arithmetic** instructions (ADD, SUB, RSB, MUL, UDIV, SDIV) compute; **compare** instructions (CMP, CMN, TST, TEQ) only set flags.`,
    why: md`Register-level embedded C is built from these: «|=» is ORR, «&= ~» is BIC, «<<» is LSL, «if (a > b)» is CMP + a conditional branch. Understanding them explains exactly what the compiler produces and why the flags matter.`,
    problem: md`They let the CPU set, clear, test and move individual bits (for peripheral registers), do fast multiply/divide by powers of two with shifts, and make decisions through flags.`,
    how: md`Each takes register or immediate operands and writes a destination register. With the **S** suffix (ADDS, ANDS, LSLS…) they also update N and Z, and arithmetic ones update C and V; shifts put the last bit shifted out into C.`,
    where: md`Bit masks for GPIO/ADC/USART registers, checksum and parity calculation, fixed-point maths, loop counters, comparisons in every if/while.`,
  },
  detailed: md`
## Logical operations (bitwise)

| Instruction | Operation | C equivalent | Typical use |
|---|---|---|---|
| «AND Rd, Rn, Op2» | Rd = Rn & Op2 | «&» | Clear/keep bits (masking), test bits |
| «ORR Rd, Rn, Op2» | Rd = Rn \| Op2 | «\|» | **Set** bits |
| «EOR Rd, Rn, Op2» | Rd = Rn ^ Op2 | «^» | **Toggle** bits |
| «BIC Rd, Rn, Op2» | Rd = Rn & ~Op2 | «& ~» | **Clear** bits (bit clear) |
| «ORN Rd, Rn, Op2» | Rd = Rn \| ~Op2 | «\| ~» | |
| «MVN Rd, Op2» | Rd = ~Op2 | «~» | |
| «TST Rn, Op2» | flags from Rn & Op2 | «if (x & mask)» | test a bit, result discarded |
| «TEQ Rn, Op2» | flags from Rn ^ Op2 | | equality test |

Truth: AND with 0 forces 0, OR with 1 forces 1, XOR with 1 inverts, anything combined with the identity (AND 1, OR 0, XOR 0) is unchanged — the basis of every register mask.

## Shift operations

| Instruction | Effect | Arithmetic meaning | C |
|---|---|---|---|
| «LSL Rd, Rm, #n» | shift left, zeros in from the right; C = last bit out | × 2ⁿ (unsigned or signed, if no overflow) | «x << n» |
| «LSR Rd, Rm, #n» | shift right, zeros in from the left | unsigned ÷ 2ⁿ | «x >> n» (unsigned) |
| «ASR Rd, Rm, #n» | shift right, **sign bit copied** in | signed ÷ 2ⁿ (rounds toward −∞) | «x >> n» (signed) |
| «ROR Rd, Rm, #n» | rotate right; bits leaving bit 0 enter bit 31 | — | — |
| «RRX Rd, Rm» | rotate right by one through C | — | — |

«(1U << 13)» in your lab code is computed with LSL (or folded to the constant 0x2000 by the compiler).

## Arithmetic operations

| Instruction | Operation | Notes |
|---|---|---|
| «ADD{S} Rd, Rn, Op2» | Rd = Rn + Op2 | ADDS sets N Z C V |
| «ADC» | Rd = Rn + Op2 + C | multi-word addition |
| «SUB{S} Rd, Rn, Op2» | Rd = Rn − Op2 | C = 1 if **no borrow** |
| «RSB Rd, Rn, Op2» | Rd = Op2 − Rn | reverse subtract («RSB R0,R0,#0» negates) |
| «CMP Rn, Op2» | flags from Rn − Op2 | result discarded |
| «CMN Rn, Op2» | flags from Rn + Op2 | compare negative |
| «MUL Rd, Rn, Rm» | Rd = low 32 bits of Rn × Rm | single cycle on M4 |
| «MLA Rd, Rn, Rm, Ra» | Rd = Ra + Rn × Rm | multiply-accumulate |
| «MLS Rd, Rn, Rm, Ra» | Rd = Ra − Rn × Rm | |
| «UDIV / SDIV Rd, Rn, Rm» | Rd = Rn / Rm | hardware divide, 2–12 cycles; ÷0 gives 0 unless trapped |

## Flag rules summary

| Result type | N | Z | C | V |
|---|---|---|---|---|
| Logical with S | bit 31 | result = 0 | from shifter (else unchanged) | unchanged |
| Shift with S | bit 31 | result = 0 | last bit shifted out | unchanged |
| ADDS | bit 31 | result = 0 | unsigned carry out | signed overflow |
| SUBS / CMP | bit 31 | result = 0 | 1 = no borrow (a ≥ b unsigned) | signed overflow |

Conditional branches after CMP:

| Signed | Unsigned | Meaning |
|---|---|---|
| BGE (N = V) | BHS / BCS (C = 1) | ≥ |
| BLT (N ≠ V) | BLO / BCC (C = 0) | < |
| BGT (Z = 0 and N = V) | BHI (C = 1 and Z = 0) | > |
| BLE (Z = 1 or N ≠ V) | BLS (C = 0 or Z = 1) | ≤ |
| BEQ (Z = 1), BNE (Z = 0) | same | = / ≠ |
`,
  visual: md`
Run the shift program and compare LSRS with ASRS on a negative number:

::sim{cpu preset=shifts}

Bit-mask operations exactly as the C compiler applies them:

::sim{bits}
`,
  exam: {
    definitions: [
      { term: 'Masking', def: 'Using AND, ORR, EOR or BIC with a constant (mask) to clear, set, toggle or test selected bits while leaving others unchanged.' },
      { term: 'Logical shift', def: 'A shift that fills vacated bit positions with zeros (LSL, LSR).' },
      { term: 'Arithmetic shift right', def: 'A right shift that copies the sign bit into vacated positions, dividing a signed number by a power of two.' },
      { term: 'S suffix', def: 'Instruction suffix that makes a data-processing instruction update the APSR condition flags.' },
    ],
    formulas: [
      { name: 'Left shift', expr: 'x << n = x × 2ⁿ (mod 2³²)', example: '7 << 3 = 56' },
      { name: 'Logical right shift', expr: 'x >> n = ⌊x / 2ⁿ⌋ (unsigned)', example: '0x80 >> 4 = 0x08' },
    ],
    frequent: ['Explain logical, shift and arithmetic instructions with examples.', 'Find the result and flags of an instruction sequence.', 'Difference between LSR and ASR.'],
    mistakes: ['Using LSR to divide a negative signed number (needs ASR).', 'Forgetting BIC exists (BIC = AND NOT).', 'Assuming ADD (without S) updates the flags.', 'Confusing signed (BGT/BLT) and unsigned (BHI/BLO) branches.'],
    diagrams: ['Bit movement for LSL, LSR, ASR, ROR'],
    shortQs: [
      { q: 'R0 = 0xF0000000. Give R1 after LSR R1,R0,#4 and after ASR R1,R0,#4.', a: md`LSR: 0x0F00 0000 (zeros enter). ASR: 0xFF00 0000 (sign bit 1 copied in).`, marks: 2 },
      { q: 'Write instructions to clear bit 5 and set bit 2 of R0.', a: md`«BIC R0, R0, #0x20» then «ORR R0, R0, #0x04».`, marks: 2 },
      { q: 'What is the difference between CMP and SUBS?', a: md`Both compute Rn − Op2 and set N Z C V; SUBS also writes the result to a destination register, CMP discards it.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the logical, shift and arithmetic instructions of the Cortex-M4 with examples and their effect on the condition flags.', a: md`Three tables (logical, shift, arithmetic), the flag-rule summary, and an example sequence with register values and flags after each step (e.g. MOVS R0,#5; SUBS R1,R0,#6 → N=1, C=0; LSLS R2,R0,#30 → C = bit shifted out).`, marks: 8 },
      { q: 'Translate the C statement «if (x > 10) y = y * 4; else y = y / 8;» (x signed, y unsigned in registers) into Cortex-M4 assembly and explain.', a: md`~~~asm
    CMP  R0, #10
    BLE  else_part        ; signed ≤
    LSL  R1, R1, #2       ; y *= 4
    B    done
else_part:
    LSR  R1, R1, #3       ; y /= 8 (unsigned)
done:
~~~
CMP sets flags; BLE (Z=1 or N≠V) handles the signed comparison; LSL/LSR implement power-of-two multiply/divide.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'R0 = 0x0000 00F2. Find R0 after BIC R0, R0, #0x20 and then EOR R0, R0, #0x03.',
        given: ['R0 = 0xF2 = 1111 0010'],
        find: 'Final R0',
        formula: 'BIC: R0 & ~mask ; EOR: R0 ^ mask',
        steps: ['~0x20 clears bit 5: 1111 0010 → 1101 0010 = 0xD2', 'EOR with 0000 0011 toggles bits 1 and 0: 1101 0010 → 1101 0001 = 0xD1'],
        answer: '0x0000 00D1',
        value: 0xd1,
      },
      {
        q: 'Find R2 and the C flag after LSLS R2, R1, #1 with R1 = 0x8000 0001.',
        given: ['R1 = 0x80000001'],
        find: 'R2 and C',
        formula: 'LSL by 1: result = (R1 << 1) mod 2³², C = old bit 31',
        steps: ['Shift left: 0x80000001 << 1 = 0x1_00000002 → keep 32 bits = 0x00000002', 'Bit shifted out (old bit 31) = 1 → C = 1'],
        answer: 'R2 = 0x0000 0002, C = 1',
        value: 2,
      },
    ],
  },
  revision: {
    notes: ['ORR sets, BIC clears, EOR toggles, AND/TST tests.', 'LSL ×2ⁿ, LSR unsigned ÷2ⁿ, ASR signed ÷2ⁿ, ROR rotates.', 'ADDS/SUBS/CMP set N Z C V; C after SUB = no borrow.', 'MUL single-cycle; UDIV/SDIV 2–12 cycles; MLA = multiply-accumulate.', 'Signed branches GE/LT/GT/LE; unsigned HS/LO/HI/LS.'],
    takeaways: ['C operators map 1:1 to Arm instructions.', 'S suffix is what updates flags.'],
    mcqs: [
      { q: 'Which instruction clears bits of Rn using a mask?', options: ['ORR', 'EOR', 'BIC', 'MVN'], answer: 2, explain: 'BIC Rd = Rn AND NOT mask.' },
      { q: 'ASR differs from LSR because ASR…', options: ['shifts left', 'copies the sign bit into vacated positions', 'rotates through carry', 'never changes flags'], answer: 1, explain: 'Arithmetic shift preserves the sign.' },
      { q: 'After CMP R0,R1 the program should branch if R0 < R1 as unsigned numbers. Use…', options: ['BLT', 'BLO', 'BGT', 'BMI'], answer: 1, explain: 'BLO (C = 0) is the unsigned lower-than branch.' },
      { q: 'TST R0,#0x10 sets Z = 1 when…', options: ['bit 4 of R0 is 1', 'bit 4 of R0 is 0', 'R0 = 0x10', 'never'], answer: 1, explain: 'R0 AND 0x10 = 0 when bit 4 is clear → Z = 1.' },
      { q: '7 << 3 equals…', options: ['10', '21', '56', '0.875'], answer: 2, explain: '7 × 2³ = 56.' },
    ],
  },
};

export default topic;
