import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'thumb-isa',
  unit: 1,
  order: 15,
  title: 'Introduction to the Thumb instruction set',
  short: 'Why Arm created 16-bit Thumb, how Thumb-2 mixes 16- and 32-bit instructions, the T bit, IT blocks, and code density vs performance.',
  status: 'course',
  sources: [
    { file: 'Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx', detail: 'slides 6, 15 (Thumb-2, DSP)' },
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 9, 14, 33 and notes (Thumb/Thumb-2, T bit, IT)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.3 ARM Cortex-M Assembly Language' },
  ],
  keywords: ['Thumb', 'Thumb-2', '16-bit', '32-bit', 'code density', 'T bit', 'IT block', 'ARM state', 'interworking'],
  importance: 1,
  sims: ['cpu'],
  related: ['m4-registers', 'addressing-modes', 'alu-instructions'],
  fundamentals: {
    what: md`**Thumb** is a compressed 16-bit encoding of the most common Arm instructions. **Thumb-2** extends it with 32-bit instructions so one instruction stream can mix 16- and 32-bit instructions. The Cortex-M4 executes **only** Thumb/Thumb-2 (no 32-bit “ARM state”), which is why the EPSR T bit is always 1.`,
    why: md`Flash memory costs money and power. Classic 32-bit ARM code was fast but large; 16-bit Thumb was small but slower. Microcontrollers need both small code and good performance.`,
    problem: md`Thumb-2 gives roughly the code density of Thumb with performance close to 32-bit ARM code — “the performance of a modern 32-bit architecture with the high code density of 8-bit and 16-bit microcontrollers” (Day04 L01 notes).`,
    how: md`The assembler picks the shortest encoding for each instruction: e.g. «ADDS R0, R0, #1» fits in 16 bits (low registers, small immediate), while «ADD R8, R9, #1000» needs 32 bits. The decoder recognises the length from the first halfword. Conditional execution of non-branch instructions uses an **IT (If-Then)** instruction covering up to four following instructions.`,
    where: md`All Cortex-M software: Keil compiles your C into Thumb-2. Function pointers have bit 0 = 1 to mark Thumb code.`,
  },
  detailed: md`
## From ARM to Thumb to Thumb-2

| Instruction set | Width | Strength | Weakness |
|---|---|---|---|
| ARM (classic, Arm7/9) | 32-bit only | full features, fast | large code |
| Thumb (Thumb-1) | 16-bit | ~30 % smaller code | fewer features, needs more instructions, restricted to R0–R7 |
| **Thumb-2** | 16 + 32-bit mixed | small code **and** full features | — |

Original Arm processors had two states (ARM and Thumb) and had to switch between them (“interworking”). Thumb-2 “blends both”, so Cortex-M needs only one state (Day04 L02 slide 15).

## How support varies across Cortex-M (Day04 L01 slide 9)

| Core | Thumb | Thumb-2 |
|---|---|---|
| M0 / M0+ | most | subset |
| M3 / M4 / M7 | entire | entire |

## What 16-bit vs 32-bit encodings look like

| Instruction | Encoding | Why |
|---|---|---|
| «MOVS R0, #5» | 16-bit | low register, 8-bit immediate, sets flags |
| «ADDS R1, R2, R3» | 16-bit | all low registers |
| «LDR R0, [R1, #4]» | 16-bit | small word offset |
| «MOV R8, #0x1234» | 32-bit (MOVW) | high register, 16-bit immediate |
| «LDR R0, [R1, #1024]» | 32-bit | large offset |
| «UDIV R0, R1, R2» | 32-bit | instruction only exists in Thumb-2 |
| «BL func» | 32-bit | long branch range |

Up to two 16-bit instructions can be fetched in one 32-bit bus transfer, improving pipeline efficiency (Day04 L01 slide 22).

## The T bit

EPSR.T must be 1. Branch targets loaded into the PC via «BX»/«BLX»/POP must have bit 0 = 1 (the linker sets it in the vector table and function pointers); clearing it causes a UsageFault.

## IT (If-Then) blocks

~~~asm Conditional execution without branching
    CMP   R0, #10
    ITE   GE            ; If-Then-Else: next instruction if GE, the one after if LT
    MOVGE R1, #1        ; executed when R0 >= 10
    MOVLT R1, #0        ; executed when R0 < 10
~~~

The IT bits in EPSR remember the condition of each instruction in the block (Day04 L01 slide 33). Avoiding a branch keeps the pipeline full.
`,
  visual: md`
Every instruction in the register machine is Thumb-2. Try editing the program (e.g. use R8–R12) and step through:

::sim{cpu preset=flags}
`,
  exam: {
    definitions: [
      { term: 'Thumb', def: 'A 16-bit compressed encoding of common Arm instructions giving high code density.' },
      { term: 'Thumb-2', def: 'An instruction set mixing 16-bit and 32-bit instructions to give Thumb code density with near-ARM performance.' },
      { term: 'Code density', def: 'How much functionality fits in a given amount of program memory.' },
      { term: 'IT block', def: 'An If-Then instruction followed by up to four conditionally executed instructions.' },
    ],
    frequent: ['What is Thumb-2 and why is it used in Cortex-M?', 'Why is the T bit always 1?'],
    mistakes: ['Saying the Cortex-M4 can switch to 32-bit ARM state.', 'Saying Thumb-2 instructions are all 32-bit.'],
    diagrams: ['ARM vs Thumb vs Thumb-2 comparison table'],
    shortQs: [
      { q: 'What is the advantage of the Thumb-2 instruction set?', a: md`It mixes 16- and 32-bit instructions in one stream: common operations use compact 16-bit encodings (small Flash, fewer fetches), while 32-bit instructions provide full functionality (large immediates, all registers, divide, DSP), so it achieves high code density with near 32-bit performance and no state switching.`, marks: 2 },
      { q: 'Why does a function address on Cortex-M have bit 0 set?', a: md`Bit 0 of a branch target indicates Thumb state; it sets the EPSR T bit, which must be 1 on Cortex-M because only Thumb is supported.`, marks: 2 },
      { q: 'What is an IT instruction?', a: md`If-Then: it makes up to four following instructions conditional (e.g. ITE GE then MOVGE/MOVLT), avoiding branches; the conditions are tracked in the EPSR IT bits.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the evolution from the ARM instruction set to Thumb and Thumb-2 and why Cortex-M processors use Thumb-2.', a: md`ARM 32-bit: powerful but low density; Thumb 16-bit: dense but limited, needs interworking; Thumb-2: mixed lengths, full features in one state. Cortex-M uses it for small Flash, low power, single state (T = 1), and support for divide/DSP/bit-field instructions. Include the comparison table and an encoding example.`, marks: 6 },
      { q: 'Compare 16-bit and 32-bit Thumb-2 instructions with examples and explain how the processor tells them apart.', a: md`Examples table; 16-bit for low registers and small constants, 32-bit for high registers, large immediates/offsets, divide, long branches; the first halfword’s top bits identify a 32-bit instruction; two 16-bit instructions fetched per 32-bit transfer.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Thumb = 16-bit; Thumb-2 = 16 + 32-bit mixed.', 'Cortex-M4 executes only Thumb-2 → EPSR.T = 1 always.', 'Benefit: code density of 16-bit with performance of 32-bit.', 'IT blocks: up to 4 conditional instructions.'],
    takeaways: ['No ARM state on Cortex-M.', 'Bit 0 of code addresses = 1.'],
    mcqs: [
      { q: 'Which instruction state(s) does the Cortex-M4 support?', options: ['ARM only', 'Thumb only (Thumb-2)', 'ARM and Thumb', 'Jazelle'], answer: 1, explain: 'Only Thumb; T bit always 1.' },
      { q: 'Thumb-2 instructions are…', options: ['all 16-bit', 'all 32-bit', 'a mix of 16-bit and 32-bit', '8-bit'], answer: 2, explain: 'Mixed lengths.' },
      { q: 'Main benefit of Thumb over ARM encoding:', options: ['More registers', 'Higher code density', 'Floating point', 'Virtual memory'], answer: 1, explain: 'Smaller programs.' },
      { q: 'Maximum number of instructions an IT block can control:', options: ['1', '2', '4', '8'], answer: 2, explain: 'Up to four.' },
      { q: 'A BX to an address with bit 0 = 0 on Cortex-M causes…', options: ['ARM state', 'a UsageFault', 'nothing', 'a reset'], answer: 1, explain: 'Thumb state cannot be left.' },
    ],
  },
};

export default topic;
