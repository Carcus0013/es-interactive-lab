import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"
int main(void) {
    // Enable GPIOC clock
   RCC->AHB1ENR |= (1 << 2);  // Bit 2 enables the clock for GPIOC

    // Clear pin mode for PC14 (GPIOC pin 14)
    GPIOC->MODER &= ~0x30000000;

    // Set PC14 to output mode
    GPIOC->MODER |= 0x10000000;

    // Configure SysTick to generate 1Hz toggle
    SysTick->LOAD = 16000000 - 1;  // Reload with number of clocks per second (assuming 16 MHz clock)
    SysTick->VAL = 0;              // Clear current value register
    SysTick->CTRL = 5;             // Enable SysTick, no interrupt, use processor clock

    while (1) {
        // Wait for COUNT flag to be set
        if (SysTick->CTRL & 0x00010000) {
            // Toggle PC14
            GPIOC->ODR ^= (1 << 14);  // Toggle PC14
        }
    }
}`;

const p: Practical = {
  id: 'p08-systick-polling',
  order: 8,
  title: 'SysTick delay by polling: toggle LED1 every second',
  unit: 3,
  objective: 'Use the SysTick 24-bit down-counter without interrupts: load it for 1 s at 16 MHz and toggle PC14 whenever COUNTFLAG is set.',
  components: ['STM32F401CCU6 Black Pill', 'LED1 on PC14'],
  connections: [{ pin: 'PC14', to: 'LED1 (active-high)', mode: 'Output' }],
  expected: md`LED1 changes state exactly once per second: ON for 1 s, OFF for 1 s (a 0.5 Hz blink — each toggle is 1 s apart). Unlike the for-loop delay, the timing does not depend on compiler optimisation.`,
  sources: [{ file: 'Lab_6/Systick_without_interupt.txt' }, { file: 'Day09_Systick_Timer.pptx', detail: 'slides 6–12' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }] },
  programs: [
    {
      id: 'poll',
      title: 'Systick_without_interupt.txt',
      file: 'Lab_6/Systick_without_interupt.txt',
      code: CODE,
      explain: [
        { lines: [4, 4], what: 'GPIOC clock.', why: 'LED1 is on PC14.', register: 'RCC_AHB1ENR bit 2' },
        { lines: [7, 7], what: 'Clear MODER14 with a hex mask.', why: '0x3000 0000 = bits 29:28.', register: 'GPIOC_MODER' },
        { lines: [10, 10], what: 'MODER14 = 01.', why: '0x1000 0000 = bit 28.', register: 'GPIOC_MODER' },
        { lines: [13, 13], what: 'LOAD = 16 000 000 − 1.', why: 'Counter visits LOAD … 0 = 16 000 000 states → exactly 1 s at 16 MHz. 15 999 999 < 0xFF FFFF, so it fits in 24 bits.', register: 'STK_LOAD (0xE000 E014)', ifRemoved: 'LOAD is undefined at reset → unpredictable period.' },
        { lines: [14, 14], what: 'Clear VAL.', why: 'Initialisation step 2: VAL is undefined at reset; writing any value clears it and COUNTFLAG.', register: 'STK_VAL (0xE000 E018)' },
        { lines: [15, 15], what: 'CTRL = 5 → enable, processor clock, no interrupt.', why: '101b: ENABLE (bit 0) = 1, TICKINT (bit 1) = 0, CLKSOURCE (bit 2) = 1 → 16 MHz.', register: 'STK_CTRL (0xE000 E010)', internal: 'The counter now decrements every CPU clock; at 1 → 0 it sets COUNTFLAG and reloads LOAD on the next clock.', ifRemoved: 'Counter never starts → LED never toggles.' },
        { lines: [19, 19], what: 'Poll COUNTFLAG (bit 16).', why: 'Becomes 1 once per second. **Reading CTRL clears COUNTFLAG**, so each second is detected exactly once.', register: 'STK_CTRL bit 16', internal: 'The loop reads CTRL millions of times per second; only the read after an underflow returns bit 16 = 1.' },
        { lines: [21, 21], what: 'Toggle PC14.', why: 'XOR with 1 flips the bit: ON ↔ OFF.', register: 'GPIOC_ODR bit 14' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'HSI 16 MHz.', kind: 'start' },
    { label: 'GPIOC clock, PC14 output', detail: 'AHB1ENR bit 2; MODER14 = 01.', kind: 'init' },
    { label: 'SysTick: LOAD = 15 999 999', detail: '1 s at 16 MHz.', kind: 'init' },
    { label: 'VAL = 0, CTRL = 5', detail: 'Clear, then enable with processor clock, no interrupt.', kind: 'init' },
    { label: 'Read CTRL: COUNTFLAG set?', detail: 'Polling; the read also clears the flag.', kind: 'decision' },
    { label: 'Toggle PC14', detail: 'GPIOC->ODR ^= (1<<14); back to polling.', kind: 'loop' },
  ],
  sim: { id: 'systick' },
  exam: {
    viva: [
      { q: 'Why LOAD = 16000000 − 1 and not 16000000?', a: 'The counter counts from LOAD down to 0 inclusive — LOAD + 1 clock cycles per period; 15 999 999 + 1 = 16 000 000 cycles = 1 s.' },
      { q: 'What is the maximum LOAD value?', a: '0x00FF FFFF = 16 777 215 (24 bits) → 1.048 s at 16 MHz.' },
      { q: 'How is COUNTFLAG cleared?', a: 'By reading STK_CTRL (or writing STK_VAL).' },
      { q: 'What is the order of SysTick initialisation and why?', a: 'LOAD, then VAL = 0, then CTRL — LOAD and VAL are undefined at reset, so they must be valid before the counter starts.' },
    ],
    registerQs: [
      { q: 'Decode CTRL = 5.', a: 'ENABLE = 1, TICKINT = 0, CLKSOURCE = 1 (processor clock).' },
      { q: 'What LOAD gives 500 ms at 16 MHz?', a: '8 000 000 − 1 = 7 999 999.' },
      { q: 'With CTRL = 1 (HCLK/8), what LOAD gives 1 s?', a: '2 MHz × 1 s − 1 = 1 999 999.' },
    ],
    pinQs: [{ q: 'Which bits does 0x30000000 cover?', a: 'Bits 29 and 28 — MODER14 of port C.' }],
    outputQs: [{ q: 'What is the blink frequency of LED1?', a: 'It toggles every 1 s, so it completes one ON/OFF cycle every 2 s (0.5 Hz).' }],
    debugQs: [
      { q: 'The LED toggles about 8× slower than expected. Why?', a: 'CLKSOURCE = 0 (CTRL = 1) → SysTick runs at HCLK/8 = 2 MHz.' },
      { q: 'The LED never toggles. Causes?', a: 'ENABLE not set, LOAD zero, or LOAD > 24 bits (truncated), or GPIOC clock off.' },
    ],
    errors: ['LOAD > 0xFFFFFF (e.g. 84 000 000 at 84 MHz) — upper bits are lost.', 'Reading COUNTFLAG elsewhere (debugger view) clears it and a toggle is missed.', 'Mixing up bit 16 (COUNTFLAG) and bit 1 (TICKINT).'],
    modifications: ['Toggle every 0.5 s.', 'Build delay_ms() on a 1 ms SysTick (count COUNTFLAGs).', 'Blink PB9 at 2 Hz and PC14 at 1 Hz from the same 250 ms tick.', 'Convert to interrupt mode (P09).'],
    explainToExaminer: md`“SysTick is a 24-bit down-counter in the core. I load it with 16 million minus one so a full count takes exactly one second at 16 MHz, clear the current value and enable it with CTRL = 5 — processor clock, no interrupt. Each time it reaches zero it sets COUNTFLAG; my loop reads CTRL, and when bit 16 is set I toggle PC14 with XOR. Reading CTRL clears the flag, so each second is counted once.”`,
  },
  memorise: {
    essentials: ['SysTick->LOAD = 16000000 - 1;', 'SysTick->VAL = 0;', 'SysTick->CTRL = 5;', 'if (SysTick->CTRL & (1U<<16)) GPIOC->ODR ^= (1U<<14);'],
    patterns: [{ name: 'SysTick init order', code: 'LOAD → VAL = 0 → CTRL' }],
    skeleton: md`int main(void){
    RCC->AHB1ENR |= (1<<2);
    GPIOC->MODER = (GPIOC->MODER & ~(3U<<28)) | (1U<<28);
    SysTick->LOAD = 16000000-1; SysTick->VAL = 0; SysTick->CTRL = 5;
    while(1){ if (SysTick->CTRL & (1U<<16)) GPIOC->ODR ^= (1U<<14); }
}`,
  },
  topics: ['systick', 'io-sync'],
};

export default p;
