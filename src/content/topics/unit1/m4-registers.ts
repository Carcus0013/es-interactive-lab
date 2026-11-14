import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'm4-registers',
  unit: 1,
  order: 8,
  title: 'Cortex-M4 registers: R0–R15, LR, PC and xPSR',
  short: 'The register bank, the banked stack pointer, how BL and BX LR use the link register, the APSR flags N Z C V Q, and the special registers.',
  status: 'course',
  sources: [
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 26–33' },
    { file: 'Lecture01_CortexM4Processor_Introduction.pptx', detail: 'programmer’s model slides' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.1.1 Registers, §3.3.8 Functions and Control Flow' },
  ],
  keywords: ['R0', 'R12', 'SP', 'MSP', 'PSP', 'LR', 'link register', 'PC', 'xPSR', 'APSR', 'IPSR', 'EPSR', 'N Z C V', 'flags', 'PRIMASK', 'CONTROL', 'BL', 'BX LR'],
  importance: 3,
  pyq: ['MT25A-4', 'MT25B-2', 'MT25B-3', 'MT25B-4', 'MT26S2-2'],
  sims: ['cpu'],
  related: ['operating-modes', 'alu-instructions', 'memory-instructions', 'nvic'],
  fundamentals: {
    what: md`Registers are small, very fast storage cells **inside** the processor core. The Cortex-M4 has **sixteen 32-bit core registers** R0–R15 — thirteen general purpose (R0–R12) plus the stack pointer (R13), link register (R14) and program counter (R15) — and **special registers**: the program status register xPSR, the interrupt masks PRIMASK/FAULTMASK/BASEPRI, and CONTROL.`,
    why: md`The Cortex-M4 is a **load–store** machine: the ALU can only operate on register contents. Every calculation, address, function argument and return address passes through registers, so understanding them is understanding how the CPU runs your C code.`,
    problem: md`Registers remove the slow memory access from every arithmetic step; the SP, LR and PC let the processor manage function calls and returns; the flags let it make decisions (if/while); the special registers control privilege and interrupts.`,
    how: md`Data is loaded from memory into R0–R12, processed, and stored back. «BL func» copies the return address into **LR** and jumps; «BX LR» copies LR back into the **PC** to return. Instructions with the S suffix and «CMP» update the **N, Z, C, V** flags in the APSR, which conditional branches then test.`,
    where: md`Every function call (argument passing in R0–R3, return value in R0), every «if» and loop, interrupt entry (the hardware stacks R0–R3, R12, LR, PC, xPSR), and RTOS task switching (MSP vs PSP).`,
  },
  detailed: md`
## The register set

::diagram{register-bank}

| Register | Name | Purpose |
|---|---|---|
| R0–R7 | Low registers | General purpose; accessible by **all** instructions, including 16-bit Thumb ones |
| R8–R12 | High registers | General purpose; some 16-bit Thumb instructions cannot use them |
| R13 | **SP** — stack pointer | Address of the top of the stack. **Banked**: MSP (main) and PSP (process); only one is visible at a time |
| R14 | **LR** — link register | Return address of a function call; EXC_RETURN code during exceptions |
| R15 | **PC** — program counter | Address of the current instruction; advances by 2 or 4 after each instruction unless a branch writes it |

### R13 — stack pointer

- **MSP** (main stack pointer): used after reset, by the OS kernel and by all exception handlers.
- **PSP** (process stack pointer): used by application threads under an RTOS when CONTROL.SPSEL = 1.
- The stack is **full-descending**: «PUSH» first decrements SP, then stores. SP is word-aligned (bits 1:0 = 0).
- The stack saves context during function calls and task switches.

### R14 — link register and subroutine calls (Aug 2025 Set B, Aug 2026 Set 2)

1. «BL subroutine» → hardware writes the **address of the next instruction** (with bit 0 = 1 for Thumb) into **LR**, then loads the subroutine address into **PC**.
2. The subroutine runs.
3. «BX LR» → PC ← LR, so execution continues right after the BL.
4. **Nested calls:** a function that itself calls «BL» would overwrite LR, so it first does «PUSH {LR}» and returns with «POP {PC}».
5. **Exceptions:** on interrupt entry LR is loaded with a special **EXC_RETURN** value (0xFFFFFFF9 = return to thread mode using MSP, 0xFFFFFFF1 = return to handler mode, 0xFFFFFFFD = thread mode using PSP). «BX LR» with this value triggers the exception return sequence.
6. At reset LR = 0xFFFFFFFF (Valvano §3.1.2).

~~~asm Call and return
        MOVS  R0, #3
        BL    square        ; LR = address of next instruction, PC = square
        MOVS  R5, R0        ; ← execution resumes here after BX LR
        ...
square: MULS  R0, R0, R0
        BX    LR            ; PC = LR → return
~~~

### R15 — program counter

Holds the address of the current instruction (reading PC in Thumb state returns current + 4 because of the pipeline). Normally increments by the instruction size (2 or 4 bytes); branches, BL and BX load it with a new address. Bit 0 is always 0 in the PC because instructions are halfword aligned — the Thumb bit lives in EPSR instead.

## xPSR — the combined program status register (Aug 2025 Set A & B)

::diagram{xpsr}

xPSR is one view of three registers:

| Part | Bits | Content |
|---|---|---|
| **APSR** (application) | 31–27 | Condition flags **N Z C V** and sticky saturation **Q** (and GE[3:0] for SIMD) |
| **IPSR** (interrupt) | 8–0 | **ISR_NUMBER** — exception number currently executing (0 = thread mode) |
| **EPSR** (execution) | 24, 26–25, 15–10 | **T** = Thumb state (always 1); ICI/IT bits |

### The condition flags

| Flag | Set to 1 when | Typical use |
|---|---|---|
| **N** negative | bit 31 of the result is 1 (result negative as a signed number) | «BMI», «BLT» |
| **Z** zero | result is exactly 0 | «BEQ», «BNE» — equality, loop counters |
| **C** carry | unsigned overflow on add; **no borrow** on subtract (a ≥ b); last bit shifted out | unsigned comparisons «BHS», «BLO», multi-word add |
| **V** overflow | signed overflow: two positives give a negative or two negatives a positive | signed comparisons «BGE», «BLT», «BGT», «BLE» |
| **Q** saturation | a saturating instruction clipped its result (sticky until cleared) | DSP code |

**How the flags affect execution.** They are written only by instructions with an **S** suffix («ADDS», «SUBS», «MOVS») and by «CMP», «CMN», «TST», «TEQ». A later conditional instruction tests them: «BEQ» branches if Z = 1, «BGT» if Z = 0 and N = V, and so on. This is how every C «if», «while» and «for» is compiled.

| Example | Result | N | Z | C | V |
|---|---|---|---|---|---|
| 5 − 5 («SUBS») | 0 | 0 | 1 | 1 | 0 |
| 5 − 6 | 0xFFFF FFFF (−1) | 1 | 0 | 0 | 0 |
| 0x7FFF FFFF + 1 («ADDS») | 0x8000 0000 | 1 | 0 | 0 | 1 |
| 0xFFFF FFFF + 1 | 0 | 0 | 1 | 1 | 0 |

> [!warning] CPSR vs xPSR
> The Aug 2025 paper says “CPSR”. That is the name used on classic Arm (Arm7/9) cores. Cortex-M calls it **xPSR / APSR**; the N, Z, C, V flags mean exactly the same. Mention both names in your answer.

### EPSR details

- **T bit** — always 1 because Cortex-M executes only Thumb code; trying to clear it causes a fault. That is why function addresses have bit 0 = 1.
- **ICI** — remembers which registers an interrupted «LDM»/«STM» had already transferred, so it can resume after the interrupt.
- **IT** — holds the condition codes of up to four instructions in an If-Then block.

## Special registers

| Register | Function |
|---|---|
| PRIMASK | 1 → blocks all configurable-priority interrupts (only NMI and HardFault run). «__disable_irq()» sets it |
| FAULTMASK | 1 → blocks everything except NMI |
| BASEPRI | blocks interrupts with priority value ≥ BASEPRI (lower urgency) |
| CONTROL | bit 0 nPRIV (unprivileged thread), bit 1 SPSEL (PSP in thread mode), bit 2 FPCA (FPU context active) |

Special registers are accessed with «MRS»/«MSR» instructions, or CMSIS functions such as «__get_CONTROL()».
`,
  visual: md`
Run the subroutine example and watch LR receive the return address, then PC reload from it. Then run the flags example and watch N, Z, C, V change.

::sim{cpu preset=call}

::sim{cpu preset=flags}
`,
  exam: {
    definitions: [
      { term: 'Stack pointer (R13)', def: 'Holds the address of the top of the stack; banked as MSP and PSP on Cortex-M.' },
      { term: 'Link register (R14)', def: 'Holds the return address of a subroutine call (or EXC_RETURN during an exception).' },
      { term: 'Program counter (R15)', def: 'Holds the address of the instruction being executed; changed by branches and returns.' },
      { term: 'xPSR', def: 'Combined program status register made of APSR (flags), IPSR (exception number) and EPSR (Thumb/IT/ICI state).' },
      { term: 'Carry flag', def: 'Set on unsigned overflow in addition, cleared on borrow in subtraction, or set to the last bit shifted out.' },
      { term: 'Overflow flag', def: 'Set when a signed arithmetic result does not fit in 32 bits (sign is wrong).' },
    ],
    frequent: [
      'Explain the functionalities of the Cortex-M4 core registers (Aug 2025, 4 marks).',
      'How the LR is used during subroutine calls (Aug 2025 and Aug 2026, 3 marks).',
      'Significance of N, Z, C, V flags and how they affect execution (Aug 2025, 3 marks each set).',
      'What information is stored in the PSR?',
    ],
    mistakes: [
      'Saying the PC is incremented by 1 — it moves by 2 or 4 bytes.',
      'Saying C = 1 means “borrow” after SUBS — on Arm, C = 1 means **no** borrow.',
      'Confusing C (unsigned) and V (signed) overflow.',
      'Forgetting that a nested function must PUSH LR before calling another function.',
      'Saying flags change after every instruction — only S-suffixed instructions and compare/test instructions update them.',
      'Writing “16 general-purpose registers” — only R0–R12 (13) are general purpose.',
    ],
    diagrams: ['Register bank R0–R15 with special registers', 'xPSR bit layout', 'BL/BX LR call-and-return arrows (main ↔ subroutine)'],
    shortQs: [
      { q: 'How does the ARM Cortex-M4 use the Link Register (LR) during subroutine calls? [3]', a: md`On «BL label» the processor stores the return address (address of the next instruction, bit 0 = 1 for Thumb) in **R14/LR** and loads PC with the subroutine address. The subroutine ends with «BX LR», which copies LR into PC so execution resumes after the call. A subroutine that calls another function must first save LR on the stack («PUSH {LR}») and return with «POP {PC}», because the inner BL would overwrite LR. During exceptions LR holds an EXC_RETURN code (e.g. 0xFFFFFFF9) instead.`, marks: 3 },
      { q: 'Explain the significance of the N, Z, C and V flags. How do they affect program execution? [3]', a: md`N = result negative (bit 31); Z = result zero; C = unsigned carry out (addition) / no borrow (subtraction) / last bit shifted out; V = signed overflow. They are updated by S-suffixed instructions and CMP/CMN/TST/TEQ, and conditional branches/instructions test them: BEQ (Z=1), BNE (Z=0), BHS/BLO (C), BMI/BPL (N), BGE (N=V), BGT (Z=0 and N=V). This implements if/while/for decisions.`, marks: 3 },
      { q: 'What is banking of the stack pointer?', a: md`R13 is physically two registers, MSP and PSP. Only one is visible as SP at a time: handler mode always uses MSP; thread mode uses MSP or PSP depending on CONTROL.SPSEL. This separates OS/interrupt stacks from application task stacks.`, marks: 2 },
      { q: 'Why is the T bit of the EPSR always 1 on a Cortex-M4?', a: md`The Cortex-M4 supports only the Thumb instruction state; T = 1 indicates Thumb execution. Clearing it (e.g. branching to an even address) causes a usage fault.`, marks: 2 },
    ],
    longQs: [
      {
        q: 'Explain the functionalities of the ARM Cortex-M4 core registers. [4]',
        a: md`**Diagram:** R0–R12, R13 (SP: MSP/PSP), R14 (LR), R15 (PC), xPSR, PRIMASK, FAULTMASK, BASEPRI, CONTROL.
- **R0–R12** general-purpose data/address registers; R0–R7 low (all instructions), R8–R12 high (32-bit instructions). R0–R3 carry function arguments, R0 the return value.
- **R13 SP**: top of stack, banked MSP (reset, handlers, kernel) / PSP (threads).
- **R14 LR**: return address after BL; EXC_RETURN on exception entry.
- **R15 PC**: address of current instruction; branches load it.
- **xPSR**: APSR flags N Z C V Q; IPSR exception number; EPSR T bit, ICI/IT.
- **PRIMASK/FAULTMASK/BASEPRI**: interrupt masking. **CONTROL**: privilege (nPRIV) and stack selection (SPSEL).`,
        marks: 4,
      },
      {
        q: 'What information is stored in the Program Status Register of the ARM Cortex-M4? Explain the purpose of the condition flags used in decision making, with an example.',
        a: md`xPSR = APSR + IPSR + EPSR (bit layout diagram). APSR: N Z C V Q (+GE). IPSR: ISR number. EPSR: T, ICI/IT. Flags: definitions; updated by S-instructions and compares. Example: «CMP R0, #10 / BGE big» computes R0 − 10, sets N and V; BGE branches if N == V (R0 ≥ 10 signed). Show a 5 − 6 example: N = 1, Z = 0, C = 0 (borrow), V = 0. Conclude: flags + conditional branches implement if-else and loops.`,
        marks: 6,
      },
    ],
    numericals: [
      {
        q: 'Find N, Z, C, V after ADDS R2, R0, R1 with R0 = 0x7FFF FFF0 and R1 = 0x0000 0020.',
        given: ['R0 = 0x7FFFFFF0 (+2147483632)', 'R1 = 0x00000020 (+32)'],
        find: 'Result and flags',
        formula: 'r = a + b mod 2³²; C = unsigned carry out; V = both operands same sign and result sign different',
        steps: ['Sum = 0x7FFFFFF0 + 0x20 = 0x80000010', 'Bit 31 = 1 → N = 1', 'Result ≠ 0 → Z = 0', 'No carry out of bit 31 (sum < 2³²) → C = 0', 'Two positives gave a negative → V = 1'],
        answer: 'R2 = 0x8000 0010, N=1 Z=0 C=0 V=1',
        concept: 'Signed overflow (V) vs unsigned carry (C).',
      },
      {
        q: 'Find the flags after CMP R0, R1 with R0 = 3 and R1 = 7.',
        given: ['R0 = 3', 'R1 = 7'],
        find: 'N Z C V',
        formula: 'CMP computes R0 − R1 and discards the result',
        steps: ['3 − 7 = −4 = 0xFFFFFFFC', 'N = 1 (bit 31 set)', 'Z = 0', 'Borrow occurred (3 < 7 unsigned) → C = 0', 'No signed overflow → V = 0'],
        answer: 'N=1 Z=0 C=0 V=0 (so BLT and BLO would branch)',
      },
    ],
  },
  revision: {
    notes: [
      'R0–R12 general purpose (R0–R7 low, R8–R12 high); R13 SP (MSP/PSP), R14 LR, R15 PC.',
      'BL: LR ← return address, PC ← target. BX LR: PC ← LR. Nested: PUSH {LR} … POP {PC}.',
      'Exception entry: LR ← EXC_RETURN (0xFFFFFFF9 / F1 / FD).',
      'xPSR = APSR (N Z C V Q) + IPSR (ISR number) + EPSR (T = 1, ICI/IT).',
      'Flags updated only by S-suffix and CMP/CMN/TST/TEQ; tested by conditional branches.',
      'PRIMASK/FAULTMASK/BASEPRI mask interrupts; CONTROL selects privilege and stack.',
    ],
    takeaways: ['C after subtraction = NOT borrow.', 'V is for signed, C for unsigned.', 'LR answers: BL saves, BX LR restores, push LR when nesting.'],
    mcqs: [
      { q: 'Which register holds the return address after a BL instruction?', options: ['R13', 'R14', 'R15', 'R12'], answer: 1, explain: 'R14 is the link register.' },
      { q: 'After SUBS R0, R1, R2 with R1 = R2, which flags are set?', options: ['N and V', 'Z and C', 'Only Z', 'C and V'], answer: 1, explain: 'Result 0 → Z = 1; no borrow → C = 1.' },
      { q: 'Which part of the xPSR holds the number of the exception being serviced?', options: ['APSR', 'EPSR', 'IPSR', 'CONTROL'], answer: 2, explain: 'Interrupt PSR — ISR_NUMBER.' },
      { q: 'Adding two positive numbers produced a negative result. Which flag indicates this?', options: ['C', 'Z', 'V', 'Q'], answer: 2, explain: 'Signed overflow sets V.' },
      { q: 'Low registers are…', options: ['R0–R7', 'R8–R12', 'R13–R15', 'only R0'], answer: 0, explain: 'R0–R7 are accessible by all instructions.' },
    ],
  },
};

export default topic;
