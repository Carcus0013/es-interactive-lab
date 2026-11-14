import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'spi',
  unit: 3,
  order: 11,
  title: 'SPI (Serial Peripheral Interface)',
  short: 'Four-wire synchronous full-duplex bus: SCLK, MOSI, MISO, CS; shift-register exchange; CPOL/CPHA modes; multiple slaves; SPI vs I²C vs UART.',
  status: 'additional',
  sources: [
    { file: 'Day10_5_UART_TX.pptx', detail: 'slides 4, 6 (SPI listed as a synchronous protocol)' },
    { file: 'Case_Study_Guidelines_26.pdf', detail: 'SPI allowed as the external peripheral interface' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§8.3 Synchronous Serial Interface (SSI)' },
  ],
  externalNote: md`SPI is named in your UART deck and the case-study rules but has no lecture or lab. This lesson uses general SPI knowledge and Valvano §8.3 (SSI = TI's name for SPI).`,
  keywords: ['SPI', 'SCLK', 'MOSI', 'MISO', 'CS', 'NSS', 'slave select', 'CPOL', 'CPHA', 'mode 0', 'full duplex', 'shift register', 'daisy chain', 'SD card', 'display', 'SPI1'],
  importance: 1,
  sims: ['spi'],
  related: ['serial-basics', 'i2c', 'uart'],
  fundamentals: {
    what: md`**SPI** is a synchronous, **full-duplex**, single-master serial bus with four signals: **SCLK** (clock from master), **MOSI** (master out, slave in), **MISO** (master in, slave out) and **CS/NSS** (chip select, active LOW, one per slave). Master and slave each hold a shift register; every clock pulse moves one bit each way, so after 8 clocks they have **swapped** bytes.`,
    why: md`Some peripherals (SD cards, TFT displays, fast ADCs, flash memories, radio modules) need far higher speed than I²C provides; SPI runs at tens of MHz with very simple hardware.`,
    problem: md`High-throughput, low-overhead communication: no addresses, no ACKs, no start/stop framing — just clocked bits with a select line.`,
    how: md`The master pulls the slave's CS LOW, then generates 8 (or 16) SCLK pulses. **CPOL** sets the clock's idle level, **CPHA** sets whether data is sampled on the first or second edge. Both sides must use the same mode (0–3). CS goes HIGH to end the transfer.`,
    where: md`SD cards, ILI9341/ST7735 displays, NRF24L01 radios, MAX7219 LED drivers, external ADC/DAC chips, SPI Flash. Allowed for the case-study “external peripheral interface”.`,
  },
  detailed: md`
> [!additional]
> Not taught in your supplied material; required knowledge if your case study uses an SPI module.

::diagram{spi-bus}

## The four modes

| Mode | CPOL | CPHA | Clock idle | Data sampled on |
|---|---|---|---|---|
| 0 | 0 | 0 | LOW | rising (first) edge |
| 1 | 0 | 1 | LOW | falling (second) edge |
| 2 | 1 | 0 | HIGH | falling (first) edge |
| 3 | 1 | 1 | HIGH | rising (second) edge |

Most devices use mode 0 or 3. Data are normally sent **MSB first**.

## Multiple slaves

- **Independent CS**: one CS line per slave; only the selected slave drives MISO (others tri-state it).
- **Daisy chain**: MISO of one slave feeds MOSI of the next; data shifts through all (LED drivers, shift registers).

## STM32 SPI basics (RM0368, external)

SPI1 on PA5 (SCK), PA6 (MISO), PA7 (MOSI), AF5. Key registers: CR1 (MSTR, BR[2:0] baud divider, CPOL, CPHA, SPE, SSM/SSI), SR (TXE, RXNE, BSY), DR.

~~~c Exchange one byte (polling)
uint8_t spi_xfer(uint8_t out) {
    while (!(SPI1->SR & (1U << 1))) {}   // TXE
    *(volatile uint8_t *)&SPI1->DR = out;
    while (!(SPI1->SR & (1U << 0))) {}   // RXNE
    return *(volatile uint8_t *)&SPI1->DR;   // byte shifted in simultaneously
}
// CS: GPIOA->BSRR = (1U << (4 + 16));  spi_xfer(cmd);  GPIOA->BSRR = (1U << 4);
~~~

## Comparison

| | UART | I²C | SPI |
|---|---|---|---|
| Wires | 2 (+GND) | 2 | 4 (+1 CS per extra slave) |
| Clock | none (async) | SCL | SCLK |
| Duplex | full | half | full |
| Addressing | none | 7/10-bit | CS lines |
| ACK | no | yes | no |
| Speed | ≤ few Mbit/s | 100 k – 3.4 Mbit/s | tens of Mbit/s |
| Devices | 2 | many (≤ 128) | limited by CS pins |
| Typical | PC console, GPS, BT | sensors, EEPROM, RTC, LCD backpack | SD card, displays, fast ADC |
`,
  visual: md`
Choose a mode and two bytes; step edge by edge and watch the master and slave registers swap:

::sim{spi}
`,
  exam: {
    definitions: [
      { term: 'SPI', def: 'Serial Peripheral Interface: a synchronous full-duplex master/slave bus using SCLK, MOSI, MISO and chip select.' },
      { term: 'MOSI / MISO', def: 'Master-out-slave-in and master-in-slave-out data lines.' },
      { term: 'Chip select (CS/NSS)', def: 'Active-low line by which the master selects one slave.' },
      { term: 'CPOL / CPHA', def: 'Clock polarity (idle level) and clock phase (sampling edge) that define the SPI mode.' },
    ],
    frequent: ['Explain SPI with a diagram.', 'SPI modes.', 'Compare SPI, I²C and UART.'],
    mistakes: ['Calling SPI half duplex.', 'Forgetting that reading requires sending a (dummy) byte.', 'Mismatched modes between master and slave.'],
    diagrams: ['Master–slave SPI connections', 'Mode 0 timing'],
    shortQs: [
      { q: 'Why is SPI called full duplex?', a: md`On every clock pulse the master shifts a bit out on MOSI while the slave shifts a bit out on MISO, so data moves in both directions simultaneously.`, marks: 2 },
      { q: 'What do CPOL and CPHA define?', a: md`CPOL: SCLK idle level (0 LOW, 1 HIGH). CPHA: whether data is sampled on the first (0) or second (1) clock edge. Together they give modes 0–3.`, marks: 2 },
      { q: 'How does an SPI master select one of three slaves?', a: md`Each slave has its own CS line; the master drives only that slave's CS LOW during the transfer; unselected slaves keep MISO in high impedance.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the SPI protocol with a block diagram and timing diagram, and compare it with I²C.', a: md`Signals, shift-register exchange, CS, modes table, mode-0 timing diagram, multiple slaves; comparison table with I²C (wires, duplex, addressing, ACK, speed, devices).`, marks: 8 },
      { q: 'Your case study needs an SD card and a temperature sensor. Which bus would you use for each and why?', a: md`SD card → SPI (high throughput, simple, full duplex); temperature sensor → I²C (few bytes, shares two wires with other sensors, addressing, ACK). Justify with the comparison criteria.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['SCLK, MOSI, MISO, CS (active LOW).', 'Full duplex: bytes swap after 8 clocks.', 'Modes 0–3 from CPOL/CPHA; usually mode 0 or 3; MSB first.', 'No addressing/ACK; one CS per slave.'],
    takeaways: ['Fastest of the three common buses.'],
    mcqs: [
      { q: 'Number of signal lines in basic single-slave SPI:', options: ['2', '3', '4', '8'], answer: 2, explain: 'SCLK, MOSI, MISO, CS.' },
      { q: 'SPI mode with clock idle HIGH and sampling on the first edge:', options: ['0', '1', '2', '3'], answer: 2, explain: 'CPOL = 1, CPHA = 0.' },
      { q: 'How does a slave know it is addressed?', options: ['7-bit address', 'Its CS line goes LOW', 'Start bit', 'ACK'], answer: 1, explain: 'Chip select.' },
      { q: 'To read a byte from an SPI slave the master must…', options: ['send STOP', 'clock out a byte (dummy if needed)', 'wait for RXNE only', 'change mode'], answer: 1, explain: 'Clocks come only from the master.' },
      { q: 'Which is typically fastest?', options: ['I²C', 'UART', 'SPI', 'RS-232'], answer: 2, explain: 'Tens of MHz.' },
    ],
  },
};

export default topic;
