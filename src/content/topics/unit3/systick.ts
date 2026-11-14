import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'systick',
  unit: 3,
  order: 4,
  title: 'SysTick timer',
  short: 'The 24-bit down-counter built into every Cortex-M: CTRL, LOAD, VAL, COUNTFLAG, clock source, reload-value calculation and accurate delays by polling.',
  status: 'course',
  sources: [
    { file: 'Day09_Systick_Timer.pptx', detail: 'slides 2–12 (features, clock tree, registers, reload formula, init sequence, 1 s toggle)' },
    { file: 'EMBEDDED_LAB_MATERIALS/Lab_6/Systick_without_interupt.txt', detail: 'polling program' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§4.4 SysTick Timer' },
  ],
  keywords: ['SysTick', 'system timer', '24-bit', 'down counter', 'STK_CTRL', 'STK_LOAD', 'STK_VAL', 'RVR', 'CVR', 'COUNTFLAG', 'CLKSOURCE', 'TICKINT', 'ENABLE', 'reload value', 'delay', 'HCLK/8'],
  importance: 3,
  pyq: ['MT26S1-3', 'MT26S2-3'],
  sims: ['systick'],
  practicals: ['p08-systick-polling', 'p09-systick-interrupt'],
  related: ['systick-interrupt', 'gp-timers', 'interrupts-basics'],
  fundamentals: {
    what: md`**SysTick** is a standard timer built into every Arm Cortex-M core (so it is the same on every Cortex-M chip). It is a **24-bit down-counter** with auto-reload, a programmable clock source, a COUNTFLAG status bit and an optional maskable interrupt when it reaches zero (Day09 slide 2).`,
    why: md`Software delay loops are inaccurate (they depend on clock, compiler and optimisation). SysTick counts actual clock cycles, so delays and periodic events are exact — and the same code works on any Cortex-M.`,
    problem: md`Generates precise time bases: millisecond delays, 1 s toggles, a periodic “tick” for scheduling and RTOS time-slicing, time measurement.`,
    how: md`Load **STK_LOAD** with N − 1, clear **STK_VAL**, enable via **STK_CTRL**. VAL counts LOAD, LOAD−1, … 1, 0 at the selected clock; on reaching 0 it sets **COUNTFLAG** (and raises the SysTick exception if TICKINT = 1), then reloads. Period = (LOAD + 1) / f_clk.`,
    where: md`Lab 6: toggle PC14 every 1 s; HAL_Delay() and RTOS ticks; the PYQ asks for the reload value for a 1 ms tick.`,
  },
  detailed: md`
## Block diagram (Day10_4 slide 12)

::diagram{systick-block}

## Clock source (Day09 slide 5)

“The RCC feeds the external clock of the SysTick with the AHB clock (HCLK) **divided by 8**. The SysTick can work either with this clock or with the Cortex clock (HCLK), configurable in the SysTick control and status register.”

| CLKSOURCE (CTRL bit 2) | Clock | Lab (HCLK = 16 MHz) |
|---|---|---|
| 0 | HCLK / 8 (external reference) | 2 MHz |
| 1 | HCLK (processor clock) | 16 MHz |

## Registers (base 0xE000 E010, in the System Control Space)

| Register | Address | Contents |
|---|---|---|
| **STK_CTRL** (SYST_CSR) | 0xE000 E010 | bit 0 ENABLE, bit 1 TICKINT, bit 2 CLKSOURCE, bit 16 **COUNTFLAG** |
| **STK_LOAD** (SYST_RVR) | 0xE000 E014 | 24-bit RELOAD value (max 0x00FF FFFF = 16 777 215) |
| **STK_VAL** (SYST_CVR) | 0xE000 E018 | current count; any write clears it to 0 and clears COUNTFLAG |
| STK_CALIB | 0xE000 E01C | calibration (10 ms reference) |

COUNTFLAG is **1 if the counter reached 0 since the last read of CTRL**, and reading CTRL clears it.

| CTRL value | Meaning |
|---|---|
| 5 = 101b | ENABLE, processor clock, **no interrupt** (polling — Lab 6) |
| 7 = 111b | ENABLE, processor clock, **interrupt** |
| 1 = 001b | ENABLE, HCLK/8, no interrupt |
| 3 = 011b | ENABLE, HCLK/8, interrupt |

## Reload value formula (Day09 slide 9)

$$
N = time_delay × f_clock          (clock cycles needed)
LOAD = N − 1                      (because the counter visits LOAD … 0 = LOAD + 1 states)
period = (LOAD + 1) / f_clock
$$

The lecture writes “Reload value N = 16 000 000 for 1 s at 16 MHz”; the lab code correctly writes «SysTick->LOAD = 16000000 - 1;». In the exam show both N and N − 1.

> [!exam] PYQ pattern (Aug 2026, 3 marks)
> “Calculate the reload value for a periodic interrupt every 1 ms, clock 84 MHz with a /8 prescaler.” → f = 84/8 = 10.5 MHz; N = 1 ms × 10.5 MHz = 10 500; **RVR = 10 499** (0x2903).
> With 16 MHz /8: f = 2 MHz; N = 2000; **RVR = 1999** (0x7CF).

## Initialisation sequence (Day09 slide 11)

“The SysTick reload and current value are undefined at reset; the correct initialisation sequence is: 1. program reload value, 2. clear current value, 3. program control and status register.”

~~~c Lab 6: toggle PC14 every 1 s by polling COUNTFLAG
SysTick->LOAD = 16000000 - 1;   // 1 s at 16 MHz (fits in 24 bits)
SysTick->VAL  = 0;               // clear current value (and COUNTFLAG)
SysTick->CTRL = 5;               // ENABLE + CLKSOURCE = processor clock, no interrupt
while (1) {
    if (SysTick->CTRL & 0x00010000) {   // COUNTFLAG (bit 16) — reading also clears it
        GPIOC->ODR ^= (1 << 14);        // toggle LED1
    }
}
~~~

## Longest single delay

24 bits → max LOAD = 16 777 215. At 16 MHz that is 1.048 s; at 84 MHz 0.1997 s; at 84/8 = 10.5 MHz 1.598 s. Longer delays: count several SysTick periods in software (e.g. 1 ms tick × 1000).

~~~c Reusable millisecond delay (polling)
void delay_ms(uint32_t ms) {
    SysTick->LOAD = 16000 - 1;      // 1 ms at 16 MHz
    SysTick->VAL  = 0;
    SysTick->CTRL = 5;
    for (uint32_t i = 0; i < ms; i++)
        while (!(SysTick->CTRL & (1U << 16))) {}   // wait for each 1 ms rollover
    SysTick->CTRL = 0;
}
~~~
`,
  visual: md`
Run the init sequence, watch VAL count down and COUNTFLAG set; use the calculator for the PYQ values (try 1 ms at 84 MHz with HCLK/8):

::sim{systick preset=pyq84}

::diagram{systick-block}
`,
  exam: {
    definitions: [
      { term: 'SysTick', def: 'A 24-bit down-counting system timer integrated in every Cortex-M core, with auto-reload and an optional interrupt.' },
      { term: 'Reload value (RVR / LOAD)', def: 'The value loaded into the counter each time it reaches 0; period = LOAD + 1 clock cycles.' },
      { term: 'COUNTFLAG', def: 'STK_CTRL bit 16: set when the counter reaches 0, cleared when CTRL is read.' },
      { term: 'CLKSOURCE', def: 'STK_CTRL bit 2: selects processor clock (1) or HCLK/8 (0).' },
      { term: 'TICKINT', def: 'STK_CTRL bit 1: enables the SysTick exception when the count reaches 0.' },
    ],
    formulas: [
      { name: 'Clock cycles for a delay', expr: 'N = delay × f_clk' },
      { name: 'Reload value', expr: 'LOAD = N − 1 = delay × f_clk − 1', example: '1 ms @ 84 MHz/8 → 10 499' },
      { name: 'SysTick period', expr: 'T = (LOAD + 1) / f_clk' },
      { name: 'Maximum delay', expr: 'T_max = 2²⁴ / f_clk', example: '16 MHz → 1.048 s' },
    ],
    frequent: ['State one function of SysTick and calculate the reload value for 1 ms (both Aug 2026 papers).', 'Explain the SysTick registers and block diagram.', 'Write a 1 s delay/toggle with SysTick.'],
    mistakes: ['Forgetting the /8 when CLKSOURCE = 0.', 'Not subtracting 1 (accept N, but explain N − 1).', 'Exceeding 24 bits (e.g. 84 000 000 for 1 s at 84 MHz).', 'Writing COUNTFLAG = bit 15 or bit 1.', 'Wrong init order: enabling before loading.'],
    diagrams: ['SysTick block diagram: CLKSOURCE mux, ENABLE gate, STCVR with STRVR reload, COUNTFLAG'],
    shortQs: [
      { q: 'State one function of the SysTick timer.', a: md`Generating a periodic interrupt at a fixed interval — e.g. a 1 ms system tick for delays, timekeeping or RTOS task scheduling.`, marks: 1 },
      { q: 'Calculate the reload value for a 1 ms interrupt with an 84 MHz processor clock and /8 prescaler.', a: md`f = 84/8 = 10.5 MHz; N = 1 × 10⁻³ × 10.5 × 10⁶ = 10 500 cycles; RVR = N − 1 = **10 499** (0x2903).`, marks: 2 },
      { q: 'Calculate the reload value for a 1 ms interrupt with a 16 MHz clock and /8 prescaler.', a: md`f = 2 MHz; N = 2000; RVR = **1999** (0x7CF).`, marks: 2 },
      { q: 'Why is SysTick->CTRL = 5 used in the polling lab?', a: md`5 = 101b: ENABLE = 1, TICKINT = 0 (no interrupt — the program polls COUNTFLAG), CLKSOURCE = 1 (processor clock, 16 MHz).`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the SysTick timer of the Cortex-M4 with a block diagram and its registers. Write a program to toggle PC14 every second using SysTick without interrupts.', a: md`Features (24-bit, down-counter, auto-reload, COUNTFLAG, interrupt, clock source), block diagram, register table with bits, reload formula with 16 MHz example (LOAD = 15 999 999), init sequence, the Lab 6 program with explanation.`, marks: 8 },
      { q: 'Explain how SysTick generates accurate delays. Derive the reload value for 500 ms at 16 MHz and check whether it fits in the LOAD register.', a: md`N = 0.5 × 16 MHz = 8 000 000 → LOAD = 7 999 999 = 0x7A11FF < 0xFFFFFF, fits. Explain counting, COUNTFLAG, why software loops are inaccurate, and the limit 2²⁴ cycles.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'Calculate the SysTick reload value for a periodic interrupt every 1 ms, processor clock 84 MHz with a /8 prescaler. [Aug 2026 Slot 1 Set 1]',
        given: ['f_CPU = 84 MHz', 'prescaler = 8 (CLKSOURCE = 0)', 'T = 1 ms'],
        find: 'SYST_RVR',
        formula: 'f = f_CPU / 8 ; N = T × f ; RVR = N − 1',
        steps: ['f = 84 MHz / 8 = 10.5 MHz', 'N = 1 × 10⁻³ s × 10.5 × 10⁶ Hz = 10 500', 'RVR = 10 500 − 1 = 10 499 = 0x2903'],
        answer: 'RVR = 10 499 (0x2903)',
        value: 10499,
        tolerance: 1,
        concept: 'The counter visits LOAD…0, i.e. LOAD + 1 states per period.',
      },
      {
        q: 'Calculate the SysTick reload value for 1 ms, processor clock 16 MHz with a /8 prescaler. [Aug 2026 Slot 1 Set 2]',
        given: ['f_CPU = 16 MHz', 'prescaler = 8', 'T = 1 ms'],
        find: 'SYST_RVR',
        formula: 'RVR = T × f_CPU / 8 − 1',
        steps: ['f = 16 / 8 = 2 MHz', 'N = 1 ms × 2 MHz = 2000', 'RVR = 1999 = 0x7CF'],
        answer: 'RVR = 1999 (0x07CF)',
        value: 1999,
        tolerance: 1,
      },
      {
        q: 'What is the maximum interval one SysTick period can produce at 84 MHz (processor clock)?',
        given: ['LOAD max = 2²⁴ − 1', 'f = 84 MHz'],
        find: 'T_max',
        formula: 'T_max = 2²⁴ / f',
        steps: ['2²⁴ = 16 777 216', 'T = 16 777 216 / 84 × 10⁶ = 0.1997 s'],
        answer: '≈ 199.7 ms',
        value: 199.7,
        tolerance: 0.5,
        unit: 'ms',
      },
    ],
  },
  revision: {
    notes: ['24-bit down-counter, auto-reload, in every Cortex-M (0xE000 E010).', 'CTRL: bit0 ENABLE, bit1 TICKINT, bit2 CLKSOURCE (1 = HCLK, 0 = HCLK/8), bit16 COUNTFLAG.', 'LOAD = N − 1, N = delay × f. Max 0xFFFFFF.', 'Init: LOAD → VAL = 0 → CTRL.', 'PYQ: 84 MHz/8, 1 ms → 10 499; 16 MHz/8, 1 ms → 1999.'],
    takeaways: ['Always state N and N − 1.', 'Reading CTRL clears COUNTFLAG.'],
    mcqs: [
      { q: 'Width of the SysTick counter:', options: ['16 bits', '24 bits', '32 bits', '8 bits'], answer: 1, explain: '24-bit down-counter.' },
      { q: 'CTRL = 7 means…', options: ['enable, interrupt, processor clock', 'enable only', 'interrupt only', 'HCLK/8, no interrupt'], answer: 0, explain: 'Bits 0, 1, 2 set.' },
      { q: 'Reload for 1 s at 16 MHz processor clock:', options: ['16 000 000', '15 999 999', '1 999 999', '0xFFFFFF'], answer: 1, explain: 'N − 1.' },
      { q: 'COUNTFLAG is cleared by…', options: ['writing 1 to it', 'reading STK_CTRL', 'the ISR returning', 'reading LOAD'], answer: 1, explain: 'Read clears it (or writing VAL).' },
      { q: 'With CLKSOURCE = 0 and HCLK = 84 MHz the SysTick clock is…', options: ['84 MHz', '10.5 MHz', '42 MHz', '8 MHz'], answer: 1, explain: 'HCLK/8.' },
    ],
  },
};

export default topic;
