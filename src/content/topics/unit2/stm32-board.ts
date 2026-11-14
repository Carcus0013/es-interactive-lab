import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'stm32-board',
  unit: 2,
  order: 1,
  title: 'STM32F401CCU6, the Black Pill and clock gating (RCC)',
  short: 'The microcontroller used in every lab, the kit pin map, the Keil/CMSIS workflow, and why the first line of every program enables a clock in RCC.',
  status: 'course',
  sources: [
    { file: 'STM32F401CCU6_Intro_GPIO.pptx', detail: 'slides 1–14 (features, PC13 driver)' },
    { file: 'Day05_Lecture01_GPIO_Configuration_Registers.pptx', detail: 'slides 4–11 (RCC, AHB1ENR)' },
    { file: 'Emb-kit Manual.docx', detail: 'kit pin map and sample programs' },
    { file: 'stm32f401cc.pdf (datasheet)', detail: 'pinout, PC13–PC15 current limit' },
  ],
  keywords: ['STM32F401CCU6', 'Black Pill', 'WeAct', 'RCC', 'AHB1ENR', 'APB1ENR', 'APB2ENR', 'clock gating', 'HSI', '16 MHz', 'Keil', 'CMSIS', 'stm32f4xx.h', 'kit pins'],
  importance: 2,
  practicals: ['p01-led-on'],
  sims: ['gpio'],
  related: ['gpio-registers', 'memory-map', 'leds-switches'],
  fundamentals: {
    what: md`The **STM32F401CCU6** is ST's microcontroller built around an Arm Cortex-M4F core: 84 MHz max, 256 KB Flash, 64 KB SRAM, GPIO ports A–E and H, a 12-bit ADC, timers, USART, I²C, SPI and USB. Your lab uses it on the WeAct **Black Pill** board plus an extension board with LEDs, switches, a potentiometer and an LDR. **RCC** (Reset and Clock Control) supplies and gates the clocks of every peripheral.`,
    why: md`To save power, every peripheral's clock is **off after reset**. A peripheral without a clock ignores register writes — so the first step of every program is to enable the clock of each peripheral you use.`,
    problem: md`Clock gating lets the chip consume power only in the blocks the application needs; RCC also chooses the system clock source and divides it for the buses.`,
    how: md`Each bus has an enable register: **RCC_AHB1ENR** (GPIO ports, DMA), **RCC_APB1ENR** (USART2, I2C1, TIM2–5) and **RCC_APB2ENR** (ADC1, SYSCFG, USART1). Setting bit n with «|=» starts that peripheral's clock. All lab programs run from the 16 MHz internal **HSI** oscillator (no PLL setup).`,
    where: md`«RCC->AHB1ENR |= (1U<<2);» is the first line of the LED program; «RCC->APB2ENR |= (1<<8);» enables ADC1; «RCC->APB1ENR |= (1<<17);» enables USART2.`,
  },
  detailed: md`
## STM32F401CCU6 at a glance

| Feature | Value |
|---|---|
| Core | Arm Cortex-M4 with FPU (Cortex-M4F), up to 84 MHz |
| Memory | 256 KB Flash, 64 KB SRAM |
| Package | UFQFPN48 — the “U6” suffix |
| GPIO | Ports A–E and H (F/G/I/J/K not available) |
| Analog | One 12-bit ADC (ADC1), up to 16 external channels; **no DAC** |
| Timers | SysTick, TIM1–TIM5, TIM9–TIM11 |
| Communication | USART1/2/6, I2C1–3, SPI1–4, USB OTG FS |
| Other | DMA1/2, RTC, CRC unit, NVIC, EXTI |

> [!source] STM32F401CCU6_Intro_GPIO slide 5 lists the blocks you will use: Cortex-M4 with FPU, MPU, Flash, CRC unit, SRAM, multi-AHB bus matrix, DMA, NVIC, EXTI, clocks and start-up, GPIOs, ADC, temperature sensor, SWJ-DP, ETM.

## The lab kit (Emb-kit Manual)

::diagram{kit-pinout}

| Function | Pin | Notes |
|---|---|---|
| USER LED (on board) | **PC13** | **Active-low**: LED cathode connected to PC13 — write 0 to turn ON |
| LED1 (extension) | **PC14** | Active-high |
| LED2 (extension) | **PB9** | Active-high |
| Switch S1 | **PB10** | Pressed = connects pin to GND |
| Switch S2 | **PA6** | Pressed = GND |
| USER KEY (on board) | **PA0** | Pressed = GND (shares PA0 with the potentiometer) |
| Potentiometer | **PA0** | ADC1 channel 0 |
| LDR | **PA1** | ADC1 channel 1 |
| USART2 | PA2 (TX), PA3 (RX) | AF7, to a USB-TTL adapter |
| I2C1 | PB6 (SCL), PB7 (SDA) | AF4, to the LCD backpack |

> [!warning] PC13–PC15 are weak pins
> The datasheet notes that PC13, PC14 and PC15 are supplied through the backup-domain power switch, which can only sink about **3 mA**; they must not be used as a current source for an LED and should run at ≤ 2 MHz. That is why the board LED on PC13 is wired **active-low** (the pin sinks current).

## RCC — Reset and Clock Control (Day05 L01 slide 8)

- **Clock configuration:** selects SYSCLK from HSI (16 MHz RC), HSE (external crystal) or PLL.
- **Clock enable/disable:** enables clocks of AHB1, AHB2, APB1, APB2 peripherals.
- **Clock dividers:** different speeds for the core and buses (APB1 ≤ 42 MHz, APB2 ≤ 84 MHz).
- **Reset control:** resets peripherals for proper initialisation.
- **Clock security system:** switches to a safe source if the HSE fails.

### RCC_AHB1ENR (0x4002 3830)

| Bit | 7 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|
| Name | GPIOHEN | GPIOEEN | GPIODEN | **GPIOCEN** | **GPIOBEN** | **GPIOAEN** |

~~~c Day05 L01 slides 10–11
RCC->AHB1ENR |= (1U << 0);   /* 1. Enable GPIOA clock: write 1 to bit 0 of AHB1ENR */
RCC->AHB1ENR |= (1U << 2);   /* 2. Enable GPIOC clock: write 1 to bit 2 of AHB1ENR */
~~~

Other enable bits used in the labs: **APB2ENR** bit 8 = ADC1, bit 14 = SYSCFG; **APB1ENR** bit 17 = USART2, bit 21 = I2C1.

> [!tip] Why «|=» and not «=»?
> «RCC->AHB1ENR = (1U<<2);» would switch GPIOC on but switch **every other** AHB1 clock off — including ports another part of the program already uses.

## The development workflow

1. Keil µVision 5 project for STM32F401CCUx with CMSIS and device startup selected.
2. «#include "stm32f4xx.h"» — CMSIS device header: defines «RCC», «GPIOA», «ADC1», «USART2» … as pointers to register structs.
3. Build (F7) → Download (F8) over ST-Link/SWD → press reset; or Debug (Ctrl+F5) to step and watch registers.
4. The startup file runs «SystemInit()» (HSI 16 MHz by default) then «main()».

## The minimal driver: turn on the PC13 LED (Intro_GPIO slides 8–12)

| Step | Register | Code |
|---|---|---|
| 1. Enable GPIOC clock | RCC_AHB1ENR bit 2 | «RCC->AHB1ENR \|= (1U<<2);» |
| 2. PC13 as output | GPIOC_MODER bits 27:26 = 01 | «GPIOC->MODER \|= (1U<<26);» |
| 3. Drive PC13 low | GPIOC_ODR bit 13 = 0 | «GPIOC->ODR &= ~(1U<<13);» |
`,
  visual: md`
Try the classic bug: configure PC13 as output and clear ODR13 **before** enabling the GPIOC clock — nothing happens. Then enable the clock and repeat.

::sim{gpio preset=manual}

::diagram{kit-pinout}
`,
  exam: {
    definitions: [
      { term: 'RCC', def: 'Reset and Clock Control: the STM32 block that selects clock sources, sets bus dividers, and enables/resets each peripheral.' },
      { term: 'Clock gating', def: 'Switching a peripheral’s clock off when unused to save power; the peripheral cannot work until its clock is enabled.' },
      { term: 'HSI', def: 'High-speed internal 16 MHz RC oscillator; the default system clock after reset, used by all lab programs.' },
      { term: 'CMSIS', def: 'Cortex Microcontroller Software Interface Standard: vendor headers and core functions (e.g. stm32f4xx.h, NVIC_EnableIRQ).' },
    ],
    frequent: ['Pin assignments of the kit (every Part-B question).', 'Why RCC must be enabled first.', 'Which RCC register and bit enables GPIOx / ADC1 / USART2.'],
    mistakes: ['Forgetting to enable the GPIO clock (LED never lights).', 'Enabling ADC1 in AHB1ENR instead of APB2ENR.', 'Using «=» on RCC registers and turning off other peripherals.', 'Driving the PC13 LED high to turn it on (it is active-low).'],
    diagrams: ['Kit pin map', 'RCC_AHB1ENR bit layout'],
    shortQs: [
      { q: 'Why must RCC->AHB1ENR be configured before GPIO registers?', a: md`After reset the GPIO port clocks are off to save power; a port without a clock ignores register writes. Setting the port’s bit in RCC_AHB1ENR starts its clock so MODER/ODR writes take effect.`, marks: 2 },
      { q: 'Write the statements to enable clocks for GPIOA, GPIOB and GPIOC.', a: md`«RCC->AHB1ENR \|= (1U<<0) \| (1U<<1) \| (1U<<2);» (bits 0, 1, 2).`, marks: 2 },
      { q: 'Why is the PC13 LED active-low?', a: md`PC13–PC15 can only sink about 3 mA and must not source current to an LED, so the LED is connected from 3.3 V through a resistor to PC13; driving PC13 low lets current flow and lights it.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the role of the RCC in the STM32F401 and write the register-level code to turn ON the on-board LED at PC13.', a: md`RCC functions (clock source selection, enables for AHB1/APB1/APB2, dividers, resets, CSS; power saving). Steps with registers: AHB1ENR bit 2; MODER bits 27:26 = 01; ODR bit 13 = 0 (active-low). Code with comments; explain each line.`, marks: 6 },
      { q: 'Describe the STM32F401CCU6 and the lab kit used in your course, with a table of pin connections.', a: md`Core/memory/peripheral summary; kit table (PC13, PC14, PB9, PB10, PA6, PA0, PA1, PA2/PA3, PB6/PB7) with active-low/high and ADC channels; HSI 16 MHz default; Keil + CMSIS workflow.`, marks: 6 },
    ],
  },
  revision: {
    notes: [
      'STM32F401CCU6: Cortex-M4F, 84 MHz, 256 KB Flash, 64 KB SRAM, 12-bit ADC, no DAC.',
      'Kit: PC13 user LED (active-low), PC14 & PB9 LEDs (active-high), PB10 S1, PA6 S2, PA0 key/pot (ch0), PA1 LDR (ch1).',
      'RCC_AHB1ENR: bit0 GPIOA, bit1 GPIOB, bit2 GPIOC. APB2ENR: bit8 ADC1, bit14 SYSCFG. APB1ENR: bit17 USART2, bit21 I2C1.',
      'Labs run on HSI = 16 MHz.',
      'Always |= on RCC registers.',
    ],
    takeaways: ['Clock first, then configure, then use.', 'PC13 LED ON = write 0.'],
    mcqs: [
      { q: 'Which register enables the clock for GPIOC?', options: ['RCC_APB1ENR', 'RCC_AHB1ENR', 'RCC_APB2ENR', 'GPIOC_MODER'], answer: 1, explain: 'GPIO ports are on AHB1; GPIOC = bit 2.' },
      { q: 'ADC1 clock enable is in…', options: ['AHB1ENR bit 8', 'APB2ENR bit 8', 'APB1ENR bit 17', 'APB2ENR bit 14'], answer: 1, explain: 'ADC1 is on APB2.' },
      { q: 'Default system clock used in the lab programs:', options: ['84 MHz PLL', '25 MHz HSE', '16 MHz HSI', '32.768 kHz LSE'], answer: 2, explain: 'No PLL configuration is done, so SYSCLK = HSI.' },
      { q: 'Which kit pin is the LDR on?', options: ['PA0', 'PA1', 'PA6', 'PB10'], answer: 1, explain: 'LDR on PA1, ADC channel 1.' },
      { q: 'What does RCC->AHB1ENR = (1U<<2) do that |= would not?', options: ['Nothing different', 'Turns off all other AHB1 clocks', 'Resets the MCU', 'Sets PC2'], answer: 1, explain: 'Assignment clears every other bit.' },
    ],
  },
};

export default topic;
