import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'es-types',
  unit: 1,
  order: 3,
  title: 'Types and applications of embedded systems',
  short: 'Classification by function (real-time, standalone, networked, mobile) and by scale (small, medium, sophisticated), with application domains.',
  status: 'course',
  sources: [{ file: 'Day02-Introduction to Embedded System.pptx', detail: 'slides 16–22' }],
  keywords: ['real-time', 'standalone', 'networked', 'mobile', 'small-scale', 'medium-scale', 'sophisticated', 'applications'],
  importance: 1,
  related: ['es-intro', 'es-characteristics'],
  fundamentals: {
    what: md`Embedded systems are classified two ways in the lecture: by **performance and function** (real-time, standalone, networked, mobile) and by **scale/complexity** (small, medium, sophisticated).`,
    why: md`The type decides the hardware (8-bit MCU vs 32-bit SoC), the software (bare-metal vs RTOS vs Linux) and the main design constraint (deadline, power, connectivity, cost).`,
    problem: md`Classification gives a vocabulary to compare designs and choose a processor: a battery-powered mobile system and a networked security system face different problems.`,
    how: md`Look at what drives the design: does it have deadlines (real-time)? Does it work alone (standalone)? Is it connected (networked)? Is it battery-limited (mobile)? Then judge the scale by processor width, memory and software complexity.`,
    where: md`Real-time: patient monitors, radio/satellite communication. Standalone: microwave ovens, digital cameras. Networked: office security systems over LAN/WAN. Mobile: phones, MP3 players. Scale ranges from battery toys (small) to multi-processor avionics (sophisticated).`,
  },
  detailed: md`
## By performance and function

| Type | Idea | Examples (lecture) |
|---|---|---|
| **Real-time** | Responds to critical events within a guaranteed time | Military, medical, industrial; radio/satellite/telephone communication; patient monitoring |
| **Standalone** | Works by itself without a host computer; takes analog/digital input, processes, outputs (often on a display) | Microwave oven, digital camera |
| **Networked** | Connected to a network (LAN/WAN/Internet) to deliver output to attached resources | Office security: light, smoke and motion sensors networked over LAN, controlled over the Internet |
| **Mobile** | Portable, limited memory and power | Mobile phones, MP3 players, digital cameras |

Real-time systems are further split into **hard** real-time (missing a deadline is a failure — airbag, pacemaker) and **soft** real-time (late results are degraded but tolerable — video streaming). *(Hard/soft split: external knowledge, consistent with the lecture's airbag example.)*

## By scale (performance of the microcontroller)

| Scale | Processor | Memory / software | Notes |
|---|---|---|---|
| **Small-scale** | 8–16-bit MCU | On-chip ROM and RAM; simple C or assembly | Can run from a battery; low complexity |
| **Medium-scale** | 16–32-bit MCU/MPU | External RAM/ROM; C, C++, Java; RTOS | Hardware/software integration is complex |
| **Sophisticated** | Multiple 32–64-bit chips | Large distributed software; RTOS/Linux | Very high complexity; distributed processing |

> [!note] Where does the STM32F401 sit?
> A 32-bit Cortex-M4 with on-chip 256 KB Flash and 64 KB SRAM sits at the top of “small” / bottom of “medium”: it needs no external memory, but it is powerful enough to run an RTOS. The lecture's classification is by bit-width, so in the exam call it **medium-scale (32-bit)**.

## Application domains (Day02 slides 21–22)

- **Automobiles and telecommunications:** motor and cruise control, body/engine safety, in-car entertainment, assembly-line robotics, wireless communication, mobile networking.
- **Smart cards, missiles and satellites:** security systems, telephone and banking, defence and aerospace, communication.
- **Peripherals and networking:** displays and monitors, networking systems, image processing, network cards and printers.
- **Consumer electronics:** digital cameras, set-top boxes, HD TVs, DVD players.
`,
  visual: md`
Classify by asking four questions, in order:

| Question | If yes → |
|---|---|
| Is there a hard deadline? | Real-time |
| Does it need a network to do its job? | Networked |
| Is it battery-powered and portable? | Mobile |
| Otherwise | Standalone |

::diagram{es-block}
`,
  exam: {
    definitions: [
      { term: 'Standalone embedded system', def: 'Works independently without a host computer, taking inputs, processing them and producing outputs (e.g. microwave oven).' },
      { term: 'Networked embedded system', def: 'An embedded system connected to a wired or wireless network to provide its function (e.g. networked security system).' },
      { term: 'Mobile embedded system', def: 'A portable embedded system constrained by memory, power and size (e.g. mobile phone).' },
      { term: 'Small-scale embedded system', def: 'Built around an 8–16-bit microcontroller with on-chip ROM/RAM, low complexity, often battery-operated.' },
    ],
    frequent: ['Classify embedded systems with one example each.', 'Differentiate small, medium and sophisticated embedded systems.'],
    mistakes: ['Giving a PC as an example of an embedded system.', 'Mixing the two classification schemes (function vs scale) in one table without saying so.'],
    diagrams: ['Classification tree: by function and by scale'],
    shortQs: [
      { q: 'Classify embedded systems based on performance and functional requirements with one example each.', a: md`Real-time (patient monitor), standalone (microwave oven), networked (networked office security system), mobile (mobile phone).`, marks: 2 },
      { q: 'Differentiate small-scale and medium-scale embedded systems.', a: md`Small-scale: 8–16-bit MCU, on-chip ROM/RAM, simple software, battery-operable. Medium-scale: 16–32-bit MCU/MPU, often external RAM/ROM, complex hardware–software integration, C/C++/Java and RTOS.`, marks: 2 },
      { q: 'Give two applications of embedded systems in automobiles and two in consumer electronics.', a: md`Automobile: cruise control, engine/airbag safety (also infotainment). Consumer: digital camera, set-top box (also HD TV, DVD player).`, marks: 2 },
    ],
    longQs: [
      {
        q: 'Explain the classification of embedded systems based on (a) performance and functional requirements and (b) the performance of the microcontroller, with examples.',
        a: md`**(a) Function:** real-time (critical response time; patient monitoring, satellite comms), standalone (no host; microwave, camera), networked (LAN/WAN connected; office security), mobile (portable, limited resources; phones, MP3 players).
**(b) Scale:** small (8–16-bit MCU, on-chip memory, battery), medium (16–32-bit, external memory, RTOS, complex integration), sophisticated (multiple 32–64-bit chips, distributed processing, very high complexity).
**Conclusion:** the same product can belong to one class in each scheme (a smartwatch is mobile, networked, and medium-scale).`,
        marks: 6,
      },
      {
        q: 'Discuss the applications of embedded systems in four different domains.',
        a: md`Automobiles/telecom (cruise control, engine safety, infotainment, robotics, wireless); smart cards, missiles and satellites (security, banking, defence, aerospace); peripherals and networking (monitors, network cards, printers, image processing); consumer electronics (cameras, set-top boxes, HD TVs). For each, state the dedicated function and a key constraint (e.g. real-time for engine control, security for smart cards).`,
        marks: 6,
      },
    ],
  },
  revision: {
    notes: ['By function: real-time, standalone, networked, mobile.', 'By scale: small (8–16-bit), medium (16–32-bit, RTOS), sophisticated (multi 32–64-bit).', 'Hard real-time: missed deadline = failure; soft: degraded.', 'Domains: automotive, telecom, smart cards/defence, peripherals/networking, consumer.'],
    takeaways: ['Two independent classification schemes.', 'One example per class is enough for 2 marks.', 'STM32F401 = 32-bit → medium scale.'],
    mcqs: [
      { q: 'A microwave oven is best classified as…', options: ['Networked', 'Standalone', 'Sophisticated', 'Mobile'], answer: 1, explain: 'It works independently without a host computer.' },
      { q: 'Small-scale embedded systems typically use…', options: ['8–16-bit microcontrollers', '64-bit multi-core processors', 'GPUs', 'Mainframes'], answer: 0, explain: 'Per the lecture: 8–16-bit MCU with on-chip ROM and RAM.' },
      { q: 'A smoke/motion sensor system controlled over the Internet is…', options: ['Standalone', 'Networked', 'Small-scale only', 'Not embedded'], answer: 1, explain: 'Sensors networked over LAN and controlled over the WAN.' },
      { q: 'Which is a mobile embedded system?', options: ['Industrial PLC', 'MP3 player', 'Railway signal controller', 'Desktop PC'], answer: 1, explain: 'Portable with limited memory and power.' },
      { q: 'Medium-scale embedded systems commonly use…', options: ['No software', '16–32-bit processors with external memory and possibly an RTOS', 'Only analog circuits', 'Vacuum tubes'], answer: 1, explain: 'As defined on Day02 slide 19.' },
    ],
  },
};

export default topic;
