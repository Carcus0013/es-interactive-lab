import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'es-characteristics',
  unit: 1,
  order: 2,
  title: 'Characteristics of embedded systems',
  short: 'The eleven characteristics from the lecture — specificity, strict design parameters, efficiency, real-time response, safety, cost — and how to apply them to any product.',
  status: 'course',
  sources: [{ file: 'Day03-Introduction to Embedded System.pptx', detail: 'slides 2–23 (11 characteristics, pacemaker, airbag ACU, safety standards, summary)' }],
  keywords: ['specificity', 'real-time', 'efficiency', 'safety', 'cost', 'multi-rate', 'compact', 'power', 'washing machine', 'automobile', 'pacemaker', 'airbag'],
  importance: 3,
  pyq: ['MT26S1-1', 'MT26S2-1'],
  related: ['es-intro', 'es-types'],
  fundamentals: {
    what: md`The **characteristics** of embedded systems are the properties that set them apart from general-purpose computers: they do one specific task, under strict limits of time, power, size, memory and cost, often with safety consequences.`,
    why: md`Examiners rarely ask "list the characteristics" any more — the 2026 mid-terms gave a **washing machine** and an **automobile** and asked which characteristics they show. You need to recognise each characteristic in a real product and justify it.`,
    problem: md`Knowing the characteristics tells a designer which constraints drive the design: a pacemaker is constrained by power and reliability, an airbag by timing, a toy by cost. Choosing the wrong priority produces a product that fails.`,
    how: md`Each characteristic follows from the **dedicated function**: because the task is fixed, hardware and software can be sized exactly (compact, cheap, efficient), the timing can be guaranteed (real-time), the interface can be minimal, and safety analysis can be done for every failure mode.`,
    where: md`Every embedded product: washing machines (specific, automatic, minimal UI), cars (multi-rate, real-time, safety-critical), pacemakers (strict parameters), wearables (power-efficient), IoT nodes (cost-effective).`,
  },
  detailed: md`
## The eleven characteristics (Day03)

| # | Characteristic | Meaning | Lecture example |
|---|---|---|---|
| 1 | **Specificity** | Domain- or task-specific; does only its designated job | Digital BP monitor: measures and shows BP and pulse only |
| 2 | **Strict design parameters** | Fixed, non-negotiable constraints on power, size, timing, reliability, EMI, security, compliance | Pacemaker: 5–10 years on a coin cell, fits in the chest, exact pulse timing |
| 3 | **Efficiency** | Uses power, CPU cycles, memory and money with minimum waste; reacts to the real-time environment | Air conditioner, cruise control |
| 4 | **Exclusive memory** | No secondary storage; program in ROM/Flash; memory cannot be extended | SRAM blocks, Flash bootloader areas, TCM, peripheral FIFOs |
| 5 | **Multi-rate operation** | Several subsystems/tasks run at different rates, synchronised | A car: engine, ABS, infotainment each with its own ECU and rate |
| 6 | **Compact design** | Everything (MCU, timers, I/O, software) on as few chips as possible | Single-chip controllers |
| 7 | **Minimal power dissipation** | Low power to extend battery life and avoid heat | Battery/portable devices |
| 8 | **Sophisticated functionality** | Advanced features: DSP, FPU, NPU, FPGA, SoC, RTOS/Linux | Smartphones, Cortex-M7, FPGAs |
| 9 | **Minimal user interface** | Simple, non-graphical interaction; the system runs automatically | Washing machine, oven, AC; keypad door locks |
| 10 | **Safety factor** | Safety analysis; failures can injure people; certified standards | Airbag ACU; ISO 26262, IEC 61508, IEC 62304, EN 50128, DO-178C |
| 11 | **Cost-effective** | Minimal hardware, no OS licence, open-source tools, mass-production parts | IoT, consumer electronics, wearables |

> [!source] Lecture summary slide
> Requires real-time performance; high availability and reliability; often built around an RTOS; diskless operation, boots from ROM; designed for one specific task; connected to peripherals; minimal user interface; limited memory, low cost, low power; no secondary memory.

## Case study 1 from the lecture: pacemaker (strict design parameters)

| Parameter | Constraint |
|---|---|
| Power | 5–10 years on a coin-cell battery |
| Size | Must fit inside the human chest |
| Timing | Electrical pulses at exact intervals |
| Reliability | Life-critical, near 100 % uptime |
| EMI immunity | Not disturbed by phones or MRI machines |
| Security | Wireless telemetry encrypted |
| Compliance | FDA, ISO 13485, IEC 60601 |

## Case study 2: airbag control unit (safety + real time)

The ACU reads accelerometers, gyros, crash and seat-occupancy sensors and must: detect the collision within **2–3 ms**, decide within **5–10 ms**, and fire the inflator **under 20 ms** from impact. It also tensions seatbelts and logs the event to the "black box". Missing the deadline is a failure even if the decision is correct — that is what **hard real-time** means.

## Applying the characteristics — washing machine (Aug 2026 Set 1)

> [!exam] Method for "why is X an embedded system and which characteristics does it show?"
> (1) Define an embedded system. (2) Show X has a processor + software doing a dedicated task. (3) Pick 5–6 characteristics and tie **each** to a concrete feature of X. (4) Short conclusion.

| Characteristic | How the washing machine shows it |
|---|---|
| Specificity | Only washes clothes according to stored programs; it cannot be reprogrammed to browse the web |
| Real-time / efficiency | Opens the inlet valve until the water-level sensor reaches the target; heats to the set temperature; times each phase |
| Minimal user interface | A knob/buttons to pick the program and a small display; then it runs fully automatically and stops when done |
| Sensors and actuators (peripherals) | Water-level (pressure) sensor, temperature sensor, door-lock switch; motor, inlet/drain valves, heater |
| Reliability and safety | Door stays locked while the drum spins; leak/imbalance detection; must run thousands of cycles |
| Cost-effective and compact | A low-cost 8/32-bit MCU on one small board, no OS licence |
| Exclusive memory | Wash programs stored in Flash; no hard disk |

## Applying the characteristics — automobile (Aug 2026 Set 2)

| Function | Embedded role | Characteristic shown |
|---|---|---|
| Cruise control | Reads wheel-speed sensors, adjusts throttle every few ms to hold speed | Real-time, efficiency (closed-loop control) |
| Engine management (ECU) | Controls fuel injection and ignition timing from sensor data | Hard real-time, efficiency, strict design parameters (emissions) |
| Safety (ABS, airbags) | Detects skid/crash and acts within milliseconds | Safety factor, reliability, ISO 26262 |
| Entertainment / infotainment | Media, navigation, displays | Sophisticated functionality, UI |
| Whole car | 50–100 ECUs on CAN/LIN buses, each at its own rate | **Multi-rate operation**, networked |

> [!tip]
> End with: *“A modern car is therefore a network of many dedicated embedded systems, each meeting real-time, reliability and safety constraints.”*
`,
  visual: md`
Use the block diagram to identify the sensors and actuators of any product before listing its characteristics.

::diagram{es-block}

Hard real-time timing of the airbag example: if the 20 ms deadline is missed the system has failed, even if the decision was right.

| Phase | Deadline |
|---|---|
| Detect collision | 2–3 ms |
| Decide to deploy | 5–10 ms |
| Fire inflator | < 20 ms after impact |
`,
  exam: {
    definitions: [
      { term: 'Specificity', def: 'An embedded system is domain- or task-specific: it performs only its designated function.' },
      { term: 'Real-time system', def: 'A system whose correctness depends on producing results within a time limit (deadline), not only on the result itself.' },
      { term: 'Multi-rate operation', def: 'Different tasks or subsystems execute at different rates or frequencies while remaining synchronised (e.g. ECUs in a car).' },
      { term: 'Safety-critical system', def: 'A system whose failure could cause injury, death or major damage; it is designed and certified to safety standards such as ISO 26262.' },
      { term: 'Strict design parameters', def: 'Well-defined, non-negotiable constraints (power, size, timing, reliability, EMI, security, compliance) the system must meet.' },
    ],
    frequent: [
      'Explain why a given product (washing machine, car, wearable) is an embedded system and which characteristics it shows — 6 marks in both Aug 2026 papers.',
      'Explain any four/six characteristics with examples.',
      'Real-time requirement with an example (airbag, ABS).',
    ],
    mistakes: [
      'Listing characteristics without linking each to the product in the question.',
      'Saying embedded systems are "slow" or "simple" — many are sophisticated (DSP, FPGA, SoC).',
      'Confusing real-time with fast: real-time means a guaranteed deadline.',
      'Forgetting multi-rate operation for the automobile question.',
    ],
    diagrams: ['Block diagram of the product with its sensors and actuators labelled'],
    shortQs: [
      { q: 'What is meant by “multi-rate operation”? Give an example.', a: md`Different subsystems run at different execution rates but stay synchronised. Example: in a car, the engine ECU runs its control loop every few ms, the ABS faster still, and infotainment much slower — all coordinated over CAN.`, marks: 2 },
      { q: 'Why is a minimal user interface typical of embedded systems?', a: md`The system performs one automated task; the user only selects the input (e.g. a wash program). The device then runs by itself, so a few buttons, LEDs or a small display are enough, saving cost, size and power.`, marks: 2 },
      { q: 'List the strict design parameters of a pacemaker.', a: md`Power (5–10 years on a coin cell), size (fits in the chest), timing (exact pulse intervals), reliability (life-critical), EMI immunity (phones, MRI), security (encrypted telemetry), compliance (FDA, ISO 13485, IEC 60601).`, marks: 2 },
      { q: 'Name two safety standards for embedded systems and their domains.', a: md`ISO 26262 — automotive functional safety; IEC 62304 — medical device software (also IEC 61508 industrial, EN 50128 railways, DO-178C airborne).`, marks: 2 },
    ],
    longQs: [
      {
        q: 'A washing machine automatically controls water intake, washing time, motor operation and completion of the washing cycle based on the selected program. Explain why it is an embedded system and describe the characteristics of embedded systems reflected in this application. [6 marks]',
        a: md`**Why embedded:** a microcontroller with firmware in Flash controls the machine; it performs one dedicated function (washing according to stored programs) as part of a larger electro-mechanical product.

**Characteristics shown:**
1. **Specificity** — runs only wash programs; cannot be used as a general computer.
2. **Real-time behaviour/efficiency** — fills water until the level sensor reports the target, heats to the set temperature, times wash/rinse/spin; must react to sensor changes immediately.
3. **Minimal user interface** — program knob/buttons and a small display; after starting, it is fully automatic and stops by itself.
4. **Interfacing with sensors/actuators** — water-level, temperature, door-lock and imbalance sensors; motor, inlet/drain valves, heater, buzzer.
5. **Reliability and safety** — door locked during spin; leak/overflow and imbalance protection; thousands of cycles without failure.
6. **Cost-effective, compact, exclusive memory** — a cheap MCU on one board, programs in Flash, no hard disk or OS licence.

**Conclusion:** the washing machine is a classic stand-alone, real-time embedded system dedicated to one task.`,
        marks: 6,
      },
      {
        q: 'A modern automobile uses electronic systems for cruise control, engine management, safety and entertainment. Explain the role of embedded systems in these functions and describe the characteristics required for their effective operation. [6 marks]',
        a: md`**Role:** each function is handled by a dedicated electronic control unit (ECU) — an MCU with sensors, actuators and firmware.
- **Cruise control:** reads wheel-speed sensors and adjusts the throttle continuously to hold the set speed (closed-loop control).
- **Engine management:** computes fuel-injection quantity and ignition timing from crank position, airflow and oxygen sensors, every engine cycle.
- **Safety:** ABS modulates brake pressure in milliseconds; the airbag ACU detects a crash and fires within ~20 ms; seat-belt tensioners.
- **Entertainment:** infotainment, navigation and displays (more sophisticated, often an application processor with Linux/Android).

**Characteristics required:** hard **real-time** response (deadlines of ms); **reliability and safety** (ISO 26262); **multi-rate operation** (many ECUs at different rates, networked over CAN/LIN); **efficiency** (fuel, power, CPU); **strict design parameters** (temperature range, vibration, EMI); **cost-effectiveness** for mass production; **sophisticated functionality** for infotainment.

**Conclusion:** a car is a distributed network of specific, real-time, safety-critical embedded systems.`,
        marks: 6,
      },
    ],
  },
  revision: {
    notes: [
      'Eleven characteristics: specificity, strict design parameters, efficiency, exclusive memory, multi-rate, compact, minimal power, sophisticated functionality, minimal UI, safety, cost-effective.',
      'Real-time = guaranteed deadline (airbag: detect 2–3 ms, decide 5–10 ms, fire < 20 ms).',
      'Pacemaker = strict design parameters (power, size, timing, reliability, EMI, security, compliance).',
      'Safety standards: ISO 26262 (auto), IEC 61508 (industrial), IEC 62304 (medical), EN 50128 (rail), DO-178C (aero).',
      'Application questions: define → justify “dedicated” → map 5–6 characteristics to the product → conclude.',
    ],
    takeaways: ['Every characteristic follows from “dedicated function”.', 'Use a table in the exam: characteristic | how the product shows it.', 'Cars show multi-rate and safety; washing machines show specificity and minimal UI.'],
    mcqs: [
      { q: 'An airbag must fire within 20 ms of impact. This is mainly an example of…', options: ['Minimal user interface', 'Hard real-time requirement', 'Exclusive memory', 'Sophisticated functionality'], answer: 1, explain: 'The result is useless if late — a hard deadline.' },
      { q: 'Many ECUs in a car run at different rates yet cooperate. This characteristic is called…', options: ['Specificity', 'Compact design', 'Multi-rate operation', 'Cost-effectiveness'], answer: 2, explain: 'Multi-rate operation: tasks/subsystems at different frequencies, synchronised.' },
      { q: 'Which standard covers automotive functional safety?', options: ['IEC 62304', 'ISO 26262', 'DO-178C', 'EN 50128'], answer: 1, explain: 'ISO 26262 — road vehicles. IEC 62304 is medical software, DO-178C airborne, EN 50128 railways.' },
      { q: '“Must operate 5–10 years on a coin cell and fit inside the chest” describes which characteristic of a pacemaker?', options: ['Strict design parameters', 'Multi-rate operation', 'Sophisticated functionality', 'Minimal UI'], answer: 0, explain: 'Non-negotiable power and size constraints are strict design parameters.' },
      { q: 'Why do embedded systems usually have no secondary storage (hard disk)?', options: ['Disks are too fast', 'The program is fixed and stored in ROM/Flash; extra storage adds cost, size and failure risk', 'Embedded systems have no software', 'Operating systems forbid it'], answer: 1, explain: 'Exclusive memory: firmware in Flash, data in SRAM, nothing to load from a disk.' },
    ],
  },
};

export default topic;
