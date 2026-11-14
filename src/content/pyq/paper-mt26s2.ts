import type { PyqPaper } from '../../types';
import { md } from '../md';
import { bitbandSolution, BITBAND_WHY, setBitSolution, LR_ANSWER, systickSolution, fanSolution } from './shared';

const RUBRIC_2026_FAN = md`### Rubric (30 marks)

| Criterion (as printed) | Marks |
|---|---|
| Register-Level Configuration | 5 |
| Door Sensor Functionality (PA6 → PC13) | 5 |
| Potentiometer-Based Speed Indication (PB9 Blink, two bands) | 5 |
| Manual Override (PB10 → PB9 steady ON + PC14 indicator) | 5 |
| ADC Value Demonstration & Functional Verification | 10 |`;

const paper: PyqPaper = {
  id: 'mt26s2',
  title: 'Mid-Term Aug 2026, Slot 1 Set 2',
  exam: 'Mid-Term',
  year: 2026,
  month: 'August',
  set: 'Slot 1, Set 2',
  file: "EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET2.pdf",
  duration: '2 hours',
  maxMarks: 50,
  notes: 'Part A (theory) is 20 marks and Part B (practical) is 30 marks.',
  questions: [
    {
      id: 'MT26S2-1',
      number: '1',
      text: md`A modern automobile uses electronic systems for cruise control, engine management, safety, and entertainment. Explain the role of embedded systems in these functions and describe the characteristics required for their effective operation.`,
      marks: 6,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['es-characteristics', 'es-intro', 'es-types'],
      kind: 'theory',
      solution: md`**Definition.** An embedded system is a microcontroller-based combination of hardware and firmware that performs a dedicated function inside a larger system. A modern car contains **50–100 such systems (ECUs — Electronic Control Units)**, connected by in-vehicle networks such as CAN and LIN.

### Role of embedded systems in each function

| Function | What the embedded system does | Sensors → actuators |
|---|---|---|
| **Cruise control** | Holds a set speed by reading vehicle speed every few milliseconds and adjusting the throttle (closed-loop control); cancels when the brake is pressed | Wheel-speed sensors, brake switch → electronic throttle |
| **Engine management (ECU)** | Calculates fuel injection quantity and ignition timing for every engine cycle to optimise power, fuel economy and emissions | Crankshaft position, oxygen (lambda), air-flow, temperature sensors → injectors, spark coils |
| **Safety** | ABS prevents wheel lock by modulating brake pressure; the airbag control unit detects a crash and fires the inflator within about 20 ms | Wheel-speed sensors, accelerometers → brake valves, airbag squib |
| **Entertainment (infotainment)** | Plays media, runs navigation and the touch display, connects phones by Bluetooth | GPS, microphones, touch screen → display, speakers |

### Characteristics required

| Characteristic | Why the car needs it |
|---|---|
| **Real-time (hard real-time for safety)** | An airbag or ABS decision that arrives late is a failure even if it is correct |
| **Reliability and availability** | Must work for years across −40 °C to +125 °C, vibration and electrical noise |
| **Safety factor** | Failures can injure people; designed and certified to ISO 26262 |
| **Specificity** | Each ECU does one job (engine, ABS, airbag) |
| **Multi-rate operation** | Engine control runs every few ms, cruise control every tens of ms, infotainment far slower — all synchronised over CAN |
| **Efficiency and strict design parameters** | Fuel economy and emission limits, cost per unit, size and power |
| **Sophisticated functionality** | Infotainment needs powerful processors, graphics and an OS |
| **Networked / connected to peripherals** | ECUs exchange data (e.g. speed shared by cruise control, ABS and the dashboard) |

**Conclusion.** Embedded systems sense, decide and act in every major car function. Safety-critical ones need hard real-time, highly reliable, certified designs, while comfort and entertainment systems emphasise rich functionality.`,
    },
    {
      id: 'MT26S2-2',
      number: '2',
      text: md`How does the ARM Cortex-M4 use the Link Register (LR) during subroutine calls?`,
      marks: 3,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['m4-registers', 'memory-instructions'],
      kind: 'theory',
      solution: LR_ANSWER,
    },
    {
      id: 'MT26S2-3',
      number: '3',
      text: md`State one function of the SysTick timer in ARM Cortex-M4. Calculate the reload value to be loaded into the SysTick Reload Value Register (SYST_RVR) to generate a periodic interrupt every 1 ms, assuming a processor clock of 16 MHz with a /8 prescaler`,
      marks: 3,
      co: 'CO03',
      btl: 'BTL 2',
      unit: 3,
      topics: ['systick', 'systick-interrupt'],
      kind: 'numerical',
      solution: systickSolution(16),
    },
    {
      id: 'MT26S2-4a',
      number: '4(a)',
      text: md`Apply the concept of bit-banding in ARM Cortex-M4 to control a GPIO pin using STM32F401CCU6. The GPIOB base address is 0x40020400 and the GPIO output data register (ODR) offset is 0x14.

i. Determine the address of the GPIOB_ODR register and calculate the bit-band alias address corresponding to bit 4 of the register.

ii. Explain how bit-banding improves GPIO control in real-time applications.`,
      marks: 4,
      co: 'CO02',
      btl: 'BTL 3',
      unit: 1,
      topics: ['bit-banding', 'memory-map', 'gpio-registers'],
      kind: 'mixed',
      solution: bitbandSolution({
        reg: 0x40020414,
        bit: 4,
        regName: 'GPIOB_ODR',
        derive: md`
**Register address:** GPIOB_ODR = base + offset = 0x4002 0400 + 0x14 = **0x4002 0414**.
`,
      }) + '\n' + BITBAND_WHY,
    },
    {
      id: 'MT26S2-4b',
      number: '4(b)',
      text: md`You are working with a 32-bit control register in the STM32F401CCU6 microcontroller. The register controls multiple hardware features through individual bits, and several bits are already set.

i. Analyze the bitwise operation required to set bit 4 while preserving the states of all other bits in the register

ii. Compare this approach with the use of a direct assignment such as REG = 0x10;, in terms of its effect on the other bits of the register.`,
      marks: 4,
      co: 'CO02',
      btl: 'BTL 4',
      unit: 2,
      topics: ['bit-manipulation'],
      kind: 'mixed',
      solution: setBitSolution(4, 'REG = 0x10;', 0x10),
    },
    {
      id: 'MT26S2-5',
      number: '5',
      text: md`Design and implement a Smart Fan Speed and Status Indicator system on an STM32F401CCU6 microcontroller. The hardware setup is as follows: a switch is connected to PA6 to act as the fan power control, a potentiometer is connected to ADC1 channel 0 to regulate fan speed, another switch is connected to PB10 for manual override, and LEDs are connected to PC13, PC14, and PB9 for system indication. The system must operate in the following manner:

a. when the switch on PA6 is pressed, it simulates turning the fan ON and the LED on PC13 should glow, while releasing the switch turns the fan OFF and the LED goes OFF.

b. The potentiometer reading determines the fan speed level, which should be indicated by the blinking frequency of PB9 with two bands only: slow blinking for low speed and fast blinking for high speed.

c. The manual override switch on PB10, when pressed, should force PB9 to stay steadily ON regardless of the potentiometer input, and simultaneously PC14 should glow steadily to indicate that override mode is active. Releasing PB10 must resume potentiometer-based automatic fan speed control. Importantly, if the fan is OFF (PA6 not pressed), both PB9 and PC14 must remain OFF irrespective of potentiometer or override input.

Rubrics: Register-Level Configuration [5], Door Sensor Functionality (PA6 → PC13) [5], Potentiometer-Based Speed Indication (PB9 Blink, two bands) [5], Manual Override (PB10 → PB9 steady ON + PC14 indicator) [5], ADC Value Demonstration & Functional Verification [10].`,
      marks: 30,
      co: 'CO02',
      btl: 'BTL 2–4',
      unit: 2,
      topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
      kind: 'program',
      sourceNote: md`The rubric calls the PA6 → PC13 item “Door Sensor Functionality”, a label carried over from the Smart Lighting paper. Here it marks the **fan power switch** behaviour. The arrows are missing from the extracted PDF text and have been restored.`,
      solution: fanSolution(RUBRIC_2026_FAN),
    },
  ],
};

export default paper;
