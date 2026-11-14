import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'm4-features',
  unit: 1,
  order: 6,
  title: 'Cortex-M4 features and block diagram',
  short: 'The 32-bit RISC Harvard core with a 3-stage pipeline, NVIC, WIC, MPU, FPU, DSP extensions, bus matrix and debug — what each block does.',
  status: 'course',
  sources: [
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 13–25 and notes' },
    { file: 'Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx', detail: 'slides 6, 13–27 (pipeline, Thumb-2, DSP, FPU, MPU, caches, AHB-Lite, bus matrix)' },
  ],
  keywords: ['pipeline', 'fetch decode execute', 'NVIC', 'WIC', 'MPU', 'FPU', 'DSP', 'SIMD', 'MAC', 'bus matrix', 'AHB-Lite', 'DMIPS', 'prefetch'],
  importance: 2,
  sims: ['pipeline'],
  related: ['m4-registers', 'memory-map', 'low-power-debug', 'nvic'],
  fundamentals: {
    what: md`The **Arm Cortex-M4** (introduced 2010) is a 32-bit RISC processor core with a Harvard bus structure, a 3-stage pipeline, the full Thumb/Thumb-2 instruction set, DSP extensions, an optional floating-point unit, an integrated interrupt controller (NVIC) and debug logic.`,
    why: md`Embedded control often needs both fast, deterministic interrupt handling and some signal processing (filters, motor control). The M4 provides both in a small, low-power core so one chip can replace an MCU plus a DSP.`,
    problem: md`It delivers “high-end processing hardware” — single-cycle MAC, SIMD, saturating arithmetic, hardware divide, optional FPU — while keeping latency predictable (enhanced determinism) and power in the µW/MHz range.`,
    how: md`Instructions flow through **fetch → decode → execute**; the **NVIC** prioritises up to 240 interrupts plus NMI; the **WIC** wakes the core from deep sleep; the **MPU** restricts memory access; the **bus matrix** connects the core's code and system buses to Flash, SRAM and peripherals; the **debug** system halts the core for inspection.`,
    where: md`STM32F4, NXP Kinetis K, TI Tiva TM4C (the textbook's board) — motor control, audio, sensor fusion, wearables, industrial control.`,
  },
  detailed: md`
## Feature list (Day04 L01 slides 13–20)

| Feature | Detail |
|---|---|
| Architecture | 32-bit RISC, **Harvard** (separate instruction and data buses), Armv7E-M |
| Instruction set | Entire Thumb (16-bit) and Thumb-2 (16/32-bit) |
| Pipeline | **3-stage** + branch speculation |
| Performance | 1.25 DMIPS/MHz (up to 1.95 with optimisations) at µW/MHz |
| Interrupts | NMI + 1–240 physical interrupts, 8–256 priority levels |
| Sleep | Up to 240 wake-up interrupts, WFI/WFE, sleep-on-exit, sleep and deep-sleep signals |
| Enhanced instructions | Hardware divide (2–12 cycles), single-cycle 16/32-bit MAC, dual 16-bit MAC, 8/16-bit SIMD, saturating maths |
| FPU | Optional IEEE-754 single precision |
| Debug | Optional JTAG and Serial Wire Debug, up to 8 breakpoints and 4 watchpoints |
| Memory protection | Optional 8-region MPU with sub-regions and background region |

::diagram{m4-block}

## The blocks

**Processor core.** Sixteen 32-bit registers (13 general purpose), the ALU and data path. Load–store: data must be in registers to be processed.

**3-stage pipeline.** Fetch, decode, execute overlap, so once full, one instruction completes per cycle. Multi-cycle instructions stall the pipeline; the core speculatively prefetches from branch targets and can fetch two 16-bit instructions in one 32-bit transfer.

::diagram{pipeline}

**NVIC** (Nested Vectored Interrupt Controller). Up to 240 IRQs + NMI; compares priorities with the current level and automatically handles nesting, tail-chaining and late arrival. Tightly coupled to the core for low latency (12 cycles to the first ISR instruction).

**WIC** (Wake-up Interrupt Controller, optional). When most of the chip is shut down in deep sleep, the WIC detects an interrupt and tells the power-management unit to power the system up.

**MPU** (optional). Up to 8 regions, each with a base address, power-of-two size (32 B … 4 GB), access permissions (read-only, read/write, no access, execute-never), privilege level and memory attributes. Stops errant code from overwriting critical memory (e.g. a guard region below the stack catches stack overflow).

**FPU** (optional). Single-precision add, subtract, multiply, divide, square root in hardware; without it, floating point is emulated in software and is much slower.

**DSP extensions.** MAC: multiply two values and add to an accumulator in one cycle. SIMD: one instruction operates on two 16-bit or four 8-bit values packed in a register.

**Bus interconnect / bus matrix.** AHB-Lite interfaces (code bus for Flash, system bus for SRAM and peripherals, PPB for NVIC/SysTick); the bus matrix lets several masters (CPU, DMA) access different slaves at the same time. It also implements the **write buffer** and **bit-band** accesses. AHB-to-APB bridges reach the slower peripherals.

**Debug subsystem.** Breakpoints, watchpoints and halting so you can inspect registers and memory (what Keil does when you press Debug).

## Caches? No — and why (Day04 L02 slide 21)

| Feature | Present? | Note |
|---|---|---|
| Instruction cache | No | Fetches directly from Flash (ST adds an ART accelerator outside the core) |
| Data cache | No | SRAM is fast enough; keeps timing predictable |
| MPU | Yes (optional) | Protection, not caching |
| FPU | Optional | Single precision |
| Prefetch buffer | Yes | Fetches instructions ahead of time to hide Flash latency |

Without caches the execution time of an ISR is predictable — essential for real-time systems.

## AHB-Lite and the multi-AHB bus matrix (Day04 L02 slides 23–27)

- **AHB-Lite**: a single-master version of AHB, so no arbitration logic — simple and low-latency.
- **Bus matrix**: a crossbar connecting several **masters** (Cortex-M4 I-bus, D-bus, S-bus, DMA1, DMA2) to several **slaves** (Flash, SRAM, AHB1/AHB2 peripherals, APB bridges) so that, for example, the CPU fetches code from Flash while DMA moves ADC data into SRAM.
`,
  visual: md`
::diagram{m4-block}

Step through the pipeline and see why a taken branch costs cycles:

::sim{pipeline}
`,
  exam: {
    definitions: [
      { term: 'Pipeline', def: 'Overlapping the fetch, decode and execute stages of successive instructions so one instruction completes per cycle.' },
      { term: 'NVIC', def: 'Nested Vectored Interrupt Controller: on-core controller that prioritises up to 240 interrupts + NMI with nesting and low latency.' },
      { term: 'WIC', def: 'Wake-up Interrupt Controller: lets the power-management unit wake the system from deep sleep when an interrupt arrives.' },
      { term: 'MPU', def: 'Memory Protection Unit: hardware that divides memory into up to 8 regions with access permissions and attributes.' },
      { term: 'SIMD', def: 'Single Instruction Multiple Data: one instruction operates on several 8/16-bit values packed in a 32-bit register.' },
      { term: 'MAC', def: 'Multiply-accumulate: acc = acc + a × b in a single instruction cycle.' },
    ],
    frequent: ['Draw and explain the Cortex-M4 block diagram.', 'List the features of the Cortex-M4.', 'Explain the 3-stage pipeline.', 'Functions of NVIC, WIC, MPU, bus matrix.'],
    mistakes: ['Saying the M4 has a 5-stage pipeline (that is M7 / classic Arm9).', 'Confusing MPU (protection) with MMU (virtual memory).', 'Forgetting to mark optional blocks (FPU, MPU, WIC, ETM).'],
    diagrams: ['Cortex-M4 block diagram', '3-stage pipeline staircase'],
    shortQs: [
      { q: 'What is the role of the WIC in the Cortex-M4?', a: md`In deep sleep most of the chip, including the NVIC clock, is off. The optional WIC detects an incoming interrupt and signals the power-management unit to restore power and clocks so the core can wake and service it.`, marks: 2 },
      { q: 'Why does the Cortex-M4 not use caches?', a: md`To keep execution time deterministic for real-time tasks. It relies on fast on-chip SRAM, a prefetch buffer (and vendor flash accelerators) instead.`, marks: 2 },
      { q: 'State four features of the Cortex-M4 that support DSP applications.', a: md`Single-cycle 16/32-bit MAC, dual 16-bit MAC, 8/16-bit SIMD arithmetic, saturating arithmetic, hardware divide, optional single-precision FPU.`, marks: 2 },
      { q: 'How does the bus matrix improve performance?', a: md`It is a non-blocking crossbar: different masters (CPU instruction bus, data bus, DMA) can access different slaves (Flash, SRAM, peripherals) simultaneously instead of waiting on one shared bus.`, marks: 2 },
    ],
    longQs: [
      { q: 'Draw the block diagram of the Arm Cortex-M4 processor and explain the function of each block.', a: md`Diagram: processor core (register bank, ALU/MAC, 3-stage pipeline), NVIC, WIC, optional FPU, optional MPU, bus matrix with code and system interfaces, debug access port, optional trace (ETM, ITM, DWT, FPB). Explain each as in the lesson; mark optional blocks. Conclude with key figures: 32-bit RISC, Harvard, Thumb-2, 240 IRQs, 1.25 DMIPS/MHz.`, marks: 8 },
      { q: 'Explain the features of the Cortex-M4 processor that make it suitable for low-power real-time embedded applications.', a: md`Deterministic, low-latency interrupts (NVIC, tail-chaining); no caches → predictable timing; 3-stage pipeline with branch speculation; Thumb-2 code density (small Flash); sleep/deep sleep, WFI/WFE, sleep-on-exit, WIC; hardware MAC/DSP/FPU so maths finishes quickly and the core sleeps sooner; MPU for robustness.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['32-bit RISC, Harvard, Armv7E-M, Thumb/Thumb-2, 3-stage pipeline + branch speculation.', 'NVIC: NMI + 240 IRQs, 8–256 priority levels; WIC wakes from deep sleep.', 'Optional FPU (single precision), optional 8-region MPU.', 'DSP: 1-cycle MAC, SIMD, saturation, HW divide 2–12 cycles.', 'No caches → deterministic; prefetch buffer instead.', 'Bus matrix: multiple masters ↔ slaves in parallel; AHB-Lite single-master bus.'],
    takeaways: ['Mark optional blocks with dashed lines in the diagram.', 'MPU protects; MMU translates — M4 has only MPU.', 'Pipeline full ⇒ 1 instruction per cycle.'],
    mcqs: [
      { q: 'How many pipeline stages does the Cortex-M4 have?', options: ['2', '3', '5', '8'], answer: 1, explain: 'Fetch, decode, execute (Day04 L01 slide 22).' },
      { q: 'Maximum number of external interrupt inputs the M4 NVIC supports:', options: ['16', '64', '240', '1024'], answer: 2, explain: 'NMI + 1 to 240 physical interrupts.' },
      { q: 'Which block can wake the system from deep sleep when the NVIC is not clocked?', options: ['MPU', 'WIC', 'FPU', 'ETM'], answer: 1, explain: 'The Wake-up Interrupt Controller.' },
      { q: 'How many regions can the Cortex-M4 MPU define?', options: ['2', '4', '8', '16'], answer: 2, explain: 'Up to 8 regions plus sub-regions and a background region.' },
      { q: 'Why is AHB-Lite simpler than full AHB?', options: ['It has no clock', 'It supports a single master, so no arbitration is needed', 'It is 8-bit', 'It is wireless'], answer: 1, explain: 'Single master eliminates arbitration logic.' },
    ],
  },
};

export default topic;
