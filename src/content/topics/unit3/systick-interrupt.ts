import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'systick-interrupt',
  unit: 3,
  order: 5,
  title: 'Timer periodic interrupts with SysTick',
  short: 'Using TICKINT to run SysTick_Handler at a fixed rate: the 1 s LED toggle lab, millisecond tick counters, non-blocking timing and SysTick_Config.',
  status: 'course',
  sources: [
    { file: 'Day10_4_Systick_Timer_With_Interupt.pptx', detail: 'slides 2–15 (maskable vs NMI, usages, ISR, program on slide 15)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§9.6 SysTick Periodic Interrupts' },
  ],
  keywords: ['periodic interrupt', 'SysTick_Handler', 'TICKINT', 'CTRL = 7', 'tick', 'millis', 'non-blocking delay', 'SysTick_Config', 'XOR toggle', 'volatile'],
  importance: 2,
  sims: ['systick', 'interrupt'],
  practicals: ['p09-systick-interrupt'],
  related: ['systick', 'nvic', 'interrupts-basics', 'gp-timers'],
  fundamentals: {
    what: md`A **periodic interrupt** is an interrupt that occurs at a fixed time interval. Setting **TICKINT** in STK_CTRL makes SysTick raise the **SysTick exception (number 15)** every time its counter reaches zero, so «SysTick_Handler()» runs at an exact rate without the main program doing anything.`,
    why: md`Polling COUNTFLAG keeps the CPU busy checking. With an interrupt the main loop can do other work (or sleep), and timing stays exact regardless of what main() is doing.`,
    problem: md`Provides a time base for blinking, sampling sensors at fixed rates, timeouts, debouncing, software timers and RTOS scheduling (Day10_4 slide 3).`,
    how: md`Program LOAD, clear VAL, write CTRL = 7 (enable + interrupt + processor clock). The core vectors to SysTick_Handler on each underflow; the handler does a short job (toggle an LED, increment a counter) and returns. COUNTFLAG need not be read.`,
    where: md`Lab: toggle PC14 every 1 s from the ISR while «while(1)» is empty. HAL's HAL_Delay() and every RTOS tick use exactly this mechanism.`,
  },
  detailed: md`
## The lab program (Day10_4 slide 15)

~~~c Toggle PC14 every 1 s using the SysTick interrupt
#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1 << 2);          // GPIOC clock
    GPIOC->MODER &= ~0x30000000;       // clear MODER14
    GPIOC->MODER |=  0x10000000;       // PC14 output
    SysTick->LOAD = 16000000 - 1;      // 1 s at 16 MHz
    SysTick->VAL  = 0;                 // clear current value
    SysTick->CTRL = 7;                 // ENABLE | TICKINT | CLKSOURCE (processor clock)
    while (1) {
        // empty: toggling happens in the interrupt
    }
}
void SysTick_Handler(void) {
    GPIOC->ODR ^= (1 << 14);           // toggle PC14
}
~~~

- No NVIC_EnableIRQ is needed: SysTick is a **system exception**, enabled by TICKINT alone.
- «^=» is XOR: “compares two bits and returns 1 if they are different” — XOR with 1 toggles the bit (slide 15).
- The handler name must match the vector-table entry in the startup file exactly.

## Polling vs interrupt version

| | Lab 6 polling (CTRL = 5) | Interrupt (CTRL = 7) |
|---|---|---|
| Who toggles | main loop after reading COUNTFLAG | SysTick_Handler |
| CPU during the second | busy checking | free / can sleep with «__WFI()» |
| Timing accuracy | exact, but toggle delayed if main is busy | exact, independent of main |

## Millisecond tick and non-blocking timing

Use a 1 ms tick and a counter; compare elapsed time in main instead of blocking:

~~~c
volatile uint32_t ms_ticks = 0;
void SysTick_Handler(void) { ms_ticks++; }

int main(void) {
    SysTick->LOAD = 16000 - 1;  SysTick->VAL = 0;  SysTick->CTRL = 7;   // 1 kHz tick
    uint32_t last = 0;
    while (1) {
        if (ms_ticks - last >= 250) {        // every 250 ms
            last += 250;
            GPIOB->ODR ^= (1U << 9);
        }
        /* read switches, ADC … without being blocked */
    }
}
~~~

This pattern solves the Smart Fan PYQ (blink fast/slow while still reading the switches), and the subtraction works even when the counter wraps.

## CMSIS shortcut

«SysTick_Config(SystemCoreClock / 1000);» sets LOAD = ticks − 1, sets the lowest priority, clears VAL and writes CTRL = 7 — the same three steps.

## Shared variables

«ms_ticks» is written in the ISR and read in main, so it must be «volatile». A 32-bit read on Cortex-M is atomic, so no extra protection is needed for a single counter.
`,
  visual: md`
Turn on TICKINT in the simulator and run: the LED toggles from the handler while main is idle.

::sim{systick preset=interrupt}

::diagram{systick-block}
`,
  exam: {
    definitions: [
      { term: 'Periodic interrupt', def: 'An interrupt requested at a fixed time interval by a timer.' },
      { term: 'SysTick_Handler', def: 'The ISR executed for exception 15 each time SysTick counts down to zero with TICKINT set.' },
      { term: 'Tick', def: 'The basic periodic time unit produced by a periodic interrupt, e.g. 1 ms.' },
    ],
    formulas: [{ name: 'Interrupt rate', expr: 'f_int = f_clk / (LOAD + 1)', example: '16 MHz / 16 000 = 1 kHz' }],
    frequent: ['Write a program to toggle an LED every second using the SysTick interrupt.', 'Difference between SysTick polling and interrupt modes.', 'Usages of SysTick.'],
    mistakes: ['Calling NVIC_EnableIRQ(SysTick_IRQn) and forgetting TICKINT.', 'Misspelling SysTick_Handler (the default handler runs instead).', 'Putting delays inside the ISR.', 'Not making shared tick counters volatile.'],
    diagrams: ['main loop ↔ SysTick_Handler timeline'],
    shortQs: [
      { q: 'What changes are needed to convert the polling SysTick program into an interrupt-driven one?', a: md`Write CTRL = 7 instead of 5 (set TICKINT), remove the COUNTFLAG check from main, and add «void SysTick_Handler(void){ GPIOC->ODR ^= (1<<14); }».`, marks: 2 },
      { q: 'Why is NVIC_EnableIRQ not used for SysTick in the lab?', a: md`SysTick is a core system exception (number 15), enabled by the TICKINT bit in STK_CTRL; NVIC_EnableIRQ is for peripheral IRQs (number ≥ 0).`, marks: 2 },
      { q: 'List two usages of the SysTick periodic interrupt.', a: md`Measuring elapsed time / delay functions; executing tasks periodically such as sensor polling or OS CPU scheduling (Day10_4 slide 3).`, marks: 2 },
    ],
    longQs: [
      { q: 'Write a program to toggle LED1 (PC14) every second using the SysTick interrupt and explain each statement and the execution flow.', a: md`The Day10_4 slide 15 program with explanation of clock, MODER, LOAD, VAL, CTRL = 7, empty loop, handler with XOR; flow: init → idle loop → every 1 s exception entry (stacking) → toggle → return.`, marks: 8 },
      { q: 'Design non-blocking code that blinks PB9 at 2 Hz while continuously reading switch S1, using a 1 ms SysTick tick.', a: md`volatile ms counter in SysTick_Handler; main loop compares elapsed time (≥ 250 ms → toggle) and reads PB10 each iteration; explain why blocking delays would miss switch presses.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['CTRL = 7 → enable + TICKINT + processor clock.', 'Handler: void SysTick_Handler(void) — exact name.', 'No NVIC_EnableIRQ needed (system exception 15).', '1 ms tick: LOAD = f/1000 − 1; volatile counter.', 'Non-blocking: if (ticks − last ≥ period).'],
    takeaways: ['Polling = CTRL 5 + COUNTFLAG; interrupt = CTRL 7 + handler.'],
    mcqs: [
      { q: 'Which CTRL value enables SysTick with interrupt using the processor clock?', options: ['1', '5', '7', '3'], answer: 2, explain: '111b.' },
      { q: 'SysTick exception number:', options: ['11', '14', '15', '16'], answer: 2, explain: 'Exception 15.' },
      { q: 'GPIOC->ODR ^= (1<<14) does what?', options: ['sets PC14', 'clears PC14', 'toggles PC14', 'reads PC14'], answer: 2, explain: 'XOR toggles.' },
      { q: 'LOAD for a 1 ms tick at 16 MHz:', options: ['16 000', '15 999', '1599', '159 999'], answer: 1, explain: '16 000 − 1.' },
      { q: 'A variable incremented in SysTick_Handler and read in main must be…', options: ['static', 'volatile', 'const', 'register'], answer: 1, explain: 'Prevents caching.' },
    ],
  },
};

export default topic;
