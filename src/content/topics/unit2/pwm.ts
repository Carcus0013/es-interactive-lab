import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'pwm',
  unit: 2,
  order: 12,
  title: 'Pulse-width modulation (PWM)',
  short: 'Period, frequency and duty cycle; average voltage; generating PWM with a timer (PSC, ARR, CCR); LED dimming, motor speed and buzzer tones.',
  status: 'additional',
  sources: [
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§8.7 Pulse-width modulation' },
    { file: 'Syllabus (Day01 slide 4)', detail: 'PWM listed in Unit 2' },
    { file: 'Mid-term PYQs Aug 2025 Set B / Aug 2026 Set 2', detail: '“fan speed indicated by blinking frequency” — software timing, not timer PWM' },
  ],
  externalNote: md`No PWM lecture or timer-PWM lab was supplied. The STM32 timer register names (PSC, ARR, CCR, CCMR, CCER) are from RM0368 — external to your slides.`,
  keywords: ['PWM', 'duty cycle', 'period', 'frequency', 'average voltage', 'PSC', 'ARR', 'CCR', 'CCMR', 'PWM mode 1', 'LED dimming', 'motor speed', 'servo', 'H-bridge'],
  importance: 2,
  sims: ['pwm', 'timer'],
  related: ['gp-timers', 'dac', 'buzzer'],
  fundamentals: {
    what: md`**Pulse-width modulation** is a digital square wave whose **duty cycle** — the fraction of each period the signal is HIGH — is varied to control the **average** power delivered to a load. The frequency stays fixed; only the pulse width changes.`,
    why: md`A GPIO pin can only be fully ON or OFF, but LEDs need dimming and motors need speed control. Switching fast enough makes the load respond to the average voltage, with almost no power wasted in the switch.`,
    problem: md`PWM gives “analog-like” control (brightness, speed, position, tone) from a digital output, efficiently and with a single pin.`,
    how: md`A timer counter runs from 0 to ARR repeatedly (setting the **frequency**); a compare register CCR sets where the output switches LOW (setting the **duty**). Average voltage = duty × V_DD. The load's inertia (motor) or the eye's persistence (LED, > ~100 Hz) averages the pulses.`,
    where: md`LED dimming, DC-motor speed (fans — the Smart Fan PYQ), servo position (1–2 ms pulses at 50 Hz), buzzer tones, switching power supplies, PWM-based DACs.`,
  },
  detailed: md`
> [!additional]
> PWM is in the syllabus but your labs only produce “slow/fast blinking” with software delays. Hardware PWM on STM32 timers is explained here for completeness.

## Definitions and formulas

$$
T = T_on + T_off ;  f = 1 / T
duty cycle D = T_on / T × 100 %
V_avg = D × V_high
$$

| Duty | 0 % | 25 % | 50 % | 75 % | 100 % |
|---|---|---|---|---|---|
| V_avg (3.3 V) | 0 V | 0.83 V | 1.65 V | 2.48 V | 3.3 V |
| LED | off | dim | half | bright | full |

## Generating PWM with an STM32 timer

$$
f_PWM = f_TIMclk / ((PSC + 1) × (ARR + 1))
duty   = CCR / (ARR + 1)        (PWM mode 1, up-counting)
$$

Output is HIGH while CNT < CCR and LOW from CCR to ARR.

Example: 16 MHz clock, PSC = 15 → 1 MHz tick; ARR = 999 → 1 kHz PWM; CCR = 250 → 25 % duty.

~~~c TIM3 channel 1 PWM on PA6 (AF2), 1 kHz, 25 % — register names per RM0368
RCC->AHB1ENR |= (1U << 0);                 // GPIOA
RCC->APB1ENR |= (1U << 1);                 // TIM3
GPIOA->MODER = (GPIOA->MODER & ~(3U << 12)) | (2U << 12);   // PA6 alternate function
GPIOA->AFR[0] = (GPIOA->AFR[0] & ~(0xFU << 24)) | (2U << 24); // AF2 = TIM3_CH1
TIM3->PSC  = 15;                           // 16 MHz / 16 = 1 MHz
TIM3->ARR  = 999;                          // 1000 counts → 1 kHz
TIM3->CCR1 = 250;                          // 25 % duty
TIM3->CCMR1 = (6U << 4) | (1U << 3);       // OC1M = 110 (PWM mode 1), preload
TIM3->CCER |= (1U << 0);                   // enable CH1 output
TIM3->CR1  |= (1U << 0);                   // start counter
~~~

Change brightness/speed by writing a new CCR1 value; change frequency with ARR.

## Choosing the frequency

| Load | Typical PWM frequency |
|---|---|
| LED dimming | > 200 Hz (no visible flicker) |
| DC motor | 1–20 kHz (above audible whine) |
| Servo | 50 Hz, pulse 1–2 ms |
| Buzzer | the tone itself, 1–4 kHz |

## Software “PWM” in the PYQ

The Smart Fan question indicates speed by **blinking frequency** of PB9 (slow vs fast), which can be done with SysTick-based delays — that is frequency modulation of an indicator, not true PWM. A real fan would use timer PWM through a transistor/MOSFET driver.

> [!warning]
> Never drive a motor directly from a GPIO pin; use a transistor, MOSFET or H-bridge driver with a flyback diode.
`,
  visual: md`
Change PSC, ARR and CCR and watch the counter, the PWM waveform, the LED brightness and the motor:

::sim{pwm}
`,
  exam: {
    definitions: [
      { term: 'PWM', def: 'A technique that varies the pulse width (duty cycle) of a fixed-frequency square wave to control average power.' },
      { term: 'Duty cycle', def: 'The ratio of ON time to the period, T_on/T, expressed as a percentage.' },
      { term: 'ARR', def: 'Auto-reload register: the counter counts 0…ARR, setting the PWM period.' },
      { term: 'CCR', def: 'Capture/compare register: the count at which the PWM output switches, setting the duty cycle.' },
    ],
    formulas: [
      { name: 'Duty cycle', expr: 'D = T_on / T × 100 %' },
      { name: 'Average voltage', expr: 'V_avg = D × V_high', example: '40 % × 3.3 V = 1.32 V' },
      { name: 'Timer PWM frequency', expr: 'f = f_clk / ((PSC + 1)(ARR + 1))', example: '16 MHz / (16 × 1000) = 1 kHz' },
      { name: 'Timer PWM duty', expr: 'D = CCR / (ARR + 1)', example: '250 / 1000 = 25 %' },
    ],
    frequent: ['Define PWM and duty cycle; compute average voltage.', 'Compute PSC/ARR/CCR for a given frequency and duty.', 'Applications: LED dimming, motor speed.'],
    mistakes: ['Forgetting the +1 in (PSC + 1) and (ARR + 1).', 'Changing ARR to change duty (that changes frequency).', 'Driving a motor directly from a pin.'],
    diagrams: ['PWM waveforms at 25 %, 50 %, 75 % duty', 'Counter sawtooth with CCR threshold'],
    shortQs: [
      { q: 'A PWM signal has T_on = 3 ms and T_off = 1 ms at 3.3 V. Find frequency, duty and average voltage.', a: md`T = 4 ms → f = 250 Hz; duty = 3/4 = 75 %; V_avg = 0.75 × 3.3 = 2.48 V.`, marks: 2 },
      { q: 'Timer clock 84 MHz; required PWM 20 kHz. Suggest PSC and ARR.', a: md`(PSC+1)(ARR+1) = 84 MHz / 20 kHz = 4200 → PSC = 0, ARR = 4199 (or PSC = 3, ARR = 1049).`, marks: 2 },
      { q: 'Why does a PWM-driven LED look dimmer rather than flashing?', a: md`At frequencies above ~100 Hz the eye integrates the light (persistence of vision), perceiving the average brightness proportional to duty cycle.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain PWM generation using a general-purpose timer of the STM32F401 and calculate register values for a 1 kHz, 30 % PWM from a 16 MHz clock.', a: md`Counter, ARR, CCR, PWM mode 1 waveform; f and duty formulas; PSC = 15 (1 MHz), ARR = 999, CCR = 300; GPIO alternate function, CCMR/CCER, CR1; applications.`, marks: 8 },
      { q: 'Explain how PWM is used to control LED brightness and DC-motor speed.', a: md`Average voltage concept, frequency choice, driver circuits (transistor/MOSFET/H-bridge, flyback diode), duty → brightness/speed, example values.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'Find PSC, ARR and CCR for a 50 Hz servo signal with a 1.5 ms pulse from a 16 MHz timer clock.',
        given: ['f_clk = 16 MHz', 'f = 50 Hz (T = 20 ms)', 'pulse = 1.5 ms'],
        find: 'PSC, ARR, CCR',
        formula: 'Choose a 1 MHz tick: PSC = 16 − 1; ARR + 1 = T × tick; CCR = pulse × tick',
        steps: ['PSC = 15 → tick = 1 MHz (1 µs)', 'ARR + 1 = 20 ms / 1 µs = 20 000 → ARR = 19 999', 'CCR = 1.5 ms / 1 µs = 1500', 'Duty = 1500/20000 = 7.5 %'],
        answer: 'PSC = 15, ARR = 19 999, CCR = 1500',
        value: 19999,
      },
    ],
  },
  revision: {
    notes: ['Duty = T_on/T; V_avg = duty × V_high.', 'f = f_clk/((PSC+1)(ARR+1)); duty = CCR/(ARR+1).', 'ARR → frequency; CCR → duty.', 'LED > 200 Hz, motor 1–20 kHz, servo 50 Hz.'],
    takeaways: ['Remember the +1s.', 'Use a driver for motors.'],
    mcqs: [
      { q: 'Changing which register changes the PWM duty without changing frequency?', options: ['PSC', 'ARR', 'CCR', 'CNT'], answer: 2, explain: 'CCR sets the compare point.' },
      { q: 'Duty cycle of a 1 kHz PWM with 0.2 ms high time:', options: ['2 %', '20 %', '80 %', '0.2 %'], answer: 1, explain: '0.2 / 1 ms.' },
      { q: 'Average voltage of a 3.3 V, 50 % PWM:', options: ['3.3 V', '1.65 V', '0 V', '6.6 V'], answer: 1, explain: '0.5 × 3.3.' },
      { q: '16 MHz, PSC = 15, ARR = 999 → f_PWM =', options: ['1 MHz', '1 kHz', '16 kHz', '100 Hz'], answer: 1, explain: '16 MHz/16/1000.' },
      { q: 'Typical servo PWM frequency:', options: ['50 Hz', '1 kHz', '20 kHz', '1 MHz'], answer: 0, explain: '20 ms period.' },
    ],
  },
};

export default topic;
