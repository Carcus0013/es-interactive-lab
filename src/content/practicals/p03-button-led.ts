import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"

int main(void) {
    // 1. Enable GPIOA & GPIOC clock
    RCC->AHB1ENR |= (1U<<0);  // GPIOA
    RCC->AHB1ENR |= (1U<<2);  // GPIOC

    // 2. Set PA0 to input mode
    GPIOA->MODER &= ~(3U << 0);  // MODER0 = 00 (input)
    GPIOA->PUPDR &= ~(3U << 0);  // clear PUPDR0
    GPIOA->PUPDR |=  (1U << 0);  // set PA0 pull-up (01)

    // 3. Set PC13 to output mode
    GPIOC->MODER &= ~(3U << 26); // MODER13 = 00
    GPIOC->MODER |=  (1U << 26); // MODER13 = 01 (output)

    while (1) {
        // 4. Read PA0, drive PC13
        if (GPIOA->IDR & (1U << 0)) {
            GPIOC->ODR &= ~(1U << 13); // LED ON
        } else {
            GPIOC->ODR |=  (1U << 13); // LED OFF
        }
    }
}`;

const KIT = md`// Control the status of User LED (PC13) by the User Button ( Key at PA0)
#include "stm32f4xx.h"
int main(void) {
/*1. Enable GPIOA clock by Writing 1 to bit0 of AHB1ENR*/
RCC->AHB1ENR |=(1U<<0);
/*2. Enable GPIOC clock by writing 1 to bit2 of AHB1ENR*/
RCC->AHB1ENR |=(1U<<2);
/*3. Set PA0 to input mode by writing 0 to bit0 of and bit 1 of MODER*/
GPIOA->MODER |=(0U<<0);
GPIOA->MODER |=(0U<<1);
GPIOA->PUPDR &= ~0x00000003; /* clear pull-up/pull-down bits for PA0*/
GPIOA->PUPDR |= 0x00000001; /* set pull-up for PA0 */
/*4. Set PC13 to output mode by writing 1 to bit  26 of MODER*/
GPIOC->MODER |=(1U<<26);
while (1) {
/*5. Check if input is high by checking if bit0 of port A is 1*/
if(GPIOA->IDR & (1U<<0)) {
/*6. Turn on PC13 by writing 0 to bit13 of ODR*/
GPIOC->ODR &=~(1U<<13);
}
else{
/*7. Turn off PC13 by writing 1 to bit13 of ODR */
GPIOC->ODR |=(1U<<13);
}
}
}`;

const p: Practical = {
  id: 'p03-button-led',
  order: 3,
  title: 'User key (PA0) controls the on-board LED (PC13)',
  unit: 2,
  objective: 'Read a push button through GPIO input with an internal pull-up and drive an LED from its state using polling.',
  components: ['STM32F401CCU6 Black Pill', 'On-board USER KEY on PA0 (to GND when pressed)', 'On-board USER LED on PC13 (active-low)'],
  connections: [
    { pin: 'PA0', to: 'USER KEY → GND', mode: 'Input, internal pull-up (PUPDR = 01)' },
    { pin: 'PC13', to: 'USER LED (anode → 3.3 V)', mode: 'Output' },
  ],
  expected: md`**LED ON while the key is released, OFF while it is held.** With the pull-up, released → PA0 = 1 → the program clears PC13 → active-low LED lights. Pressing pulls PA0 to 0 → PC13 set → LED off. (The comments say “LED ON” for the input-high branch — that is the *released* state.)`,
  sources: [{ file: 'Lab_3/Button_LED.txt' }, { file: 'Lab_1/Emb-kit Manual.docx', detail: 'program 3' }, { file: 'Day05_Lecture01_GPIO_Configuration_Registers.pptx', detail: 'slides 15, 28, 31' }],
  circuit: { leds: [{ pin: 'PC13', label: 'USER LED', activeLow: true }], switches: [{ pin: 'PA0', label: 'USER KEY', pull: 'up' }] },
  programs: [
    {
      id: 'lab3',
      title: 'Button_LED.txt',
      file: 'Lab_3/Button_LED.txt',
      code: CODE,
      corrected: {
        code: md`#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<0) | (1U<<2);           // GPIOA, GPIOC clocks
    GPIOA->MODER &= ~(3U << 0);                  // PA0 input
    GPIOA->PUPDR = (GPIOA->PUPDR & ~(3U << 0)) | (1U << 0);   // pull-up
    GPIOC->MODER = (GPIOC->MODER & ~(3U << 26)) | (1U << 26); // PC13 output
    while (1) {
        if ((GPIOA->IDR & (1U << 0)) == 0)       // key PRESSED (reads 0)
            GPIOC->ODR &= ~(1U << 13);           // LED ON while pressed
        else
            GPIOC->ODR |=  (1U << 13);           // LED OFF when released
    }
}`,
        changes: ['Inverted the test so the LED is ON **while the key is pressed** — the usual intent of “button controls LED”. The original is correct code; it just implements the opposite behaviour (ON when released).', 'Combined clock enables; single-statement field writes.'],
      },
      explain: [
        { lines: [5, 6], what: 'Enable GPIOA and GPIOC clocks.', why: 'Two ports are used: the key on port A, the LED on port C.', register: 'RCC_AHB1ENR bits 0 and 2', ifRemoved: 'Without port A’s clock, IDR reads 0 → the program thinks the key is always pressed.' },
        { lines: [9, 9], what: 'PA0 → input (MODER0 = 00).', why: 'Inputs must not drive the pin. The reset value of GPIOA_MODER is 0xA800 0000, so bits 1:0 are already 00, but clearing is safe practice.', register: 'GPIOA_MODER bits 1:0' },
        { lines: [10, 11], what: 'Enable the internal pull-up on PA0.', why: 'The key connects PA0 to GND when pressed; when released nothing drives the pin, so a pull-up is required to read a defined 1.', register: 'GPIOA_PUPDR bits 1:0 = 01', internal: 'A ~40 kΩ resistor inside the pin connects it to V_DD.', ifRemoved: 'PA0 floats when released and reads random 0/1 → the LED flickers or behaves randomly.' },
        { lines: [14, 15], what: 'PC13 → output (clear then set the field).', why: 'MODER13 = 01.', register: 'GPIOC_MODER bits 27:26' },
        { lines: [17, 17], what: 'Super-loop (polling).', why: 'Read the key continuously and update the LED.' },
        { lines: [19, 19], what: 'Test PA0.', why: '«IDR & (1U<<0)» is non-zero only when PA0 is HIGH, i.e. the key is released.', register: 'GPIOA_IDR bit 0', internal: 'The Schmitt-trigger input samples the pin every AHB clock; the AND masks off the other 15 pins.' },
        { lines: [20, 20], what: 'Released → PC13 LOW → LED ON.', why: 'Active-low LED.', register: 'GPIOC_ODR bit 13 = 0' },
        { lines: [21, 23], what: 'Pressed → PC13 HIGH → LED OFF.', why: 'The else branch handles PA0 = 0.' },
      ],
    },
    {
      id: 'kit',
      title: 'Kit manual version',
      file: 'Lab_1/Emb-kit Manual.docx (program 3)',
      code: KIT,
      corrected: {
        code: md`GPIOA->MODER &= ~(3U << 0);   // replaces lines 9–10: actually clears MODER0`,
        changes: ['Lines 9–10 «GPIOA->MODER |= (0U<<0);» are **no-ops**: OR-ing with 0 changes nothing. Input mode only works because MODER0 is already 00 after reset. To force input you must clear with «&= ~(3U<<0)».'],
      },
      explain: [
        { lines: [5, 7], what: 'Enable GPIOA and GPIOC clocks.', why: 'Same as Lab 3.', register: 'RCC_AHB1ENR bits 0, 2' },
        { lines: [9, 10], what: 'Intended: PA0 input — but these lines do nothing.', why: '«x |= 0» leaves x unchanged.', internal: 'Works only because the reset value already makes PA0 an input.', ifRemoved: 'No change in behaviour (they had no effect).' },
        { lines: [11, 12], what: 'Pull-up on PA0 using hex masks.', why: '0x3 clears bits 1:0, 0x1 writes 01.', register: 'GPIOA_PUPDR' },
        { lines: [14, 14], what: 'PC13 output.', why: 'MODER13 bit 26.' },
        { lines: [17, 24], what: 'Same if/else as Lab 3.', why: 'Released → LED ON; pressed → LED OFF. The comment “Turn on PC13 by writing 0” is correct for the active-low LED.' },
      ],
    },
  ],
  flow: [
    { label: 'Reset, main()', detail: 'HSI 16 MHz.', kind: 'start' },
    { label: 'Enable GPIOA, GPIOC clocks', detail: 'RCC_AHB1ENR bits 0 and 2.', kind: 'init' },
    { label: 'PA0 input + pull-up', detail: 'MODER0 = 00, PUPDR0 = 01.', kind: 'init' },
    { label: 'PC13 output', detail: 'MODER13 = 01.', kind: 'init' },
    { label: 'Read GPIOA->IDR bit 0', detail: 'Key released → 1; pressed → 0.', kind: 'loop' },
    { label: 'PA0 == 1 ?', detail: 'Decision on the key state.', kind: 'decision' },
    { label: 'Update PC13', detail: 'Released: ODR13 = 0 (LED ON). Pressed: ODR13 = 1 (LED OFF). Loop again.', kind: 'io' },
  ],
  sim: { id: 'gpio', preset: 'button' },
  exam: {
    viva: [
      { q: 'Why is a pull-up enabled on PA0?', a: 'The key only connects PA0 to GND; when released the pin would float. The pull-up gives a defined HIGH.' },
      { q: 'What value does IDR bit 0 have when the key is pressed?', a: '0 — the pin is shorted to ground.' },
      { q: 'Is this program polling or interrupt-driven?', a: 'Polling: the while(1) loop reads IDR continuously. Lab 7 shows the interrupt version.' },
      { q: 'Why does the LED stay ON when nobody touches the key?', a: 'Released → PA0 = 1 → the if branch clears PC13 → active-low LED ON.' },
    ],
    registerQs: [
      { q: 'Which register is read to know the key state?', a: 'GPIOA_IDR (offset 0x10), bit 0.' },
      { q: 'What does GPIOA->PUPDR |= 0x00000001 do?', a: 'Sets PUPDR0 = 01 → pull-up on PA0.' },
    ],
    pinQs: [{ q: 'PA0 is also the potentiometer input. Can both be used at the same time?', a: 'No — the pin is either a digital input for the key or an analog ADC input (MODER = 11) for the pot; the kit’s pot and key share PA0.' }],
    outputQs: [
      { q: 'What happens if PUPDR0 is set to 10 (pull-down)?', a: 'Released → PA0 = 0, pressed → still 0 → IDR always 0 → LED always OFF.' },
      { q: 'What if the condition is changed to !(GPIOA->IDR & 1)?', a: 'The behaviour inverts: LED ON only while the key is pressed.' },
    ],
    debugQs: [
      { q: 'The LED flickers randomly when the key is not touched. Cause?', a: 'No pull-up (PUPDR0 = 00) → floating input.' },
      { q: 'Pressing the key does nothing; the LED stays on. Cause?', a: 'GPIOA clock off (IDR reads 0 constantly would actually keep it OFF) — check the clock, or the condition polarity, or that the code was downloaded.' },
    ],
    errors: ['Testing «GPIOA->IDR == 1» (fails if other pins are high) instead of masking.', 'Forgetting the pull-up.', 'Assuming pressed = 1.', 'Using «|= (0U<<n)» to clear MODER bits.'],
    modifications: ['LED ON only while the key is pressed.', 'Toggle the LED on each press (edge detection + debounce).', 'Use S1 (PB10) to control LED1 (PC14) — practical P04.', 'Count presses and blink the LED that many times.'],
    explainToExaminer: md`“PA0 is the user key wired to ground, so I configure it as input with the internal pull-up: released reads 1, pressed reads 0. PC13 is the active-low LED. In the infinite loop I mask IDR bit 0: if it is 1 (released) I clear ODR13 to light the LED, else I set ODR13 to switch it off. This is polling — the CPU checks the pin continuously.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= (1U<<0) | (1U<<2);', 'GPIOA->MODER &= ~(3U<<0);', 'GPIOA->PUPDR &= ~(3U<<0); GPIOA->PUPDR |= (1U<<0);', 'GPIOC->MODER &= ~(3U<<26); GPIOC->MODER |= (1U<<26);', 'while(1){ if (GPIOA->IDR & (1U<<0)) GPIOC->ODR &= ~(1U<<13); else GPIOC->ODR |= (1U<<13); }'],
    patterns: [
      { name: 'Input with pull-up', code: 'GPIOx->MODER &= ~(3U<<(2*n));\nGPIOx->PUPDR = (GPIOx->PUPDR & ~(3U<<(2*n))) | (1U<<(2*n));' },
      { name: 'Read a pin', code: 'if (GPIOx->IDR & (1U<<n)) { /* HIGH */ } else { /* LOW */ }' },
    ],
    skeleton: md`#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<0) | (1U<<2);
    GPIOA->MODER &= ~(3U<<0);
    GPIOA->PUPDR |= (1U<<0);
    GPIOC->MODER |= (1U<<26);
    while (1) {
        if (GPIOA->IDR & (1U<<0)) GPIOC->ODR &= ~(1U<<13);
        else                      GPIOC->ODR |=  (1U<<13);
    }
}`,
  },
  topics: ['leds-switches', 'pull-resistors', 'gpio-registers', 'io-sync'],
};

export default p;
