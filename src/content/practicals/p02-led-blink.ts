import type { Practical } from '../../types';
import { md } from '../md';

const BLINK = md`#include "stm32f4xx.h"
int main(void) {
//1. Enable GPIOC clock by Writing 1 to bit2 of AHB1ENR
RCC->AHB1ENR |=(1U<<2);
//2. Set PC13 to output mode by writing 1 to bit26 of MODER
GPIOC->MODER |=(1U<<26);
while (1) {
//3. Turn off PC13 by writing 1 to bit13 of ODR
GPIOC->ODR |= (1U<<13);
//4. Delay for some time/
for(int i =0; i<180000; i++){;}
//5. Turn on PC13 by writing 0 to bit13 of ODR
GPIOC->ODR &= ~(1U<<13);
//6. Delay for some time/
for(int i =0; i<180000; i++) {}
}
}`;

const PB9 = md`#include "stm32f4xx.h"
int main (void)
{
RCC->AHB1ENR |= (1<<1); //clock to port B
GPIOB->MODER |= (1<<18);
GPIOB->MODER &= ~(1<<19);//26th 1 and 27th0
//blynk
	while(1){
GPIOB->ODR |=	(1<<9);
	for(int i=0;i<=500000;i++) {}
GPIOB->ODR &=	~(1<<9);
  for(int i=0;i<=500000;i++) {}
}
	}`;

const ALT = md`// Program to blink LEDs at PB9 and PC14 in the Extension Board
#include "stm32f4xx.h"
int main(void) {
//1. Enable GPIOB clock by Writing 1 to bit1 of AHB1ENR
RCC->AHB1ENR |=(1U<<1);
//1. Enable GPIOC clock by Writing 1 to bit2 of AHB1ENR
RCC->AHB1ENR |=(1U<<2);
//2. Set PB9 to output mode by writing 1 to bit18 of GPIOB MODER
GPIOB->MODER |=(1U<<18);
//2. Set PC14 to output mode by writing 1 to bit28 of GPIOC MODER
GPIOC->MODER |=(1U<<28);
while (1) {
//3. Turn on PB9 by writing 1 to bit9 of GPIOB ODR
GPIOB->ODR |= (1U<<9);
//3. Turn off PC14 by writing 0 to bit14 of GPIOC ODR
GPIOC->ODR &= ~ (1U<<14);
//4. Delay for some time/
for(int i =0; i<180000; i++){;}
//3. Turn off PB9 by writing 0 to bit9 of GPIOB ODR
GPIOB->ODR &= ~(1U<<9);
//3. Turn on PC14 by writing 1 to bit14 of GPIOC ODR
GPIOC->ODR |= (1U<<14);
//6. Delay for some time/
for(int i =0; i<180000; i++) {}
}
}`;

const p: Practical = {
  id: 'p02-led-blink',
  order: 2,
  title: 'LED blinking with a software delay',
  unit: 2,
  objective: 'Blink the on-board LED (PC13), LED2 (PB9), and LED1/LED2 alternately, using an infinite loop and busy-wait delay loops.',
  components: ['STM32F401CCU6 Black Pill', 'On-board LED PC13', 'Extension board LEDs PC14 and PB9'],
  connections: [
    { pin: 'PC13', to: 'On-board LED (active-low)', mode: 'Output' },
    { pin: 'PB9', to: 'LED2 (active-high)', mode: 'Output' },
    { pin: 'PC14', to: 'LED1 (active-high)', mode: 'Output' },
  ],
  expected: md`The LED(s) flash continuously, roughly a few times per second. In the alternate program PB9 and PC14 are always in opposite states (one ON while the other is OFF). The exact rate depends on the clock (16 MHz) and on compiler optimisation.`,
  sources: [{ file: 'Lab_2/blink.txt' }, { file: 'Lab_2/LED_Blinking.txt' }, { file: 'Lab_1/Emb-kit Manual.docx', detail: 'program 2 (PB9 + PC14) and a PC13 variant with a 720000 OFF delay' }],
  circuit: { leds: [{ pin: 'PC13', label: 'USER LED', activeLow: true }, { pin: 'PB9', label: 'LED2' }, { pin: 'PC14', label: 'LED1' }] },
  programs: [
    {
      id: 'blink',
      title: 'blink.txt — PC13',
      file: 'Lab_2/blink.txt',
      code: BLINK,
      corrected: {
        code: md`#include "stm32f4xx.h"
static void delay(volatile uint32_t n) { while (n--) { } }   // volatile: not optimised away
int main(void) {
    RCC->AHB1ENR |= (1U << 2);                      // GPIOC clock
    GPIOC->MODER = (GPIOC->MODER & ~(3U << 26)) | (1U << 26);   // PC13 output
    while (1) {
        GPIOC->ODR |=  (1U << 13);                  // LED OFF (active-low)
        delay(180000);
        GPIOC->ODR &= ~(1U << 13);                  // LED ON
        delay(180000);
    }
}`,
        changes: [
          'The delay counter is «volatile», so an optimising compiler (-O1 and above) cannot delete the empty loop.',
          'MODER13 field cleared before setting.',
          'Behaviour is otherwise identical; for an accurate period use SysTick (practical P08).',
        ],
      },
      explain: [
        { lines: [4, 4], what: 'Enable the GPIOC clock.', why: 'Port C must be clocked before configuration.', register: 'RCC_AHB1ENR bit 2' },
        { lines: [6, 6], what: 'PC13 → output (MODER13 = 01).', why: 'Bit 26 set; bit 27 is 0 from reset.', register: 'GPIOC_MODER bits 27:26' },
        { lines: [7, 7], what: 'Start the super-loop.', why: 'Embedded firmware runs forever; the blink must repeat.', internal: 'Compiles to a branch back to the top of the loop body.', ifRemoved: 'The LED would flash once and the program would fall off the end of main.' },
        { lines: [9, 9], what: 'PC13 HIGH → LED OFF.', why: 'Active-low LED: a 1 stops the current. The comment “Turn off … writing 1” is correct.', register: 'GPIOC_ODR bit 13 = 1' },
        { lines: [11, 11], what: 'Software delay (busy-wait).', why: 'Without it the LED would toggle millions of times per second and look permanently half-lit.', internal: 'The CPU executes ~180 000 iterations of compare/increment/branch (several cycles each at 16 MHz ≈ tens of ms to 0.1 s). With optimisation on, the compiler may remove the loop because «i» has no visible effect.', ifRemoved: 'LED appears continuously on (dim) — the eye cannot see the switching.' },
        { lines: [13, 13], what: 'PC13 LOW → LED ON.', why: 'Clear bit 13 only.', register: 'GPIOC_ODR bit 13 = 0' },
        { lines: [15, 15], what: 'Second delay.', why: 'Equal ON and OFF times → 50 % duty blink. The kit-manual version uses 720000 here, so the LED is ON four times longer than OFF.', ifRemoved: 'LED would be ON only for the few cycles before line 9 runs again → it would look OFF.' },
      ],
    },
    {
      id: 'pb9',
      title: 'LED_Blinking.txt — PB9',
      file: 'Lab_2/LED_Blinking.txt',
      code: PB9,
      corrected: {
        code: md`#include "stm32f4xx.h"
int main(void)
{
    RCC->AHB1ENR |= (1U << 1);       // clock to port B
    GPIOB->MODER |=  (1U << 18);     // MODER9 = 01: bit 18 = 1
    GPIOB->MODER &= ~(1U << 19);     //              bit 19 = 0
    while (1) {
        GPIOB->ODR |=  (1U << 9);    // LED2 ON
        for (volatile int i = 0; i <= 500000; i++) { }
        GPIOB->ODR &= ~(1U << 9);    // LED2 OFF
        for (volatile int i = 0; i <= 500000; i++) { }
    }
}`,
        changes: ['Fixed the misleading comment “26th 1 and 27th 0” — PB9 uses MODER bits 18 and 19.', '«volatile» loop counters.', 'Indentation.'],
      },
      explain: [
        { lines: [4, 4], what: 'Enable GPIOB clock.', why: 'PB9 is on port B.', register: 'RCC_AHB1ENR bit 1' },
        { lines: [5, 6], what: 'MODER9 = 01.', why: 'Set bit 18 and clear bit 19 (2 × 9 = 18). The inline comment mentions 26/27, copied from the PC13 program — it is wrong for PB9.', register: 'GPIOB_MODER bits 19:18' },
        { lines: [8, 8], what: 'Infinite loop.', why: 'Repeat the blink forever.' },
        { lines: [9, 9], what: 'PB9 HIGH → LED2 ON.', why: 'Active-high LED.', register: 'GPIOB_ODR bit 9' },
        { lines: [10, 10], what: 'Delay ≈ 500 001 iterations.', why: 'Visible ON time (longer than blink.txt’s 180 000, so a slower blink).' },
        { lines: [11, 12], what: 'LED2 OFF and delay.', why: 'Completes one blink period.' },
      ],
    },
    {
      id: 'alt',
      title: 'Kit manual — PB9 and PC14 alternately',
      file: 'Lab_1/Emb-kit Manual.docx (program 2)',
      code: ALT,
      explain: [
        { lines: [5, 7], what: 'Enable GPIOB and GPIOC clocks.', why: 'The program uses one pin on each port; each port needs its own clock bit.', register: 'RCC_AHB1ENR bits 1 and 2' },
        { lines: [9, 11], what: 'PB9 and PC14 outputs.', why: 'MODER9 → bit 18, MODER14 → bit 28.', register: 'GPIOB_MODER bit 18, GPIOC_MODER bit 28' },
        { lines: [14, 16], what: 'PB9 ON, PC14 OFF.', why: 'Opposite states: one LED lit at a time.' },
        { lines: [18, 18], what: 'Delay.', why: 'Hold this state visibly.' },
        { lines: [20, 22], what: 'PB9 OFF, PC14 ON.', why: 'Swap the states.' },
        { lines: [24, 24], what: 'Delay.', why: 'Hold the swapped state, then loop.' },
      ],
    },
  ],
  flow: [
    { label: 'Reset and start-up', detail: 'Clock = HSI 16 MHz; main() starts.', kind: 'start' },
    { label: 'Enable GPIO clock(s)', detail: 'RCC_AHB1ENR bit for each port used.', kind: 'init' },
    { label: 'Configure output pins', detail: 'MODER fields = 01.', kind: 'init' },
    { label: 'LED → first state', detail: 'Write ODR (PC13: 1 = OFF; PB9: 1 = ON).', kind: 'loop' },
    { label: 'Delay loop', detail: 'Busy-wait ~180 000 or 500 000 iterations.', kind: 'loop' },
    { label: 'LED → opposite state', detail: 'Clear/set the ODR bit.', kind: 'io' },
    { label: 'Delay loop, repeat', detail: 'Back to the top of while(1).', kind: 'loop' },
  ],
  sim: { id: 'gpio', preset: 'blink' },
  exam: {
    viva: [
      { q: 'Why is a delay needed between ON and OFF?', a: 'The CPU toggles the pin in microseconds; without a delay the eye sees only an average dim glow.' },
      { q: 'Why is the software delay inaccurate?', a: 'Its duration depends on the clock frequency, the instructions the compiler generates and the optimisation level; an optimiser may even delete it. SysTick gives exact timing.' },
      { q: 'What does while(1) do and why is it needed?', a: 'It repeats the blink forever; firmware never terminates.' },
    ],
    registerQs: [
      { q: 'Which statement toggles PB9 in a single line?', a: 'GPIOB->ODR ^= (1U<<9);' },
      { q: 'Rewrite the PC13 ON/OFF with BSRR.', a: 'OFF: GPIOC->BSRR = (1U<<13); ON: GPIOC->BSRR = (1U<<29);' },
    ],
    pinQs: [{ q: 'Which MODER bits are used for PB9 and PC14?', a: 'PB9: bits 19:18 of GPIOB_MODER; PC14: bits 29:28 of GPIOC_MODER.' }],
    outputQs: [
      { q: 'In the kit-manual PC13 variant the second delay is 720000. What do you observe?', a: 'The LED stays ON four times longer than OFF (ON after line 13, the 720000 delay is the ON period).' },
      { q: 'What changes if the loop limit is halved?', a: 'The blink becomes twice as fast.' },
    ],
    debugQs: [
      { q: 'With optimisation -O2 the LED seems always on. Why?', a: 'The empty for-loops were removed; declare the counter volatile or use SysTick.' },
      { q: 'Only PB9 blinks in the alternate program; PC14 never lights. Likely cause?', a: 'GPIOC clock not enabled or MODER14 written to the wrong bit (e.g. bit 14 instead of 28).' },
    ],
    errors: ['Wrong MODER bit (n instead of 2n).', 'Missing second delay → LED looks off/on.', 'Forgetting to enable a second port’s clock.', 'Expecting precise timing from a for-loop.'],
    modifications: ['Make the LED blink faster/slower.', 'Blink with ^= toggle instead of two writes.', 'Blink PC13, PC14, PB9 in a running sequence.', 'Blink N times then stop.', 'Replace the delay with SysTick (P08).'],
    explainToExaminer: md`“After enabling the port clock and setting the pin as output, the program loops forever: it writes the LED ON, wastes time in a counting loop so the state is visible, writes the LED OFF and waits again. PC13 is active-low, so writing 1 turns it off. The delay is a software busy-wait, so its length depends on the CPU clock and compiler; SysTick would make it exact.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= (1U<<2);', 'GPIOC->MODER |= (1U<<26);', 'while (1) {', 'GPIOC->ODR |= (1U<<13);   // OFF', 'for (int i = 0; i < 180000; i++) {}', 'GPIOC->ODR &= ~(1U<<13);  // ON', 'for (int i = 0; i < 180000; i++) {}', '}'],
    patterns: [
      { name: 'Software delay', code: 'for (volatile int i = 0; i < N; i++) { }' },
      { name: 'Toggle', code: 'GPIOx->ODR ^= (1U << n);' },
    ],
    skeleton: md`#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<2);
    GPIOC->MODER |= (1U<<26);
    while (1) {
        GPIOC->ODR ^= (1U<<13);
        for (volatile int i = 0; i < 180000; i++) {}
    }
}`,
  },
  topics: ['leds-switches', 'gpio-registers', 'bit-manipulation', 'systick'],
};

export default p;
