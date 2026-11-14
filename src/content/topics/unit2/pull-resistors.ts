import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'pull-resistors',
  unit: 2,
  order: 4,
  title: 'Pull-up and pull-down resistors',
  short: 'Why an unconnected input floats, how pull-up and pull-down resistors define a default level, internal PUPDR resistors, and open-drain outputs.',
  status: 'course',
  sources: [
    { file: 'Day05_Lecture02_Pull-Up and Pull down.pptx', detail: 'slides 1–7 (Dr. A. Baskar)' },
    { file: 'Day05_Lecture01_GPIO_Configuration_Registers.pptx', detail: 'slides 17, 25–28 (OTYPER, PUPDR)' },
    { file: 'stm32f401cc.pdf', detail: 'V_IL/V_IH, internal pull-up ≈ 40 kΩ' },
  ],
  keywords: ['pull-up', 'pull-down', 'floating', 'high impedance', 'PUPDR', 'logic threshold', 'V_IL', 'V_IH', 'open-drain', 'button'],
  importance: 2,
  sims: ['pullup', 'gpio'],
  practicals: ['p03-button-led', 'p04-switch-led'],
  related: ['gpio-registers', 'leds-switches', 'i2c'],
  fundamentals: {
    what: md`A **pull-up resistor** connects a signal line to the supply (V_DD) so it reads **HIGH** when nothing drives it; a **pull-down resistor** connects it to ground so it reads **LOW**. STM32 GPIO pins contain switchable internal pull-up and pull-down resistors selected in **GPIOx_PUPDR**.`,
    why: md`A digital input has three possible states: HIGH, LOW and **floating** (undefined). An input connected only to an open switch floats: it picks up noise and may read 0 or 1 at random, falsely triggering the program.`,
    problem: md`The resistor gives the input a known default level, while still letting a switch (or another device) override it. It also limits the current when the switch closes.`,
    how: md`With a pull-up and a switch to GND: switch open → the resistor pulls the pin to V_DD → reads 1; switch closed → the pin is shorted to GND → reads 0 (a small current flows through the resistor). A pull-down works the other way round with the switch to V_DD.`,
    where: md`All lab switches (PA0, PA6, PB10) use internal pull-ups (PUPDR = 01). I²C lines need pull-ups because the outputs are open-drain.`,
  },
  detailed: md`
## Logic levels and the floating problem (Day05 L02 slides 3–4)

Digital circuits recognise only HIGH and LOW. The lecture's 5 V example: input above 2 V → HIGH, below 0.8 V → LOW, **0.9–1.9 V → undefined**. An unconnected (floating) input drifts into this band because of leakage and electrical noise, so the reading is unpredictable.

For the STM32F401 at V_DD = 3.3 V the datasheet thresholds are: **V_IL ≤ 0.3 V_DD ≈ 0.99 V** (reads 0) and **V_IH ≥ 0.7 V_DD ≈ 2.31 V** (reads 1).

## Pull-up resistor (slide 5)

“A resistor connected between a signal line (input pin) and the positive supply voltage (Vcc) … ensures the signal line is at a high logic level when no other device is actively pulling it low.”

## Pull-down resistor (slide 6)

“A resistor connected between a signal line and ground … switch open: resistor connects the pin to GND → logic LOW; switch closed: pin connected to Vcc (HIGH) → resistor is overridden.”

::diagram{pull-resistors}

| Configuration | Switch open | Switch pressed | PUPDR |
|---|---|---|---|
| Pull-up, switch to GND (lab kit) | 1 | 0 | 01 |
| Pull-down, switch to V_DD | 0 | 1 | 10 |
| No pull, switch to GND | **floating** | 0 | 00 ✘ |

## Internal resistors in the STM32 (PUPDR)

~~~c Lab 3: PA0 key with pull-up
GPIOA->MODER &= ~(3U << 0);   // MODER0 = 00 (input)
GPIOA->PUPDR &= ~(3U << 0);   // clear PUPDR0
GPIOA->PUPDR |=  (1U << 0);   // PUPDR0 = 01 → pull-up
~~~

The internal pull resistors are weak (about 40 kΩ typ.), fine for buttons, too weak for fast buses — I²C at 400 kHz needs external 2.2–4.7 kΩ resistors. *(Typical value from the datasheet electrical characteristics.)*

## Choosing the resistor value

- **Too small** → large current when the switch closes (3.3 V / 1 kΩ = 3.3 mA wasted) and the switch may not pull the line fully low.
- **Too large** → slow rising edges and more noise pickup.
- Typical: 4.7 kΩ – 47 kΩ for buttons; 2.2–10 kΩ for I²C.

## Pull-ups and open-drain outputs (Day05 L01 slide 17; Day10_8 slide 28)

An open-drain output can only pull low; when it “releases” the line, only a pull-up resistor makes it HIGH. Several open-drain devices can share one line safely (any one can pull it low — a wired-AND). This is exactly how the I²C bus works.

::diagram{pushpull-od}
`,
  visual: md`
Leave the input floating and watch the voltage wander through the undefined band; then enable a pull-up and press the switch:

::sim{pullup}
`,
  exam: {
    definitions: [
      { term: 'Pull-up resistor', def: 'A resistor between a signal line and V_DD that holds the line HIGH when no device drives it LOW.' },
      { term: 'Pull-down resistor', def: 'A resistor between a signal line and GND that holds the line LOW when no device drives it HIGH.' },
      { term: 'Floating input', def: 'An input not connected to a defined voltage, whose logic value is undefined and noise-sensitive.' },
      { term: 'Open-drain output', def: 'An output that can only sink current (pull low); a pull-up resistor provides the HIGH level.' },
    ],
    frequent: ['Explain pull-up and pull-down resistors with circuit diagrams.', 'Why is a pull-up needed for a push button?', 'Configure PUPDR for a given pin.'],
    mistakes: ['Drawing the pull-up to GND.', 'Saying a pressed button reads 1 with the kit’s pull-up wiring (it reads 0).', 'Using PUPDR = 11 (reserved).', 'Forgetting pull-ups for I²C.'],
    diagrams: ['Pull-up with switch to GND', 'Pull-down with switch to V_DD'],
    shortQs: [
      { q: 'What is a floating input and why is it a problem?', a: md`An input not connected to V_DD or GND. Its voltage drifts with noise and leakage, often into the undefined region between V_IL and V_IH, so the program reads random 0s and 1s and may trigger falsely.`, marks: 2 },
      { q: 'With an internal pull-up and a switch to ground, what does IDR read when the switch is pressed and released?', a: md`Pressed: 0 (pin shorted to GND). Released: 1 (pulled up to 3.3 V).`, marks: 2 },
      { q: 'Write code to enable the pull-down on PB10.', a: md`«GPIOB->PUPDR &= ~(3U << 20); GPIOB->PUPDR \|= (2U << 20);» (PUPDR10 = 10).`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain pull-up and pull-down resistors with neat diagrams. How are they configured in the STM32F401?', a: md`Three input states and the floating problem with thresholds; pull-up and pull-down circuits with truth tables; PUPDR encoding (00/01/10) and code for PA0; internal resistor value and when to use external ones; link to open-drain/I²C.`, marks: 6 },
      { q: 'Compare push-pull and open-drain outputs and explain why I²C requires pull-up resistors.', a: md`Push-pull drives both levels via P-MOS/N-MOS; open-drain only N-MOS. I²C devices all use open-drain so any device can pull the line low without short circuits (wired-AND, arbitration, ACK); the pull-up resistors restore the HIGH idle level.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Input states: HIGH, LOW, floating (undefined).', 'Pull-up → default 1; pull-down → default 0.', 'Kit switches: pull-up + switch to GND → pressed 0, released 1.', 'PUPDR: 00 none, 01 up, 10 down (2 bits per pin).', 'Open-drain needs a pull-up (I²C).'],
    takeaways: ['Never leave an input floating.', 'Pressed = 0 on the kit.'],
    mcqs: [
      { q: 'A push button connects a pin to GND. Which resistor configuration is needed?', options: ['Pull-down', 'Pull-up', 'None', 'Series resistor only'], answer: 1, explain: 'Pull-up gives a defined HIGH when released.' },
      { q: 'PUPDR field value for pull-down:', options: ['00', '01', '10', '11'], answer: 2, explain: '10 = pull-down.' },
      { q: 'An input with no pull resistor and an open switch is…', options: ['always 0', 'always 1', 'floating/undefined', 'analog'], answer: 2, explain: 'It floats.' },
      { q: 'Why does I²C need pull-up resistors?', options: ['To increase speed', 'Because the outputs are open-drain', 'To power the slave', 'To set the address'], answer: 1, explain: 'Open-drain outputs only pull low.' },
      { q: 'At V_DD = 3.3 V, an STM32 input is guaranteed to read 1 above about…', options: ['0.8 V', '1.65 V', '2.31 V', '3.3 V'], answer: 2, explain: 'V_IH = 0.7 V_DD.' },
    ],
  },
};

export default topic;
