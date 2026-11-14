import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"

int main(void)
{
    // 1- Enable GPIOA, GPIOB, and GPIOC clocks
    RCC->AHB1ENR |= (1U << 0);  // Enable clock for GPIOA (1U << 0 corresponds to GPIOAEN)
    RCC->AHB1ENR |= (1U << 1);  // Enable clock for GPIOB (1U << 1 corresponds to GPIOBEN)
    RCC->AHB1ENR |= (1U << 2);  // Enable clock for GPIOC (1U << 2 corresponds to GPIOCEN)

    // 2- Set PC14 as output
    GPIOC->MODER &= ~(0x3 << 28); // Clear mode bits for PC14 (28 is the bit position)
    GPIOC->MODER |= (0x1 << 28);  // Set PC14 to output mode (01)

    // 3- Set PA6 and PB10 as input
    GPIOA->MODER &= ~(0x3 << 12); // Set PA6 to input mode (12 is the bit position for PA6)
    GPIOB->MODER &= ~(0x3 << 20); // Set PB10 to input mode (20 is the bit position for PB10)

    // Enable internal pull-up resistors for PA6 and PB10
    GPIOA->PUPDR &= ~(0x3 << 12); // Clear pull-up/pull-down bits for PA6
    GPIOA->PUPDR |= (0x1 << 12);  // Set pull-up for PA6 (01)

    GPIOB->PUPDR &= ~(0x3 << 20); // Clear pull-up/pull-down bits for PB10
    GPIOB->PUPDR |= (0x1 << 20);  // Set pull-up for PB10 (01)

    // 4- Enable SYSCFG clock
    RCC->APB2ENR |= (1U << 14); // Enable SYSCFG clock (1U << 14 corresponds to SYSCFGEN)

    // 5- Configure EXTI for PA6 and PB10
    SYSCFG->EXTICR[1] &= ~(0xF << 8); // Clear EXTI6 configuration (PA6)
    SYSCFG->EXTICR[1] |= (0x0 << 8);  // Set PA6 as the source input for EXTI6

    SYSCFG->EXTICR[2] &= ~(0xF << 8); // Clear EXTI10 configuration (PB10)
    SYSCFG->EXTICR[2] |= (0x1 << 8);  // Set PB10 as the source input for EXTI10

    // 6- Enable the Interrupt Mask register
    EXTI->IMR |= (1 << 6);   // Unmask EXTI line 6 (PA6)
    EXTI->IMR |= (1 << 10);  // Unmask EXTI line 10 (PB10)

    // 7- Select the Interrupt Trigger
    EXTI->FTSR |= (1 << 6);  // PA6 as Falling trigger
    EXTI->FTSR |= (1 << 10); // PB10 as Falling trigger

    // 8- NVIC Enable
    NVIC_EnableIRQ(EXTI9_5_IRQn);  // Enable EXTI9_5 interrupt (PA6 covers line 5 to 9)
    NVIC_EnableIRQ(EXTI15_10_IRQn); // Enable EXTI15_10 interrupt (PB10 covers line 10 to 15)

    while (1)
    {
        // Main loop - do nothing, waiting for interrupts
    }
}

// EXTI9_5 interrupt handler (PA6 is on EXTI line 6)
void EXTI9_5_IRQHandler(void)
{
    if (EXTI->PR & (1 << 6)) // Check if interrupt is pending on EXTI6
    {
        EXTI->PR |= (1 << 6); // Clear pending interrupt on EXTI6

        // Turn on LED on PC14
        GPIOC->ODR |= (1 << 14);
    }
}

// EXTI15_10 interrupt handler (PB10 is on EXTI line 10)
void EXTI15_10_IRQHandler(void)
{
    if (EXTI->PR & (1 << 10)) // Check if interrupt is pending on EXTI10
    {
        EXTI->PR |= (1 << 10); // Clear pending interrupt on EXTI10

        // Turn off LED on PC14
        GPIOC->ODR &= ~(1 << 14);
    }
}`;

const p: Practical = {
  id: 'p10-gpio-interrupts',
  order: 10,
  title: 'External (EXTI) interrupts: S2 turns LED1 ON, S1 turns it OFF',
  unit: 3,
  objective: 'Configure PA6 (S2) and PB10 (S1) as falling-edge external interrupts through SYSCFG, EXTI and the NVIC; S2 switches LED1 (PC14) on and S1 switches it off, with an empty main loop.',
  components: ['STM32F401CCU6 Black Pill', 'Switches S2 (PA6) and S1 (PB10) to GND', 'LED1 on PC14'],
  connections: [
    { pin: 'PA6', to: 'S2 → GND', mode: 'Input, pull-up, EXTI6 falling edge' },
    { pin: 'PB10', to: 'S1 → GND', mode: 'Input, pull-up, EXTI10 falling edge' },
    { pin: 'PC14', to: 'LED1', mode: 'Output' },
  ],
  expected: md`Press **S2** → LED1 turns ON and **stays on** after release (the interrupt fires once per press). Press **S1** → LED1 turns OFF and stays off. Holding a switch does nothing more. A bouncy switch may fire several times, but because each ISR only sets or clears, the result is the same.`,
  sources: [{ file: 'Lab_7/GPIO_Interupts.c' }, { file: 'Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx', detail: 'Experiment slides 18–21' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }], switches: [{ pin: 'PA6', label: 'S2', pull: 'up' }, { pin: 'PB10', label: 'S1', pull: 'up' }] },
  programs: [
    {
      id: 'exti',
      title: 'GPIO_Interupts.c',
      file: 'Lab_7/GPIO_Interupts.c',
      code: CODE,
      corrected: {
        code: md`void EXTI9_5_IRQHandler(void)
{
    if (EXTI->PR & (1U << 6)) {
        EXTI->PR = (1U << 6);          // write-1-to-clear: clear ONLY line 6
        GPIOC->ODR |= (1U << 14);
    }
}
void EXTI15_10_IRQHandler(void)
{
    if (EXTI->PR & (1U << 10)) {
        EXTI->PR = (1U << 10);         // clear ONLY line 10
        GPIOC->ODR &= ~(1U << 14);
    }
}`,
        changes: [
          '«EXTI->PR |= (1<<6)» is a read-modify-write on a write-1-to-clear register: if another line (e.g. 7) is also pending, its 1 is read and written back, clearing it without servicing. Plain assignment clears only the intended line.',
          'Lines 30 and 33 «|= (0x0 << 8)» are no-ops (OR with 0) — harmless after the clear on the line before.',
          'Optional: add a debounce (ignore edges within ~20 ms using a SysTick millisecond counter).',
        ],
      },
      explain: [
        { lines: [6, 8], what: 'Clocks for ports A, B, C.', why: 'Switches on A and B, LED on C.', register: 'RCC_AHB1ENR bits 0, 1, 2' },
        { lines: [11, 12], what: 'PC14 output.', register: 'GPIOC_MODER bits 29:28 = 01', why: 'LED1.' },
        { lines: [15, 16], what: 'PA6 and PB10 inputs.', why: '6 × 2 = 12, 10 × 2 = 20.', register: 'GPIOA_MODER 13:12, GPIOB_MODER 21:20 = 00' },
        { lines: [19, 23], what: 'Pull-ups on both switches.', why: 'Released = 1, pressed = 0 → a press is a falling edge.', register: 'PUPDR fields = 01', ifRemoved: 'Floating inputs → random edges → spurious interrupts.' },
        { lines: [26, 26], what: 'Enable the SYSCFG clock.', why: 'EXTICR registers live in SYSCFG on APB2.', register: 'RCC_APB2ENR bit 14 (SYSCFGEN)', ifRemoved: 'EXTICR writes ignored → EXTI10 stays on port A (PA10), so S1 never interrupts; EXTI6 still defaults to PA6.' },
        { lines: [29, 30], what: 'EXTI6 ← port A.', why: 'Line 6 is configured in EXTICR2 = «EXTICR[1]» bits 11:8; code 0000 = port A.', register: 'SYSCFG_EXTICR2 bits 11:8', internal: 'Index = 6 / 4 = 1; field = 4 × (6 mod 4) = 8.' },
        { lines: [32, 33], what: 'EXTI10 ← port B.', why: 'Line 10 in EXTICR3 = «EXTICR[2]» bits 11:8; code 0001 = port B.', register: 'SYSCFG_EXTICR3 bits 11:8 = 0001', internal: 'Index = 10 / 4 = 2; field = 4 × (10 mod 4) = 8.' },
        { lines: [36, 37], what: 'Unmask lines 6 and 10.', why: 'Only unmasked lines generate interrupt requests.', register: 'EXTI_IMR bits 6, 10' },
        { lines: [40, 41], what: 'Falling-edge trigger.', why: 'Press = 1 → 0 with pull-up.', register: 'EXTI_FTSR bits 6, 10', ifRemoved: 'No edge selected → PR never sets → no interrupts.' },
        { lines: [44, 45], what: 'Enable the two NVIC lines.', why: 'Lines 5–9 share IRQ 23 (EXTI9_5), lines 10–15 share IRQ 40 (EXTI15_10).', register: 'NVIC_ISER0 bit 23, NVIC_ISER1 bit 8', ifRemoved: 'PR bits set but the CPU is never interrupted.' },
        { lines: [47, 50], what: 'Empty main loop.', why: 'Everything is event-driven; the CPU could sleep here.' },
        { lines: [53, 63], what: 'EXTI9_5 handler (S2).', why: 'Shared by lines 5–9, so it checks PR bit 6, clears it and turns LED1 ON.', register: 'EXTI_PR bit 6, GPIOC_ODR bit 14', internal: 'Exception number 39 → vector at 0x9C. Clearing PR before returning stops immediate re-entry.' },
        { lines: [65, 75], what: 'EXTI15_10 handler (S1).', why: 'Checks PR bit 10, clears it, turns LED1 OFF.', register: 'EXTI_PR bit 10', ifRemoved: 'If PR were not cleared the handler would re-enter forever and the main loop would never run.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Clocks, PC14 output, two inputs', detail: 'Port configuration: PA6 and PB10 are inputs with pull-ups.', kind: 'init' },
    { label: 'SYSCFG clock, EXTICR mapping', detail: 'EXTI6 ← PA, EXTI10 ← PB.', kind: 'init' },
    { label: 'IMR, FTSR, NVIC_EnableIRQ', detail: 'Unmask, falling edge, enable IRQ 23 and 40.', kind: 'init' },
    { label: 'Empty while(1)', detail: 'Wait for events.', kind: 'loop' },
    { label: 'EXTI9_5_IRQHandler (S2 pressed)', detail: 'PR6 set → clear → LED1 ON → return.', kind: 'isr' },
    { label: 'EXTI15_10_IRQHandler (S1 pressed)', detail: 'PR10 set → clear → LED1 OFF → return.', kind: 'isr' },
  ],
  sim: { id: 'exti', preset: 'pa6' },
  exam: {
    viva: [
      { q: 'Why is FTSR used rather than RTSR?', a: 'With a pull-up the pin goes from 1 to 0 when pressed — a falling edge.' },
      { q: 'Why does PA6 use EXTI9_5_IRQHandler?', a: 'EXTI lines 5–9 share one NVIC interrupt; the handler checks PR to see which line fired.' },
      { q: 'What happens if the pending bit is not cleared?', a: 'The interrupt stays pending and the handler re-enters immediately after returning, locking up the CPU.' },
      { q: 'Why enable the SYSCFG clock?', a: 'EXTICR, which maps ports to EXTI lines, is a SYSCFG register on APB2; without its clock the mapping cannot be written.' },
    ],
    registerQs: [
      { q: 'Which EXTICR element and bits select PB10?', a: 'EXTICR[2] (EXTICR3), bits 11:8 = 0001.' },
      { q: 'Write the statements to also trigger on release for line 6.', a: 'EXTI->RTSR |= (1U<<6); (keep FTSR as well for both edges).' },
      { q: 'Which NVIC IRQ numbers are used?', a: 'EXTI9_5_IRQn = 23, EXTI15_10_IRQn = 40.' },
    ],
    pinQs: [{ q: 'Can PB6 and PA6 be used as two separate EXTI interrupts?', a: 'No, both would need EXTI line 6; only one port can be mapped to a line.' }],
    outputQs: [{ q: 'S2 is pressed three times. What happens?', a: 'LED1 turns on at the first press and stays on; later presses just set it again.' }],
    debugQs: [
      { q: 'S2 works but S1 does nothing. Likely causes?', a: 'EXTICR[2] not set to port B (SYSCFG clock missing or wrong index), FTSR/IMR bit 10 missing, or EXTI15_10 not enabled in the NVIC.' },
      { q: 'The program freezes after the first press. Why?', a: 'The ISR does not clear EXTI_PR, so it keeps re-entering.' },
    ],
    errors: ['EXTICR index off by one (EXTICR1 is index 0).', 'Forgetting SYSCFG clock.', 'Using PR |= instead of PR =.', 'Handler name misspelled.', 'Long delays inside the ISR.'],
    modifications: ['S2 toggles LED1 on each press (with debounce).', 'Count presses in the ISR and display on LED2 blink.', 'Give EXTI15_10 a higher priority with NVIC_SetPriority.', 'Wake from __WFI() sleep on a press.', 'Use the user key PA0 on EXTI0.'],
    explainToExaminer: md`“Instead of polling, each switch generates an interrupt. After enabling the port clocks and configuring PA6 and PB10 as inputs with pull-ups, I enable SYSCFG and map EXTI6 to port A and EXTI10 to port B in EXTICR. I unmask both lines in IMR, select falling edges in FTSR because a press pulls the pin low, and enable the shared NVIC IRQs EXTI9_5 and EXTI15_10. In each handler I check and clear the pending bit and set or clear PC14. The main loop is empty.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= 7;  RCC->APB2ENR |= (1U<<14);', 'inputs + pull-ups on PA6, PB10', 'SYSCFG->EXTICR[1] &= ~(0xF<<8);', 'SYSCFG->EXTICR[2] = (SYSCFG->EXTICR[2] & ~(0xF<<8)) | (1<<8);', 'EXTI->IMR |= (1<<6)|(1<<10);  EXTI->FTSR |= (1<<6)|(1<<10);', 'NVIC_EnableIRQ(EXTI9_5_IRQn); NVIC_EnableIRQ(EXTI15_10_IRQn);', 'ISR: if (EXTI->PR & bit) { EXTI->PR = bit; ... }'],
    patterns: [
      { name: 'EXTI mapping', code: 'SYSCFG->EXTICR[n/4] = (SYSCFG->EXTICR[n/4] & ~(0xF << 4*(n%4))) | (PORT << 4*(n%4));' },
      { name: 'ISR skeleton', code: 'void EXTI9_5_IRQHandler(void) {\n    if (EXTI->PR & (1U<<6)) { EXTI->PR = (1U<<6); /* work */ }\n}' },
    ],
    skeleton: md`main: clocks → GPIO → SYSCFG clock → EXTICR → IMR → FTSR → NVIC_EnableIRQ → while(1){}
handlers: check PR bit → clear PR bit → act`,
  },
  topics: ['exti', 'nvic', 'interrupts-basics', 'pull-resistors'],
};

export default p;
