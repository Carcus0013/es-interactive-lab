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
    SysTick->CTRL = 7;             // Enable SysTick, interrupt, use processor clock

    while (1) {
        // The main loop can remain empty because the toggling is handled in the interrupt
    }
}
void SysTick_Handler(void) {
    // Toggle PC14 inside the SysTick interrupt handler
    GPIOC->ODR ^= (1 << 14);  // Toggle PC14
}`;

const p: Practical = {
  id: 'p09-systick-interrupt',
  order: 9,
  title: 'SysTick periodic interrupt: toggle LED1 every second',
  unit: 3,
  objective: 'Generate a 1 s periodic interrupt with SysTick (TICKINT) and toggle PC14 inside SysTick_Handler while the main loop stays empty.',
  components: ['STM32F401CCU6 Black Pill', 'LED1 on PC14'],
  connections: [{ pin: 'PC14', to: 'LED1 (active-high)', mode: 'Output' }],
  expected: md`Same visible result as P08 — LED1 toggles every second — but the CPU is free: main() does nothing, and the toggle happens in the exception handler. Pause in the debugger inside SysTick_Handler to see IPSR = 15.`,
  sources: [{ file: 'Day10_4_Systick_Timer_With_Interupt.pptx', detail: 'slide 15 (code shown as an image; transcribed)' }, { file: 'Lab_6/Systick_Timer_With_Interupt.pptx' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }] },
  programs: [
    {
      id: 'int',
      title: 'SysTick with interrupt (Day10_4 slide 15)',
      file: 'Day10_4_Systick_Timer_With_Interupt.pptx (slide 15 image)',
      code: CODE,
      explain: [
        { lines: [4, 8], what: 'GPIOC clock and PC14 output.', why: 'Same as P08.', register: 'RCC_AHB1ENR bit 2; GPIOC_MODER bits 29:28 = 01' },
        { lines: [10, 11], what: 'LOAD = 15 999 999; VAL = 0.', why: '1 s period at 16 MHz; clear the undefined current value.', register: 'STK_LOAD, STK_VAL' },
        { lines: [12, 12], what: 'CTRL = 7: ENABLE + TICKINT + CLKSOURCE.', why: '111b — the counter runs on the 16 MHz processor clock and requests the SysTick exception (no. 15) at every underflow.', register: 'STK_CTRL bits 0, 1, 2', internal: 'SysTick is a core system exception: TICKINT alone enables it; no NVIC_EnableIRQ call is needed.', ifRemoved: 'Without TICKINT (CTRL = 5) the counter runs but SysTick_Handler is never called — the LED never toggles.' },
        { lines: [14, 16], what: 'Empty super-loop.', why: 'All work is done in the interrupt; main could do other tasks or sleep with __WFI().' },
        { lines: [18, 21], what: 'SysTick_Handler — the ISR.', why: 'Name must match the vector-table entry in startup_stm32f401xc.s exactly; the hardware calls it every second.', internal: 'On entry the core stacks R0–R3, R12, LR, PC, xPSR, sets LR = 0xFFFFFFF9, IPSR = 15, fetches the vector at 0x0000 003C; on BX LR it unstacks and resumes the empty loop.', ifRemoved: 'If misspelled (e.g. Systick_Handler) the default handler — an infinite loop — runs instead and the program appears frozen.' },
        { lines: [20, 20], what: 'Toggle PC14.', why: 'XOR flips the LED each second.', register: 'GPIOC_ODR bit 14' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'GPIOC clock, PC14 output', detail: 'AHB1ENR, MODER.', kind: 'init' },
    { label: 'SysTick LOAD, VAL, CTRL = 7', detail: '1 s period with interrupt.', kind: 'init' },
    { label: 'Empty while(1)', detail: 'CPU idles in thread mode.', kind: 'loop' },
    { label: 'SysTick_Handler (every 1 s)', detail: 'Hardware stacking → handler mode → toggle PC14 → return.', kind: 'isr' },
    { label: 'Back in while(1)', detail: 'Unstacking restores the context; loop continues.', kind: 'loop' },
  ],
  sim: { id: 'systick', preset: 'interrupt' },
  exam: {
    viva: [
      { q: 'What changes compared with the polling version?', a: 'CTRL = 7 instead of 5 (TICKINT set), and the toggle moves from the loop into SysTick_Handler.' },
      { q: 'Why is there no NVIC_EnableIRQ call?', a: 'SysTick is a Cortex-M system exception (number 15) enabled by TICKINT; NVIC_EnableIRQ is for peripheral IRQs.' },
      { q: 'What happens to the CPU registers when the interrupt occurs?', a: 'R0–R3, R12, LR, PC, xPSR are pushed automatically; LR gets EXC_RETURN; IPSR = 15; the handler address is fetched from 0x3C.' },
      { q: 'What does ^= do?', a: 'Bitwise XOR assignment: toggles the bits that are 1 in the mask.' },
    ],
    registerQs: [
      { q: 'Decode CTRL = 7.', a: 'ENABLE, TICKINT, CLKSOURCE = processor clock.' },
      { q: 'Vector-table address of the SysTick handler?', a: '4 × 15 = 0x0000 003C.' },
    ],
    pinQs: [{ q: 'Which pin and LED are toggled?', a: 'PC14, LED1 on the extension board.' }],
    outputQs: [{ q: 'If LOAD were 8 000 000 − 1, what happens?', a: 'The LED toggles every 0.5 s.' }],
    debugQs: [
      { q: 'The program builds but the LED never toggles and the debugger shows the PC in Default_Handler. Why?', a: 'The handler name is misspelled, so the vector points to the default handler.' },
      { q: 'The LED toggles but extremely fast. Why?', a: 'LOAD left small/undefined (missing LOAD write) so the interrupt fires every few cycles.' },
    ],
    errors: ['Misspelling SysTick_Handler.', 'Using CTRL = 5 and expecting interrupts.', 'Doing long work or delays inside the handler.'],
    modifications: ['1 ms tick with a volatile counter; blink from main using elapsed time.', 'Toggle PB9 every 250 ms and PC14 every 1 s from one 250 ms tick.', 'Use SysTick_Config(SystemCoreClock).', 'Put the CPU to sleep in the loop with __WFI().'],
    explainToExaminer: md`“I configure SysTick exactly as for polling but write CTRL = 7, which also sets TICKINT. Now every time the counter underflows — once per second — the core takes the SysTick exception, saves the context on the stack and jumps to SysTick_Handler, where I toggle PC14 with XOR. The main loop is empty; the timing is handled entirely by hardware and the interrupt.”`,
  },
  memorise: {
    essentials: ['SysTick->LOAD = 16000000 - 1;', 'SysTick->VAL = 0;', 'SysTick->CTRL = 7;', 'while (1) { }', 'void SysTick_Handler(void) { GPIOC->ODR ^= (1 << 14); }'],
    patterns: [{ name: 'Periodic interrupt handler', code: 'void SysTick_Handler(void) { /* short job */ }' }],
    skeleton: md`int main(void){
    GPIOC clock + PC14 output;
    SysTick->LOAD = 16000000-1; SysTick->VAL = 0; SysTick->CTRL = 7;
    while(1){}
}
void SysTick_Handler(void){ GPIOC->ODR ^= (1<<14); }`,
  },
  topics: ['systick-interrupt', 'systick', 'interrupts-basics', 'nvic'],
};

export default p;
