import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'gp-timers',
  unit: 3,
  order: 6,
  title: 'General-purpose timers (prescaler, auto-reload, update interrupt)',
  short: 'STM32 TIMx: prescaler (PSC), counter (CNT), auto-reload (ARR), update event and UIF interrupt, delays and periodic interrupts, input capture and output compare.',
  status: 'additional',
  sources: [
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§9.7 Timer Periodic Interrupts' },
    { file: 'rm0368', detail: '§13–15 TIM2–TIM5, TIM9–11 (external reading)' },
  ],
  externalNote: md`Your lectures cover timing only with SysTick. The STM32 general-purpose timers appear in the syllabus line “Timer” and in the brief’s request for a prescaler/auto-reload simulator; register details here come from RM0368 (supplied) rather than your slides.`,
  keywords: ['timer', 'TIM2', 'TIM3', 'PSC', 'ARR', 'CNT', 'update event', 'UIF', 'UIE', 'DIER', 'overflow', 'prescaler', 'auto-reload', 'input capture', 'output compare', 'PWM'],
  importance: 1,
  sims: ['timer', 'pwm'],
  related: ['systick', 'pwm', 'systick-interrupt'],
  fundamentals: {
    what: md`A **general-purpose timer** (TIM2–TIM5, TIM9–TIM11 on the STM32F401) is a 16- or 32-bit counter clocked through a **prescaler (PSC)**. It counts up from 0 to the **auto-reload value (ARR)**, then wraps to 0 and generates an **update event** (UIF flag, optional interrupt). Channels add **output compare/PWM** and **input capture**.`,
    why: md`SysTick is a single, simple timer. Real applications need several independent time bases, PWM outputs, pulse measurement and event counting — dedicated hardware that runs without CPU help.`,
    problem: md`Generates precise periodic interrupts and delays of almost any length (16-bit PSC × 16/32-bit ARR), PWM signals, and measures pulse widths or frequencies with clock-cycle precision.`,
    how: md`Counter clock = f_TIM / (PSC + 1). The counter counts 0 … ARR, so the update period = (PSC + 1)(ARR + 1) / f_TIM. Each update sets UIF in TIMx_SR; if UIE in TIMx_DIER is set and the NVIC line is enabled, TIMx_IRQHandler runs, which must clear UIF.`,
    where: md`Periodic sampling of the ADC, PWM for LEDs and motors, servo pulses, ultrasonic distance measurement (input capture), encoder counting, timeouts.`,
  },
  detailed: md`
> [!additional]
> Not in your supplied lectures; included because “Timer” is in the Unit 3 syllabus and timers generate PWM (Unit 2).

## Timer equations

$$
f_CNT = f_TIM / (PSC + 1)
T_update = (PSC + 1) × (ARR + 1) / f_TIM
$$

Example (16 MHz): PSC = 15 999 → 1 kHz count clock (1 ms per count); ARR = 499 → update every **500 ms**.

## Key registers

| Register | Purpose |
|---|---|
| TIMx_PSC | prescaler (0–65535) |
| TIMx_ARR | auto-reload value |
| TIMx_CNT | current count |
| TIMx_CR1 | CEN (bit 0) starts the counter; DIR, ARPE |
| TIMx_DIER | UIE (bit 0) update interrupt enable; CCxIE |
| TIMx_SR | UIF (bit 0) update flag — clear by writing 0 |
| TIMx_CCRx, CCMRx, CCER | compare/capture channels, PWM |

## Periodic interrupt with TIM2

~~~c TIM2 interrupt every 500 ms toggling PC14 (16 MHz)
RCC->APB1ENR |= (1U << 0);        // TIM2 clock
TIM2->PSC = 16000 - 1;            // 16 MHz / 16000 = 1 kHz
TIM2->ARR = 500 - 1;              // 500 counts = 500 ms
TIM2->DIER |= (1U << 0);          // UIE
TIM2->CR1  |= (1U << 0);          // CEN: start
NVIC_EnableIRQ(TIM2_IRQn);

void TIM2_IRQHandler(void) {
    if (TIM2->SR & 1U) {          // UIF
        TIM2->SR &= ~1U;          // clear the flag
        GPIOC->ODR ^= (1U << 14);
    }
}
~~~

## SysTick vs general-purpose timer

| | SysTick | TIMx |
|---|---|---|
| Location | Cortex-M core (same on all vendors) | ST peripheral |
| Width | 24-bit | 16-bit (TIM3/4/9–11) or 32-bit (TIM2/5) |
| Direction | down | up, down, centre-aligned |
| Prescaler | fixed ÷1 or ÷8 | 16-bit programmable |
| Channels | none | up to 4 (PWM, capture, compare) |
| Interrupt | exception 15 (TICKINT) | NVIC IRQ (UIE, CCxIE) |

## Input capture (measurement)

On an edge at a channel pin, the counter value is copied into CCRx. The difference between two captures × count period gives a pulse width or period — e.g. HC-SR04 ultrasonic echo time.
`,
  visual: md`
Watch the prescaler counter fill, CNT step to ARR, and UIF set on overflow:

::sim{timer}
`,
  exam: {
    definitions: [
      { term: 'Prescaler', def: 'A divider (PSC + 1) that reduces the timer input clock to the counter clock.' },
      { term: 'Auto-reload register (ARR)', def: 'The top value of an up-counting timer; the counter returns to 0 after reaching it.' },
      { term: 'Update event', def: 'Event generated when the counter overflows (reaches ARR and wraps); sets UIF.' },
      { term: 'Input capture', def: 'Timer mode that latches the counter value into CCR on an input edge for time measurement.' },
    ],
    formulas: [
      { name: 'Counter clock', expr: 'f_CNT = f_TIM / (PSC + 1)' },
      { name: 'Update period', expr: 'T = (PSC + 1)(ARR + 1) / f_TIM', example: '(16000 × 500) / 16 MHz = 0.5 s' },
    ],
    frequent: ['Compute PSC and ARR for a given period.', 'Compare SysTick with general-purpose timers.'],
    mistakes: ['Forgetting the +1 terms.', 'Not clearing UIF in the ISR.', 'Exceeding 65535 in PSC or a 16-bit ARR.'],
    diagrams: ['Clock → PSC → CNT (0…ARR) → update event → interrupt'],
    shortQs: [
      { q: 'Find PSC and ARR for a 1 s update with an 84 MHz timer clock (16-bit registers).', a: md`(PSC+1)(ARR+1) = 84 × 10⁶. Choose PSC = 8399 (10 kHz) → ARR = 9999.`, marks: 2 },
      { q: 'Why must UIF be cleared in the timer ISR?', a: md`Otherwise the interrupt remains pending and the ISR is re-entered immediately after returning.`, marks: 1 },
      { q: 'Give two differences between SysTick and TIM2.', a: md`SysTick is a 24-bit down-counter in the core with a fixed /1 or /8 prescaler and no channels; TIM2 is a 32-bit ST peripheral with a 16-bit prescaler, up/down counting and 4 capture/compare/PWM channels.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the working of a general-purpose timer of the STM32F401 and write code to generate an interrupt every 500 ms.', a: md`Block (clock, PSC, CNT, ARR, update, channels), equations with calculation (16 MHz, PSC 15999, ARR 499), registers and the TIM2 code including ISR.`, marks: 8 },
      { q: 'Compare SysTick and general-purpose timers and state where each is preferred.', a: md`Table as in the lesson; SysTick for OS tick/simple delays/portability; TIMx for PWM, capture, multiple time bases, long periods.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'A timer runs at 16 MHz with PSC = 1599 and ARR = 9999. Find the update period.',
        given: ['f_TIM = 16 MHz', 'PSC = 1599', 'ARR = 9999'],
        find: 'T_update',
        formula: 'T = (PSC + 1)(ARR + 1) / f_TIM',
        steps: ['(1600 × 10 000) = 16 000 000', 'T = 16 × 10⁶ / 16 × 10⁶ = 1 s'],
        answer: '1 s',
        value: 1,
        unit: 's',
      },
    ],
  },
  revision: {
    notes: ['f_CNT = f/(PSC+1); T = (PSC+1)(ARR+1)/f.', 'Update event sets UIF; UIE + NVIC → TIMx_IRQHandler; clear UIF.', 'TIM2/TIM5 32-bit, others 16-bit.', 'Channels: PWM, output compare, input capture.'],
    takeaways: ['PSC picks the tick; ARR picks the count.'],
    mcqs: [
      { q: 'Counter clock with f = 16 MHz and PSC = 15:', options: ['16 MHz', '1 MHz', '15 MHz', '100 kHz'], answer: 1, explain: '16/(15+1).' },
      { q: 'Flag set on timer overflow:', options: ['COUNTFLAG', 'UIF', 'EOC', 'TXE'], answer: 1, explain: 'Update interrupt flag.' },
      { q: 'Which timers are 32-bit on STM32F401?', options: ['TIM3, TIM4', 'TIM2, TIM5', 'TIM9, TIM10', 'all'], answer: 1, explain: 'TIM2 and TIM5.' },
      { q: 'Measuring a pulse width uses…', options: ['output compare', 'input capture', 'PWM', 'update interrupt only'], answer: 1, explain: 'Capture CNT on edges.' },
      { q: 'Bit that starts a timer counter:', options: ['CR1.CEN', 'DIER.UIE', 'SR.UIF', 'EGR.UG'], answer: 0, explain: 'Counter enable.' },
    ],
  },
};

export default topic;
