import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'arm-families',
  unit: 1,
  order: 5,
  title: 'Arm architecture and processor families',
  short: 'Arm licenses IP rather than making chips; the A, R and M profiles; architecture vs processor; where the Cortex-M4 (Armv7E-M) fits.',
  status: 'course',
  sources: [
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 3–9 and speaker notes' },
    { file: 'Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx', detail: 'slides 2–7 (A/R/M comparison table)' },
  ],
  keywords: ['Arm Holdings', 'licensing', 'IP', 'Cortex-A', 'Cortex-R', 'Cortex-M', 'SecurCore', 'Armv7-M', 'Armv7E-M', 'SoC'],
  importance: 1,
  related: ['m4-features', 'mpu-mcu-dsp'],
  fundamentals: {
    what: md`**Arm** is a family of RISC processor architectures designed and **licensed** by Arm Holdings. Arm does not manufacture chips: partners such as ST, NXP and TI combine Arm processor IP with their own memories and peripherals to build system-on-chips (the STM32F401 is ST's chip around an Arm Cortex-M4 core).`,
    why: md`Licensing lets hundreds of companies share one instruction set, compiler toolchain and ecosystem, so code and skills transfer between chips — you can learn on an STM32 and move to an NXP part.`,
    problem: md`Different products need very different processors; Arm offers three profiles (A, R, M) so each market gets an optimised core with the same overall programming model.`,
    how: md`An **architecture** (e.g. Armv7-M) defines the instruction set, programmer's model, exception model and memory map; a **processor** (e.g. Cortex-M4) is one implementation of it with specific pipeline and timing (Day04 L01 slide 8).`,
    where: md`Cortex-A in phones, tablets, Raspberry Pi; Cortex-R in brakes, engine control, storage controllers; Cortex-M in microcontrollers, sensors, wearables; SecurCore in smart cards.`,
  },
  detailed: md`
## How an Arm-based SoC is made (Day04 L01 slide 6)

1. Choose IP blocks: an Arm core (Cortex-M4), bus IP (AHB, APB), memory controllers, GPIO, timers — from Arm and other vendors.
2. Integrate them into one chip design.
3. Send the design to a foundry for fabrication.

## Processor families

| Family | Optimised for | OS | Typical products |
|---|---|---|---|
| **Cortex-A** (Application) | High performance, MMU for virtual memory | Linux, Android, Windows | Smartphones, smart TVs, Raspberry Pi, infotainment |
| **Cortex-R** (Real-time) | Determinism, reliability, fault tolerance, TCM | RTOS / bare-metal | ABS, engine control units, industrial drives, medical devices |
| **Cortex-M** (Microcontroller) | Low cost, low power, fast interrupts (NVIC), MPU (no MMU) | RTOS / bare-metal | IoT sensors, wearables, MCUs |
| SecurCore | Security | — | Smart / ATM cards |
| Classic Arm7, Arm9, Arm11 | Older designs | — | Legacy products |

## A, R and M compared (Day04 L02 slides 4–5)

| Category | Cortex-A | Cortex-R | Cortex-M |
|---|---|---|---|
| ISA | Armv7-A / v8-A / v9-A | Armv7-R / v8-R | Armv6-M / v7-M / v8-M |
| Real-time determinism | No (complex pipelines) | Yes | Yes (fast interrupt response) |
| Interrupt controller | GIC | Vectored interrupt system | **NVIC** |
| Memory system | MMU, virtual memory | TCM, optional MPU | Optional **MPU**, no MMU |
| FPU/DSP | NEON SIMD + FPU | Optional FPU | Optional (M4/M7/M33/M55) |
| Performance | GHz, superscalar | Hundreds of MHz | Tens to hundreds of MHz |
| Power efficiency | Lower | Balanced | Very high |
| Cost / area | High | Medium | Very low |

## The Cortex-M series (Day04 L01 slide 9)

| Core | Architecture | Bus | Thumb / Thumb-2 | HW multiply | HW divide | DSP | FPU |
|---|---|---|---|---|---|---|---|
| M0 / M0+ | Armv6-M | von Neumann | most / subset | 1 or 32 cycle | no | no | no |
| M3 | Armv7-M | Harvard | entire / entire | 1 cycle | yes | no | no |
| **M4** | **Armv7E-M** | **Harvard** | entire / entire | 1 cycle | yes | **yes** | optional |
| M7 | Armv7E-M | Harvard | entire / entire | 1 cycle | yes | yes | optional |

“E” in Armv7E-M stands for the DSP **e**xtensions. The STM32F401 includes the optional FPU, so it is a **Cortex-M4F**.

> [!note] Architecture vs processor (common exam trap)
> Armv7-M is the *architecture*; Cortex-M3 and Cortex-M4 are two *processors* implementing it (M4 adds DSP, so Armv7**E**-M). The architecture is documented in the Architecture Reference Manual; each processor in its Technical Reference Manual (Day04 L01 slide 8, 34).
`,
  visual: md`
Where the families sit:

| Need | Pick |
|---|---|
| Run Linux, big apps, a GUI | Cortex-A |
| Hard deadlines, fault tolerance | Cortex-R |
| Cheap, low power, interrupts | Cortex-M |

::diagram{m4-block}
`,
  exam: {
    definitions: [
      { term: 'Arm architecture', def: 'The specification of an instruction set, programmer’s model, exception model and memory map (e.g. Armv7-M).' },
      { term: 'Arm processor', def: 'A specific implementation of an architecture with its own pipeline, timing and options (e.g. Cortex-M4).' },
      { term: 'IP licensing', def: 'Arm sells designs (intellectual property) that chip companies integrate and fabricate; Arm does not manufacture chips.' },
      { term: 'Bare metal', def: 'Programming directly on the hardware without an operating system.' },
    ],
    frequent: ['Compare Cortex-A, Cortex-R and Cortex-M.', 'Difference between Arm architecture and Arm processor.'],
    mistakes: ['Saying “Arm manufactures the STM32” — ST makes it using Arm IP.', 'Saying Cortex-M has an MMU (it has an optional MPU).', 'Calling the M4 architecture Armv7-A.'],
    diagrams: ['Table comparing A/R/M profiles'],
    shortQs: [
      { q: 'Arm does not manufacture processors. Explain how Arm-based chips are produced.', a: md`Arm licenses processor IP; a semiconductor company selects Arm cores plus other IP (memories, buses, peripherals), integrates them into a SoC design and fabricates it at a foundry, then sells the chip (e.g. ST's STM32F401).`, marks: 2 },
      { q: 'Differentiate Arm architecture and Arm processor.', a: md`Architecture = programming specification (ISA, programmer's model, exceptions, memory map), e.g. Armv7E-M. Processor = an implementation with timing and options, e.g. Cortex-M4 (documented in its TRM).`, marks: 2 },
      { q: 'Which Cortex-M cores implement DSP instructions?', a: md`Cortex-M4 and Cortex-M7 (Armv7E-M); also M33/M55 optionally. M0/M0+/M3 do not.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the Arm processor families and compare Cortex-A, Cortex-R and Cortex-M with applications.', a: md`Describe A (application, MMU, rich OS), R (real-time, deterministic, safety), M (microcontroller, NVIC, MPU, low power), SecurCore and Classic; add the comparison table (ISA, determinism, interrupt controller, memory system, FPU/DSP, performance, power, cost) and one application each.`, marks: 6 },
      { q: 'Compare the Cortex-M0, M3, M4 and M7 processors.', a: md`Use the Day04 L01 table: architecture (v6-M vs v7-M vs v7E-M), bus (von Neumann vs Harvard), Thumb/Thumb-2 support, hardware multiply/divide, saturated maths, DSP, FPU; conclude that M4 suits signal-processing control tasks such as motor control and audio.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Arm licenses IP; ST/NXP/TI fabricate.', 'Cortex-A: apps + MMU; Cortex-R: real-time/safety; Cortex-M: MCU + NVIC + MPU.', 'Cortex-M4 = Armv7E-M, Harvard, Thumb-2, 1-cycle MUL, HW divide, DSP, optional FPU.', 'Architecture (spec) ≠ processor (implementation).'],
    takeaways: ['M-profile = deterministic interrupts via NVIC.', 'The F in Cortex-M4F means FPU present.'],
    mcqs: [
      { q: 'Which Cortex profile includes an MMU for virtual memory?', options: ['Cortex-M', 'Cortex-R', 'Cortex-A', 'SecurCore'], answer: 2, explain: 'Cortex-A runs full operating systems with virtual memory.' },
      { q: 'The Cortex-M4 implements which architecture?', options: ['Armv6-M', 'Armv7-M', 'Armv7E-M', 'Armv8-A'], answer: 2, explain: 'Armv7-M plus DSP extensions.' },
      { q: 'Which interrupt controller does the Cortex-M family use?', options: ['GIC', 'NVIC', 'PIC 8259', 'APIC'], answer: 1, explain: 'Nested Vectored Interrupt Controller.' },
      { q: 'An automotive braking ECU most likely uses…', options: ['Cortex-A', 'Cortex-R', 'SecurCore', 'Arm7'], answer: 1, explain: 'Cortex-R targets deterministic, safety-critical real-time systems.' },
      { q: 'Which statement is TRUE?', options: ['Arm manufactures every Arm chip', 'Arm licenses designs to partners', 'Cortex-M0 has DSP extensions', 'Cortex-M4 is von Neumann'], answer: 1, explain: 'Arm is an IP company.' },
    ],
  },
};

export default topic;
