import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'buzzer',
  unit: 2,
  order: 6,
  title: 'Buzzer interfacing',
  short: 'Active vs passive buzzers, driving them through a transistor, and generating tones with a GPIO toggle or PWM.',
  status: 'additional',
  sources: [{ file: 'Syllabus (Day01 slide 4)', detail: 'listed under Unit 2; no lecture or lab material supplied' }],
  keywords: ['buzzer', 'active buzzer', 'passive buzzer', 'piezo', 'transistor driver', 'tone', 'frequency', 'PWM', 'flyback diode'],
  importance: 1,
  sims: ['pwm'],
  related: ['leds-switches', 'pwm', 'gp-timers'],
  fundamentals: {
    what: md`A **buzzer** is an audio output device. An **active** buzzer contains its own oscillator and beeps at a fixed tone whenever DC voltage is applied. A **passive** buzzer (piezo disc or magnetic transducer) has no oscillator: you must feed it a square wave, and its pitch equals the wave's frequency.`,
    why: md`Many products need audible alerts — alarms, key-press feedback, timers, fault warnings — that work even when nobody is looking at a display.`,
    problem: md`It gives a cheap, low-power way to signal events audibly. With a passive buzzer the MCU can also play different tones (e.g. success vs error beeps).`,
    how: md`Active buzzer: a GPIO output switches it on/off like an LED (usually through a transistor, because buzzers draw 20–40 mA). Passive buzzer: toggle a GPIO at the tone frequency (e.g. every 0.5 ms for 1 kHz) or, better, use a timer's PWM output at 50 % duty so the CPU is free.`,
    where: md`Microwave and washing-machine end-of-cycle beeps, smoke alarms, keypad feedback, parking sensors, fault indicators on industrial panels.`,
  },
  detailed: md`
> [!additional]
> The buzzer is named in the Unit 2 syllabus but none of your slides or lab programs use one. This lesson uses general electronics practice; the GPIO and timer details match the STM32 registers you already know.

## Active vs passive

| | Active buzzer | Passive buzzer |
|---|---|---|
| Internal oscillator | Yes | No |
| Drive signal | DC on/off | Square wave (≈ 2–5 kHz best) |
| Tones | One fixed tone | Any frequency → melodies |
| MCU effort | One GPIO write | Toggle loop or timer PWM |
| How to tell | Usually sealed with a + mark; beeps on a battery | Clicks once on a battery |

## Drive circuit

Buzzers need more current than a GPIO pin should supply (STM32 pins: ~8–20 mA recommended, and PC13–15 only 3 mA). Use an NPN transistor (or MOSFET) as a low-side switch:

- GPIO → 1 kΩ base resistor → NPN base; emitter to GND; collector to buzzer −; buzzer + to 3.3/5 V.
- For magnetic (inductive) buzzers add a **flyback diode** across the buzzer to absorb the voltage spike at switch-off.

## Code

~~~c Active buzzer on PB9 (via transistor) — beep for 200 ms
GPIOB->ODR |=  (1U << 9);     // buzzer ON
delay_ms(200);
GPIOB->ODR &= ~(1U << 9);     // buzzer OFF
~~~

~~~c Passive buzzer: 1 kHz tone by toggling (blocks the CPU)
for (int i = 0; i < 2000; i++) {      // 2000 half-periods = 1 s
    GPIOB->ODR ^= (1U << 9);
    delay_us(500);                     // half of 1 ms period
}
~~~

Better: configure a timer channel in PWM mode with f_PWM = tone and duty = 50 % (see PWM) so the tone plays while the CPU does other work.

| Tone | Half-period for a toggle loop | Timer at 1 MHz tick: ARR |
|---|---|---|
| 1 kHz | 500 µs | 999 |
| 2 kHz | 250 µs | 499 |
| 4 kHz | 125 µs | 249 |
`,
  visual: md`
Set the PWM frequency and press “Play this frequency” to hear what a passive buzzer driven by that PWM would sound like:

::sim{pwm preset=buzzer}
`,
  exam: {
    definitions: [
      { term: 'Active buzzer', def: 'A buzzer with a built-in oscillator that sounds at a fixed frequency when DC is applied.' },
      { term: 'Passive buzzer', def: 'A transducer without an oscillator that must be driven by an AC/square-wave signal; its pitch follows the drive frequency.' },
      { term: 'Flyback diode', def: 'A diode across an inductive load that conducts the back-EMF spike when the drive transistor turns off.' },
    ],
    formulas: [{ name: 'Toggle half-period for a tone', expr: 't_half = 1 / (2 f)', example: '1 kHz → 500 µs' }],
    frequent: ['Active vs passive buzzer.', 'Interface a buzzer to a microcontroller with a transistor.'],
    mistakes: ['Driving a buzzer directly from a weak pin such as PC13.', 'Giving DC to a passive buzzer and expecting a tone.'],
    diagrams: ['GPIO → resistor → NPN transistor → buzzer (with flyback diode)'],
    shortQs: [
      { q: 'Differentiate active and passive buzzers.', a: md`Active: internal oscillator, sounds at a fixed tone with DC, MCU just switches it on/off. Passive: no oscillator, needs a square wave whose frequency sets the tone, so the MCU must toggle a pin or use PWM.`, marks: 2 },
      { q: 'Why is a transistor used to drive a buzzer?', a: md`The buzzer needs more current (tens of mA) than a GPIO pin can safely supply; the transistor switches the larger current from the supply while the pin only supplies a small base current.`, marks: 2 },
      { q: 'What half-period is needed to generate a 2 kHz tone by toggling a GPIO?', a: md`Period = 1/2000 = 500 µs, so toggle every 250 µs.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain how a buzzer is interfaced with the STM32F401 to produce (a) a simple alarm and (b) musical tones.', a: md`(a) Active buzzer through an NPN transistor on a GPIO output, switched on/off in software (with the circuit). (b) Passive buzzer driven by a square wave: toggle loop (half-period formula) or timer PWM at 50 % duty with f = f_clk/((PSC+1)(ARR+1)); change ARR for each note; mention flyback diode and current limits.`, marks: 6 },
      { q: 'Design an end-of-cycle beep for a washing machine controller: three 200 ms beeps separated by 200 ms.', a: md`Active buzzer on a GPIO via transistor; loop 3 times: ON, 200 ms delay (SysTick), OFF, 200 ms; explain register configuration (clock, MODER output) and why SysTick gives accurate timing.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Active = DC on/off, fixed tone; passive = square wave, tone = frequency.', 'Drive through a transistor; add a flyback diode for magnetic buzzers.', 'Tone by toggling (half-period 1/2f) or by PWM at 50 % duty.'],
    takeaways: ['PWM frequency sets pitch; duty cycle (≈50 %) sets loudness/timbre.'],
    mcqs: [
      { q: 'A buzzer that beeps when connected to a battery is…', options: ['passive', 'active', 'piezo-only', 'broken'], answer: 1, explain: 'It contains its own oscillator.' },
      { q: 'To play 1 kHz on a passive buzzer, toggle the pin every…', options: ['1 ms', '500 µs', '2 ms', '1 µs'], answer: 1, explain: 'Half of a 1 ms period.' },
      { q: 'Why add a diode across a magnetic buzzer?', options: ['To make it louder', 'To absorb the inductive voltage spike', 'To change the tone', 'To light it'], answer: 1, explain: 'Flyback diode.' },
      { q: 'Best peripheral to generate a tone without blocking the CPU:', options: ['ADC', 'Timer PWM', 'EXTI', 'RCC'], answer: 1, explain: 'Hardware PWM runs on its own.' },
      { q: 'Why not drive a buzzer directly from PC13?', options: ['PC13 is analog only', 'PC13 can sink only ~3 mA', 'PC13 is input only', 'It is reserved for USB'], answer: 1, explain: 'Datasheet current limit.' },
    ],
  },
};

export default topic;
