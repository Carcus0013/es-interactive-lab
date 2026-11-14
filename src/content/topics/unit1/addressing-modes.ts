import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'addressing-modes',
  unit: 1,
  order: 12,
  title: 'Addressing modes and operands',
  short: 'How an instruction finds its data: register, immediate, indexed (with offset, pre- and post-indexed), PC-relative and register-list addressing.',
  status: 'textbook',
  sources: [{ file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.3.1 Syntax, §3.3.2 Addressing Modes and Operands' }],
  externalNote: md`Your lecture slides do not cover this syllabus line; it is taught here from the **prescribed textbook** (Valvano Ch. 3), whose headings match the syllabus wording exactly.`,
  keywords: ['addressing mode', 'immediate', 'register', 'indexed', 'pointer', 'offset', 'pre-indexed', 'post-indexed', 'PC-relative', 'register list', 'LDR', 'literal pool'],
  importance: 2,
  sims: ['cpu'],
  related: ['memory-instructions', 'alu-instructions', 'm4-registers'],
  fundamentals: {
    what: md`An **addressing mode** is the format an instruction uses to specify where its operand (data) is: inside the instruction itself, in a register, or in memory at an address computed from registers or the PC.`,
    why: md`Because the Cortex-M4 is a load–store machine, only load/store instructions reach memory. They need flexible ways to compute addresses so C arrays, pointers, structs and stack variables can be accessed efficiently.`,
    problem: md`Addressing modes let one instruction do “read the next array element and advance the pointer” or “load a constant that does not fit in the instruction”, reducing code size and execution time.`,
    how: md`Every instruction is fetched from the address in PC. Then: **immediate** data comes from the instruction; **register** data from Rn; **indexed** data from memory at [Rn + offset]; **PC-relative** data/branch targets are computed from the PC; **register lists** name several registers for PUSH/POP.`,
    where: md`Every compiled C program: «x = 5» (immediate), «a = b + c» (register), «*p» and «arr[i]» (indexed), «if» branches and constants (PC-relative), function prologue/epilogue (register list).`,
  },
  detailed: md`
## Assembly syntax (Valvano §3.3.1)

~~~asm
Label   Opcode  Operands         ; comment
Start   MOV     R0, #100         ; R0 = 100
~~~

Data flows **towards the opcode**: the register next to the opcode receives the result («ADD R2, R0, R1» means R2 = R0 + R1).

## The addressing modes

| Mode | Example | Meaning |
|---|---|---|
| **Register** | «ADD R2, R0, R1» | Operands are in registers; no memory access |
| **Immediate** | «MOV R0, #100» | The data (100 = 0x64) is encoded in the instruction. Used only to read data, never as a store destination |
| **Indexed** (register pointer) | «LDR R0, [R1]» | R1 holds the address; R0 ← memory[R1]; R1 unchanged |
| Indexed with offset | «LDR R0, [R1, #4]» | R0 ← memory[R1 + 4]; R1 unchanged |
| Pre-indexed (write-back) | «LDR R0, [R1, #4]!» | R1 ← R1 + 4 first, then R0 ← memory[R1] |
| Post-indexed | «LDR R0, [R1], #4» | R0 ← memory[R1], then R1 ← R1 + 4 |
| Register offset | «LDR R0, [R1, R2]» | R0 ← memory[R1 + R2] |
| Scaled register offset | «LDR R0, [R1, R2, LSL #2]» | R0 ← memory[R1 + 4 × R2] — word array indexing |
| **PC-relative** | «B Loop», «BL Func», «LDR R1, =Count» | Address = PC + offset computed by the assembler |
| **Register list** | «PUSH {R4-R6, LR}», «POP {R4-R6, PC}» | Several registers transferred to/from the stack |

### PC-relative constant loading

«LDR R1, =Count» is a pseudo-instruction: the assembler stores the 32-bit address of «Count» in a **literal pool** in Flash near the code and encodes «LDR R1, [PC, #offset]». Accessing a variable therefore takes two instructions:

~~~asm Valvano Figure 3.13
    LDR R1, =Count    ; R1 = &Count (PC-relative load of the address)
    LDR R0, [R1]      ; R0 = Count  (indexed load of the value)
~~~

## Matching C to addressing modes

| C | Assembly | Mode |
|---|---|---|
| «x = 5;» | «MOVS R0, #5» | immediate |
| «y = x + z;» | «ADDS R0, R1, R2» | register |
| «v = *p;» | «LDR R0, [R1]» | indexed |
| «v = s.field2;» (offset 4) | «LDR R0, [R1, #4]» | indexed with offset |
| «v = *p++;» | «LDR R0, [R1], #4» | post-indexed |
| «v = a[i];» (int array) | «LDR R0, [R1, R2, LSL #2]» | scaled register |
| «GPIOC->ODR» | «LDR R1, =0x40020814» then «LDR R0, [R1]» | PC-relative + indexed |
| function call | «BL func» | PC-relative |

> [!exam]
> For “explain addressing modes”, give the mode name, one instruction, what it does in one line and draw a small register/memory picture for indexed addressing (R1 → memory cell → R0).
`,
  visual: md`
Step through the array-sum program: «LDR R1, =array» (PC-relative), «LDR R3, [R1], #4» (post-indexed — watch R1 advance by 4), «ADDS» (register), «MOVS R2, #4» (immediate).

::sim{cpu preset=array}
`,
  exam: {
    definitions: [
      { term: 'Addressing mode', def: 'The format an instruction uses to specify the location of its operand.' },
      { term: 'Immediate addressing', def: 'The operand value is contained in the instruction itself.' },
      { term: 'Indexed addressing', def: 'A register (pointer/index register) holds the memory address of the operand, optionally plus an offset.' },
      { term: 'PC-relative addressing', def: 'Indexed addressing that uses the PC as the base register; used for branches, calls and literal constants.' },
      { term: 'Post-indexed', def: 'Memory is accessed at the base address, then the base register is updated by the offset.' },
    ],
    frequent: ['Explain addressing modes of the Cortex-M4 with examples.', 'Difference between pre-indexed and post-indexed addressing.', 'What does LDR R1,=Count do?'],
    mistakes: ['Saying immediate addressing can be used as a store destination.', 'Swapping pre- and post-indexed behaviour.', 'Thinking «LDR R0,[R1,#4]» changes R1 (only the ! form or post-index does).'],
    diagrams: ['Indexed addressing: register pointer → memory → destination register'],
    shortQs: [
      { q: 'Differentiate LDR R0,[R1,#4]! and LDR R0,[R1],#4.', a: md`Pre-indexed «[R1,#4]!»: R1 = R1 + 4 first, then R0 = mem[R1] (new address). Post-indexed «[R1],#4»: R0 = mem[R1] (old address), then R1 = R1 + 4. Both write back R1.`, marks: 2 },
      { q: 'What is PC-relative addressing used for?', a: md`Branches (B), function calls (BL) and loading constants/addresses from the literal pool («LDR Rd, =value»); the address is computed as PC + offset by the assembler.`, marks: 2 },
      { q: 'Which addressing mode does MOV R0,#100 use and where is 100 stored?', a: md`Immediate addressing; 100 (0x64) is encoded inside the machine instruction, so no extra memory access is needed.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the addressing modes of the ARM Cortex-M4 with one instruction example each.', a: md`Register, immediate, indexed (simple, offset, pre-indexed, post-indexed, register offset, scaled), PC-relative, register list — each with example and effect, a diagram for indexed addressing, and the two-instruction pattern for accessing a variable (LDR =, then LDR []).`, marks: 8 },
      { q: 'Write an assembly loop that sums a 4-element word array using post-indexed addressing and explain each instruction.', a: md`~~~asm
    LDR  R1, =array
    MOVS R0, #0
    MOVS R2, #4
loop LDR  R3, [R1], #4
    ADDS R0, R0, R3
    SUBS R2, R2, #1
    BNE  loop
~~~
LDR = loads the array address (PC-relative); MOVS immediate initialisations; post-indexed LDR reads and advances; ADDS accumulates; SUBS decrements and sets Z; BNE loops until Z = 1.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Register: ADD R2,R0,R1. Immediate: MOV R0,#100.', 'Indexed: [R1], [R1,#4], [R1,#4]! (pre), [R1],#4 (post), [R1,R2,LSL #2].', 'PC-relative: B, BL, LDR R1,=Count (literal pool).', 'Register list: PUSH {R4-R6,LR}, POP {R4-R6,PC}.', 'Variable access = LDR Rx,=var then LDR Ry,[Rx].'],
    takeaways: ['Only loads/stores touch memory.', 'Pre = update then access; post = access then update.'],
    mcqs: [
      { q: 'LDR R0,[R1],#4 is an example of…', options: ['Immediate', 'Pre-indexed', 'Post-indexed', 'PC-relative'], answer: 2, explain: 'Access at R1, then R1 += 4.' },
      { q: 'Which addressing mode does BL Func use?', options: ['Register', 'PC-relative', 'Immediate', 'Register list'], answer: 1, explain: 'The target is PC + offset.' },
      { q: 'After LDR R0,[R1,#8] (no !), R1 is…', options: ['R1 + 8', 'unchanged', '0', 'R0'], answer: 1, explain: 'Offset addressing without write-back leaves the base register alone.' },
      { q: 'Accessing a[i] in an int array is best done with…', options: ['LDR R0,[R1,R2,LSL #2]', 'MOV R0,#a', 'B a', 'PUSH {R0}'], answer: 0, explain: 'Address = base + 4 × i.' },
      { q: 'LDR R1,=Count places the constant…', options: ['in a register file', 'in a literal pool in code memory, loaded PC-relative', 'on the stack', 'in the NVIC'], answer: 1, explain: 'The assembler creates a literal pool entry.' },
    ],
  },
};

export default topic;
