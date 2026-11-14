import type { PyqPaper } from '../../types';
import { md } from '../md';
import { bitbandSolution, BITBAND_WHY, clearBitSolution, THREAD_HANDLER, lightingSolution, RUBRIC_2025 } from './shared';

const paper: PyqPaper = {
  id: 'mt25a',
  title: 'Mid-Term Aug 2025, Set A',
  exam: 'Mid-Term',
  year: 2025,
  month: 'August',
  set: 'Set A',
  file: "EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf",
  duration: '2 hours',
  maxMarks: 50,
  notes: 'The compiled PDF holds two August 2025 papers without set labels. This platform labels the first one Set A and the second Set B. Part A (theory) is 20 marks and Part B (practical) is 30 marks.',
  questions: [
    {
      id: 'MT25A-1',
      number: '1',
      text: md`Compare a microcontroller and a microprocessor in terms of their components using the use case of a smart home and a personal computer.`,
      marks: 2,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['mpu-mcu-dsp'],
      kind: 'theory',
      solution: md`**Definition.** A **microcontroller (MCU)** is a complete computer on one chip: CPU + Flash + SRAM + peripherals. A **microprocessor (MPU)** is only the CPU; memory and I/O are separate chips.

| Component | Microcontroller — smart home (smart switch, thermostat, door lock) | Microprocessor — personal computer |
|---|---|---|
| CPU | Small core, e.g. Cortex-M4 at 16–84 MHz | Powerful multi-core x86 CPU at GHz speeds |
| Program memory | On-chip Flash (e.g. 256 KB) | External SSD/HDD, loaded into RAM |
| Data memory | On-chip SRAM (e.g. 64 KB) | External DRAM, several GB |
| I/O | On-chip GPIO, ADC, timers, UART/I²C/SPI read the sensors and drive relays directly | Separate chipset, USB, graphics card |
| Power and cost | Milliwatts, low cost, battery friendly | Tens of watts, high cost |
| Software | One dedicated firmware task, real-time | General-purpose OS running many applications |

**Conclusion.** The smart home device needs a cheap, low-power, single-chip controller for a fixed job → **MCU**. The PC needs raw performance and expandability for many programs → **MPU** with external memory and I/O.`,
    },
    {
      id: 'MT25A-2',
      number: '2',
      text: md`You have been hired as a junior embedded systems engineer at a company that develops smart wearable health devices (like fitness bands or smartwatches). Your first task is to understand how the internal embedded system of such a device is structured so you can later help optimize its design. Draw the basic architecture of an embedded system and explain the function of each major component (such as processor, memory, sensors, actuators, and communication interfaces) in the context of a wearable health monitoring device.`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['es-intro', 'es-characteristics'],
      kind: 'theory',
      solution: md`**Definition.** An embedded system is a microprocessor/microcontroller-based system of hardware and software designed to perform a dedicated function, usually as part of a larger device.

### Architecture

::diagram{es-block}

~~~text
 Sensors ──► Signal conditioning / ADC ──► Processor (MCU) ──► Actuators / Output
 (PPG, accel,                               │      ▲             (display, vibration
  temperature)                              ▼      │              motor, LED)
                                   Memory (Flash, SRAM)
                                            │
                    Communication (BLE) ◄───┘          Power: battery + regulator
                                                       Timers / RTC, firmware
~~~

### Function of each block in a wearable health monitor

| Block | Function in the fitness band |
|---|---|
| **Sensors** | PPG optical sensor for heart rate and SpO₂, accelerometer for steps and sleep, temperature sensor |
| **Signal conditioning + ADC** | Amplify and filter weak sensor signals; ADC converts them to digital values |
| **Processor (MCU, e.g. Cortex-M4)** | Runs the firmware: samples sensors, filters data (DSP/FPU), counts steps, detects abnormal heart rate, manages power |
| **Memory** | Flash holds the firmware and logged readings; SRAM holds variables and sensor buffers |
| **Actuators / output** | OLED display shows readings; vibration motor gives alerts; LEDs drive the PPG sensor |
| **Communication interface** | Bluetooth Low Energy sends data to the phone app; I²C/SPI connect sensors to the MCU internally |
| **Power supply** | Rechargeable battery, regulator and charger; low-power modes extend battery life to days |
| **Timers / RTC** | Periodic sampling, time-stamping, watch time |

**Conclusion.** Sensors measure the body, the MCU processes the data under strict power and size limits, outputs inform the user, and BLE links the device to the phone — a typical small, low-power, real-time embedded system.`,
    },
    {
      id: 'MT25A-3',
      number: '3',
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
      id: 'MT25A-4',
      number: '4',
      text: md`Explain the significance of the following condition flags found in CPSR: N (Negative), Z (Zero), C (Carry), V (Overflow) in the ARM Cortex-M4 processor. How do these flags affect the operation of the processor during program execution?`,
      marks: 3,
      co: 'CO01',
      btl: 'BTL 2',
      unit: 1,
      topics: ['m4-registers', 'alu-instructions'],
      kind: 'theory',
      sourceNote: md`The paper says **CPSR**, the name used on classic ARM (ARM7, Cortex-A). On the Cortex-M4 the same flags are bits 31–28 of the **APSR**, part of the combined **xPSR**.`,
      solution: md`**Definition.** The condition flags are bits 31–28 of the APSR. They are updated by «CMP», «CMN», «TST», «TEQ» and by instructions with the **S** suffix («ADDS», «SUBS», «MOVS» …), and they record properties of the last result.

::diagram{xpsr}

| Flag | Bit | Set when | Example |
|---|---|---|---|
| **N** Negative | 31 | Bit 31 of the result is 1 (negative in two's complement) | «MOVS R0, #0» then «SUBS R0, R0, #1» → R0 = 0xFFFFFFFF, N = 1 |
| **Z** Zero | 30 | The result is exactly zero | «SUBS R0, R0, R0» → Z = 1 |
| **C** Carry | 29 | Unsigned carry out of an addition; for subtraction/compare C = 1 means **no borrow**; or the last bit shifted out | 0xFFFFFFFF + 1 → result 0, C = 1, Z = 1 |
| **V** Overflow | 28 | Signed overflow: the result's sign is wrong for signed arithmetic | 0x7FFFFFFF + 1 → 0x80000000, V = 1, N = 1 |

### How the flags affect execution

1. **Conditional branches** test them: «BEQ» (Z = 1), «BNE» (Z = 0), «BCS/BHS» (C = 1, unsigned ≥), «BCC/BLO» (C = 0), «BMI» (N = 1), «BPL» (N = 0), «BVS/BVC» (V), «BHI» (C = 1 and Z = 0), «BGE» (N = V), «BLT» (N ≠ V), «BGT» (Z = 0 and N = V), «BLE».
2. **IT blocks** make up to four following instructions conditional («ITE EQ» …) without branching.
3. **Multi-word arithmetic** uses C: «ADDS» low words, then «ADC» high words adds the carry.

~~~asm
        CMP   R0, #10       ; R0 − 10, sets N Z C V, result discarded
        BLT   small         ; signed: taken if N ≠ V (R0 < 10)
        BEQ   equal         ; taken if Z = 1 (R0 == 10)
~~~

**Conclusion.** The flags let the processor make decisions — loops, if/else and comparisons — by turning the outcome of an arithmetic or compare instruction into a branch or conditional execution.`,
    },
    {
      id: 'MT25A-5a',
      number: '5(a)',
      text: md`Apply the concept of bit-banding in ARM Cortex-M4 to control a GPIO pin using STM32F401CCU6.

i. Calculate the bit-band alias address for bit 5 of the register located at 0x4002001C (GPIO port output data register).

ii. Explain how bit-banding improves GPIO control in real-time applications`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 3',
      unit: 1,
      topics: ['bit-banding', 'memory-map'],
      kind: 'mixed',
      sourceNote: md`On the STM32F401, offset **0x1C** from GPIOA (0x4002 0000) is **GPIOA_LCKR** (the configuration lock register). The output data register is at offset **0x14** (0x4002 0014). The answer below uses the address exactly as printed — that is what the examiner marks. If ODR was intended, bit 5 of 0x4002 0014 aliases to **0x4240 0294**.`,
      solution: bitbandSolution({ reg: 0x4002001c, bit: 5, regName: 'the register at 0x4002001C as printed' }) + '\n' + BITBAND_WHY,
    },
    {
      id: 'MT25A-5b',
      number: '5(b)',
      text: md`You are working with a 32-bit control register in the STM32F401CCU6 microcontroller. The register enables and disables multiple hardware features using different bits, and several bits are already set.

i. Apply bitwise logic to write a C statement that disables only bit 5, without modifying the state of other bits in the register.

ii. Compare this approach with the use of a direct assignment such as REG = 0;.`,
      marks: 4,
      co: 'CO01',
      btl: 'BTL 3',
      unit: 2,
      topics: ['bit-manipulation'],
      kind: 'mixed',
      solution: clearBitSolution(5, 'REG = 0;'),
    },
    {
      id: 'MT25A-6',
      number: '6',
      text: md`Design and implement a Smart Lighting with Door Sensor and Manual Override system on an STM32F401CCU6 microcontroller. The hardware setup is as follows: switches are connected to PA0 (door sensor) and PB10 (manual override), an LDR is connected to channel 1 through the ADC, and LEDs are connected to PC13, PC14, and PB9. The system should work as follows:

a. when the switch on PA0 is pressed, it simulates a door opening, and LED PC13 must turn ON, while releasing the switch (door closed) should turn it OFF.

b. The LDR on PA1 is used for automatic lighting: when the ambient light is low (ADC value - set threshold), LED PB9 should turn ON, and when the light is high, it should turn OFF.

c. In addition, the switch on PB10 acts as a manual override for LED PB9; pressing it should temporarily disable the auto-light function and toggle the LED ON or OFF with each press, resuming automatic LDR control once override is released.

Rubrics: Register Configurations, Logic Design, Implementation, Interfacing the Hardware, Output.`,
      marks: 30,
      co: 'CO02',
      btl: 'BTL 3–4',
      unit: 2,
      topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
      kind: 'program',
      sourceNote: md`In the text extracted from the PDF the rubric marks are offset by one line from the criteria. The order shown (10, 5, 5, 5, 5) matches the second August 2025 paper, which prints the same rubric cleanly. “ADC value - set threshold” is printed as is; read it as “ADC value compared with a set threshold”.`,
      solution: lightingSolution(RUBRIC_2025, true),
    },
  ],
};

export default paper;
