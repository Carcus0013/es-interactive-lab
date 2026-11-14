import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'exti',
  unit: 3,
  order: 3,
  title: 'Edge-triggered GPIO interrupts (EXTI)',
  short: 'Routing a pin to an EXTI line with SYSCFG_EXTICR, choosing rising/falling edges, unmasking in IMR, enabling the NVIC line, and clearing EXTI_PR in the ISR.',
  status: 'course',
  sources: [
    { file: 'Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx', detail: 'slides 2–21 (APB2ENR, EXTICR1–4, IMR, mapping, RTSR, FTSR, NVIC enable, PR, PA6/PB10 experiment)' },
    { file: 'EMBEDDED_LAB_MATERIALS/Lab_7/GPIO_Interupts.c', detail: 'complete program' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§9.5 Edge-triggered interrupts' },
  ],
  keywords: ['EXTI', 'external interrupt', 'edge triggered', 'rising edge', 'falling edge', 'SYSCFG', 'EXTICR', 'IMR', 'RTSR', 'FTSR', 'PR', 'pending register', 'EXTI9_5', 'EXTI15_10', 'APB2ENR bit 14'],
  importance: 2,
  sims: ['exti'],
  practicals: ['p10-gpio-interrupts'],
  related: ['nvic', 'interrupts-basics', 'leds-switches', 'io-sync'],
  fundamentals: {
    what: md`The **EXTI** (external interrupt/event controller) turns a change on a GPIO pin — a **rising edge** (0 → 1), a **falling edge** (1 → 0) or both — into an interrupt request to the NVIC. STM32F401 has 16 GPIO EXTI lines (EXTI0–15), one per pin number.`,
    why: md`Polling a switch wastes CPU time and can miss short pulses. An edge-triggered interrupt reacts to the press itself, letting the main loop do other work or sleep (Day10_2 slide 2).`,
    problem: md`It converts asynchronous external events into prompt, prioritised ISR calls, making the system event-driven and power-efficient.`,
    how: md`Line n can be connected to pin n of **one** port, chosen in **SYSCFG_EXTICR** (SYSCFG clock must be on). **RTSR/FTSR** choose the edge, **IMR** unmasks the line, and the NVIC line (EXTIn, EXTI9_5 or EXTI15_10) is enabled. When the edge occurs the **PR** bit is set and the ISR runs; the ISR must clear PR by writing 1.`,
    where: md`Lab 7: S2 on PA6 (EXTI6) turns PC14 on, S1 on PB10 (EXTI10) turns it off. Real uses: wake-up buttons, encoders, sensor data-ready pins, emergency stops.`,
  },
  detailed: md`
## Configuration steps (Day10_2 + lab code)

| Step | Register | PA6 (S2) | PB10 (S1) |
|---|---|---|---|
| 1. GPIO clocks | RCC_AHB1ENR | bit 0 | bit 1 |
| 2. Pin as input + pull-up | MODER = 00, PUPDR = 01 | bits 13:12 | bits 21:20 |
| 3. SYSCFG clock | RCC_APB2ENR bit 14 | ✓ | ✓ |
| 4. Route pin to line | SYSCFG_EXTICRk | EXTICR2 = EXTICR[1], bits 11:8 = 0000 (port A) | EXTICR3 = EXTICR[2], bits 11:8 = 0001 (port B) |
| 5. Unmask line | EXTI_IMR | bit 6 | bit 10 |
| 6. Edge | EXTI_FTSR (falling: press with pull-up) | bit 6 | bit 10 |
| 7. NVIC | NVIC_EnableIRQ | EXTI9_5_IRQn | EXTI15_10_IRQn |
| 8. ISR | check and clear EXTI_PR | EXTI9_5_IRQHandler | EXTI15_10_IRQHandler |

## Pin-to-line mapping (slide 11)

::diagram{exti-map}

- **Line n ↔ pin n** of any port: EXTI6 can be PA6, PB6, PC6 … but only **one** of them at a time.
- **EXTICR index** = n / 4; **field** = bits 4(n mod 4)+3 : 4(n mod 4). Port codes: A = 0000, B = 0001, C = 0010, D = 0011, E = 0100, H = 0111.
- **IRQ grouping**: EXTI0–EXTI4 have their own handlers; EXTI5–9 share «EXTI9_5_IRQHandler»; EXTI10–15 share «EXTI15_10_IRQHandler». In a shared handler, test PR bits to find which line fired.

## The lab program, key part

~~~c GPIO_Interupts.c (core)
SYSCFG->EXTICR[1] &= ~(0xF << 8);   // EXTI6 ← port A (0000)
SYSCFG->EXTICR[2] &= ~(0xF << 8);
SYSCFG->EXTICR[2] |=  (0x1 << 8);   // EXTI10 ← port B (0001)
EXTI->IMR  |= (1 << 6) | (1 << 10); // unmask
EXTI->FTSR |= (1 << 6) | (1 << 10); // falling edge = button press
NVIC_EnableIRQ(EXTI9_5_IRQn);
NVIC_EnableIRQ(EXTI15_10_IRQn);

void EXTI9_5_IRQHandler(void) {
    if (EXTI->PR & (1 << 6)) {      // was it line 6?
        EXTI->PR |= (1 << 6);       // clear pending (write 1)
        GPIOC->ODR |= (1 << 14);    // LED1 ON
    }
}
~~~

## The pending register: write 1 to clear

EXTI_PR bits are “rc_w1”: reading shows pending lines, **writing 1 clears** a bit, writing 0 does nothing. Hence:

- «EXTI->PR = (1 << 6);» — clears only line 6 (recommended).
- «EXTI->PR |= (1 << 6);» (lab code) — reads PR, ORs, writes back: if line 7 is also pending, its 1 is written back too and **clears line 7 without servicing it**. Usually harmless with one button per group, but a real bug with several.

## Rising, falling or both?

With the kit's pull-up wiring, **press = falling edge**, **release = rising edge**. Enable both RTSR and FTSR to react to both; then read IDR in the ISR to know which.

## Bounce

A bouncing switch generates several edges per press → several interrupts. Debounce by ignoring further edges for ~20 ms (record SysTick time in the ISR) or by masking the line briefly.
`,
  visual: md`
Choose port, pin and edges, press the switch, and watch PR, the ISR count and the generated code:

::sim{exti preset=pa6}

::diagram{exti-map}
`,
  exam: {
    definitions: [
      { term: 'EXTI', def: 'External interrupt/event controller that detects edges on GPIO lines and sends interrupt requests to the NVIC.' },
      { term: 'Edge-triggered interrupt', def: 'An interrupt generated on a transition of the input (rising 0→1 or falling 1→0), not on its level.' },
      { term: 'SYSCFG_EXTICR', def: 'Registers that select which GPIO port drives each EXTI line (4 bits per line).' },
      { term: 'EXTI_IMR', def: 'Interrupt mask register: 1 enables the interrupt request from that line.' },
      { term: 'EXTI_PR', def: 'Pending register: bit set when the selected edge occurs; cleared by writing 1.' },
    ],
    formulas: [
      { name: 'EXTICR register and field', expr: 'EXTICR[n / 4], bits 4(n mod 4)+3 : 4(n mod 4)', example: 'PB10 → EXTICR[2] bits 11:8 = 0001' },
    ],
    frequent: ['Configure an edge-triggered GPIO interrupt at register level.', 'Explain EXTI mapping and registers.', 'Interrupt-driven version of a switch/LED program.'],
    mistakes: ['Forgetting the SYSCFG clock (APB2ENR bit 14) — EXTICR writes are ignored.', 'Wrong EXTICR index (EXTICR1 = index 0).', 'Not clearing PR → ISR loops forever.', 'Using RTSR for a button press with pull-up (press is falling).', 'Expecting PA6 and PB6 to interrupt independently.'],
    diagrams: ['EXTI line mapping (MUX → edge detect → IMR → PR → NVIC)'],
    shortQs: [
      { q: 'Which EXTICR register and bits connect PB10 to EXTI10? What value?', a: md`EXTICR3 = «SYSCFG->EXTICR[2]», bits 11:8, value 0001 (port B).`, marks: 2 },
      { q: 'Why does the switch interrupt use FTSR rather than RTSR in the lab?', a: md`The switch connects the pin to GND with an internal pull-up, so pressing it changes the pin from 1 to 0 — a falling edge.`, marks: 2 },
      { q: 'Why is “EXTI->PR = (1<<6);” preferred over “EXTI->PR |= (1<<6);”?', a: md`PR is write-1-to-clear. «|=» reads all pending bits and writes them back as 1, clearing other pending lines unintentionally; plain assignment clears only line 6.`, marks: 2 },
    ],
    longQs: [
      { q: 'Write a register-level program in which a press of S2 (PA6) turns LED1 (PC14) ON and a press of S1 (PB10) turns it OFF using external interrupts. Explain each register.', a: md`Use the Lab 7 program (clocks, PC14 output, PA6/PB10 inputs with pull-up, SYSCFG clock, EXTICR[1]/[2], IMR, FTSR, NVIC_EnableIRQ for EXTI9_5 and EXTI15_10, two handlers that check and clear PR and set/clear ODR14). Explain the mapping, edge choice, NVIC grouping and why PR must be cleared.`, marks: 8 },
      { q: 'Explain the external interrupt controller of the STM32F401 with a block diagram.', a: md`MUX per line controlled by EXTICR, edge detectors (RTSR/FTSR), software interrupt register, IMR/EMR, PR, NVIC lines (individual 0–4, grouped 5–9 and 10–15), clearing PR; mapping rule and example.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Clocks: GPIO + SYSCFG (APB2ENR bit 14).', 'EXTICR[n/4] field 4(n%4): A=0, B=1, C=2.', 'IMR unmask, RTSR rising, FTSR falling.', 'NVIC: EXTI0..4 own; 5–9 → EXTI9_5; 10–15 → EXTI15_10.', 'ISR: if (EXTI->PR & bit) { EXTI->PR = bit; … }.'],
    takeaways: ['Press with pull-up = falling edge.', 'Write 1 to clear PR.'],
    mcqs: [
      { q: 'Which clock must be enabled to write SYSCFG_EXTICR?', options: ['AHB1ENR bit 0', 'APB2ENR bit 14', 'APB1ENR bit 17', 'None'], answer: 1, explain: 'SYSCFGEN.' },
      { q: 'PA6 shares its NVIC handler with lines…', options: ['0–4', '5–9', '10–15', 'none'], answer: 1, explain: 'EXTI9_5_IRQHandler.' },
      { q: 'How is an EXTI_PR bit cleared?', options: ['Write 0', 'Write 1', 'Read IDR', 'It clears itself'], answer: 1, explain: 'rc_w1.' },
      { q: 'EXTICR value to select port B for a line:', options: ['0000', '0001', '0010', '1111'], answer: 1, explain: 'B = 1.' },
      { q: 'Can PA6 and PC6 both generate independent EXTI interrupts?', options: ['Yes', 'No — they share line 6', 'Only with DMA', 'Only in sleep'], answer: 1, explain: 'One port per line.' },
    ],
  },
};

export default topic;
