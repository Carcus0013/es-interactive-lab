/**
 * GENERATED PRACTICE QUESTIONS — debugging, register-based, circuit-based and programming.
 * Self-marked against the model answer. None of these is a PYQ.
 */
import type { BankItem } from '../../types';
import { md } from '../md';

type Item = Omit<BankItem, 'generated' | 'answer'>;

const debug: Item[] = [
  {
    id: 'dbg-pc13-polarity', type: 'debug', unit: 2, topic: 'leds-switches', difficulty: 'easy', marks: 2,
    q: md`This code should turn the Black Pill's on-board LED **on**, but the LED stays off. Find the bug.
~~~c
RCC->AHB1ENR |= (1U << 2);
GPIOC->MODER = (GPIOC->MODER & ~(3U << 26)) | (1U << 26);
GPIOC->ODR |= (1U << 13);
~~~`,
    explain: md`The PC13 LED is **active-low** (wired from 3.3 V to the pin). Setting ODR13 = 1 turns it **off**. Fix: «GPIOC->ODR &= ~(1U << 13);» (or «GPIOC->BSRR = (1U << (13 + 16));»).`,
  },
  {
    id: 'dbg-no-clock', type: 'debug', unit: 2, topic: 'gpio-registers', difficulty: 'easy', marks: 2,
    q: md`The LED on PB9 never lights. What is missing?
~~~c
GPIOB->MODER |= (1U << 18);
GPIOB->ODR   |= (1U << 9);
~~~`,
    explain: md`The **GPIOB clock** is never enabled, so writes to its registers are ignored. Add «RCC->AHB1ENR |= (1U << 1);» before configuring the port. (Also clear bit 19 first so MODER9 is exactly 01.)`,
  },
  {
    id: 'dbg-moder-shift', type: 'debug', unit: 2, topic: 'gpio-registers', difficulty: 'medium', marks: 3,
    q: md`The programmer wants **PA6 as a general-purpose output** and writes «GPIOA->MODER |= (1U << 13);». The pin does not respond to ODR. Explain and fix.`,
    explain: md`PA6 uses MODER bits **13:12**. Setting only bit 13 gives 10 = **alternate function** mode, so ODR has no effect. Fix:
~~~c
GPIOA->MODER = (GPIOA->MODER & ~(3U << 12)) | (1U << 12);   /* 01 = output */
~~~`,
  },
  {
    id: 'dbg-or-zero', type: 'debug', unit: 2, topic: 'bit-manipulation', difficulty: 'medium', marks: 2,
    q: md`A lab sheet clears the PA6 pull settings with «GPIOA->PUPDR |= (0U << 12);». Does it work?`,
    explain: md`No — «0U << 12» is 0 and OR-ing 0 changes nothing: it is a **no-op**. To clear bits use AND with an inverted mask: «GPIOA->PUPDR &= ~(3U << 12);».`,
  },
  {
    id: 'dbg-precedence', type: 'debug', unit: 2, topic: 'leds-switches', difficulty: 'medium', marks: 2,
    q: md`This test for “S1 pressed” is never true. Why?
~~~c
if (GPIOB->IDR & (1U << 10) == 0) { ... }
~~~`,
    explain: md`«==» binds tighter than «&», so it is evaluated as «GPIOB->IDR & ((1U << 10) == 0)» = «IDR & 0» = 0. Add parentheses: «if ((GPIOB->IDR & (1U << 10)) == 0)».`,
  },
  {
    id: 'dbg-adc-pin', type: 'debug', unit: 2, topic: 'adc-stm32', difficulty: 'medium', marks: 3,
    q: md`The LDR reading on channel 1 is noisy and wrong. The pin set-up line is «GPIOA->MODER |= (3U << 1);». What is wrong?`,
    explain: md`PA1 uses MODER bits **3:2**, so the shift must be 2: «GPIOA->MODER |= (3U << 2);». The given line sets bits 2 and 1: MODER0 becomes 10 (PA0 alternate function) and MODER1 becomes 01 (**PA1 an output**), so the ADC samples a pin that is being driven by the output buffer instead of an analog input.`,
  },
  {
    id: 'dbg-adc-single', type: 'debug', unit: 2, topic: 'adc-stm32', difficulty: 'medium', marks: 3,
    q: md`The ADC is configured in **single** conversion mode (CONT = 0). SWSTART is set once before the loop. The first value is read correctly, then the program hangs. Why?
~~~c
ADC1->CR2 |= (1U << 30);
while (1) {
    while (!(ADC1->SR & (1U << 1))) { }
    value = ADC1->DR;
}
~~~`,
    explain: md`In single mode each SWSTART produces **one** conversion. After the first DR read EOC is cleared and never set again, so the second wait loops forever. Fix: set SWSTART inside the loop before each wait, or set CONT (bit 1 of CR2) for continuous conversion.`,
  },
  {
    id: 'dbg-systick-load', type: 'debug', unit: 3, topic: 'systick', difficulty: 'easy', marks: 2,
    q: md`A 1 ms delay at 16 MHz uses «SysTick->LOAD = 16000;». The timing is slightly long. Why?`,
    explain: md`The counter counts LOAD, LOAD−1, … 0 — that is **LOAD + 1** clocks. 16000 gives 16 001 clocks. Use «LOAD = 16000 − 1 = 15999».`,
  },
  {
    id: 'dbg-isr-name', type: 'debug', unit: 3, topic: 'systick-interrupt', difficulty: 'medium', marks: 2,
    q: md`TICKINT is set and SysTick is running, but the handler below never runs and the program ends up stuck in an infinite loop in the startup file.
~~~c
void Systick_Handler(void) { ticks++; }
~~~`,
    explain: md`The name must match the vector table exactly: **SysTick_Handler** (capital T). Otherwise the weak default handler (an infinite loop) is used.`,
  },
  {
    id: 'dbg-exti-pr', type: 'debug', unit: 3, topic: 'exti', difficulty: 'hard', marks: 3,
    q: md`An ISR clears its pending bit with «EXTI->PR |= (1U << 6);». Occasionally an interrupt on another EXTI line is lost. Explain.`,
    explain: md`PR is **write-1-to-clear**. «|=» reads PR (which may have other lines pending, e.g. bit 10), ORs bit 6 and writes back — writing 1 to bit 10 clears that pending interrupt too. Use a plain write: «EXTI->PR = (1U << 6);».`,
  },
  {
    id: 'dbg-nvic-missing', type: 'debug', unit: 3, topic: 'nvic', difficulty: 'medium', marks: 3,
    q: md`EXTI6 is configured (SYSCFG_EXTICR2, IMR, FTSR) and the PR bit sets when PA6 is pressed, but «EXTI9_5_IRQHandler» never runs. List two likely causes.`,
    explain: md`1. The interrupt is not enabled in the **NVIC**: «NVIC_EnableIRQ(EXTI9_5_IRQn);».
2. Interrupts are globally masked (PRIMASK = 1, e.g. «__disable_irq()» left active).

(If PR sets, SYSCFG and EXTI are fine — remember the SYSCFG clock, APB2ENR bit 14, is needed for EXTICR to take effect.)`,
  },
  {
    id: 'dbg-uart-baud', type: 'debug', unit: 3, topic: 'uart', difficulty: 'easy', marks: 2,
    q: md`The terminal is set to 9600 8N1 and shows garbage characters. The code uses «USART2->BRR = 0x008B;» with a 16 MHz clock. Explain.`,
    explain: md`0x008B is **115 200 baud** at 16 MHz (8.6875 → 0x8B). Either set the terminal to 115 200 or use «BRR = 0x0683» for 9600.`,
  },
  {
    id: 'dbg-i2c-addr', type: 'debug', unit: 3, topic: 'i2c-stm32', difficulty: 'hard', marks: 3,
    q: md`An I²C LCD program hangs at «while (!(I2C1->SR1 & (1U << 1))) { }» right after sending the address. Give three possible causes.`,
    explain: md`The ADDR flag never sets because the slave does not ACK:
1. **Wrong address** — the PCF8574 7-bit address 0x27 must be sent as 0x4E (shifted left, R/W = 0). Sending 0x27 addresses a non-existent device.
2. **No pull-ups / wiring** — SDA/SCL swapped or no pull-up resistors.
3. **Pins not AF4 open-drain** — PB6/PB7 must be MODER = 10, OTYPER = 1, AFRL = 0100.

Robust code also checks the **AF** (acknowledge failure) flag in SR1 instead of waiting forever.`,
  },
];

const register: Item[] = [
  {
    id: 'reg-pb9-pb10', type: 'register', unit: 2, topic: 'gpio-registers', difficulty: 'easy', marks: 3,
    q: md`Write register statements to make PB9 a push-pull output and PB10 an input with pull-up, without disturbing other pins.`,
    explain: md`~~~c
RCC->AHB1ENR |= (1U << 1);                                     /* GPIOB clock          */
GPIOB->MODER  = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);      /* PB9  = 01 output     */
GPIOB->OTYPER &= ~(1U << 9);                                   /* push-pull            */
GPIOB->MODER &= ~(3U << 20);                                   /* PB10 = 00 input      */
GPIOB->PUPDR  = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);      /* PB10 pull-up (01)    */
~~~`,
  },
  {
    id: 'reg-decode-moder', type: 'register', unit: 2, topic: 'gpio-registers', difficulty: 'medium', marks: 2,
    q: md`GPIOC->MODER reads **0x0400 0000**. Which pins are outputs, and what mode are the others in?`,
    explain: md`0x0400 0000 has only **bit 26** set → MODER13 (bits 27:26) = 01 → **PC13 is an output**. Every other 2-bit field is 00 → all other port C pins are inputs.`,
  },
  {
    id: 'reg-bsrr', type: 'register', unit: 2, topic: 'gpio-registers', difficulty: 'medium', marks: 2,
    q: md`Using BSRR, write one statement that turns PB9 **on** and one that turns it **off**. Why is BSRR preferred in ISRs?`,
    explain: md`«GPIOB->BSRR = (1U << 9);» sets PB9; «GPIOB->BSRR = (1U << (9 + 16));» resets it. BSRR is write-only and each write affects only the bits written as 1, so it is **atomic** — no read-modify-write that an interrupt could corrupt.`,
  },
  {
    id: 'reg-rcc-bits', type: 'register', unit: 2, topic: 'stm32-board', difficulty: 'medium', marks: 4,
    q: md`Give the RCC register and bit that enable the clock of: GPIOA, GPIOC, ADC1, SYSCFG, USART2, I2C1 and TIM2 on the STM32F401.`,
    explain: md`| Peripheral | Register | Bit |
|---|---|---|
| GPIOA | RCC_AHB1ENR | 0 |
| GPIOC | RCC_AHB1ENR | 2 |
| ADC1 | RCC_APB2ENR | 8 |
| SYSCFG | RCC_APB2ENR | 14 |
| USART2 | RCC_APB1ENR | 17 |
| I2C1 | RCC_APB1ENR | 21 |
| TIM2 | RCC_APB1ENR | 0 |`,
  },
  {
    id: 'reg-adc-smp', type: 'register', unit: 2, topic: 'adc-stm32', difficulty: 'medium', marks: 2,
    q: md`Set the sampling time of ADC1 channel 1 to **84 cycles** with one statement that leaves other channels unchanged.`,
    explain: md`Channel 1 uses SMPR2 bits **5:3**; 84 cycles = code **100**.
~~~c
ADC1->SMPR2 = (ADC1->SMPR2 & ~(7U << 3)) | (4U << 3);
~~~
(Codes: 000 = 3, 001 = 15, 010 = 28, 011 = 56, 100 = 84, 101 = 112, 110 = 144, 111 = 480 cycles.)`,
  },
  {
    id: 'reg-systick-ctrl', type: 'register', unit: 3, topic: 'systick', difficulty: 'easy', marks: 2,
    q: md`Explain what «SysTick->CTRL = 7;» does, bit by bit.`,
    explain: md`7 = 0b111:
- bit 0 **ENABLE** = 1 → counter runs
- bit 1 **TICKINT** = 1 → SysTick exception when the count reaches 0
- bit 2 **CLKSOURCE** = 1 → processor clock (0 would be AHB/8)

Bit 16 COUNTFLAG is read-only status.`,
  },
  {
    id: 'reg-exti10', type: 'register', unit: 3, topic: 'exti', difficulty: 'hard', marks: 4,
    q: md`Configure a **falling-edge** interrupt on **PB10** (S1). List every register write.`,
    explain: md`~~~c
RCC->AHB1ENR |= (1U << 1);                     /* GPIOB clock                 */
RCC->APB2ENR |= (1U << 14);                    /* SYSCFG clock                */
GPIOB->MODER &= ~(3U << 20);                   /* PB10 input                  */
GPIOB->PUPDR  = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);   /* pull-up      */
SYSCFG->EXTICR[2] = (SYSCFG->EXTICR[2] & ~(0xFU << 8)) | (1U << 8); /* EXTI10 = port B */
EXTI->IMR  |= (1U << 10);                      /* unmask line 10              */
EXTI->FTSR |= (1U << 10);                      /* falling edge                */
NVIC_EnableIRQ(EXTI15_10_IRQn);                /* lines 10–15 share one IRQ   */
~~~
EXTI10 lives in **EXTICR3** (array index 2), bits 11:8; port B = 0001.`,
  },
  {
    id: 'reg-nvic-prio', type: 'register', unit: 3, topic: 'nvic', difficulty: 'medium', marks: 2,
    q: md`The STM32F4 implements 4 priority bits. What byte value ends up in the NVIC IPR field when you call «NVIC_SetPriority(EXTI0_IRQn, 2)»?`,
    explain: md`Only the upper 4 bits of each 8-bit priority field are implemented, so CMSIS shifts the value left by 4: 2 << 4 = **0x20**.`,
  },
  {
    id: 'reg-tim2-1hz', type: 'register', unit: 3, topic: 'gp-timers', difficulty: 'medium', marks: 3,
    q: md`Choose PSC and ARR for TIM2 (clocked at 16 MHz) to generate an update event every 1 s, and write the set-up code.`,
    explain: md`PSC = 15 999 → 16 MHz / 16 000 = 1 kHz; ARR = 999 → 1000 counts = **1 s**.
~~~c
RCC->APB1ENR |= (1U << 0);      /* TIM2 clock    */
TIM2->PSC = 16000 - 1;
TIM2->ARR = 1000 - 1;
TIM2->CNT = 0;
TIM2->CR1 |= (1U << 0);         /* CEN           */
/* poll: while (!(TIM2->SR & 1)); TIM2->SR &= ~1U; */
~~~`,
  },
  {
    id: 'reg-pwm-ch4', type: 'register', unit: 2, topic: 'pwm', difficulty: 'hard', marks: 4,
    q: md`Which TIM4 register fields set **PWM mode 1** with preload on **channel 4**, enable the output and start the counter?`,
    explain: md`| Register | Field | Value |
|---|---|---|
| TIM4_CCMR2 | OC4M (bits 14:12) | 110 = PWM mode 1 |
| TIM4_CCMR2 | OC4PE (bit 11) | 1 = preload CCR4 |
| TIM4_CCER | CC4E (bit 12) | 1 = output enabled |
| TIM4_CR1 | ARPE (bit 7), CEN (bit 0) | 1, 1 |

The duty is set with CCR4 and the period with ARR.`,
  },
  {
    id: 'reg-i2c-100k', type: 'register', unit: 3, topic: 'i2c-stm32', difficulty: 'hard', marks: 3,
    q: md`PCLK1 = 16 MHz. Give CR2.FREQ, CCR and TRISE for **100 kHz standard-mode** I²C.`,
    explain: md`- CR2.FREQ = **16** (PCLK1 in MHz)
- CCR = PCLK1 / (2 × 100 kHz) = 16 000 000 / 200 000 = **80**
- TRISE = (1000 ns max rise time / 62.5 ns) + 1 = 16 + 1 = **17**`,
  },
  {
    id: 'reg-uart-115200', type: 'register', unit: 3, topic: 'uart', difficulty: 'medium', marks: 3,
    q: md`Calculate USART_BRR for **115 200 baud** at 16 MHz with 16× oversampling.`,
    explain: md`USARTDIV = 16 000 000 / (16 × 115 200) = 8.6806
- Mantissa = 8 → 0x8
- Fraction = 0.6806 × 16 = 10.89 → **11** = 0xB

BRR = (8 << 4) | 11 = **0x008B**. Actual baud = 16 MHz / (16 × 8.6875) = 115 108 (−0.08 % error).`,
  },
];

const circuit: Item[] = [
  {
    id: 'cir-switch-pullup', type: 'circuit', unit: 2, topic: 'pull-resistors', difficulty: 'easy', marks: 3,
    q: md`Sketch how S1 is connected to PB10 on the kit using the **internal pull-up**, and state what IDR bit 10 reads when the switch is open and when it is pressed.`,
    explain: md`~~~text
 3.3 V
   │
  [R_PU ≈ 40 kΩ]  (internal, PUPDR = 01)
   │
 PB10 ●─────────┐
                │ S1
               ─┴─
               GND
~~~
Open → the pull-up holds the pin at 3.3 V → **IDR10 = 1**. Pressed → the pin is shorted to GND → **IDR10 = 0**. Without a pull resistor the open pin would float and read randomly.`,
  },
  {
    id: 'cir-led-sink', type: 'circuit', unit: 2, topic: 'leds-switches', difficulty: 'medium', marks: 3,
    q: md`Draw an active-high and an active-low LED connection to a GPIO pin. Which one is used for PC13 on the Black Pill, and what current limit applies to PC13?`,
    explain: md`~~~text
Active-high (source)            Active-low (sink)
 PB9 ──[R]──►|── GND           3.3 V ──[R]──►|── PC13
 ODR = 1 → ON                  ODR = 0 → ON
~~~
PC13 uses the **active-low (sink)** arrangement. PC13–PC15 sit in the backup domain and can sink only about **3 mA**, so the series resistor must keep the current low.`,
  },
  {
    id: 'cir-ldr-divider', type: 'circuit', unit: 2, topic: 'adc-fundamentals', difficulty: 'medium', marks: 4,
    q: md`Design an LDR voltage divider for PA1 so that the ADC reading **rises in the dark**. Show the circuit and the expected readings for LDR = 1 kΩ (bright) and 100 kΩ (dark) with a 10 kΩ fixed resistor.`,
    explain: md`Put the fixed resistor to 3.3 V and the LDR to GND:
~~~text
3.3 V ──[10 kΩ]──●── PA1 (ADC1_IN1)
                 │
               [LDR]
                 │
                GND
~~~
V = 3.3 × R_LDR / (10 k + R_LDR)
- Bright, 1 kΩ: V = 0.30 V → about **372**
- Dark, 100 kΩ: V = 3.0 V → about **3723**

Swap the two resistors and the reading falls in the dark — which is why the Smart Lighting solution keeps the comparison in one macro.`,
  },
  {
    id: 'cir-uart-wiring', type: 'circuit', unit: 3, topic: 'uart', difficulty: 'easy', marks: 2,
    q: md`Show the wiring between the Black Pill (USART2) and a USB-TTL adapter.`,
    explain: md`~~~text
Black Pill            USB-TTL adapter
PA2 (TX)  ─────────►  RX
PA3 (RX)  ◄─────────  TX
GND       ──────────  GND
~~~
TX and RX **cross over**, the grounds are common, and the adapter must use 3.3 V logic levels.`,
  },
  {
    id: 'cir-i2c-lcd', type: 'circuit', unit: 3, topic: 'i2c', difficulty: 'medium', marks: 3,
    q: md`Draw the connections for an I²C 16×2 LCD (PCF8574 backpack) to I2C1 and explain why pull-up resistors are needed.`,
    explain: md`~~~text
            3.3 V   3.3 V
              │       │
            [4.7k]  [4.7k]
              │       │
PB6 (SCL) ────●───────┼──── SCL  PCF8574 backpack ── 16×2 LCD
PB7 (SDA) ────────────●──── SDA
GND       ───────────────── GND
                            VCC (5 V for the LCD module)
~~~
Both lines are **open-drain**: devices can only pull them low. The pull-ups bring them back high; without them the bus never leaves 0 and no START/ACK is seen. Many backpacks already include pull-ups. Address 0x27 (written as 0x4E).`,
  },
  {
    id: 'cir-spi-slaves', type: 'circuit', unit: 3, topic: 'spi', difficulty: 'medium', marks: 3,
    q: md`Show how one SPI master connects to **two** slaves.`,
    explain: md`~~~text
Master SCK  ──┬──────────► Slave 1 SCK
              └──────────► Slave 2 SCK
Master MOSI ──┬──────────► Slave 1 MOSI
              └──────────► Slave 2 MOSI
Master MISO ◄─┬────────── Slave 1 MISO
              └────────── Slave 2 MISO   (tri-stated when not selected)
GPIO CS1    ──────────────► Slave 1 SS (active low)
GPIO CS2    ──────────────► Slave 2 SS (active low)
~~~
SCK, MOSI and MISO are shared; each slave gets its **own chip-select** line, and only one is pulled low at a time.`,
  },
  {
    id: 'cir-seven-seg-2', type: 'circuit', unit: 2, topic: 'seven-segment', difficulty: 'medium', marks: 2,
    q: md`A **common-cathode** seven-segment display has segments a–g on PB0–PB6. Which segments light for the digit “2”, and what value is written to the port (bits 6..0 = g..a)?`,
    explain: md`“2” uses **a, b, g, e, d**. Bits g f e d c b a = 1 0 1 1 0 1 1 = **0x5B**. (Common cathode → a 1 lights the segment.)`,
  },
  {
    id: 'cir-buzzer-driver', type: 'circuit', unit: 2, topic: 'buzzer', difficulty: 'medium', marks: 3,
    q: md`A 5 V magnetic buzzer draws 30 mA. Draw a suitable driver circuit from a GPIO pin and explain each component.`,
    explain: md`~~~text
              5 V
               │
           ┌───┴───┐
           │Buzzer │   ┌─ diode (cathode to 5 V) across the buzzer
           └───┬───┘
               │ C
GPIO ──[1 kΩ]──┤ B   NPN (e.g. BC547 / 2N2222)
               │ E
              GND
~~~
- **Transistor:** the GPIO cannot supply 30 mA; the NPN switches the load from 5 V.
- **Base resistor:** limits base current (about 2.6 mA).
- **Flyback diode:** the buzzer coil is inductive and produces a voltage spike when switched off.`,
  },
];

const program: Item[] = [
  {
    id: 'prg-toggle-edge', type: 'program', unit: 2, topic: 'leds-switches', difficulty: 'medium', marks: 6,
    q: md`Write a register-level program that **toggles PB9** each time S1 (PB10) is pressed. Holding the switch must toggle only once.`,
    explain: md`~~~c
#include "stm32f4xx.h"

int main(void)
{
    uint32_t prev = 1, now, i;

    RCC->AHB1ENR |= (1U << 1);                                   /* GPIOB */
    GPIOB->MODER  = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);   /* PB9 out */
    GPIOB->MODER &= ~(3U << 20);                                 /* PB10 in */
    GPIOB->PUPDR  = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);   /* pull-up */

    while (1) {
        now = (GPIOB->IDR >> 10) & 1U;
        if (prev == 1 && now == 0)          /* falling edge = new press */
            GPIOB->ODR ^= (1U << 9);
        prev = now;
        for (i = 0; i < 20000; i++) { }     /* crude debounce delay */
    }
}
~~~
Key idea: act on the **1 → 0 transition**, not on the level. See [P04](/lab/p04-switch-led) for the level-based version.`,
  },
  {
    id: 'prg-delay-ms', type: 'program', unit: 3, topic: 'systick', difficulty: 'easy', marks: 4,
    q: md`Write «delay_ms(uint32_t ms)» using SysTick in **polling** mode for a 16 MHz core clock.`,
    explain: md`~~~c
void delay_ms(uint32_t ms)
{
    SysTick->LOAD = 16000 - 1;      /* 1 ms                        */
    SysTick->VAL  = 0;              /* clear current value          */
    SysTick->CTRL = 5;              /* ENABLE + CLKSOURCE = CPU     */
    while (ms--)
        while (!(SysTick->CTRL & (1U << 16))) { }   /* COUNTFLAG    */
    SysTick->CTRL = 0;
}
~~~
COUNTFLAG sets each time the counter reaches 0 and clears when CTRL is read. See [P08](/lab/p08-systick-polling).`,
  },
  {
    id: 'prg-pot-threshold', type: 'program', unit: 2, topic: 'adc-stm32', difficulty: 'medium', marks: 6,
    q: md`Read the potentiometer on PA0 (ADC1 channel 0) and turn **PC14 on** when the reading is above half scale, off otherwise.`,
    explain: md`~~~c
#include "stm32f4xx.h"

int main(void)
{
    uint32_t v;
    RCC->AHB1ENR |= (1U << 0) | (1U << 2);           /* GPIOA, GPIOC */
    RCC->APB2ENR |= (1U << 8);                       /* ADC1         */
    GPIOA->MODER |= (3U << 0);                       /* PA0 analog   */
    GPIOC->MODER  = (GPIOC->MODER & ~(3U << 28)) | (1U << 28);   /* PC14 out */

    ADC1->CR1 = 0;                                   /* 12-bit       */
    ADC1->SQR3 = 0;                                  /* channel 0    */
    ADC1->SQR1 = 0;                                  /* 1 conversion */
    ADC1->CR2 = (1U << 1) | (1U << 0);               /* CONT, ADON   */
    ADC1->CR2 |= (1U << 30);                         /* SWSTART      */

    while (1) {
        while (!(ADC1->SR & (1U << 1))) { }          /* EOC          */
        v = ADC1->DR;
        if (v > 2048) GPIOC->ODR |=  (1U << 14);
        else          GPIOC->ODR &= ~(1U << 14);
    }
}
~~~
Compare with [P07](/lab/p07-adc-threshold).`,
  },
  {
    id: 'prg-uart-hello', type: 'program', unit: 3, topic: 'uart', difficulty: 'medium', marks: 6,
    q: md`Write a program that sends «HELLO\r\n» on USART2 at 9600 baud about once per second.`,
    explain: md`~~~c
#include "stm32f4xx.h"

static void putc2(char c)
{
    while (!(USART2->SR & (1U << 7))) { }   /* TXE */
    USART2->DR = c;
}

int main(void)
{
    const char *s;
    volatile uint32_t i;
    RCC->AHB1ENR |= (1U << 0);
    RCC->APB1ENR |= (1U << 17);
    GPIOA->MODER  = (GPIOA->MODER & ~(3U << 4)) | (2U << 4);       /* PA2 AF   */
    GPIOA->AFR[0] = (GPIOA->AFR[0] & ~(0xFU << 8)) | (7U << 8);    /* AF7      */
    USART2->BRR = 0x0683;                                          /* 9600     */
    USART2->CR1 = (1U << 3) | (1U << 13);                          /* TE, UE   */

    while (1) {
        for (s = "HELLO\r\n"; *s; s++) putc2(*s);
        for (i = 0; i < 1600000; i++) { }                          /* ~1 s     */
    }
}
~~~
For an exact 1 s use SysTick. See [P12](/lab/p12-uart-tx).`,
  },
  {
    id: 'prg-exti-toggle', type: 'program', unit: 3, topic: 'exti', difficulty: 'hard', marks: 8,
    q: md`Use an **external interrupt** on PA6 (S2, falling edge) to toggle PB9. The main loop must stay empty.`,
    explain: md`~~~c
#include "stm32f4xx.h"

void EXTI9_5_IRQHandler(void)
{
    if (EXTI->PR & (1U << 6)) {
        GPIOB->ODR ^= (1U << 9);
        EXTI->PR = (1U << 6);                 /* write 1 to clear */
    }
}

int main(void)
{
    RCC->AHB1ENR |= (1U << 0) | (1U << 1);
    RCC->APB2ENR |= (1U << 14);               /* SYSCFG */
    GPIOA->MODER &= ~(3U << 12);
    GPIOA->PUPDR  = (GPIOA->PUPDR & ~(3U << 12)) | (1U << 12);
    GPIOB->MODER  = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);

    SYSCFG->EXTICR[1] &= ~(0xFU << 8);        /* EXTI6 = port A (0000) */
    EXTI->IMR  |= (1U << 6);
    EXTI->FTSR |= (1U << 6);
    NVIC_EnableIRQ(EXTI9_5_IRQn);

    while (1) { }
}
~~~
EXTI6 is in EXTICR2 (index 1), bits 11:8. See [P10](/lab/p10-gpio-interrupts).`,
  },
  {
    id: 'prg-pwm-led', type: 'program', unit: 2, topic: 'pwm', difficulty: 'hard', marks: 8,
    q: md`Generate a **1 kHz, 25 % duty** PWM on PB9 (TIM4_CH4, AF2) to dim LED2. Assume a 16 MHz timer clock.`,
    explain: md`~~~c
#include "stm32f4xx.h"

int main(void)
{
    RCC->AHB1ENR |= (1U << 1);                                     /* GPIOB          */
    RCC->APB1ENR |= (1U << 2);                                     /* TIM4           */
    GPIOB->MODER  = (GPIOB->MODER & ~(3U << 18)) | (2U << 18);     /* PB9 AF         */
    GPIOB->AFR[1] = (GPIOB->AFR[1] & ~(0xFU << 4)) | (2U << 4);    /* AF2 = TIM4_CH4 */

    TIM4->PSC  = 16 - 1;                                           /* 1 MHz count    */
    TIM4->ARR  = 1000 - 1;                                         /* 1 kHz period   */
    TIM4->CCR4 = 250;                                              /* 25 % duty      */
    TIM4->CCMR2 = (TIM4->CCMR2 & ~(7U << 12)) | (6U << 12) | (1U << 11); /* PWM1, OC4PE */
    TIM4->CCER |= (1U << 12);                                      /* CC4E           */
    TIM4->CR1  |= (1U << 7) | (1U << 0);                           /* ARPE, CEN      */

    while (1) { }
}
~~~
f = 16 MHz / (16 × 1000) = 1 kHz; duty = 250 / 1000 = 25 %. No PWM lab code was supplied, so check the AF mapping in the datasheet for your board.`,
  },
  {
    id: 'prg-bitband-blink', type: 'program', unit: 1, topic: 'bit-banding', difficulty: 'medium', marks: 6,
    q: md`Blink the PC13 LED using a **bit-band alias** of GPIOC_ODR (0x4002 0814) instead of ODR masks. Show the alias calculation.`,
    explain: md`Alias = 0x4200 0000 + (0x20814 × 32) + (13 × 4) = 0x4200 0000 + 0x41 0280 + 0x34 = **0x4241 02B4**.
~~~c
#include "stm32f4xx.h"
#define PC13_BB (*(volatile uint32_t *)0x424102B4)

int main(void)
{
    volatile uint32_t i;
    RCC->AHB1ENR |= (1U << 2);
    GPIOC->MODER  = (GPIOC->MODER & ~(3U << 26)) | (1U << 26);
    while (1) {
        PC13_BB = 0;  for (i = 0; i < 400000; i++) { }   /* LED on  (active-low) */
        PC13_BB = 1;  for (i = 0; i < 400000; i++) { }   /* LED off              */
    }
}
~~~
See [P05](/lab/p05-bitband-blink).`,
  },
  {
    id: 'prg-timer-blink', type: 'program', unit: 3, topic: 'gp-timers', difficulty: 'medium', marks: 6,
    q: md`Blink PC14 at **1 Hz** (toggle every 500 ms) by polling the TIM2 update flag.`,
    explain: md`~~~c
#include "stm32f4xx.h"

int main(void)
{
    RCC->AHB1ENR |= (1U << 2);
    RCC->APB1ENR |= (1U << 0);                                   /* TIM2 */
    GPIOC->MODER  = (GPIOC->MODER & ~(3U << 28)) | (1U << 28);

    TIM2->PSC = 16000 - 1;          /* 1 kHz tick  */
    TIM2->ARR = 500 - 1;            /* 500 ms      */
    TIM2->CNT = 0;
    TIM2->CR1 |= (1U << 0);         /* CEN         */

    while (1) {
        while (!(TIM2->SR & (1U << 0))) { }   /* UIF */
        TIM2->SR &= ~(1U << 0);               /* clear UIF */
        GPIOC->ODR ^= (1U << 14);
    }
}
~~~
Toggling every 500 ms gives a 1 s period = 1 Hz.`,
  },
];

const items: BankItem[] = [...debug, ...register, ...circuit, ...program].map((i) => ({ ...i, answer: i.explain, generated: true as const }));
export default items;
