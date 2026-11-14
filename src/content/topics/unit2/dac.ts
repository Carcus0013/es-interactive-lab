import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'dac',
  unit: 2,
  order: 11,
  title: 'Digital-to-analog conversion (DAC)',
  short: 'Binary-weighted and R-2R DACs, resolution and output voltage, waveform generation from a look-up table, and why the STM32F401 needs an external or PWM-based DAC.',
  status: 'additional',
  sources: [
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§10.1–10.3 Digital to Analog Conversion, Music Generation' },
    { file: 'Syllabus (Day01 slide 4)', detail: '“Analog I/O interfacing – DAC and ADC”' },
  ],
  externalNote: md`No DAC lecture or lab was supplied, and the **STM32F401 has no on-chip DAC**. This lesson follows the prescribed textbook (Valvano Ch. 10), which builds DACs from GPIO pins and resistors.`,
  keywords: ['DAC', 'R-2R ladder', 'binary weighted', 'resolution', 'full scale', 'waveform', 'sine table', 'music', 'PWM DAC', 'low-pass filter'],
  importance: 1,
  sims: ['dac', 'pwm'],
  related: ['adc-fundamentals', 'pwm'],
  fundamentals: {
    what: md`A **digital-to-analog converter (DAC)** produces an output voltage proportional to a binary input number: V_out = D × V_ref / 2ⁿ. It is the inverse of an ADC.`,
    why: md`Processors compute digitally but many outputs must be analog: audio, motor speed references, LED brightness, signal generators, test voltages.`,
    problem: md`It lets the MCU synthesise any waveform — speech, music, sine waves — by writing a sequence of numbers at a fixed rate.`,
    how: md`Each bit switches a weighted current or voltage into a summing node. A **binary-weighted** DAC uses resistors R, 2R, 4R…; an **R-2R ladder** uses only two values, so it is easier to make accurate. Output is updated periodically from a table (usually in a timer interrupt) and smoothed by a low-pass filter.`,
    where: md`Audio players, function generators, motor drives, programmable power supplies; Valvano's lab builds a 4-bit DAC on GPIO pins to play music.`,
  },
  detailed: md`
> [!additional]
> Syllabus topic with no supplied lecture. STM32F401 has no DAC peripheral (some STM32F4 parts such as F407 do). Options on your board: a resistor DAC on GPIO pins, an external I²C/SPI DAC chip, or **PWM + RC low-pass filter**.

## Output equation

$$
V_out = D × V_ref / 2ⁿ        (D = 0 … 2ⁿ − 1)
resolution = V_ref / 2ⁿ ;  full-scale output = (2ⁿ − 1) × V_ref / 2ⁿ
$$

Example: 4-bit, V_ref = 3.3 V, D = 11 (1011) → 11 × 3.3/16 = 2.27 V.

## Binary-weighted resistor DAC

Each bit drives a resistor whose value halves for each more significant bit (MSB: R, next: 2R, 4R, 8R…) into an op-amp summing junction. Simple, but for 12 bits you need resistors from R to 2048R with very precise ratios — impractical.

## R-2R ladder DAC

Only two resistor values, R and 2R. Each switch connects its 2R leg to V_ref (bit = 1) or ground (bit = 0); the ladder halves the contribution at each stage, so bit k contributes V_ref × 2ᵏ / 2ⁿ. Easy to build accurately, scalable to many bits.

## Waveform synthesis (Valvano §10.3)

1. Store one period of the wave in a table, e.g. 32 sine samples scaled to 0 … 2ⁿ − 1.
2. A periodic interrupt (SysTick or timer) outputs the next table entry each time.
3. Output frequency = interrupt rate / table length. For a 440 Hz tone with 32 entries → 14 080 interrupts per second.
4. A low-pass filter smooths the staircase.

~~~c 4-bit DAC on PB0–PB3, sine in a SysTick handler
const uint8_t sine[16] = {8,11,13,15,15,15,13,11,8,5,3,1,1,1,3,5};
volatile uint8_t idx = 0;
void SysTick_Handler(void) {
    GPIOB->ODR = (GPIOB->ODR & ~0xFU) | sine[idx];   // write 4 bits
    idx = (idx + 1) & 0xF;
}
~~~

## PWM as a DAC

A PWM signal with duty cycle d, filtered by an RC low-pass with a cut-off well below the PWM frequency, gives an average voltage d × V_DD. Cheap, but slower to respond and with ripple.
`,
  visual: md`
::sim{dac}
`,
  exam: {
    definitions: [
      { term: 'DAC', def: 'A circuit that converts a binary number into a proportional analog voltage or current.' },
      { term: 'R-2R ladder', def: 'A DAC network using only resistors of values R and 2R in which each stage halves the contribution of the next bit.' },
      { term: 'DAC resolution', def: 'The smallest output change, V_ref / 2ⁿ, produced by a one-count change in the input.' },
    ],
    formulas: [
      { name: 'DAC output', expr: 'V_out = D × V_ref / 2ⁿ', example: '4-bit, 3.3 V, D = 11 → 2.27 V' },
      { name: 'Waveform frequency', expr: 'f_out = f_interrupt / table_length', example: '14 080 Hz / 32 = 440 Hz' },
    ],
    frequent: ['Explain the R-2R ladder DAC.', 'Calculate DAC output voltage.', 'Generate a waveform with a DAC.'],
    mistakes: ['Dividing by 2ⁿ − 1 when the formula with 2ⁿ was asked (state your convention).', 'Saying the STM32F401 has a DAC.', 'Forgetting the low-pass filter for PWM-DAC.'],
    diagrams: ['R-2R ladder', 'Binary-weighted resistor DAC'],
    shortQs: [
      { q: 'An 8-bit DAC has V_ref = 5 V. Find the resolution and the output for D = 0x80.', a: md`Resolution = 5/256 = 19.53 mV. V_out = 128 × 19.53 mV = 2.5 V.`, marks: 2 },
      { q: 'Why is the R-2R ladder preferred over the binary-weighted DAC?', a: md`It needs only two resistor values, so precise matching is easy and the design scales to many bits; the binary-weighted DAC needs a huge range of precise values (R … 2ⁿ⁻¹R).`, marks: 2 },
      { q: 'How can the STM32F401 produce an analog output without a DAC?', a: md`Timer PWM followed by an RC low-pass filter (average = duty × V_DD), a resistor DAC on GPIO pins, or an external DAC over I²C/SPI.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the working of an R-2R ladder DAC and derive its output voltage.', a: md`Circuit, Thevenin halving at each node, contribution of bit k = V_ref × 2ᵏ/2ⁿ, sum → V_out = D × V_ref/2ⁿ, worked example, advantages.`, marks: 6 },
      { q: 'Explain how a sine wave can be generated using a DAC and a periodic interrupt.', a: md`Table generation, interrupt rate and table length formula, ISR writing DAC, filtering; give a code sketch and a frequency calculation.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'A 4-bit DAC with V_ref = 3.3 V receives 1011. Find V_out.',
        given: ['n = 4', 'V_ref = 3.3 V', 'D = 1011₂ = 11'],
        find: 'V_out',
        formula: 'V_out = D × V_ref / 2ⁿ',
        steps: ['Step = 3.3 / 16 = 0.20625 V', 'V_out = 11 × 0.20625 = 2.269 V'],
        answer: '≈ 2.27 V',
        value: 2.269,
        tolerance: 0.01,
        unit: 'V',
      },
    ],
  },
  revision: {
    notes: ['V_out = D × V_ref / 2ⁿ.', 'R-2R uses two resistor values; binary-weighted needs R…2ⁿ⁻¹R.', 'f_out = interrupt rate / table length.', 'STM32F401 has no DAC → use PWM + RC filter or external DAC.'],
    takeaways: ['DAC is the inverse of ADC.'],
    mcqs: [
      { q: 'An R-2R ladder needs how many distinct resistor values?', options: ['1', '2', 'n', '2ⁿ'], answer: 1, explain: 'R and 2R.' },
      { q: '8-bit DAC, V_ref = 2.56 V, D = 100 → V_out =', options: ['1.00 V', '0.10 V', '2.56 V', '1.28 V'], answer: 0, explain: '100 × 2.56/256 = 1.00 V.' },
      { q: 'Does the STM32F401 have an on-chip DAC?', options: ['Yes, 12-bit', 'Yes, 8-bit', 'No', 'Only on PA4'], answer: 2, explain: 'Not available on this part.' },
      { q: 'A 32-entry sine table output at 32 kHz produces…', options: ['32 kHz', '1 kHz', '1 Hz', '64 kHz'], answer: 1, explain: '32 000 / 32.' },
      { q: 'PWM can act as a DAC when followed by…', options: ['a high-pass filter', 'a low-pass filter', 'an ADC', 'a comparator'], answer: 1, explain: 'Averaging the waveform.' },
    ],
  },
};

export default topic;
