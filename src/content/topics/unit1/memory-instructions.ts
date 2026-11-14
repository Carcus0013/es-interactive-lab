import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'memory-instructions',
  unit: 1,
  order: 13,
  title: 'Memory-access instructions and the stack',
  short: 'LDR/STR and their byte, halfword and signed forms, alignment, PUSH/POP and the full-descending stack.',
  status: 'textbook',
  sources: [{ file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.3.3 Memory Access Instructions, §3.3.7 Stack' }],
  externalNote: md`Taught from the prescribed textbook (Valvano Ch. 3); not on your slides.`,
  keywords: ['LDR', 'STR', 'LDRB', 'LDRH', 'LDRSB', 'LDRSH', 'STRB', 'STRH', 'PUSH', 'POP', 'stack', 'alignment', 'sign extension', 'zero extension'],
  importance: 1,
  sims: ['cpu'],
  related: ['addressing-modes', 'alu-instructions', 'm4-registers'],
  fundamentals: {
    what: md`Memory-access instructions move data between registers and memory: **LDR** (load) reads memory into a register and **STR** (store) writes a register to memory, in 8-, 16- or 32-bit sizes. **PUSH** and **POP** store and restore registers on the stack.`,
    why: md`In a load–store architecture these are the **only** instructions that touch memory, including peripheral registers. Every variable read, array access and GPIO register access in C becomes an LDR or STR.`,
    problem: md`They give precise control over data size and sign: an «int8_t» must be sign-extended when loaded, a «uint8_t» zero-extended, otherwise arithmetic on it gives wrong answers.`,
    how: md`The address comes from an addressing mode («[R1]», «[R1,#4]» …). Loads of bytes/halfwords fill the upper bits with zeros (LDRB/LDRH) or copies of the sign bit (LDRSB/LDRSH). Stores write only the low 8/16/32 bits. PUSH decrements SP then writes; POP reads then increments SP.`,
    where: md`«GPIOC->ODR |= …» compiles to LDR, ORR, STR; local variables and return addresses live on the stack via PUSH/POP; byte buffers (UART data) use LDRB/STRB.`,
  },
  detailed: md`
## Load and store forms

| Instruction | Size | Effect |
|---|---|---|
| «LDR Rd, [Rn]» | 32-bit | Rd ← word at Rn |
| «LDRH Rd, [Rn]» | 16-bit unsigned | Rd ← halfword, zero-extended |
| «LDRSH Rd, [Rn]» | 16-bit signed | Rd ← halfword, sign-extended |
| «LDRB Rd, [Rn]» | 8-bit unsigned | Rd ← byte, zero-extended |
| «LDRSB Rd, [Rn]» | 8-bit signed | Rd ← byte, sign-extended |
| «STR Rd, [Rn]» | 32-bit | word at Rn ← Rd |
| «STRH Rd, [Rn]» | 16-bit | halfword at Rn ← Rd[15:0] |
| «STRB Rd, [Rn]» | 8-bit | byte at Rn ← Rd[7:0] |
| «LDR Rd, =value» | pseudo | Rd ← 32-bit constant/address via literal pool |

Example: memory byte 0xF0 → «LDRB» gives 0x0000 00F0 (240), «LDRSB» gives 0xFFFF FFF0 (−16).

**Alignment:** word accesses should be at addresses divisible by 4 and halfwords by 2. The M4 tolerates unaligned LDR/STR for normal memory but they are slower; LDM/STM and stack accesses must be aligned.

## Read-modify-write is three instructions

~~~asm GPIOC->ODR |= (1 << 13);
    LDR  R1, =0x40020814   ; address of GPIOC_ODR
    LDR  R0, [R1]          ; READ
    ORR  R0, R0, #0x2000   ; MODIFY (set bit 13)
    STR  R0, [R1]          ; WRITE
~~~

An interrupt between the LDR and STR that changes another ODR bit will be overwritten — the problem bit-banding and BSRR solve.

## The stack (Valvano §3.3.7)

The Cortex-M stack is **full descending**: SP points to the last item pushed, and the stack grows towards lower addresses.

| Instruction | Effect |
|---|---|
| «PUSH {R0}» | SP ← SP − 4; mem[SP] ← R0 |
| «POP {R0}» | R0 ← mem[SP]; SP ← SP + 4 |
| «PUSH {R4-R6, LR}» | four words stored; lowest-numbered register at the lowest address |
| «POP {R4-R6, PC}» | restores R4–R6 and returns (PC ← saved LR) |

Stack rules: balance every PUSH with a POP; never read below SP; keep SP word-aligned (8-byte aligned at function calls by AAPCS).
`,
  visual: md`
Run the subroutine example: watch «PUSH {R4, LR}» lower SP by 8 and write two words, and «POP {R4, PC}» restore them.

::sim{cpu preset=call}

Then run the GPIO example to see read-modify-write in three instructions:

::sim{cpu preset=gpio}
`,
  exam: {
    definitions: [
      { term: 'Load instruction', def: 'Copies data from a memory address into a register (LDR, LDRB, LDRH, LDRSB, LDRSH).' },
      { term: 'Store instruction', def: 'Copies data from a register into memory (STR, STRB, STRH).' },
      { term: 'Sign extension', def: 'Filling the upper bits of a register with the sign bit of a loaded byte/halfword so the signed value is preserved.' },
      { term: 'Full-descending stack', def: 'SP points to the last pushed item and the stack grows towards lower addresses.' },
    ],
    frequent: ['List memory-access instructions with examples.', 'Explain PUSH and POP and how the stack grows.'],
    mistakes: ['Using LDRB for a signed char (needs LDRSB).', 'Saying PUSH increments SP.', 'Forgetting that STRB stores only the low 8 bits.'],
    diagrams: ['Stack before/after PUSH {R4, LR}'],
    shortQs: [
      { q: 'Memory byte at R1 is 0x80. What do LDRB R0,[R1] and LDRSB R0,[R1] put in R0?', a: md`LDRB: 0x0000 0080 (128). LDRSB: 0xFFFF FF80 (−128).`, marks: 2 },
      { q: 'SP = 0x2000 1000. What is SP after PUSH {R4, R5, LR}, and where is LR stored?', a: md`SP = 0x2000 1000 − 12 = 0x2000 0FF4. R4 at 0x2000 0FF4, R5 at 0x2000 0FF8, LR at 0x2000 0FFC (highest register at highest address).`, marks: 2 },
      { q: 'Why does GPIOC->ODR |= (1<<13) need three instructions?', a: md`Load–store architecture: the ALU cannot modify memory directly, so the value is loaded (LDR), modified in a register (ORR), and stored back (STR).`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the memory-access instructions of the Cortex-M4 including byte/halfword and signed variants, with examples.', a: md`Table of LDR/LDRB/LDRH/LDRSB/LDRSH/STR/STRB/STRH; zero vs sign extension example; LDR =const; alignment; the three-instruction read-modify-write of a GPIO register; relation to addressing modes.`, marks: 6 },
      { q: 'Explain how the stack works on the Cortex-M4 using PUSH and POP in a nested function call.', a: md`Full-descending stack; PUSH {R4,LR} on entry, POP {R4,PC} on exit; SP values before/after; why LR must be saved when the function calls another function; diagram of stack contents.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'SP = 0x2000 0800. Find SP after PUSH {R0-R3} followed by POP {R0, R1}.',
        given: ['SP = 0x20000800', 'PUSH 4 registers', 'POP 2 registers'],
        find: 'Final SP',
        formula: 'PUSH n regs: SP −= 4n ; POP n regs: SP += 4n',
        steps: ['After PUSH: 0x20000800 − 16 = 0x200007F0', 'After POP: 0x200007F0 + 8 = 0x200007F8'],
        answer: '0x2000 07F8',
        value: 0x200007f8,
      },
    ],
  },
  revision: {
    notes: ['LDR/STR word; LDRH/STRH halfword; LDRB/STRB byte; LDRSB/LDRSH sign-extend.', 'Only loads/stores access memory → RMW needs LDR, op, STR.', 'Stack is full-descending: PUSH = SP−4 then store; POP = load then SP+4.', 'PUSH {…,LR} / POP {…,PC} for nested calls.'],
    takeaways: ['Signed byte → LDRSB.', 'Highest register at highest stack address.'],
    mcqs: [
      { q: 'Which instruction loads a signed 16-bit value with sign extension?', options: ['LDRH', 'LDRSH', 'LDRSB', 'LDR'], answer: 1, explain: 'LDRSH sign-extends a halfword.' },
      { q: 'On the Cortex-M4 the stack grows…', options: ['upwards', 'downwards (full descending)', 'in both directions', 'only in Flash'], answer: 1, explain: 'SP decreases on PUSH.' },
      { q: 'STRB R0,[R1] writes…', options: ['all 32 bits of R0', 'R0[7:0] to one byte', 'R0[15:0]', 'nothing'], answer: 1, explain: 'Byte store.' },
      { q: 'POP {R4, PC} at the end of a function…', options: ['returns from the function', 'disables interrupts', 'is illegal', 'pushes PC'], answer: 0, explain: 'Loading PC with the saved LR returns.' },
      { q: 'How many instructions does a C read-modify-write of a register usually take?', options: ['1', '2', '3', '8'], answer: 2, explain: 'LDR, modify, STR.' },
    ],
  },
};

export default topic;
