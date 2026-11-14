import type { PyqPaper } from '../../types';
import { md } from '../md';
import { bitbandSolution, BITBAND_WHY, clearBitSolution, THREAD_HANDLER, systickSolution, lightingSolution } from './shared';

const RUBRIC_2026_LIGHTING = md`### Rubric (30 marks)

| Criterion | Marks |
|---|---|
| Register-Level Configuration | 5 |
| Door Sensor Functionality (PA0 → PC13) | 5 |
| LDR-based Automatic Lighting (PA1 ADC → PB9) | 5 |
| Manual Override Function (PB10 → PB9) | 5 |
| ADC Value Demonstration & Functional Verification | 10 |`;

const paper: PyqPaper = {
  id: 'mt26s1',
  title: 'Mid-Term Aug 2026, Slot 1 Set 1',
  exam: 'Mid-Term',
  year: 2026,
  month: 'August',
  set: 'Slot 1, Set 1',
  file: "EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET1.pdf",
  duration: '2 hours',
  maxMarks: 50,
  notes: 'Part A (theory) is 20 marks and Part B (practical) is 30 marks.',
  questions: [
    {
      id: 'MT26S1-1',
      number: '1',
      text: md`A washing machine automatically controls water intake, washing time, motor operation, and completion of the washing cycle based on the selected program. Explain why the washing machine is considered an embedded system and describe the characteristics of embedded systems reflected in this application.`,
      marks: 6,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['es-characteristics', 'es-intro'],
      kind: 'theory',
      solution: md`**Definition.** An embedded system is a combination of hardware (a microcontroller with memory and peripherals) and software (firmware) designed to perform a **specific, dedicated function**, usually inside a larger product and often under real-time constraints.

### Why a washing machine is an embedded system

- It contains a **microcontroller** that runs **fixed firmware** stored in Flash.
- It performs **one dedicated job** — washing clothes according to the selected program — and cannot be used as a general-purpose computer.
- It reads **sensors** (water-level pressure sensor, temperature sensor, door-lock switch, motor speed sensor) and drives **actuators** (water inlet valve, drain pump, drum motor, heater) through its peripherals.
- It works **automatically and in real time**: once a program is selected it fills, washes, rinses, spins and stops without user intervention.

::diagram{es-block}

### Characteristics reflected in the washing machine

| Characteristic | How the washing machine shows it |
|---|---|
| **Specificity** | Only runs washing programs; the software is fixed for that task |
| **Real-time operation / efficiency** | Opens the inlet valve until the level sensor reaches the target, heats to the set temperature, times each phase precisely |
| **Minimal user interface** | A knob or a few buttons and a small display; then it runs by itself |
| **Connected to peripherals (sensors and actuators)** | Level, temperature and door sensors; motor, valves, pump, heater |
| **Reliability and safety** | Door stays locked while the drum spins; detects imbalance and leaks; runs thousands of cycles |
| **Exclusive memory** | Wash programs in Flash/ROM; no hard disk |
| **Low cost and compact design** | A cheap single-chip MCU on a small board, no OS licence |
| **Low power** | Standby modes between uses |

**Working example.** For a “Cotton 40 °C” program the MCU opens the valve until the water level is reached, switches the heater on until the temperature sensor reads 40 °C, runs the motor in alternating directions for the wash time using a timer, drains, rinses, spins, and finally unlocks the door and signals completion.

**Conclusion.** Because a dedicated microcontroller and firmware sense, decide and control a single appliance function automatically and in real time, the washing machine is a classic embedded system.`,
    },
    {
      id: 'MT26S1-2',
      number: '2',
      text: md`Answer the following

a. Differentiate between Thread mode and Handler mode in ARM Cortex-M processors. Which of these modes is used exclusively for privileged operations?

b. Can the system switch from unprivileged mode to privileged mode using software? Explain briefly.`,
      marks: 3,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['operating-modes'],
      kind: 'theory',
      solution: THREAD_HANDLER,
    },
    {
      id: 'MT26S1-3',
      number: '3',
      text: md`State one function of the SysTick timer in ARM Cortex-M4. Calculate the reload value to be loaded into the SysTick Reload Value Register (SYST_RVR) to generate a periodic interrupt every 1 ms, assuming a processor clock of 84 MHz with a /8 prescaler.`,
      marks: 3,
      co: 'CO03',
      btl: 'BTL 2',
      unit: 3,
      topics: ['systick', 'systick-interrupt'],
      kind: 'numerical',
      solution: systickSolution(84),
    },
    {
      id: 'MT26S1-4a',
      number: '4(a)',
      text: md`Apply the concept of bit-banding in ARM Cortex-M4 to control a GPIO pin using STM32F401CCU6. The GPIOA base address is 0x40020000 and the GPIO output data register (ODR) offset is 0x14.

i. Determine the address of the GPIOA_ODR register and calculate the bit-band alias address corresponding to bit 7 of the register.

ii. Explain how bit-banding improves GPIO control in real-time applications`,
      marks: 4,
      co: 'CO02',
      btl: 'BTL 3',
      unit: 1,
      topics: ['bit-banding', 'memory-map', 'gpio-registers'],
      kind: 'mixed',
      solution: bitbandSolution({
        reg: 0x40020014,
        bit: 7,
        regName: 'GPIOA_ODR',
        derive: md`
**Register address:** GPIOA_ODR = base + offset = 0x4002 0000 + 0x14 = **0x4002 0014**.
`,
      }) + '\n' + BITBAND_WHY,
    },
    {
      id: 'MT26S1-4b',
      number: '4(b)',
      text: md`You are working with a 32-bit control register in the STM32F401CCU6 microcontroller. The register enables and disables multiple hardware features using different bits, and several bits are already set.

i. Analyze the bitwise operation required to clear bit 7 while preserving the states of all other bits in the register.

ii. Compare this approach with the use of a direct assignment such as REG = 0;.`,
      marks: 4,
      co: 'CO02',
      btl: 'BTL 4',
      unit: 2,
      topics: ['bit-manipulation'],
      kind: 'mixed',
      solution: clearBitSolution(7, 'REG = 0;'),
    },
    {
      id: 'MT26S1-5',
      number: '5',
      text: md`Design and implement a Smart Lighting with Door Sensor and Manual Override system on an STM32F401CCU6 microcontroller. The hardware setup is as follows: switches are connected to PA0 (door sensor) and PB10 (manual override), an LDR is connected to channel 1 through the ADC, and LEDs are connected to PC13 and PB9. The system should work as follows:

a. when the switch on PA0 is pressed, it simulates a door opening and LED PC13 must turn ON, while releasing the switch (door closed) should turn it OFF.

b. The LDR on PA1 is used for automatic lighting: when the ambient light is low (ADC value - set threshold), LED PB9 should turn ON, and when the light is high, it should turn OFF.

c. In addition, the switch on PB10 acts as a manual override for LED PB9; pressing it should temporarily disable the auto-light function and toggle the LED (PB9) ON or OFF with each press, resuming automatic LDR control once override is released.

Rubrics: Register-Level Configuration [5], Door Sensor Functionality (PA0 → PC13) [5], LDR-based Automatic Lighting (PA1 ADC → PB9) [5], Manual Override Function (PB10 → PB9) [5], ADC Value Demonstration & Functional Verification [10].`,
      marks: 30,
      co: 'CO02',
      btl: 'BTL 2–4',
      unit: 2,
      topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
      kind: 'program',
      sourceNote: md`The arrows in the rubric (PA0 → PC13 and so on) are missing from the extracted PDF text and have been restored.`,
      solution: lightingSolution(RUBRIC_2026_LIGHTING, false),
    },
  ],
};

export default paper;
