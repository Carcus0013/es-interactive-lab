import type { Practical } from '../../types';
import { md } from '../md';

const LAB4 = md`#include "stm32f4xx.h"
int main(void) {
// 1. Enable GPIOB & GPIOC clock
RCC->AHB1ENR |= (1U << 1);  // GPIOB
RCC->AHB1ENR |= (1U << 2);  // GPIOC
// 2. Set PB10 to input mode with pull-up
GPIOB->MODER &= ~(3U << 20);   // MODER10 = 00 (input)0
GPIOB->PUPDR &= ~(3U << 20);   // clear PUPDR10
GPIOB->PUPDR |=  (1U << 20);   // set pull-up (01)
// 3. Set PC14 to output mode
GPIOC->MODER &= ~(3U << 28);   // MODER14 = 00
GPIOC->MODER |=  (1U << 28);   // MODER14 = 01 (output)
while (1) {
if (GPIOB->IDR & (1U << 10)) {
GPIOC->ODR &= ~(1U << 14); // LED OFF
} else {
GPIOC->ODR |=  (1U << 14); // LED ON (active high)
}
}
}`;

const DUAL = md`// Control the status of LED 1 at PC14 by Switch S1 at PB10 and status of LED 2 at PB9 by Switch S2 at PA6
// Digital output : LED 1 at PC 14  and LED 2 at PB 9
// Digital Input: Switch S1 at PB10  and Switch S2 at PA6
#include "stm32f4xx.h"
int main(void) {
/*1. Enable GPIOA clock by Writing 1 to bit0 of AHB1ENR*/
RCC->AHB1ENR |=(1U<<0);
/*2. Enable GPIOB clock by writing 1 to bit1 of AHB1ENR*/
RCC->AHB1ENR |=(1U<<1);
/*2. Enable GPIOC clock by writing 1 to bit2 of AHB1ENR*/
RCC->AHB1ENR |=(1U<<2);
/*3. Set PB10 to input mode by writing 0 to bit20 of and bit 21 of MODER*/
GPIOB->MODER |=(0U<<20);
GPIOB->MODER |=(0U<<21);
GPIOB->PUPDR &= ~0x00300000; /* clear pull-up/pull-down bits for PB10*/
GPIOB->PUPDR |= 0x00100000; /* set pull-up for PB10 */
[/*3. Set PA6 to input mode by writing 0 to bit12 of and bit 13 of MODER*/
GPIOA->MODER |=(0U<<12);
GPIOA->MODER |=(0U<<13);
GPIOA->PUPDR &= ~0x00003000; /* clear pull-up/pull-down bits for PA6*/
GPIOA->PUPDR |= 0x00001000; /* set pull-up for PA6 */
///////////////////////////
/*4. Set PC14 to output mode by writing 1 to bit  28 of MODER*/
GPIOC->MODER |=(1U<<28);
/*4. Set PB9 to output mode by writing 1 to bit  18 of MODER*/
GPIOB->MODER |=(1U<<18);
while (1) {
/*5. Check if input S1 at PB10  is high by checking if bit10 of port B is 1*/
if(GPIOB->IDR & (1U<<10)) {
/*6. Turn off LED1 at PC14 by writing 0 to bit14 of ODR*/
GPIOC->ODR &=~(1U<<14);
}
else{
/*7. Turn on LED1 at PC14 by writing 1 to bit14 of ODR */
GPIOC->ODR |=(1U<<14);
}
///////////////////////
/*5. Check if input S2 (PA6)  is high by checking if bit6 of port A is 1*/
if(GPIOA->IDR & (1U<<6)) {
/*6. Turn off  LED2 at  PB9 by writing 0 to bit9 of ODR*/
GPIOB->ODR &=~(1U<<9);
}
else{
/*7. Turn on LED2 at PB9 by writing 1 to bit9 of ODR */
GPIOB->ODR |=(1U<<9);
}
}
}`;

const p: Practical = {
  id: 'p04-switch-led',
  order: 4,
  title: 'Switches S1/S2 control LED1/LED2',
  unit: 2,
  objective: 'Interface the extension-board switches (PB10, PA6) with internal pull-ups and drive the active-high LEDs (PC14, PB9): each LED is ON while its switch is pressed.',
  components: ['STM32F401CCU6 Black Pill', 'Switch S1 on PB10, switch S2 on PA6 (to GND)', 'LED1 on PC14, LED2 on PB9 (active-high)'],
  connections: [
    { pin: 'PB10', to: 'S1 → GND', mode: 'Input, pull-up' },
    { pin: 'PA6', to: 'S2 → GND', mode: 'Input, pull-up' },
    { pin: 'PC14', to: 'LED1 → R → GND', mode: 'Output' },
    { pin: 'PB9', to: 'LED2 → R → GND', mode: 'Output' },
  ],
  expected: md`Holding S1 lights LED1 (PC14); releasing turns it off. In the dual program, S2 controls LED2 (PB9) the same way, independently. (Here “switch pressed → LED ON”, unlike Lab 3, because these LEDs are active-high.)`,
  sources: [{ file: 'Lab_4/switch interface PB10_LED_interface_PC14.docx' }, { file: 'Lab_1/Emb-kit Manual.docx', detail: 'program 4 (two switches, two LEDs)' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }, { pin: 'PB9', label: 'LED2' }], switches: [{ pin: 'PB10', label: 'S1', pull: 'up' }, { pin: 'PA6', label: 'S2', pull: 'up' }] },
  programs: [
    {
      id: 'lab4',
      title: 'Lab 4 — PB10 → PC14',
      file: 'Lab_4/switch interface PB10_LED_interface_PC14.docx',
      code: LAB4,
      explain: [
        { lines: [4, 5], what: 'Enable GPIOB and GPIOC clocks.', why: 'Switch on port B, LED on port C.', register: 'RCC_AHB1ENR bits 1, 2' },
        { lines: [7, 7], what: 'PB10 input (MODER10 = 00).', why: '2 × 10 = 20 → bits 21:20 cleared.', register: 'GPIOB_MODER bits 21:20', internal: 'Proper clearing with &= ~(3U<<20) — compare the kit-manual version.' },
        { lines: [8, 9], what: 'Pull-up on PB10.', why: 'S1 connects to GND; released must read 1.', register: 'GPIOB_PUPDR bits 21:20 = 01', ifRemoved: 'Floating input → LED flickers.' },
        { lines: [11, 12], what: 'PC14 output.', why: 'MODER14 bits 29:28 = 01.', register: 'GPIOC_MODER' },
        { lines: [14, 15], what: 'Released (IDR10 = 1) → LED OFF.', why: 'Active-high LED: clear ODR14 to switch it off.', register: 'GPIOB_IDR bit 10, GPIOC_ODR bit 14' },
        { lines: [16, 17], what: 'Pressed (IDR10 = 0) → LED ON.', why: 'Set ODR14 → PC14 HIGH → current through LED1.' },
      ],
    },
    {
      id: 'dual',
      title: 'Kit manual — two switches, two LEDs',
      file: 'Lab_1/Emb-kit Manual.docx (program 4)',
      code: DUAL,
      corrected: {
        code: md`#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<0) | (1U<<1) | (1U<<2);           // GPIOA, B, C
    GPIOB->MODER &= ~(3U<<20);                             // PB10 input
    GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U<<20)) | (1U<<20);  // pull-up
    GPIOA->MODER &= ~(3U<<12);                             // PA6 input
    GPIOA->PUPDR = (GPIOA->PUPDR & ~(3U<<12)) | (1U<<12);  // pull-up
    GPIOC->MODER = (GPIOC->MODER & ~(3U<<28)) | (1U<<28);  // PC14 output
    GPIOB->MODER = (GPIOB->MODER & ~(3U<<18)) | (1U<<18);  // PB9 output
    while (1) {
        if (GPIOB->IDR & (1U<<10)) GPIOC->ODR &= ~(1U<<14); else GPIOC->ODR |= (1U<<14);
        if (GPIOA->IDR & (1U<<6))  GPIOB->ODR &= ~(1U<<9);  else GPIOB->ODR |= (1U<<9);
    }
}`,
        changes: [
          'Line 17 starts with a stray «[» — a **syntax error**; the program does not compile as supplied.',
          'Lines 13–14 and 18–19 «MODER |= (0U<<n)» do nothing; replaced by «&= ~(3U<<2n)».',
          'Field writes combined; behaviour otherwise identical.',
        ],
      },
      explain: [
        { lines: [7, 11], what: 'Enable clocks for ports A, B, C.', why: 'Inputs on A and B, outputs on B and C.', register: 'RCC_AHB1ENR bits 0, 1, 2' },
        { lines: [13, 14], what: '“Set PB10 input” — no effect.', why: 'OR with zero leaves MODER unchanged; input works only because of the reset value.', internal: 'GPIOB_MODER resets to 0x0000 0280; bits 21:20 are 0.' },
        { lines: [15, 16], what: 'PB10 pull-up with hex masks.', why: '0x0030 0000 = bits 21:20; 0x0010 0000 = 01.', register: 'GPIOB_PUPDR' },
        { lines: [17, 17], what: 'Stray “[” — compile error.', why: 'Typo in the supplied document; delete it.', ifRemoved: 'Removing it fixes the build.' },
        { lines: [20, 21], what: 'PA6 pull-up.', why: '0x3000 = bits 13:12.', register: 'GPIOA_PUPDR' },
        { lines: [24, 26], what: 'PC14 and PB9 outputs.', why: 'Bits 28 and 18.' },
        { lines: [29, 36], what: 'S1 → LED1.', why: 'Released → OFF, pressed → ON.' },
        { lines: [39, 46], what: 'S2 → LED2.', why: 'Same pattern on PA6/PB9; both checks run every loop pass so the LEDs respond independently.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Enable port clocks', detail: 'A, B, C as needed.', kind: 'init' },
    { label: 'Switch pins: input + pull-up', detail: 'PB10 (and PA6).', kind: 'init' },
    { label: 'LED pins: output', detail: 'PC14 (and PB9).', kind: 'init' },
    { label: 'S1 pressed? (IDR10 == 0)', detail: 'Read GPIOB_IDR bit 10.', kind: 'decision' },
    { label: 'Drive LED1', detail: 'Pressed → ODR14 = 1 (ON); released → 0 (OFF).', kind: 'loop' },
    { label: 'Same for S2 → LED2, repeat', detail: 'Read PA6, drive PB9, loop forever.', kind: 'loop' },
  ],
  sim: { id: 'gpio', preset: 'dual' },
  exam: {
    viva: [
      { q: 'Why does pressing S1 turn LED1 ON here, but pressing the user key turned PC13 OFF in Lab 3?', a: 'Both switches read 0 when pressed, but LED1 is active-high (needs ODR = 1) while PC13 is active-low; the programs also use the opposite branch assignment.' },
      { q: 'What is the purpose of the pull-up on PB10?', a: 'To hold the input HIGH when the switch is open so the reading is defined.' },
    ],
    registerQs: [
      { q: 'Which PUPDR bits enable the pull-up on PA6 and what mask is used?', a: 'Bits 13:12; clear with 0x3000, set 0x1000 (01).' },
      { q: 'Write one statement to configure PB10 as input without relying on reset values.', a: 'GPIOB->MODER &= ~(3U<<20);' },
    ],
    pinQs: [{ q: 'List the kit switches and LEDs with their pins.', a: 'S1 PB10, S2 PA6, LED1 PC14, LED2 PB9, user LED PC13, user key PA0.' }],
    outputQs: [{ q: 'Both switches are held. What do you see?', a: 'Both LED1 and LED2 are ON.' }],
    debugQs: [
      { q: 'The kit-manual program gives “error: expected expression” at line 17. Fix?', a: 'Delete the stray “[” before the comment.' },
      { q: 'LED2 never lights although S2 works. Possible causes?', a: 'PB9 not configured as output (wrong MODER bit), or GPIOB clock missing; check ODR9 in the debugger.' },
    ],
    errors: ['Stray characters copied from documents (the “[” bug).', 'Using |= (0U<<n) to clear.', 'Mixing up 0x0030 0000 (bits 21:20) and 0x0003 0000 (bits 17:16).'],
    modifications: ['S1 toggles LED1 on each press.', 'S1 turns LED1 on, S2 turns it off (latching).', 'Use interrupts instead of polling (practical P10).', 'Light both LEDs only when both switches are pressed (AND logic).'],
    explainToExaminer: md`“S1 and S2 are inputs with internal pull-ups, so they read 1 when released and 0 when pressed. The LEDs are active-high outputs. In the loop I mask each input bit: if it is 1 I clear the LED's ODR bit, otherwise I set it. Each switch therefore controls its own LED in real time by polling.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= (1U<<0)|(1U<<1)|(1U<<2);', 'GPIOB->MODER &= ~(3U<<20); GPIOB->PUPDR |= (1U<<20);', 'GPIOA->MODER &= ~(3U<<12); GPIOA->PUPDR |= (1U<<12);', 'GPIOC->MODER |= (1U<<28); GPIOB->MODER |= (1U<<18);', 'if (GPIOB->IDR & (1U<<10)) GPIOC->ODR &= ~(1U<<14); else GPIOC->ODR |= (1U<<14);'],
    patterns: [{ name: 'Pin numbers × 2', code: 'PA6 → 12, PB9 → 18, PB10 → 20, PC13 → 26, PC14 → 28' }],
    skeleton: md`int main(void){
    clocks;  inputs+pullups;  outputs;
    while(1){
        if (S1 released) LED1 off; else LED1 on;
        if (S2 released) LED2 off; else LED2 on;
    }
}`,
  },
  topics: ['leds-switches', 'pull-resistors', 'gpio-registers', 'bit-manipulation'],
};

export default p;
