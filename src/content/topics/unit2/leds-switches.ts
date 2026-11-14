import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'leds-switches',
  unit: 2,
  order: 5,
  title: 'Interfacing LEDs and switches',
  short: 'Active-high and active-low LEDs, current-limiting resistors, reading switches, edge detection, software delays and debouncing.',
  status: 'course',
  sources: [
    { file: 'Lab_1 … Lab_4 programs and Emb-kit Manual.docx', detail: 'LED ON, blink, button, switch programs' },
    { file: 'STM32F401CCU6_Intro_GPIO.pptx', detail: 'slide 12 (PC13 cathode)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§2.7 Switch and LED Interfaces' },
  ],
  keywords: ['LED', 'active-low', 'active-high', 'current limiting resistor', 'switch', 'push button', 'debounce', 'edge detection', 'software delay', 'blink', 'polling'],
  importance: 3,
  pyq: ['MT25A-6', 'MT25B-6', 'MT26S1-5', 'MT26S2-5', 'LE1S1-1', 'LE1S2-1'],
  practicals: ['p01-led-on', 'p02-led-blink', 'p03-button-led', 'p04-switch-led', 'p15-eval-photo-storage', 'p16-eval-parking'],
  sims: ['gpio', 'debounce'],
  related: ['gpio-registers', 'pull-resistors', 'io-sync', 'exti'],
  fundamentals: {
    what: md`An **LED** is a diode that emits light when current flows from anode to cathode; a GPIO output controls that current through a resistor. A **switch** connects an input pin to a fixed level when pressed; the program reads it from IDR. These are the most basic I/O devices and appear in every Part-B exam question.`,
    why: md`Status indication (LEDs) and user input (switches) are needed in nearly every product, and they teach the full GPIO workflow: clock → mode → pull → read/write.`,
    problem: md`Correct wiring and logic sense (active-low vs active-high, pressed = 0) decide whether the program does what the question asks; debouncing and edge detection make counters and toggles reliable.`,
    how: md`Active-high LED: pin → resistor → LED → GND, ON when ODR bit = 1. Active-low LED: V_DD → resistor → LED → pin, ON when ODR bit = 0 (PC13). Switch to GND with pull-up: IDR bit = 0 while pressed. A program polls IDR in its «while(1)» loop and drives ODR accordingly.`,
    where: md`Lab 1 (LED ON), Lab 2 (blink), Lab 3 (PA0 key → PC13), Lab 4 (PB10 → PC14), the lab-evaluation photo-storage and parking systems, and both mid-term Part-B designs.`,
  },
  detailed: md`
## LEDs

::diagram{led-circuits}

| LED on the kit | Wiring | ON when | OFF when |
|---|---|---|---|
| PC13 (on-board) | 3.3 V → R → LED → PC13 | «GPIOC->ODR &= ~(1U<<13);» (pin LOW) | pin HIGH |
| PC14 (LED1) | PC14 → R → LED → GND | «GPIOC->ODR \|= (1U<<14);» (pin HIGH) | pin LOW |
| PB9 (LED2) | PB9 → R → LED → GND | «GPIOB->ODR \|= (1U<<9);» | pin LOW |

**Current-limiting resistor:** R = (V_DD − V_LED) / I_LED. For a red LED (V_F ≈ 2.0 V) at 5 mA: R = (3.3 − 2.0) / 0.005 = 260 Ω → use 270–330 Ω. Without it the pin and LED are over-stressed.

## Switches

With an internal pull-up and the switch to GND (lab kit):

~~~c
if (GPIOB->IDR & (1U << 10)) {
    /* PB10 = 1 → S1 released */
} else {
    /* PB10 = 0 → S1 pressed */
}
~~~

> [!warning] Read the supplied Button_LED program carefully
> «if (GPIOA->IDR & (1U<<0)) GPIOC->ODR &= ~(1U<<13);» runs when PA0 is **released** (pull-up → 1) and drives PC13 LOW, which turns the active-low LED **ON**. So in Lab 3 the LED is ON while the key is released and OFF while pressed. Lab 4 (PB10 → PC14) is the opposite: LED ON while pressed.

## Polling super-loop pattern

~~~c
while (1) {
    uint32_t pressed = !(GPIOB->IDR & (1U << 10));   // 1 when S1 is pressed
    if (pressed) GPIOC->ODR |=  (1U << 14);          // LED ON
    else         GPIOC->ODR &= ~(1U << 14);          // LED OFF
}
~~~

## Level vs edge: counting presses and toggling

“Turn the LED on **while** pressed” uses the **level**. “Toggle on **each press**” or “count uploads” needs the **edge** (released → pressed), otherwise one press counts thousands of times as the loop spins.

~~~c Falling-edge detection by polling
uint32_t prev = 1;                         // released
while (1) {
    uint32_t now = (GPIOA->IDR >> 6) & 1U; // PA6
    if (prev == 1 && now == 0) {           // just pressed
        count++;
    }
    prev = now;
}
~~~

## Bounce and debouncing

Mechanical contacts bounce for about 1–10 ms, producing several fake edges. Fixes: (1) after detecting an edge, wait ~20 ms and check the pin is still pressed; (2) count N consecutive identical samples; (3) wait for release before accepting the next press; (4) hardware RC filter.

::sim{debounce}

## Software delays

«for (int i = 0; i < 180000; i++) {}» simply burns CPU cycles. The delay depends on the clock, compiler and optimisation level (the loop may even be optimised away unless the counter is «volatile»). For accurate timing use SysTick (Unit 3).

| Loop count (lab code) | Approximate delay at 16 MHz, no optimisation |
|---|---|
| 180 000 | ≈ 0.1–0.2 s |
| 500 000 | ≈ 0.3–0.5 s |

*(Approximate — each iteration takes several cycles; measure on your board.)*
`,
  visual: md`
Run the lab programs on the virtual kit — choose “Button_LED.txt” and press USER KEY, then “Lab 4” and press S1:

::sim{gpio preset=button}

::diagram{led-circuits}
`,
  exam: {
    definitions: [
      { term: 'Active-low', def: 'A device that is activated by a LOW (0) logic level, e.g. the PC13 LED which lights when the pin is 0.' },
      { term: 'Active-high', def: 'A device activated by a HIGH (1) level, e.g. kit LEDs on PC14 and PB9.' },
      { term: 'Switch bounce', def: 'Rapid unwanted make/break transitions of mechanical contacts for a few milliseconds after pressing or releasing.' },
      { term: 'Edge detection', def: 'Detecting a change of input level (e.g. 1 → 0) rather than the level itself.' },
      { term: 'Polling', def: 'Repeatedly reading an input/status in a loop to detect changes.' },
    ],
    formulas: [{ name: 'LED series resistor', expr: 'R = (V_DD − V_F) / I_F', example: '(3.3 − 2.0) V / 5 mA = 260 Ω' }],
    frequent: ['Part B of every paper: switches on PA0/PA6/PB10, LEDs on PC13/PC14/PB9 with given behaviour.', 'Toggle an LED on each press (edge detection).', 'Lab evaluation: count presses with LED blink indications.'],
    mistakes: ['Treating PC13 as active-high.', 'Reading pressed as 1 with pull-up wiring.', 'Toggling on level instead of edge (LED flickers / counts explode).', 'No debouncing → one press counts several times.', 'Forgetting to enable the clock of every port used (A, B and C).'],
    diagrams: ['Active-low and active-high LED circuits', 'Switch with pull-up'],
    shortQs: [
      { q: 'Write the statement to turn ON the on-board LED and explain why it is a clear, not a set.', a: md`«GPIOC->ODR &= ~(1U<<13);» The LED's cathode is on PC13 and its anode goes to 3.3 V through a resistor, so current flows (LED ON) only when PC13 is LOW.`, marks: 2 },
      { q: 'Why is edge detection needed to toggle an LED with a push button?', a: md`The main loop runs millions of times while the button is held; toggling on the level would toggle repeatedly. Detecting the 1 → 0 transition toggles exactly once per press.`, marks: 2 },
      { q: 'Calculate the series resistor for an LED with V_F = 1.8 V at 10 mA from 3.3 V.', a: md`R = (3.3 − 1.8) / 0.01 = 150 Ω.`, marks: 2 },
    ],
    longQs: [
      { q: 'Write a register-level program: S1 (PB10) toggles LED1 (PC14) on each press, and the on-board LED (PC13) is ON while S2 (PA6) is held.', a: md`~~~c
#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<0) | (1U<<1) | (1U<<2);
    GPIOB->MODER &= ~(3U<<20);  GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U<<20)) | (1U<<20);
    GPIOA->MODER &= ~(3U<<12);  GPIOA->PUPDR = (GPIOA->PUPDR & ~(3U<<12)) | (1U<<12);
    GPIOC->MODER = (GPIOC->MODER & ~((3U<<26)|(3U<<28))) | (1U<<26) | (1U<<28);
    uint32_t prev = 1;
    while (1) {
        uint32_t now = (GPIOB->IDR >> 10) & 1U;
        if (prev && !now) {                    // falling edge = press
            GPIOC->ODR ^= (1U<<14);
            for (volatile int d = 0; d < 40000; d++);   // crude debounce
        }
        prev = now;
        if (GPIOA->IDR & (1U<<6)) GPIOC->ODR |=  (1U<<13);  // released → LED OFF
        else                      GPIOC->ODR &= ~(1U<<13);  // pressed  → LED ON
    }
}
~~~
Explain clocks, modes, pull-ups, edge detection, debounce and the active-low PC13.`, marks: 8 },
      { q: 'Explain active-high and active-low LED interfacing and switch interfacing to the STM32F401 with circuit diagrams.', a: md`Draw both LED circuits and the pull-up switch; derive resistor value; state ODR values for ON/OFF and IDR values for pressed/released; mention PC13 current limitation; code snippets.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['PC13 LED active-low (ODR = 0 → ON); PC14, PB9 active-high.', 'Switch to GND + pull-up: pressed = 0.', 'Level = while held; edge = once per press.', 'Debounce 10–20 ms.', 'Software delay loops are approximate; use volatile.'],
    takeaways: ['Write a truth table of pins vs behaviour before coding Part B.', 'Enable every port you touch.'],
    mcqs: [
      { q: 'Which statement turns the on-board PC13 LED ON?', options: ['GPIOC->ODR |= (1U<<13)', 'GPIOC->ODR &= ~(1U<<13)', 'GPIOC->IDR = 0', 'GPIOC->MODER = 0'], answer: 1, explain: 'Active-low.' },
      { q: 'With pull-up wiring, IDR bit while the switch is pressed is…', options: ['1', '0', 'floating', '0x10'], answer: 1, explain: 'Pin shorted to GND.' },
      { q: 'Toggling an LED once per press requires…', options: ['level detection', 'edge detection', 'analog mode', 'BSRR only'], answer: 1, explain: 'Detect the transition.' },
      { q: 'Switch bounce typically lasts…', options: ['nanoseconds', '1–10 ms', 'seconds', 'minutes'], answer: 1, explain: 'A few milliseconds.' },
      { q: 'Series resistor for 3.3 V, V_F = 2 V, 5 mA:', options: ['26 Ω', '260 Ω', '660 Ω', '2.6 kΩ'], answer: 1, explain: '1.3 V / 5 mA.' },
    ],
  },
};

export default topic;
