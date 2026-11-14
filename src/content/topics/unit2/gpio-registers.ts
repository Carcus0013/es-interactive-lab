import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'gpio-registers',
  unit: 2,
  order: 2,
  title: 'GPIO configuration registers',
  short: 'MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR, LCKR and AFRL/AFRH — what each register does and how to compute the bit positions for any pin.',
  status: 'course',
  sources: [
    { file: 'Day05_Lecture01_GPIO_Configuration_Registers.pptx', detail: 'slides 5–34' },
    { file: 'STM32_Register_Level_Programming.docx', detail: 'register descriptions, reset values, BSRR, LCKR' },
    { file: 'rm0368', detail: '§8.4 GPIO registers' },
  ],
  keywords: ['GPIO', 'MODER', 'OTYPER', 'OSPEEDR', 'PUPDR', 'IDR', 'ODR', 'BSRR', 'LCKR', 'AFRL', 'AFRH', 'alternate function', 'analog', 'push-pull', 'open-drain', 'reset value'],
  importance: 3,
  practicals: ['p01-led-on', 'p03-button-led', 'p04-switch-led'],
  sims: ['gpio', 'bits'],
  related: ['bit-manipulation', 'pull-resistors', 'leds-switches', 'stm32-board'],
  fundamentals: {
    what: md`**GPIO** (General-Purpose Input/Output) pins are the simplest peripheral: each pin can be a digital input, a digital output, an alternate function (connected to a peripheral such as USART or I²C) or an analog pin (ADC). Each port (A, B, C…) has 16 pins and a set of 32-bit registers that configure and read/write them.`,
    why: md`Every pin on the chip can do several jobs. Software must tell the hardware which job each pin does, how it drives its output, whether it needs a pull resistor, and then read or write its level.`,
    problem: md`Configuration registers turn one flexible pin into exactly the interface the circuit needs (LED driver, switch input, ADC input, UART line); data registers let the program read sensors and control actuators with simple memory writes.`,
    how: md`Four **configuration** registers (MODER, OTYPER, OSPEEDR, PUPDR), two **data** registers (IDR, ODR), one **set/reset** register (BSRR), one **lock** register (LCKR) and two **alternate-function** registers (AFRL, AFRH). Fields are 2 bits per pin (MODER, OSPEEDR, PUPDR), 1 bit per pin (OTYPER, IDR, ODR) or 4 bits per pin (AFR).`,
    where: md`Every lab: PC13/PC14/PB9 as outputs, PA0/PA6/PB10 as inputs with pull-ups, PA0/PA1 as analog for the ADC, PA2/PA3 as AF7 for USART2, PB6/PB7 as AF4 open-drain for I²C.`,
  },
  detailed: md`
## The register set (Day05 L01 slide 6)

| Offset | Register | Bits per pin | Purpose |
|---|---|---|---|
| 0x00 | **MODER** | 2 | Mode: 00 input, 01 output, 10 alternate function, 11 analog |
| 0x04 | **OTYPER** | 1 | Output type: 0 push-pull, 1 open-drain |
| 0x08 | **OSPEEDR** | 2 | Output speed (slew rate): 00 low, 01 medium, 10 fast, 11 high |
| 0x0C | **PUPDR** | 2 | 00 none, 01 pull-up, 10 pull-down, 11 reserved |
| 0x10 | **IDR** | 1 | Input data: actual level of each pin (read-only) |
| 0x14 | **ODR** | 1 | Output data: level driven on output pins |
| 0x18 | **BSRR** | 1 + 1 | Bit set (bits 15:0) / reset (bits 31:16), write-only, atomic |
| 0x1C | **LCKR** | 1 + key | Locks the configuration until reset |
| 0x20 | **AFRL** (AFR[0]) | 4 | Alternate function for pins 0–7 |
| 0x24 | **AFRH** (AFR[1]) | 4 | Alternate function for pins 8–15 |

Port bases: GPIOA 0x4002 0000, GPIOB 0x4002 0400, GPIOC 0x4002 0800 (each block 0x400 apart).

::diagram{gpio-pin}

## Finding the bits for pin n

| Register | Field position | PC13 | PB9 | PA6 |
|---|---|---|---|---|
| MODER, OSPEEDR, PUPDR | bits **2n+1 : 2n** | 27:26 | 19:18 | 13:12 |
| OTYPER, IDR, ODR | bit **n** | 13 | 9 | 6 |
| BSRR set / reset | bit **n** / bit **n+16** | 13 / 29 | 9 / 25 | 6 / 22 |
| AFRL/AFRH | bits **4(n mod 8)+3 : 4(n mod 8)** in AFR[n/8] | AFR[1] 23:20 | AFR[1] 7:4 | AFR[0] 27:24 |

## MODER (Day05 L01 slides 12–15)

~~~c
GPIOA->MODER |= (1U << 10);   // PA5 output: bit 10 = 1 (bit 11 is 0 after reset)
GPIOC->MODER |= (1U << 26);   // PC13 output (01)
// PA0 input: MODER0 = 00 — the reset value, or clear explicitly:
GPIOA->MODER &= ~(3U << 0);
GPIOA->MODER |= (3U << 0);    // PA0 analog (11) for the ADC
~~~

**Reset values** (Register-Level doc): GPIOA_MODER = 0xA800 0000 (PA13, PA14, PA15 in AF mode for SWD/JTAG), GPIOB_MODER = 0x0000 0280 (PB3, PB4 for JTAG), others 0. That is why «|= (1U<<26)» alone works for PC13 but robust code clears both bits first — and why you must **never** set PA13/PA14 to output, or you lose the debugger.

## OTYPER (slide 17)

| | Push-pull (0) | Open-drain (1) |
|---|---|---|
| Drives | both HIGH (P-MOS) and LOW (N-MOS) | only LOW; HIGH needs a pull-up |
| Pin states | LOW (GND), HIGH (V_DD) | LOW, floating (high impedance) |
| Use | LEDs, logic signals | I²C, shared interrupt lines, wired-AND buses |

::diagram{pushpull-od}

## OSPEEDR

Controls how fast the output edges switch (slew rate), not the logic level. Faster edges allow higher frequencies but cause more EMI and ringing; LEDs need only low speed. The I²C lab sets PB6/PB7 to high speed.

## PUPDR (slides 25–28)

Pull-up (01) gives a defined HIGH when nothing drives the pin; pull-down (10) a defined LOW. Used on inputs to stop floating, on buttons, and on I²C lines.

~~~c
GPIOA->PUPDR |= 0x00000001;   // PA0 pull-up (01) — lecture slide 28
~~~

## IDR and ODR (slides 22–24, 29–31)

~~~c
if (GPIOA->IDR & (1U << 0)) { ... }   // read PA0: non-zero if the pin is HIGH
GPIOA->ODR |=  (1U << 5);              // PA5 HIGH
GPIOA->ODR &= ~(1U << 5);              // PA5 LOW
GPIOC->ODR |=  (1U << 13);             // PC13 HIGH → on-board LED OFF
GPIOC->ODR &= ~(1U << 13);             // PC13 LOW  → on-board LED ON
~~~

> [!warning] Error in the supplied notes
> «STM32_Register_Level_Programming.docx» lists IDR/ODR bit values as “0 = High logic, 1 = Low logic”. That is wrong: in IDR and ODR, **1 = HIGH** and **0 = LOW** (RM0368 §8.4.5–8.4.6).

## BSRR — atomic set/reset (slides 33–34)

~~~c
GPIOC->BSRR = 0x00002000;   // bit 13 (BS13) → PC13 HIGH → LED OFF
GPIOC->BSRR = 0x20000000;   // bit 29 (BR13) → PC13 LOW  → LED ON
~~~

Writing BSRR is a single store, so it cannot be interrupted half-way, and writing 0 to a bit has no effect — plain assignment is safe. If both BS and BR are 1 for a pin, **set wins**. Reading BSRR returns 0.

## LCKR

Locks a pin's configuration (MODER, OTYPER, OSPEEDR, PUPDR, AFR) until the next reset. Lock sequence: write LCKK = 1 with the pin mask, then LCKK = 0, then LCKK = 1, then read LCKR (and read LCKK = 1 to confirm). Used in safety-critical code to prevent accidental reconfiguration.

## AFRL/AFRH — alternate functions

When MODER = 10, AFR selects which peripheral drives the pin (AF0–AF15). Lab values: **USART2** on PA2/PA3 = **AF7**; **I2C1** on PB6/PB7 = **AF4**.

~~~c UART lab: PA2 = AF7 (0111) in AFRL bits 11:8
GPIOA->AFR[0] &= ~(1 << 11);
GPIOA->AFR[0] |=  (1 << 10) | (1 << 9) | (1 << 8);
~~~
`,
  visual: md`
Configure any kit pin, switch it between input/output/analog, toggle pull resistors and watch MODER, PUPDR, ODR and IDR bits change:

::sim{gpio}

::diagram{gpio-pin}
`,
  exam: {
    definitions: [
      { term: 'GPIOx_MODER', def: '32-bit register with 2 bits per pin selecting input (00), output (01), alternate function (10) or analog (11).' },
      { term: 'GPIOx_ODR', def: 'Output data register; bit n sets the level driven on pin n when it is an output.' },
      { term: 'GPIOx_IDR', def: 'Read-only input data register reflecting the current logic level of each pin.' },
      { term: 'GPIOx_BSRR', def: 'Write-only bit set/reset register: bits 0–15 set ODR bits, bits 16–31 reset them, atomically.' },
      { term: 'Alternate function', def: 'Mode in which a pin is driven by an on-chip peripheral (USART, I²C, SPI, timer) selected through AFRL/AFRH.' },
    ],
    formulas: [
      { name: 'MODER/PUPDR/OSPEEDR field', expr: 'bits (2n + 1) : 2n for pin n', example: 'PC13 → bits 27:26' },
      { name: 'BSRR reset bit', expr: 'reset bit = n + 16', example: 'PC13 → bit 29 → 0x2000 0000' },
      { name: 'AFR field', expr: 'AFR[n / 8], bits 4(n mod 8) + 3 : 4(n mod 8)', example: 'PA2 → AFR[0] bits 11:8' },
    ],
    frequent: ['Explain each GPIO configuration register.', 'Write register-level code to configure a pin as input/output (Part B every paper).', 'Bit position of MODER for a given pin.', 'Push-pull vs open-drain.', 'ODR vs BSRR.'],
    mistakes: ['Using bit n instead of 2n for MODER/PUPDR.', 'Setting only one MODER bit without clearing the other.', 'Writing to IDR.', 'Configuring PA13/PA14 as GPIO and losing the debugger.', 'Thinking OSPEEDR changes the voltage level.'],
    diagrams: ['GPIO pin structure', 'MODER bit-pair layout for pins 0–15', 'Push-pull vs open-drain output stage'],
    shortQs: [
      { q: 'Write the MODER statements to make PB9 an output and PA1 an analog input.', a: md`«GPIOB->MODER &= ~(3U<<18); GPIOB->MODER \|= (1U<<18);» and «GPIOA->MODER \|= (3U<<2);».`, marks: 2 },
      { q: 'What is the advantage of BSRR over ODR for changing a pin?', a: md`BSRR changes a pin with a single write (atomic), so an interrupt cannot corrupt other bits in between; writing 0s has no effect so no read-modify-write is needed.`, marks: 2 },
      { q: 'When would you configure a pin as open-drain?', a: md`When several devices share a line (I²C SDA/SCL, wired-OR interrupt lines) or when an external pull-up to another voltage is needed; the pin only pulls low, the resistor pulls high.`, marks: 2 },
      { q: 'What are the reset values of GPIOA_MODER and GPIOB_MODER and why?', a: md`GPIOA_MODER = 0xA800 0000 (PA13–PA15 in AF mode for SWD/JTAG); GPIOB_MODER = 0x0000 0280 (PB3, PB4 debug pins). Other ports reset to 0 (inputs).`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the GPIO configuration and data registers of the STM32F401 with code examples.', a: md`Table of all registers with offsets and meanings; bit-position rules; code for MODER (output/input/analog), OTYPER, OSPEEDR, PUPDR, IDR test, ODR set/clear, BSRR set/reset, AFR for USART2; reset values; push-pull vs open-drain diagram.`, marks: 8 },
      { q: 'Write register-level code to configure PB10 as input with pull-up, PC14 as push-pull output, and turn PC14 ON while PB10 is pressed.', a: md`~~~c
RCC->AHB1ENR |= (1U<<1) | (1U<<2);
GPIOB->MODER &= ~(3U<<20);
GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U<<20)) | (1U<<20);
GPIOC->MODER = (GPIOC->MODER & ~(3U<<28)) | (1U<<28);
GPIOC->OTYPER &= ~(1U<<14);
while (1) {
    if (GPIOB->IDR & (1U<<10)) GPIOC->ODR &= ~(1U<<14);  // released
    else                       GPIOC->ODR |=  (1U<<14);  // pressed → ON
}
~~~
Explain each register, the 2n rule (20 = 2×10, 28 = 2×14) and the pull-up logic.`, marks: 6 },
    ],
  },
  revision: {
    notes: [
      'Offsets: MODER 0x00, OTYPER 0x04, OSPEEDR 0x08, PUPDR 0x0C, IDR 0x10, ODR 0x14, BSRR 0x18, LCKR 0x1C, AFRL 0x20, AFRH 0x24.',
      'MODER: 00 in, 01 out, 10 AF, 11 analog — bits 2n+1:2n.',
      'PUPDR: 00 none, 01 up, 10 down.',
      'OTYPER: 0 push-pull, 1 open-drain.',
      'BSRR: bit n sets, bit n+16 resets; atomic; set wins.',
      'AF7 = USART2 (PA2/PA3); AF4 = I2C1 (PB6/PB7).',
    ],
    takeaways: ['2n for 2-bit fields, n for 1-bit fields, n+16 for BSRR reset.', 'Clear the field, then set it.', 'Don’t touch PA13/PA14.'],
    mcqs: [
      { q: 'MODER value for analog mode:', options: ['00', '01', '10', '11'], answer: 3, explain: '11 = analog.' },
      { q: 'Which bits of GPIOC_MODER configure PC14?', options: ['14 and 15', '28 and 29', '26 and 27', '7 and 8'], answer: 1, explain: '2 × 14 = 28 → bits 29:28.' },
      { q: 'GPIOC->BSRR = (1U << 29); does what?', options: ['Sets PC13', 'Resets PC13', 'Sets PC29', 'Locks PC13'], answer: 1, explain: 'Bit 29 = BR13 (13 + 16).' },
      { q: 'Which register shows the actual level of an input pin?', options: ['ODR', 'IDR', 'MODER', 'PUPDR'], answer: 1, explain: 'Input data register.' },
      { q: 'Alternate function number for USART2 on PA2:', options: ['AF4', 'AF5', 'AF7', 'AF0'], answer: 2, explain: 'AF7 (UART lab).' },
    ],
  },
};

export default topic;
