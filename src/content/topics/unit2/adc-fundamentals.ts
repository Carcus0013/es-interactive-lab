import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'adc-fundamentals',
  unit: 2,
  order: 9,
  title: 'Analog-to-digital conversion: principles and ADC types',
  short: 'Sampling, quantisation and encoding; resolution and step size; quantisation error; sampling rate; flash, SAR, dual-slope, sigma-delta and pipelined ADCs.',
  status: 'course',
  sources: [
    { file: 'Day08_2_Analog_to_Digital_Converter_ADC.pptx', detail: 'slides 1–29 (steps, resolution table, comparator, flash, SAR worked examples, other types)' },
    { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'slides 2, 11–13, 37 (ratiometric value, quantisation, sampling rate, resolution)' },
  ],
  keywords: ['ADC', 'sampling', 'quantisation', 'encoding', 'resolution', 'step size', 'LSB', 'quantisation error', 'sampling rate', 'Nyquist', 'flash ADC', 'SAR', 'successive approximation', 'dual slope', 'sigma-delta', 'pipelined', 'comparator'],
  importance: 2,
  sims: ['adc', 'sar', 'flashadc'],
  practicals: ['p06-adc-pot', 'p07-adc-threshold'],
  related: ['adc-stm32', 'dac'],
  fundamentals: {
    what: md`An **analog-to-digital converter (ADC)** converts a continuous analog voltage into a discrete digital number. It does this in three steps: **sampling** (measure at fixed time intervals), **quantisation** (round each sample to one of 2ⁿ levels) and **encoding** (express the level as an n-bit binary code).`,
    why: md`Microcontrollers only understand 1s and 0s, but sensors produce continuously varying voltages (temperature, light, sound, position). Without an ADC the processor cannot read them (Day08_2 slide 2).`,
    problem: md`It turns the real world into numbers software can compare, filter, display and transmit — e.g. “is it dark?” becomes «if (adcData > threshold)».`,
    how: md`A sample-and-hold captures the input; a converter (flash, SAR, …) compares it with reference levels derived from **V_ref**; the result is a code between 0 and 2ⁿ − 1. Each code step is worth **V_ref / 2ⁿ** volts (1 LSB). The STM32F401 uses a 12-bit **successive-approximation** ADC: 0–3.3 V → 0–4095.`,
    where: md`Potentiometer and LDR labs, temperature sensing, battery monitoring, audio capture, motor-current measurement, every case-study sensor.`,
  },
  detailed: md`
## Step 1 — Sampling

“Sampling is the process of measuring the amplitude of an analog signal at regular time intervals.” The **sampling rate** (samples per second, S/s or Hz) must be high enough to follow the signal: at least **twice the highest frequency** in it (Nyquist criterion — external knowledge), otherwise fast changes are lost or appear as false slow ones (aliasing).

## Step 2 — Quantisation

The sampled value is rounded to the nearest of a **finite set of levels**. An n-bit ADC has **2ⁿ levels**.

$$
step size (1 LSB) = V_ref / 2ⁿ
digital code D ≈ V_in × 2ⁿ / V_ref          (truncated to an integer, 0 … 2ⁿ − 1)
V_in ≈ D × V_ref / 2ⁿ
$$

| Resolution | Levels | Step for 1 V range | Step for 3.3 V |
|---|---|---|---|
| 8-bit | 256 | 3.92 mV | 12.9 mV |
| 10-bit | 1024 | 0.98 mV | 3.22 mV |
| 12-bit | 4096 | 0.244 mV | **0.806 mV** |
| 14-bit | 16 384 | 61 µV | 0.20 mV |
| 16-bit | 65 536 | 15 µV | 50 µV |

(Day08_2 slide 5 gives the “1 V” column.)

**Quantisation error** = V_in − D × step. With truncation it lies between 0 and 1 LSB; with rounding between −½ and +½ LSB. More bits → smaller steps → smaller error.

> [!note] 4095 or 4096? Two conventions in your slides
> Day08_1 slide 2 uses the **ratiometric** form D = V_in × 4095 / 3.3 (so 3.3 V → 4095), giving 1.66 V → 2059. Slide 37 then writes “3.3 / 2¹² = 3.3/4095 = 0.8 mV”. Strictly 2¹² = 4096 and the ideal step is 3.3 / 4096 = 0.806 mV; dividing by 4095 gives 0.806 mV too, so numerically the answers agree to 3 significant figures. In the exam, state the formula you use; both are accepted if consistent.

## Step 3 — Encoding

The quantised level index is written in binary: e.g. level 5 of a 3-bit ADC → 101. The lecture's method: for each power of 2 from the highest down, if the number ≥ that power, write 1 and subtract it, else write 0.

## The comparator

A comparator outputs HIGH when V+ > V− and LOW otherwise — the 1-bit building block of every ADC.

## ADC types

### Flash (parallel) ADC — fastest

2ⁿ − 1 comparators compare V_in with every reference level from a resistor ladder **simultaneously**; a priority encoder converts the resulting **thermometer code** to binary. 3-bit example: V_in = 5.2 V, V_ref = 8 V → comparators at 1, 2, … 7 V → outputs 0011111 (five 1s) → **101**, quantised 5.0 V, error 0.2 V. Very fast but needs 4095 comparators for 12 bits.

### Successive-approximation (SAR) ADC — used in the STM32

A binary search, one bit per clock, MSB first:

::diagram{sar-loop}

Worked example (Day08_2 slides 20–21): V_ref = 8 V, 3 bits, V_in = 5.2 V. Bit weights 4 V, 2 V, 1 V.

| Iteration | Trial code | DAC voltage | Compare with 5.2 V | Decision | Code |
|---|---|---|---|---|---|
| 1 (MSB) | 100 | 4 V | 4 < 5.2 | keep 1 | 100 |
| 2 | 110 | 6 V | 6 > 5.2 | reset to 0 | 100 |
| 3 (LSB) | 101 | 5 V | 5 < 5.2 | keep 1 | **101** |

Result 101 = 5 → 5.0 V, quantisation error 0.2 V. A 12-bit SAR needs 12 comparison cycles (plus sampling time).

### Others (Day08_2 slides 25–28)

| Type | Speed | Resolution | How it works | Typical use |
|---|---|---|---|---|
| Dual-slope (integrating) | Slow | High | Integrates V_in for a fixed time, then times the discharge by V_ref | Digital multimeters |
| Sigma-delta (ΔΣ) | Low–moderate | Very high (up to 24 bits) | Oversamples with a 1-bit modulator, then digital filtering and noise shaping | Audio, precision measurement |
| Pipelined | High | 8–16 bits | Several stages each resolve a few bits in a pipeline | High-speed data acquisition |
| Flash | Highest | Low (≤ 8 bits) | Parallel comparators | Oscilloscopes, radar |
| SAR | Medium–high | 8–18 bits | Binary search | Microcontrollers |
`,
  visual: md`
Change the input voltage, reference and resolution; switch on a changing input to see sampling:

::sim{adc}

Watch the SAR binary search from the lecture example:

::sim{sar}

And the flash converter's thermometer code:

::sim{flashadc}
`,
  exam: {
    definitions: [
      { term: 'ADC', def: 'A circuit that converts a continuous analog voltage into a discrete digital number.' },
      { term: 'Sampling', def: 'Measuring the amplitude of an analog signal at regular time intervals.' },
      { term: 'Quantisation', def: 'Mapping each sampled amplitude to one of a finite set of discrete levels.' },
      { term: 'Encoding', def: 'Representing the quantised level as a binary number.' },
      { term: 'Resolution', def: 'The number of bits (or levels) of an ADC; equivalently the smallest input change (1 LSB = V_ref / 2ⁿ) that changes the output by one count.' },
      { term: 'Quantisation error', def: 'The difference between the actual input voltage and the voltage represented by the output code.' },
    ],
    formulas: [
      { name: 'Step size (1 LSB)', expr: 'Δ = V_ref / 2ⁿ', example: '3.3 V / 4096 = 0.806 mV' },
      { name: 'Digital output', expr: 'D = ⌊V_in × 2ⁿ / V_ref⌋   (lecture: D = V_in × 4095 / 3.3)', example: '1.66 V → 2059' },
      { name: 'Voltage from code', expr: 'V_in = D × V_ref / 2ⁿ', example: '3500 × 0.806 mV = 2.82 V' },
      { name: 'Quantisation error', expr: 'e = V_in − D × Δ', vars: '0 ≤ e < 1 LSB (truncation)' },
      { name: 'Comparators in a flash ADC', expr: 'N = 2ⁿ − 1', example: '3-bit → 7 comparators' },
    ],
    frequent: ['Explain sampling, quantisation and encoding.', 'Compute digital output for a given voltage / voltage for a given code.', 'Explain SAR ADC with a worked example.', 'Compare ADC types.'],
    mistakes: ['Using 2ⁿ − 1 levels instead of 2ⁿ (there are 2ⁿ codes, maximum value 2ⁿ − 1).', 'Forgetting to round/truncate the code to an integer.', 'In SAR, comparing with the wrong DAC value (trial code, not the previous code).', 'Mixing mV and V.'],
    diagrams: ['SAR ADC block diagram', 'Flash ADC with resistor ladder and comparators', 'Quantisation staircase'],
    shortQs: [
      { q: 'A 12-bit ADC has V_ref = 3.3 V. Find its resolution and the code for 1.65 V.', a: md`Step = 3.3/4096 = 0.806 mV. D = ⌊1.65 × 4096 / 3.3⌋ = 2048.`, marks: 2 },
      { q: 'Why does a flash ADC become impractical at high resolution?', a: md`It needs 2ⁿ − 1 comparators and a matching resistor ladder: 255 for 8 bits, 4095 for 12 bits — too much area and power.`, marks: 2 },
      { q: 'How many clock cycles does a 12-bit SAR conversion take on the STM32?', a: md`12 cycles for the binary search plus the programmed sampling time (minimum 3 cycles) → at least 15 ADCCLK cycles.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the working of a successive-approximation ADC with a block diagram. Convert 5.8 V with a 4-bit SAR ADC and V_ref = 10 V.', a: md`Block diagram (S/H, comparator, SAR logic, DAC) and binary-search steps. Step = 10/16 = 0.625 V. Trials: 1000 → 5 V ≤ 5.8 keep; 1100 → 7.5 V > 5.8 reset; 1010 → 6.25 > 5.8 reset; 1001 → 5.625 ≤ 5.8 keep → **1001 = 9**, 5.625 V, error 0.175 V.`, marks: 8 },
      { q: 'Explain the three steps of analog-to-digital conversion and compare flash, SAR, dual-slope and sigma-delta ADCs.', a: md`Sampling (rate, Nyquist), quantisation (levels, step, error), encoding (binary); comparison table of speed, resolution, principle, use.`, marks: 8 },
    ],
    numericals: [
      {
        q: 'Using the lecture convention (4095/3.3), find the ADC output for a sensor voltage of 1.66 V on the STM32F401.',
        given: ['V_in = 1.66 V', 'V_ref = 3.3 V', 'full scale = 4095'],
        find: 'Digital output D',
        formula: 'D = (4095 / 3.3) × V_in',
        steps: ['4095 / 3.3 = 1240.9', '1240.9 × 1.66 = 2059.9', 'The ADC returns an integer: D = 2059 (truncated)'],
        answer: 'D ≈ 2059',
        value: 2059,
        tolerance: 1,
        concept: 'Ratiometric conversion (Day08_1 slide 2).',
      },
      {
        q: 'A 12-bit ADC (V_ref = 3.3 V) reads 3500. What is the input voltage?',
        given: ['D = 3500', 'n = 12', 'V_ref = 3.3 V'],
        find: 'V_in',
        formula: 'V_in = D × V_ref / 2ⁿ',
        steps: ['Step = 3.3 / 4096 = 0.8057 mV', 'V_in = 3500 × 0.8057 mV = 2820 mV'],
        answer: '≈ 2.82 V (lecture: 3500 × 0.8 mV = 2.8 V)',
        value: 2.82,
        tolerance: 0.03,
        unit: 'V',
      },
      {
        q: 'SAR ADC: V_ref = 8 V, 3 bits, V_in = 5.2 V. Find the digital output and quantisation error (Day08_2 example).',
        given: ['V_ref = 8 V', 'n = 3', 'V_in = 5.2 V'],
        find: 'Code and error',
        formula: 'Bit weights V_ref/2, V_ref/4, V_ref/8 = 4, 2, 1 V; keep a bit if V_DAC ≤ V_in',
        steps: ['Try 100 → 4 V ≤ 5.2 → keep', 'Try 110 → 6 V > 5.2 → reset', 'Try 101 → 5 V ≤ 5.2 → keep', 'Code 101 = 5 → 5.0 V; error = 5.2 − 5.0 = 0.2 V'],
        answer: '101 (5), error 0.2 V',
        value: 5,
      },
      {
        q: 'How many comparators does an 8-bit flash ADC need?',
        given: ['n = 8'],
        find: 'Number of comparators',
        formula: 'N = 2ⁿ − 1',
        steps: ['2⁸ − 1 = 255'],
        answer: '255',
        value: 255,
      },
    ],
  },
  revision: {
    notes: ['Steps: sampling → quantisation → encoding.', 'Levels = 2ⁿ; step = V_ref/2ⁿ; 12-bit @ 3.3 V → 0.806 mV.', 'D = V_in × 2ⁿ / V_ref (lecture: × 4095/3.3).', 'SAR = binary search MSB→LSB, n cycles; flash = 2ⁿ−1 comparators.', 'Dual-slope accurate/slow; sigma-delta very high resolution; pipelined fast.'],
    takeaways: ['Show the formula, substitution and units.', 'SAR table: trial, V_DAC, compare, keep/reset.'],
    mcqs: [
      { q: 'Number of discrete levels of a 10-bit ADC:', options: ['10', '512', '1023', '1024'], answer: 3, explain: '2¹⁰ = 1024 levels (codes 0–1023).' },
      { q: 'Which ADC type does the STM32F401 use?', options: ['Flash', 'SAR', 'Dual-slope', 'Sigma-delta'], answer: 1, explain: '12-bit successive approximation.' },
      { q: 'Resolution of a 12-bit ADC with V_ref = 3.3 V is about…', options: ['3.3 mV', '0.8 mV', '12.9 mV', '0.08 mV'], answer: 1, explain: '3.3/4096 = 0.806 mV.' },
      { q: 'Which ADC is fastest?', options: ['Dual-slope', 'Sigma-delta', 'Flash', 'SAR'], answer: 2, explain: 'All comparisons in parallel.' },
      { q: 'Quantisation is…', options: ['measuring at regular intervals', 'rounding to a finite set of levels', 'writing the binary code', 'filtering noise'], answer: 1, explain: 'Day08_2 slide 4.' },
    ],
  },
};

export default topic;
