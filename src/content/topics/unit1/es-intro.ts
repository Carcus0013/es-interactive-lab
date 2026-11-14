import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'es-intro',
  unit: 1,
  order: 1,
  title: 'What is an embedded system?',
  short: 'A computer built into a product to do one dedicated job — its definition, its building blocks, and how a microcontroller board is organised.',
  status: 'course',
  sources: [
    { file: 'Day02-Introduction to Embedded System.pptx', detail: 'slides 7–15, 23 (definition, MCU components, board components, basic structure, digital camera)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§2.1 Embedded Systems' },
  ],
  keywords: ['definition', 'dedicated function', 'microcontroller', 'block diagram', 'sensor', 'actuator', 'ADC', 'DAC', 'firmware', 'wearable'],
  importance: 2,
  pyq: ['MT25A-2'],
  sims: [],
  related: ['es-characteristics', 'es-types', 'mpu-mcu-dsp'],
  fundamentals: {
    what: md`An **embedded system** is a combination of computer hardware and software designed to perform a **specific (dedicated) function**, either on its own or as part of a larger system (Day02 slide 7). It is a microcontroller- or microprocessor-based computer that you do not think of as a "computer" — a washing machine controller, a fitness band, an airbag unit.`,
    why: md`A general-purpose PC is too big, too expensive and too power-hungry to put inside a thermostat or a pacemaker. Products need a small, cheap, reliable computer that does exactly one job, reacts to the physical world, and often runs for years on a battery.`,
    problem: md`It lets a product **sense** the physical world (sensors → ADC), **decide** (firmware on a processor), and **act** (DAC, motors, LEDs, displays) automatically, with predictable timing and minimal cost and power.`,
    how: md`Sensors convert a physical quantity into an electrical signal; the ADC turns that into numbers; the processor runs a fixed program from non-volatile **Flash** (firmware) using **SRAM** for variables; results drive actuators through GPIO, DAC or PWM; communication interfaces (UART, I²C, SPI, USB) talk to other chips. Most small systems run **bare-metal** (no OS) in an endless loop; complex ones use an RTOS.`,
    where: md`Consumer electronics (cameras, set-top boxes, smart TVs), automobiles (engine control, cruise control, airbags), medical devices (BP monitors, pacemakers), industrial control and robotics, networking equipment, smart cards, defence and aerospace (Day02 slides 21–22).`,
  },
  detailed: md`
## Three definitions from the lecture

1. "A combination of computer hardware and software designed for a specific function."
2. "A microprocessor-based computer hardware system with software that is designed to perform a dedicated function, either as an independent system or as a part of a large system."
3. "A microcontroller or microprocessor based system which is designed to perform a specific task."

All three stress the same idea: **dedicated function**. That one idea explains almost every characteristic in the next lesson (fixed software, limited resources, minimal user interface, low cost).

> [!exam]
> Start any "define / explain an embedded system" answer with definition 2, then add: *it is designed to perform a dedicated task with real-time constraints, using limited memory, power and cost.*

## The microcontroller: a computer on one chip

Everything needed to compute is fabricated on one silicon die (Day02 slides 9–11):

| Block | Role | On the STM32F401CCU6 |
|---|---|---|
| CPU | Fetches, decodes, executes instructions (ALU, control unit, registers, SP, PC) | Arm Cortex-M4F, up to 84 MHz |
| Flash / ROM | Non-volatile **program memory** (firmware) | 256 KB at 0x0800 0000 |
| SRAM | Volatile **data memory** (variables, stack) | 64 KB at 0x2000 0000 |
| EEPROM (optional) | Small non-volatile data that survives power-off | not present (emulated in Flash) |
| Clock / oscillator | Timing pulses for the CPU and peripherals | 16 MHz HSI RC oscillator (used by all lab programs) |
| GPIO | Pins that read sensors / drive actuators | ports A, B, C (+D, E, H) |
| Timers / counters | Delays, periodic events, PWM, measuring time | SysTick, TIM1–TIM5, TIM9–11 |
| Communication | Talk to other chips | USART1/2/6, I²C1–3, SPI1–4, USB OTG |
| ADC | Analog → digital | 12-bit, 16 external channels |

## What the board adds around the chip

The development board (WeAct **Black Pill** in your lab) supplies what the chip cannot (Day02 slide 12):

- **Power management** — an LDO regulator steps USB 5 V down to 3.3 V; decoupling capacitors smooth ripple.
- **Timing** — external crystals (25 MHz HSE and 32.768 kHz LSE on the Black Pill) for precise clocks.
- **Connectivity** — USB-C connector, pin headers, SWD debug header.
- **User interface** — a power LED, the user LED on **PC13**, the **KEY** button on **PA0**, and NRST/BOOT0 buttons.

> [!analogy]
> The Arduino Uno slide puts it well: the microcontroller is the **brain**, the development board is the **body**.

## Basic structure of an embedded system

::diagram{es-block}

The lecture lists the building blocks (Day02 slide 15):

- **Memory devices** for data and program storage.
- **I/O devices** for input and output.
- **Buses** carrying data between hardware blocks.
- **Sensors** converting physical data (temperature, light, motion) into analog electrical signals.
- **ADC** converting those analog signals into digital numbers the processor can read.
- **DAC** converting digital values back into analog signals.
- **Actuators** making mechanisms move based on the processor's output (e.g. a motor).
- **Peripherals** such as cameras, printers, keyboards.

## Worked example: a wearable health monitor (Aug 2025 PYQ)

| Block | Component in a fitness band | Function |
|---|---|---|
| Processor | Low-power Cortex-M MCU | Runs the firmware: filters sensor data, computes heart rate, step count |
| Memory | Flash + SRAM | Flash stores firmware; SRAM holds samples and variables |
| Sensors | PPG optical heart-rate sensor, accelerometer, temperature | Convert body signals to electrical signals |
| ADC | On-chip ADC | Digitises the PPG photodiode signal |
| Actuators / outputs | Vibration motor, OLED display, LEDs | Alerts and display |
| Communication | Bluetooth Low Energy, I²C/SPI to sensors | Sends data to the phone; reads digital sensors |
| Power | Li-ion battery + regulator, sleep modes | Days of battery life |

## The software side

- **Firmware** is the program stored in Flash. It starts executing from the reset vector every time the chip powers up.
- Small systems run **bare-metal**: «main()» initialises the hardware and then loops forever («while(1)»). There is no operating system to return to.
- Larger systems may use a **real-time operating system (RTOS)** such as FreeRTOS to run several tasks with guaranteed timing.

~~~c Every lab program has this shape
#include "stm32f4xx.h"
int main(void) {
    /* 1. initialise: clocks, GPIO modes, peripherals */
    while (1) {
        /* 2. read inputs → decide → drive outputs, forever */
    }
}
~~~

> [!source] Digital camera example (Day02 slide 23)
> A digital camera combines a CCD/CMOS image sensor, a pre-processor, a JPEG codec, memory, a display controller, a microcontroller and a UART/USB interface — one product, several cooperating embedded processors.
`,
  visual: md`
Trace a signal through the system: a sensor value enters on the left, is digitised, processed and leaves as an actuator command on the right.

::diagram{es-block}

::diagram{kit-pinout}

The board diagram on the dashboard is interactive: hover each peripheral to see which STM32 block it uses.
`,
  exam: {
    definitions: [
      { term: 'Embedded system', def: 'A microprocessor- or microcontroller-based computer system with software designed to perform a dedicated function, independently or as part of a larger system.' },
      { term: 'Microcontroller', def: 'A single-chip computer containing a CPU, program memory (Flash), data memory (SRAM) and peripherals such as GPIO, timers, ADC and serial interfaces.' },
      { term: 'Firmware', def: 'The program permanently stored in the non-volatile memory of an embedded system.' },
      { term: 'Sensor', def: 'A device that converts a physical quantity into an electrical signal.' },
      { term: 'Actuator', def: 'A device that converts an electrical signal from the processor into physical action (motion, light, sound).' },
    ],
    frequent: [
      'Define an embedded system and draw its basic architecture (Aug 2025: 4 marks, wearable context).',
      'Explain the function of processor, memory, sensors, actuators and communication interfaces in a given product.',
      'Components inside a microcontroller vs components on the development board.',
    ],
    mistakes: [
      'Drawing a PC block diagram (keyboard, monitor, hard disk) instead of sensors → ADC → processor → DAC → actuators.',
      'Forgetting the ADC/DAC between analog sensors/actuators and the digital processor.',
      'Saying embedded systems "have no software" — they always run firmware.',
      'Explaining blocks generically when the question gives a context (wearable, washing machine) — always map each block to the product.',
    ],
    diagrams: ['Basic structure of an embedded system (input chain, processor + memory, output chain, communication, power)'],
    shortQs: [
      { q: 'Define an embedded system. Give two examples.', a: md`An embedded system is a microprocessor/microcontroller-based system with software, designed to perform a **dedicated function** either independently or as part of a larger system. Examples: washing-machine controller, digital blood-pressure monitor, automotive airbag controller.`, marks: 2 },
      { q: 'List the components fabricated inside a microcontroller chip.', a: md`CPU (ALU, control unit, registers), Flash/ROM (program memory), SRAM (data memory), optional EEPROM, clock/oscillator circuit, GPIO ports, timers/counters, communication interfaces (UART, SPI, I²C, USB) and ADC.`, marks: 2 },
      { q: 'Why are an ADC and a DAC needed in many embedded systems?', a: md`Real-world signals (temperature, light, sound) are analog but the processor works only with binary numbers. The **ADC** converts sensor voltages to digital values for processing; the **DAC** converts digital results back into analog voltages to drive analog actuators or audio.`, marks: 2 },
      { q: 'What does the development board provide that the microcontroller chip cannot?', a: md`Power regulation (LDO 5 V → 3.3 V, decoupling capacitors), accurate external crystals, connectors (USB, headers, debug port) and user interface parts (LEDs, push buttons, reset).`, marks: 2 },
    ],
    longQs: [
      {
        q: 'You are a junior engineer at a company making smart wearable health devices. Draw the basic architecture of an embedded system and explain the function of each major component (processor, memory, sensors, actuators, communication interfaces) in the context of a wearable health monitor. [Aug 2025 PYQ style]',
        a: md`**Definition:** an embedded system is a microcontroller-based system with dedicated software that performs a specific function — here, continuous health monitoring.

**Diagram:** sensors → signal conditioning → ADC → processor (with Flash/SRAM, clock) → DAC/drivers → actuators/display; communication block to the phone; battery/power block.

**Blocks in the wearable:**
- **Processor (low-power MCU, e.g. Cortex-M4):** runs firmware that filters PPG samples, computes heart rate/SpO₂/steps, decides when to alert; DSP instructions help with filtering.
- **Memory:** Flash stores the firmware permanently; SRAM holds samples, buffers and the stack.
- **Sensors:** optical PPG (heart rate), accelerometer (steps, falls), skin-temperature sensor.
- **ADC:** converts the analog photodiode/temperature voltages into numbers.
- **Actuators/outputs:** vibration motor for alerts, OLED display, LEDs for the optical sensor.
- **Communication:** BLE to send data to the phone app; I²C/SPI to read digital sensors.
- **Power:** small Li-ion battery, regulator; sleep modes keep the device running for days.

**Conclusion:** each block is chosen for the single dedicated job, minimising size, cost and power — the defining traits of an embedded system.`,
        marks: 6,
      },
      {
        q: 'Explain the components inside a microcontroller and the supporting components on a microcontroller development board, using the STM32F401 Black Pill as an example.',
        a: md`**On the chip:** CPU (Cortex-M4F with ALU, registers, SP, PC); Flash 256 KB (program); SRAM 64 KB (data); clock (16 MHz HSI); peripherals — GPIO ports, timers (SysTick, TIMx), 12-bit ADC, USART, I²C, SPI, USB.
**On the board:** 3.3 V LDO regulator and decoupling capacitors; 25 MHz and 32.768 kHz crystals; USB-C connector, pin headers, SWD header; user LED (PC13), KEY (PA0), NRST and BOOT0 buttons.
**Why the split:** the chip holds everything needed to compute; the board makes it safe to power, accurate to clock and easy to connect — the "brain and body" analogy from the lecture.`,
        marks: 6,
      },
    ],
  },
  revision: {
    notes: [
      'Embedded system = hardware + software for a **dedicated** function, standalone or inside a bigger system.',
      'MCU chip = CPU + Flash (program) + SRAM (data) + clock + GPIO + timers + ADC + serial interfaces.',
      'Board adds power regulation, crystals, connectors, LEDs and buttons.',
      'Structure: sensors → ADC → processor ⇄ memory → DAC → actuators, plus communication and power.',
      'Firmware lives in Flash and runs a «while(1)» super-loop (bare-metal) or an RTOS.',
    ],
    takeaways: ['“Dedicated function” is the key word in every definition.', 'Always map blocks to the product named in the question.', 'Draw the ADC and DAC explicitly.'],
    mcqs: [
      { q: 'Which memory stores the firmware of a microcontroller?', options: ['SRAM', 'Flash', 'CPU registers', 'Cache'], answer: 1, explain: 'Flash is non-volatile, so the program survives power-off. SRAM holds variables.' },
      { q: 'A temperature sensor produces 0.75 V. Which block makes this usable by the CPU?', options: ['DAC', 'ADC', 'UART', 'Actuator'], answer: 1, explain: 'The analog-to-digital converter turns the voltage into a binary number.' },
      { q: 'Which is NOT normally part of the microcontroller chip itself?', options: ['GPIO ports', 'Timers', 'Voltage regulator (LDO) for USB 5 V', 'ADC'], answer: 2, explain: 'The LDO that steps 5 V down to 3.3 V sits on the development board.' },
      { q: 'An actuator is a device that…', options: ['converts physical quantities to electrical signals', 'converts electrical signals into physical action', 'stores firmware', 'generates the system clock'], answer: 1, explain: 'Motors, valves, buzzers and LEDs act on the world; sensors do the opposite.' },
      { q: 'Typical structure of a bare-metal embedded program:', options: ['main() runs once and returns to the OS', 'Initialise, then loop forever in while(1)', 'Only interrupt handlers, no main()', 'A command-line menu'], answer: 1, explain: 'There is no OS to return to, so main() initialises the hardware and then loops forever.' },
    ],
  },
};

export default topic;
