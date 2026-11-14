import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'mpu-mcu-dsp',
  unit: 1,
  order: 4,
  title: 'Computers, microprocessors, microcontrollers and DSPs',
  short: 'General definitions from the syllabus, MCU vs MPU in a smart home vs a PC, RISC vs CISC, and Harvard vs von Neumann.',
  status: 'course',
  sources: [
    { file: 'Day02-Introduction to Embedded System.pptx', detail: 'slides 9–12' },
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 4, 9 (RISC, Harvard/von Neumann table)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§1.7 Computer Architecture, §3.5 CISC versus RISC' },
  ],
  keywords: ['microprocessor', 'microcontroller', 'DSP', 'RISC', 'CISC', 'Harvard', 'von Neumann', 'smart home', 'smartwatch', 'MAC'],
  importance: 3,
  pyq: ['MT25A-1', 'MT25B-1'],
  related: ['es-intro', 'arm-families', 'm4-features'],
  fundamentals: {
    what: md`A **computer** is a processor + memory + I/O. A **microprocessor (MPU)** is only the CPU on a chip; memory and I/O are separate chips. A **microcontroller (MCU)** puts CPU, memory and I/O peripherals on **one chip**. A **digital signal processor (DSP)** is a processor optimised for fast arithmetic on streams of samples (multiply-accumulate).`,
    why: md`Choosing the right kind of processor is the first design decision: a PC needs raw speed and expandable memory (MPU), a smart switch needs low cost and low power (MCU), an audio filter needs fast MACs (DSP).`,
    problem: md`MCUs solve the cost/size/power problem of control tasks by integrating everything; DSPs solve the speed problem of signal processing; MPUs solve the flexibility problem of general computing.`,
    how: md`They differ in what is integrated and how instructions are designed: the Cortex-M4 MCU is a **RISC**, **Harvard** (separate instruction and data buses) core with **DSP extensions** (single-cycle MAC, SIMD) — so it blends MCU and DSP features.`,
    where: md`MPU: desktops, laptops, servers (Intel/AMD x86). MCU: smart-home nodes, appliances, wearables (STM32, ATmega, ESP32). DSP: audio processing, modems, motor control, image processing.`,
  },
  detailed: md`
## Definitions

| Term | Definition |
|---|---|
| Computer | A system that accepts input, processes it under the control of a stored program, stores data and produces output: processor + memory + I/O |
| Microprocessor | A CPU on a single chip (ALU, control unit, registers). Needs external RAM, ROM and I/O chips |
| Microcontroller | A single-chip computer: CPU + Flash + SRAM + GPIO, timers, ADC, serial interfaces |
| Digital signal processor | A processor whose architecture is optimised for real-time numeric processing of signals: single-cycle multiply-accumulate, Harvard memories, special addressing |

::diagram{mcu-vs-mpu}

## Microcontroller vs microprocessor (Aug 2025 Set A, 2 marks)

| Aspect | Microprocessor (personal computer) | Microcontroller (smart-home node) |
|---|---|---|
| What is on the chip | CPU only (plus caches) | CPU + Flash + SRAM + peripherals |
| Memory | External DRAM (GBs), SSD | On-chip Flash (KBs–MBs) and SRAM |
| I/O | Through chipset, expansion buses | On-chip GPIO, ADC, timers, UART/I²C/SPI |
| Clock speed | GHz | MHz (STM32F401: 84 MHz) |
| Power | Tens of watts | Milliwatts; µA in sleep |
| Cost | High | Low |
| Software | General OS (Windows, Linux), many programs | One dedicated firmware, bare-metal or RTOS |
| Use case | Run any application (browser, editor, games) | Read a motion sensor and switch a light or relay |

> [!exam] Model answer pattern
> “A PC uses a **microprocessor**: only the CPU is on the chip and RAM, storage and I/O controllers are external, giving flexibility and speed at high cost and power. A smart-home node uses a **microcontroller**: CPU, Flash, SRAM, GPIO, ADC and communication peripherals are on one chip, so a single cheap, low-power chip reads the sensors and drives the actuators.”

## RISC vs CISC (Aug 2025 Set B, 2 marks)

| Aspect | RISC — Arm Cortex (smartwatch) | CISC — Intel x86 (desktop) |
|---|---|---|
| Instruction set | Small number of simple instructions | Large set, many complex instructions |
| Instruction length | Fixed or few lengths (Thumb-2: 16/32-bit) | Variable (1–15 bytes on x86) |
| Execution | Most instructions in one cycle, easily pipelined | Complex instructions take many cycles (microcode) |
| Memory access | **Load–store**: only LDR/STR touch memory; ALU works on registers | ALU instructions can operate directly on memory |
| Registers | Many general-purpose registers (R0–R12) | Fewer architectural registers |
| Hardware | Simpler core, fewer transistors | Complex decoder |
| Power | Low → long battery life | High → needs cooling |
| Best for | Battery devices: smartwatch for days | Heavy software: video editing, games |

> [!source] Lecture wording
> “Arm architecture is a family of RISC-based processor architectures … well-known for its power efficiency, hence widely used in mobile devices” (Day04 L01 slide 4). “Load-store architecture: to process memory data, they have to be first loaded from memory to registers, processed inside the processor core using register data only, and then written back to memory” (slide 26).

## Harvard vs von Neumann

| | von Neumann | Harvard |
|---|---|---|
| Buses | One bus shared by instructions and data | Separate instruction and data buses |
| Parallelism | Fetch and data access take turns | Fetch next instruction while accessing data |
| Cortex family | M0, M0+ | M3, **M4**, M7 |

The Cortex-M4 has I-Code, D-Code and System buses, so it can fetch an instruction and read data in the same cycle.

## Where does the DSP fit?

A classic DSP adds hardware for the operation «acc = acc + a × b» (filters, FFTs) in one cycle. The Cortex-M4 adds **DSP extensions** to an MCU: single-cycle 16/32-bit MAC, dual 16-bit MAC, 8/16-bit **SIMD**, saturating arithmetic, and an optional single-precision **FPU** (Day04 L01 slides 9, 15). That is why the lecture calls it a “digital signal controller”.
`,
  visual: md`
::diagram{mcu-vs-mpu}

::diagram{pipeline}

Load–store in action: open the register machine and run the “Sum an array” program — data only enters the ALU after an «LDR».

::sim{cpu preset=array}
`,
  exam: {
    definitions: [
      { term: 'Microprocessor', def: 'A CPU implemented on a single chip; memory and I/O are external.' },
      { term: 'Microcontroller', def: 'A single-chip computer containing CPU, program and data memory, and I/O peripherals.' },
      { term: 'DSP', def: 'A processor specialised for high-speed numeric signal processing, with single-cycle multiply-accumulate.' },
      { term: 'RISC', def: 'Reduced instruction set computer: few simple fixed-format instructions, load–store architecture, mostly single-cycle and pipelined.' },
      { term: 'Harvard architecture', def: 'Separate memories/buses for instructions and data, allowing simultaneous fetch and data access.' },
    ],
    frequent: ['MCU vs MPU in a given context (smart home vs PC).', 'RISC vs CISC in a given context (smartwatch vs desktop).', 'Harvard vs von Neumann.'],
    mistakes: ['Saying an MCU has “no CPU” or an MPU has “no registers”.', 'Calling Arm CISC because Thumb-2 has two instruction lengths.', 'Forgetting to use the scenario given in the question (smart home, smartwatch).', 'Claiming RISC programs are always smaller — CISC code is often denser; Thumb-2 narrows the gap.'],
    diagrams: ['MPU system vs MCU block comparison', 'Harvard vs von Neumann bus structure'],
    shortQs: [
      { q: 'Compare a microcontroller and a microprocessor in terms of their components using the use case of a smart home and a personal computer. [2]', a: md`PC → **microprocessor**: only the CPU on chip; RAM, storage, I/O controllers external; GHz speed, high power and cost; runs a general OS. Smart home → **microcontroller**: CPU, Flash, SRAM, GPIO, ADC, timers and UART/I²C on one chip; MHz speed, mW power, low cost; runs one dedicated firmware to read sensors and switch loads.`, marks: 2 },
      { q: 'Explain RISC vs CISC by comparing an Arm Cortex processor in a smartwatch with an Intel processor in a desktop. [2]', a: md`Arm (RISC): small set of simple instructions, load–store, mostly single-cycle and pipelined, fewer transistors → very low power, days of battery. Intel (CISC): large set of complex variable-length instructions that may access memory directly and take many cycles → high performance for heavy software but high power and heat, acceptable on mains power.`, marks: 2 },
      { q: 'Why does the Cortex-M4 use a Harvard architecture?', a: md`Separate instruction and data buses let it fetch the next instruction while the current one reads/writes data, keeping the 3-stage pipeline busy and improving performance without raising the clock.`, marks: 2 },
    ],
    longQs: [
      { q: 'Define computer, microprocessor, microcontroller and digital signal processor. Compare a microprocessor and a microcontroller in a table and state where each is preferred.', a: md`Definitions as above. Table: on-chip components, memory, I/O, speed, power, cost, software, applications. Prefer an MPU when performance and flexibility matter (PC, server); prefer an MCU when cost, size and power matter for a dedicated control task (appliance, wearable, smart-home node). Mention DSP for signal processing, and that the Cortex-M4 adds DSP extensions to an MCU.`, marks: 6 },
      { q: 'Explain RISC and CISC architectures. Why are RISC processors preferred for battery-operated embedded systems?', a: md`Describe both (instruction count/complexity, length, cycles, load–store, registers, hardware complexity). RISC is preferred because simple, regular instructions need a simpler decoder and fewer transistors, pipeline well (one instruction per cycle), and consume far less energy per operation; Thumb-2 keeps code density high so Flash stays small. Example: Cortex-M4 in a smartwatch lasts days; an x86 CPU would need a large battery and cooling.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['MPU = CPU only; MCU = CPU + memory + peripherals on one chip; DSP = fast MAC for signals.', 'RISC: few simple instructions, load–store, single-cycle, pipelined, low power (Arm).', 'CISC: many complex variable-length instructions, memory operands, multi-cycle (x86).', 'Harvard: separate instruction/data buses (Cortex-M3/M4/M7); von Neumann: shared (M0/M0+).', 'Cortex-M4 = MCU with DSP extensions (MAC, SIMD, saturation, optional FPU).'],
    takeaways: ['Always answer comparison questions in a table using the question’s scenario.', 'Load–store is the defining RISC trait for Arm.', 'Cortex-M4 blends MCU and DSP.'],
    mcqs: [
      { q: 'Which device integrates CPU, Flash, SRAM and peripherals on one chip?', options: ['Microprocessor', 'Microcontroller', 'GPU', 'Chipset'], answer: 1, explain: 'That is the definition of a microcontroller.' },
      { q: 'In a load–store architecture…', options: ['ALU instructions can add a memory value directly', 'only load and store instructions access memory', 'there are no registers', 'all instructions are 8 bits'], answer: 1, explain: 'Data must be loaded into registers, processed, and stored back.' },
      { q: 'The Cortex-M4 uses which bus architecture?', options: ['von Neumann', 'Harvard', 'Ring', 'Daisy-chain'], answer: 1, explain: 'Separate instruction (I-Code) and data (D-Code/System) buses (Day04 L01 slide 9).' },
      { q: 'A smartwatch uses an Arm Cortex processor mainly because RISC…', options: ['has more complex instructions', 'gives low power with good performance', 'cannot run C', 'needs no memory'], answer: 1, explain: 'Simple instructions, fewer transistors, efficient pipelines → low energy.' },
      { q: 'Which operation is a DSP optimised for?', options: ['String copying', 'Multiply-accumulate', 'Disk access', 'Context switching'], answer: 1, explain: 'acc += a × b in one cycle is the core of filters and FFTs.' },
    ],
  },
};

export default topic;
