import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'seven-segment',
  unit: 2,
  order: 7,
  title: 'Seven-segment display',
  short: 'Segment naming, common-cathode vs common-anode, digit look-up tables, GPIO port writes and multiplexing several digits.',
  status: 'additional',
  sources: [
    { file: 'Syllabus (Day01 slide 4)', detail: 'listed in Unit 2; no lecture material supplied' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: 'Ch. 1 mentions 7-segment modules (figure 1.21)' },
  ],
  keywords: ['seven segment', '7-segment', 'common cathode', 'common anode', 'segment code', 'look-up table', 'multiplexing', 'BCD'],
  importance: 1,
  sims: ['sevenseg'],
  related: ['leds-switches', 'gpio-registers', 'bit-manipulation'],
  fundamentals: {
    what: md`A **seven-segment display** is eight LEDs (segments **a–g** plus the decimal point **dp**) arranged to form digits. In a **common-cathode** display all cathodes are joined to GND and a segment lights when its pin is HIGH; in a **common-anode** display all anodes go to V_DD and a segment lights when its pin is LOW.`,
    why: md`It is the cheapest, most readable way to show numbers — counters, clocks, temperatures, meter readings — without an LCD controller.`,
    problem: md`Converts a number into the pattern of segments to light. A look-up table makes the conversion one array access; multiplexing lets 4 digits share 8 segment lines.`,
    how: md`Wire segments a–g, dp to eight GPIO pins (e.g. PB0–PB7) through resistors. Store the 8-bit pattern for each digit in a table and write it to the port: «GPIOB->ODR = (GPIOB->ODR & ~0xFF) | seg[d];». For several digits, enable one digit's common pin at a time, fast enough that the eye sees all lit.`,
    where: md`Digital clocks, microwave timers, petrol pumps, lifts, weighing scales, multimeters.`,
  },
  detailed: md`
> [!additional]
> Listed in the syllabus but not in your slides or labs; written from standard practice and the GPIO knowledge you already have.

::diagram{seven-seg}

## Segment codes (common cathode, bit order dp g f e d c b a)

| Digit | Segments ON | Binary | Hex (CC) | Hex (CA = ~CC) |
|---|---|---|---|---|
| 0 | a b c d e f | 0011 1111 | 0x3F | 0xC0 |
| 1 | b c | 0000 0110 | 0x06 | 0xF9 |
| 2 | a b d e g | 0101 1011 | 0x5B | 0xA4 |
| 3 | a b c d g | 0100 1111 | 0x4F | 0xB0 |
| 4 | b c f g | 0110 0110 | 0x66 | 0x99 |
| 5 | a c d f g | 0110 1101 | 0x6D | 0x92 |
| 6 | a c d e f g | 0111 1101 | 0x7D | 0x82 |
| 7 | a b c | 0000 0111 | 0x07 | 0xF8 |
| 8 | all | 0111 1111 | 0x7F | 0x80 |
| 9 | a b c d f g | 0110 1111 | 0x6F | 0x90 |

## Driving one digit

~~~c Common-cathode display on PB0–PB7
const uint8_t seg[10] = {0x3F,0x06,0x5B,0x4F,0x66,0x6D,0x7D,0x07,0x7F,0x6F};
RCC->AHB1ENR |= (1U << 1);
GPIOB->MODER = (GPIOB->MODER & ~0xFFFFU) | 0x5555U;   // PB0–PB7 outputs (01 each)
void show(uint8_t d) {
    GPIOB->ODR = (GPIOB->ODR & ~0xFFU) | seg[d];       // keep PB8–PB15 unchanged
}
~~~

Each segment needs its own resistor (≈ 330 Ω); one shared resistor in the common line would make the brightness depend on how many segments are lit.

## Multiplexing several digits

1. Connect all a–g, dp lines in parallel to the 8 GPIO pins.
2. Drive each digit's common pin through a transistor from its own GPIO.
3. In a SysTick/timer interrupt every ~2–5 ms: turn the current digit off, output the next digit's pattern, turn that digit on.
4. Refresh rate per digit = interrupt rate / number of digits; keep it above ~60 Hz to avoid flicker.

Pins needed for 4 digits: 8 + 4 = 12 instead of 32.

## Binary to digits

To show 1234: thousands = n / 1000, hundreds = (n / 100) % 10, tens = (n / 10) % 10, units = n % 10.
`,
  visual: md`
Pick digits, switch between common-cathode and common-anode, click segments to make your own symbol and read the byte to output:

::sim{sevenseg}
`,
  exam: {
    definitions: [
      { term: 'Common-cathode display', def: 'Seven-segment display whose LED cathodes are tied to ground; a segment lights with a HIGH input.' },
      { term: 'Common-anode display', def: 'Display whose anodes are tied to V_DD; a segment lights with a LOW input.' },
      { term: 'Multiplexing', def: 'Driving several digits with shared segment lines by enabling one digit at a time rapidly.' },
    ],
    formulas: [{ name: 'Common-anode code', expr: 'CA = ~CC & 0xFF', example: '2: ~0x5B = 0xA4' }],
    frequent: ['Draw a seven-segment display and give segment codes.', 'Interface a seven-segment display to a microcontroller.'],
    mistakes: ['Using the same codes for common-anode and common-cathode.', 'One resistor in the common line.', 'Writing the whole ODR and clobbering other pins.'],
    diagrams: ['Segment layout a–g, dp', 'Interfacing circuit with resistors'],
    shortQs: [
      { q: 'Give the common-cathode and common-anode codes for digit 5 (dp g f e d c b a).', a: md`Segments a, c, d, f, g → 0110 1101 = 0x6D (CC); common anode = ~0x6D = 0x92.`, marks: 2 },
      { q: 'Why are displays multiplexed?', a: md`To reduce pins: 4 digits need 8 + 4 lines instead of 32; digits are refreshed in turn faster than the eye can see.`, marks: 2 },
      { q: 'Why does each segment need its own resistor?', a: md`To limit each LED current independently; a shared resistor would make brightness depend on the number of lit segments.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the interfacing of a common-cathode seven-segment display to the STM32F401 and write a program to count 0–9 every second.', a: md`Circuit on PB0–PB7 with resistors; code table; MODER for 8 outputs; loop writing seg[i] with a 1 s SysTick delay; explain masking to preserve other pins.`, marks: 8 },
      { q: 'Explain how four seven-segment digits can be driven using multiplexing.', a: md`Shared segment bus, digit-enable transistors, timer-interrupt refresh algorithm, refresh-rate calculation, splitting a number into digits, pin saving.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Segments a–g + dp; bit order dp g f e d c b a.', 'CC: 1 = ON; CA: 0 = ON (CA = ~CC).', '0x3F 0x06 0x5B 0x4F 0x66 0x6D 0x7D 0x07 0x7F 0x6F for 0–9 (CC).', 'Multiplex: refresh each digit > 60 Hz.'],
    takeaways: ['Memorise 0x3F (0), 0x06 (1), 0x7F (8).', 'Mask when writing the port.'],
    mcqs: [
      { q: 'Common-cathode code for digit 1:', options: ['0x3F', '0x06', '0x4F', '0x7F'], answer: 1, explain: 'Segments b and c.' },
      { q: 'In a common-anode display a segment lights when its pin is…', options: ['HIGH', 'LOW', 'floating', 'analog'], answer: 1, explain: 'Anodes at V_DD.' },
      { q: 'Pins needed to multiplex 4 digits (with dp):', options: ['32', '12', '8', '4'], answer: 1, explain: '8 segment + 4 digit lines.' },
      { q: 'Code 0x7F lights…', options: ['digit 0', 'digit 8', 'nothing', 'only dp'], answer: 1, explain: 'All seven segments.' },
      { q: 'CA code for 0 (CC 0x3F):', options: ['0x3F', '0xC0', '0xFF', '0x00'], answer: 1, explain: '~0x3F & 0xFF = 0xC0.' },
    ],
  },
};

export default topic;
