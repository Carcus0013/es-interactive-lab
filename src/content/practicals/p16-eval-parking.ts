import type { Practical } from '../../types';
import { md } from '../md';

export const PARKING_CODE = md`#include "stm32f4xx.h"

#define CAPACITY  5

/* ---------- 1 ms delay using SysTick (polling COUNTFLAG) ---------- */
void delay_ms(uint32_t ms)
{
    SysTick->LOAD = 16000 - 1;          /* 1 ms at 16 MHz              */
    SysTick->VAL  = 0;
    SysTick->CTRL = 5;
    while (ms--) {
        while (!(SysTick->CTRL & (1U << 16))) { }
    }
    SysTick->CTRL = 0;
}

/* ---------- blink an active-high LED 'times' times, end OFF ---------- */
void blink(GPIO_TypeDef *port, uint32_t pin, uint32_t times)
{
    for (uint32_t i = 0; i < times; i++) {
        port->ODR |=  (1U << pin);
        delay_ms(200);
        port->ODR &= ~(1U << pin);
        delay_ms(200);
    }
}

int main(void)
{
    uint32_t vehicles = 0;
    uint32_t prevIn = 1, prevOut = 1, prevRst = 1;

    RCC->AHB1ENR |= (1U << 0) | (1U << 1) | (1U << 2);    /* GPIOA, B, C */

    /* inputs with pull-up: PB10 entry (S1), PA6 exit (S2), PA0 reset (KEY) */
    GPIOB->MODER &= ~(3U << 20);
    GPIOA->MODER &= ~((3U << 12) | (3U << 0));
    GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);
    GPIOA->PUPDR = (GPIOA->PUPDR & ~((3U << 12) | (3U << 0))) | (1U << 12) | (1U << 0);

    /* outputs: PB9 entry LED, PC14 exit LED, PC13 parking-full LED */
    GPIOB->MODER = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);
    GPIOC->MODER = (GPIOC->MODER & ~((3U << 28) | (3U << 26))) | (1U << 28) | (1U << 26);

    GPIOB->ODR &= ~(1U << 9);           /* PB9 OFF                     */
    GPIOC->ODR &= ~(1U << 14);          /* PC14 OFF                    */
    GPIOC->ODR |=  (1U << 13);          /* PC13 OFF (active-low)       */

    while (1) {
        uint32_t in  = (GPIOB->IDR >> 10) & 1U;    /* 0 = pressed */
        uint32_t out = (GPIOA->IDR >> 6)  & 1U;
        uint32_t rst =  GPIOA->IDR        & 1U;

        /* ---- vehicle entry ---- */
        if (prevIn == 1 && in == 0) {
            if (vehicles < CAPACITY) {
                vehicles++;
                blink(GPIOB, 9, 3);             /* entry OK: PB9 x3     */
            }
            if (vehicles == CAPACITY) {
                GPIOC->ODR &= ~(1U << 13);      /* full: PC13 ON        */
            }
        }

        /* ---- vehicle exit ---- */
        if (prevOut == 1 && out == 0) {
            if (vehicles > 0) {
                vehicles--;
                blink(GPIOC, 14, 3);            /* exit OK: PC14 x3     */
                GPIOC->ODR |= (1U << 13);       /* space free: PC13 OFF */
            }
        }

        /* ---- system reset ---- */
        if (prevRst == 1 && rst == 0) {
            vehicles = 0;
            GPIOB->ODR &= ~(1U << 9);           /* all LEDs OFF         */
            GPIOC->ODR &= ~(1U << 14);
            GPIOC->ODR |=  (1U << 13);
        }

        prevIn = in;  prevOut = out;  prevRst = rst;
        delay_ms(10);                           /* sampling + debounce  */
    }
}`;

const p: Practical = {
  id: 'p16-eval-parking',
  order: 16,
  title: 'Lab Evaluation 1 (Set 2): Smart Vehicle Parking — solution',
  unit: 2,
  objective: 'Count vehicles entering (PB10) and leaving (PA6) a 5-slot car park with LED indications and a reset key (PA0), using direct register programming.',
  components: ['STM32F401CCU6 Black Pill + extension board', 'S1 (PB10) entry, S2 (PA6) exit, USER KEY (PA0) reset', 'PB9 entry LED, PC14 exit LED, PC13 parking-full LED'],
  connections: [
    { pin: 'PB10', to: 'S1 — entry', mode: 'Input, pull-up' },
    { pin: 'PA6', to: 'S2 — exit', mode: 'Input, pull-up' },
    { pin: 'PA0', to: 'USER KEY — reset', mode: 'Input, pull-up' },
    { pin: 'PB9', to: 'Entry status LED', mode: 'Output (active-high)' },
    { pin: 'PC14', to: 'Exit status LED', mode: 'Output (active-high)' },
    { pin: 'PC13', to: 'Parking-full LED', mode: 'Output (active-low)' },
  ],
  expected: md`| Action | Condition | Result |
|---|---|---|
| Press S1 (entry) | vehicles < 5 | vehicles + 1, PB9 blinks 3×; when it reaches 5, PC13 turns ON |
| Press S1 | vehicles = 5 | count unchanged, PC13 stays ON |
| Press S2 (exit) | vehicles ≥ 1 | vehicles − 1, PC14 blinks 3×, PC13 OFF |
| Press S2 | vehicles = 0 | nothing |
| Press KEY | any | vehicles = 0, all LEDs OFF |`,
  sources: [{ file: 'EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_2.docx', detail: 'question only — solution written for the platform' }],
  circuit: {
    leds: [{ pin: 'PB9', label: 'Entry LED' }, { pin: 'PC14', label: 'Exit LED' }, { pin: 'PC13', label: 'Parking full', activeLow: true }],
    switches: [{ pin: 'PB10', label: 'S1 entry', pull: 'up' }, { pin: 'PA6', label: 'S2 exit', pull: 'up' }, { pin: 'PA0', label: 'KEY reset', pull: 'up' }],
  },
  programs: [
    {
      id: 'sol',
      title: 'Solution (register level)',
      file: 'parking.c — written for this platform',
      authored: true,
      code: PARKING_CODE,
      explain: [
        { lines: [3, 3], what: 'Capacity = 5 vehicles.', why: 'From the question.' },
        { lines: [6, 15], what: 'SysTick 1 ms delay (polling).', why: 'Accurate timing for blinks and the 10 ms loop.', register: 'STK_LOAD/VAL/CTRL, COUNTFLAG' },
        { lines: [18, 26], what: 'blink() helper.', why: 'Three blinks of an active-high LED, ending OFF.' },
        { lines: [30, 31], what: 'Vehicle counter and previous switch levels.', why: 'Counter = occupied slots; prev values for edge detection.' },
        { lines: [33, 33], what: 'Clocks for ports A, B, C.', register: 'RCC_AHB1ENR bits 0–2', why: 'Pins on all three ports.' },
        { lines: [36, 39], what: 'Inputs with pull-ups.', why: 'PB10 (bits 21:20), PA6 (13:12), PA0 (1:0): MODER 00, PUPDR 01 — pressed reads 0.', register: 'GPIOA/GPIOB MODER, PUPDR' },
        { lines: [42, 43], what: 'Outputs PB9, PC14, PC13.', register: 'MODER 01 at bits 19:18, 29:28, 27:26', why: 'Status LEDs.' },
        { lines: [45, 47], what: 'All LEDs OFF initially.', why: 'PC13 OFF = 1 (active-low).' },
        { lines: [50, 52], what: 'Read the switches.', why: '0 = pressed.', register: 'GPIOB_IDR bit 10, GPIOA_IDR bits 6, 0' },
        { lines: [55, 63], what: 'Entry.', why: 'On a press: if a slot is free, count it and blink PB9 three times. Whenever the count is 5 after the press (just filled, or already full), turn PC13 ON — the count is never incremented beyond 5.' },
        { lines: [66, 72], what: 'Exit.', why: 'On a press with at least one car: decrement, blink PC14 three times, and turn PC13 OFF because a space is now free.' },
        { lines: [75, 80], what: 'Reset.', why: 'Count = 0 and every LED OFF; the system is ready for new vehicles.' },
        { lines: [82, 83], what: 'Save levels, wait 10 ms.', why: 'Edge detection + debounce.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'vehicles = 0.', kind: 'start' },
    { label: 'Clocks, 3 inputs, 3 outputs', detail: 'Register set-up: the inputs get pull-ups and all LEDs start OFF.', kind: 'init' },
    { label: 'Read PB10, PA6, PA0', detail: 'Every 10 ms.', kind: 'loop' },
    { label: 'Entry pressed?', detail: 'count < 5 → count++, blink PB9 ×3; count == 5 → PC13 ON.', kind: 'decision' },
    { label: 'Exit pressed?', detail: 'count > 0 → count−−, blink PC14 ×3, PC13 OFF.', kind: 'decision' },
    { label: 'Reset pressed?', detail: 'count = 0, all LEDs OFF.', kind: 'decision' },
    { label: 'Save levels, delay 10 ms, repeat', detail: 'Loop.', kind: 'loop' },
  ],
  sim: { id: 'debounce' },
  exam: {
    viva: [
      { q: 'How do you make sure the count never exceeds five?', a: 'Increment only when vehicles < CAPACITY; otherwise just keep PC13 ON.' },
      { q: 'Why is PC13 turned OFF after an exit?', a: 'A space is available again, so the full indicator must go off.' },
      { q: 'Why use edge detection for the entry switch?', a: 'So a single press counts exactly one vehicle regardless of how long the button is held.' },
    ],
    registerQs: [
      { q: 'Write the statements to read S1 and S2 as 0/1.', a: 'in = (GPIOB->IDR >> 10) & 1U; out = (GPIOA->IDR >> 6) & 1U;' },
      { q: 'How is PC13 turned ON?', a: 'GPIOC->ODR &= ~(1U<<13); (active-low).' },
    ],
    pinQs: [{ q: 'Which pins are inputs and outputs?', a: 'Inputs PB10 entry, PA6 exit, PA0 reset; outputs PB9, PC14, PC13.' }],
    outputQs: [
      { q: 'Six entry presses from empty?', a: 'Five blinks of PB9 ×3; after the fifth, PC13 ON; the sixth only keeps PC13 ON.' },
      { q: 'Then one exit press?', a: 'Count 4, PC14 blinks 3×, PC13 OFF.' },
    ],
    debugQs: [
      { q: 'The count jumps by 2–3 per press. Fix?', a: 'Add edge detection and sample every ~10 ms (debounce).' },
      { q: 'Reset does nothing. Check?', a: 'PA0 pull-up and GPIOA clock; the reset edge test; KEY wiring.' },
    ],
    errors: ['Incrementing beyond 5.', 'PC13 polarity.', 'Missing pull-ups.', 'Forgetting to clear the LEDs on reset.'],
    modifications: ['Show free slots by blinking PB9 that many times on request.', 'Use EXTI interrupts for entry/exit.', 'Add a UART log of every entry/exit.', 'Display free slots on the I²C LCD.'],
    explainToExaminer: md`“A counter holds the number of parked vehicles. The three switches are pull-up inputs sampled every 10 ms with edge detection. On entry, if the count is below five I increment it and blink PB9 three times; if it is five, PC13 (active-low) is turned on. On exit, if there is a vehicle I decrement, blink PC14 three times and switch PC13 off. The user key resets the count and turns all LEDs off.”`,
  },
  memorise: {
    essentials: ['clocks A, B, C; inputs PB10/PA6/PA0 pull-up; outputs PB9/PC14/PC13', 'edge test per switch', 'entry: if (v<5){v++; blink(GPIOB,9,3);} if (v==5) PC13 ON;', 'exit: if (v>0){v--; blink(GPIOC,14,3); PC13 OFF;}', 'reset: v=0; all LEDs OFF;', 'delay_ms(10);'],
    patterns: [{ name: 'Bounded counter', code: 'if (v < MAX) v++;\nif (v > 0)   v--;' }],
    skeleton: md`init
while(1){ read; entry edge → count/blink/full; exit edge → count/blink/free; reset edge → clear; save; delay 10 ms }`,
  },
  topics: ['leds-switches', 'gpio-registers', 'pull-resistors', 'systick'],
};

export default p;
