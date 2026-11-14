import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'uart',
  unit: 3,
  order: 8,
  title: 'UART / USART on the STM32F401',
  short: 'UART vs USART, the data frame, baud rate and oversampling, USART_BRR calculation, SR/DR/CR1 registers, and the TX, string-TX and echo lab programs.',
  status: 'course',
  sources: [
    { file: 'Day10_5_UART_TX.pptx', detail: 'slides 7–49 (UART/USART, packet, baud, features, TX procedure, TXE/TC, oversampling, BRR examples, PA2 setup)' },
    { file: 'Day10_6_UART_RX & TX.pptx', detail: 'slides 1–22 (PA3 RX, AFRL, echo)' },
    { file: 'EMBEDDED_LAB_MATERIALS/USART and Lab_7', detail: 'uart_TX.txt, UART_String_TX.txt, RX_TX.c, stm32f4_usart2_config.txt' },
  ],
  keywords: ['UART', 'USART', 'baud rate', 'start bit', 'stop bit', 'parity', 'frame', 'BRR', 'USARTDIV', 'mantissa', 'fraction', 'oversampling', 'OVER8', 'TXE', 'TC', 'RXNE', 'USART2', 'PA2', 'PA3', 'AF7', 'FT232RL', 'Docklight', '9600', '115200'],
  importance: 2,
  sims: ['uart'],
  practicals: ['p12-uart-tx', 'p13-uart-echo'],
  related: ['serial-basics', 'gpio-registers', 'io-sync'],
  fundamentals: {
    what: md`A **UART** (Universal Asynchronous Receiver/Transmitter) sends bytes serially without a clock: idle HIGH, a **start bit** (LOW), 5–9 **data bits** LSB first, an optional **parity** bit, and 1–2 **stop bits** (HIGH). Both ends must use the same **baud rate**. The STM32 **USART** can also work synchronously; the labs use USART2 in asynchronous mode.`,
    why: md`It is the simplest way for an MCU to talk to a PC terminal, GPS, Bluetooth/Wi-Fi modules and other MCUs, needing only two wires (TX, RX) plus ground.`,
    problem: md`Provides full-duplex point-to-point communication with hardware framing, error detection (parity, framing, noise, overrun) and a programmable baud rate.`,
    how: md`Configure the pins as alternate function **AF7** (PA2 = TX, PA3 = RX), enable the USART2 clock (APB1ENR bit 17), set **BRR** from the formula USARTDIV = f_ck / (16 × baud), enable **TE/RE/UE** in CR1. To send: wait for **TXE**, write DR. To receive: wait for **RXNE**, read DR.`,
    where: md`Lab 7/8: send 'V' repeatedly, send “Embedded Systems”, echo characters back to Docklight through an FT232RL/HW-417 USB-TTL adapter.`,
  },
  detailed: md`
## UART vs USART (Day10_5 slide 8)

| UART | USART |
|---|---|
| Asynchronous only; clock generated locally on each side | Synchronous or asynchronous; can output a clock to the receiver |
| Baud rate must be agreed in advance | In synchronous mode the receiver uses the transmitter's clock |
| Lower data rates | Higher data rates possible |
| Simple standalone protocol | Supports LIN, RS-485, IrDA, smartcard… |

## The data frame (slides 13–14)

::diagram{uart-frame}

- **Idle**: line held HIGH (lets the receiver know a transmitter is connected).
- **Start bit**: HIGH → LOW for one bit time; the receiver detects the edge and starts timing.
- **Data**: 5–9 bits, **LSB first** (8 bits if parity is used on a 9-bit setting).
- **Parity** (optional): even or odd count of 1s for error detection.
- **Stop bit(s)**: line HIGH for 1 (or 2) bit times; then idle.

Wiring: TX → RX and RX → TX, common ground (slide 12, 22).

::diagram{uart-connection}

## Baud rate (slide 15)

Bits per second; standard values 1200, 2400, 4800, **9600**, 19200, 38400, 57600, **115200**. One bit time = 1/baud (9600 → 104.17 µs). A 10-bit frame (start + 8 data + stop) carries one byte, so 9600 baud ≈ 960 bytes/s.

## STM32 USART features (slide 17)

Full duplex asynchronous; fractional baud-rate generator up to 4.5 Mbit/s; parity; 8 or 9 data bits; 1 or 2 stop bits; LIN, IrDA, smartcard, single-wire half duplex; DMA; flags TXE, TC, RXNE; error flags ORE, NE, FE, PE; 10 interrupt sources.

## Oversampling (slides 29–31)

The receiver samples each bit 16 times (OVER8 = 0) or 8 times (OVER8 = 1) and takes a majority vote of the middle samples (8, 9, 10 or 4, 5, 6). If they disagree, the **noise error (NE)** flag is set.

## Baud-rate register calculation (slides 32–34, 44)

$$
USARTDIV = f_ck / (8 × (2 − OVER8) × baud)       →  f_ck / (16 × baud) when OVER8 = 0
BRR[15:4] = integer part (mantissa) ;  BRR[3:0] = round(fraction × 16)
$$

| f_ck | Baud | USARTDIV | Mantissa | Fraction | BRR | Actual baud |
|---|---|---|---|---|---|---|
| 16 MHz | 9600 | 104.1667 | 104 = 0x68 | 0.1667 × 16 = 2.67 → 3 | **0x0683** | 9598 (−0.02 %) |
| 16 MHz | 115200 | 8.6806 | 8 = 0x008 | 0.6806 × 16 = 10.89 → 11 = 0xB | **0x008B** | 115 108 (−0.08 %) |

With **OVER8 = 1** the fraction uses ×8 and only 3 bits (bit 3 = 0):

| f_ck | Baud | USARTDIV = f/(8·baud) | BRR |
|---|---|---|---|
| 16 MHz | 115200 | 17.36 → 17 = 0x011, 0.36 × 8 = 2.9 → 3 | **0x0113** ✓ (slide 34) |
| 16 MHz | 9600 | **208.33** → 208 = 0x0D0, 0.33 × 8 = 2.7 → 3 | **0x0D03** |

> [!warning] Arithmetic slip on Day10_5 slide 34
> The slide computes 16 MHz / (8 × 9600) as “280.33” and gives BRR = 0x1183. The correct quotient is 16 000 000 / 76 800 = **208.33**, so BRR = **0x0D03**. (0x1183 would give about 7 130 baud.) The ×16 examples on the other slides are correct.

## Registers

| Register | Bits used | Meaning |
|---|---|---|
| USART_SR | TXE (7), TC (6), RXNE (5), ORE (3), NE (2), FE (1), PE (0) | status |
| USART_DR | [8:0] | write → transmit; read → received byte |
| USART_BRR | mantissa [15:4], fraction [3:0] | baud rate |
| USART_CR1 | UE (13), M (12), PCE (10), PS (9), TXEIE (7), RXNEIE (5), TE (3), RE (2) | control |
| USART_CR2 | STOP [13:12] | stop bits |

## Transmit procedure (slide 18)

1. Enable the USART (UE = 1). 2. Program word length M. 3. Program stop bits in CR2. 4. (DMA if multi-buffer.) 5. Set BRR. 6. Set TE — an idle frame is sent first. 7. Write each byte to DR after TXE = 1 (writing clears TXE). 8. After the last byte wait for **TC = 1** before disabling the USART or sleeping.

**TXE vs TC** (slide 19): TXE = the data register is empty (the byte moved to the shift register) — you may write the next byte; TC = the shift register has also finished sending the stop bit — the line is truly idle.

## The lab setup for USART2 (PA2 TX, PA3 RX)

~~~c RX_TX.c (echo)
RCC->AHB1ENR |= (1 << 0);                      // GPIOA clock
GPIOA->MODER |= (1 << 5);                      // PA2 → 10 (AF)
GPIOA->MODER |= (1 << 7);                      // PA3 → 10 (AF)
GPIOA->AFR[0] &= ~(1 << 15);                   // PA3 AF bits 15:12 = 0111 (AF7)
GPIOA->AFR[0] |= (1 << 14) | (1 << 13) | (1 << 12);
GPIOA->AFR[0] &= ~(1 << 11);                   // PA2 AF bits 11:8 = 0111 (AF7)
GPIOA->AFR[0] |= (1 << 10) | (1 << 9) | (1 << 8);
RCC->APB1ENR |= (1 << 17);                     // USART2 clock
USART2->BRR = 0x0683;                          // 9600 baud @ 16 MHz
USART2->CR1 |= (1 << 2) | (1 << 3) | (1 << 13);// RE, TE, UE
while (1) {
    while (!(USART2->SR & (1U << 5))) {}       // wait RXNE
    data = USART2->DR;                         // read byte
    while (!(USART2->SR & (1U << 7))) {}       // wait TXE
    USART2->DR = data;                         // echo it
}
~~~

## Advantages and disadvantages (slide 10)

Advantages: only two wires for full duplex; no clock needed; parity for error detection; flexible packet format; simple and widely documented. Disadvantages: slower than parallel/USART synchronous; baud rates must match within a small error; max 9 data bits per frame; only two devices — no multiple masters/slaves.
`,
  visual: md`
Type a message, choose baud and framing, and watch it leave TX bit by bit and arrive at RX; the BRR calculation updates live:

::sim{uart preset=echo}

::diagram{uart-frame}
`,
  exam: {
    definitions: [
      { term: 'UART', def: 'Universal Asynchronous Receiver/Transmitter: hardware for asynchronous serial communication with start/stop framing.' },
      { term: 'Baud rate', def: 'The number of signal symbols (bits for UART) transmitted per second.' },
      { term: 'Start bit', def: 'A LOW bit marking the beginning of a UART frame after the idle-HIGH line.' },
      { term: 'Parity bit', def: 'An extra bit making the total number of 1s even or odd, for single-bit error detection.' },
      { term: 'Oversampling', def: 'Sampling each received bit several times (16 or 8) and voting to reject noise.' },
      { term: 'TXE', def: 'Transmit data register empty flag: DR can accept a new byte.' },
      { term: 'RXNE', def: 'Read data register not empty flag: a received byte is waiting in DR.' },
    ],
    formulas: [
      { name: 'USARTDIV (OVER8 = 0)', expr: 'USARTDIV = f_ck / (16 × baud)', example: '16 MHz, 9600 → 104.1667' },
      { name: 'BRR', expr: 'BRR = (mantissa << 4) | round(fraction × 16)', example: '104, 3 → 0x0683' },
      { name: 'Bit time', expr: 't_bit = 1 / baud', example: '9600 → 104.17 µs' },
      { name: 'Frame time', expr: 't_frame = (1 + data + parity + stop) / baud', example: '10 bits @ 115200 → 86.8 µs' },
    ],
    frequent: ['Draw the UART frame.', 'Calculate BRR for 9600 / 115200 at 16 MHz.', 'Explain UART registers and write TX/RX code.', 'UART vs USART; UART vs I²C.'],
    mistakes: ['Sending MSB first (UART is LSB first).', 'Forgetting the alternate-function setting (AF7) for PA2/PA3.', 'Writing DR without waiting for TXE (bytes lost).', 'Connecting TX to TX.', 'Using 280.33 for 16 MHz/(8×9600) (it is 208.33).', 'Including stm32f446xx.h for an F401 project.'],
    diagrams: ['UART frame with idle, start, data, parity, stop', 'TX/RX crossed connection with common ground'],
    shortQs: [
      { q: 'Compute USART_BRR for 9600 baud with a 16 MHz clock and 16× oversampling.', a: md`USARTDIV = 16 × 10⁶ / (16 × 9600) = 104.1667; mantissa 104 = 0x68; fraction 0.1667 × 16 = 2.67 → 3; **BRR = 0x0683**.`, marks: 2 },
      { q: 'Difference between TXE and TC.', a: md`TXE = 1 when the transmit data register has been copied to the shift register, so the next byte may be written. TC = 1 when the shift register has also finished (stop bit sent) — the transmission is fully complete; wait for TC before disabling the USART.`, marks: 2 },
      { q: 'Draw the frame for the character ‘A’ (0x41) with 8 data bits, even parity and one stop bit.', a: md`Idle 1 | start 0 | data LSB first 1 0 0 0 0 0 1 0 | parity 0 (two 1s → even) | stop 1 | idle 1.`, marks: 2 },
      { q: 'How long does it take to send “Embedded Systems” (16 characters) at 115 200 baud, 8N1?', a: md`10 bits per character → 160 bits / 115 200 = 1.39 ms.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the UART protocol and the STM32 USART peripheral. Write a register-level program to transmit the string “Embedded Systems” at 115200 baud on USART2.', a: md`Frame, baud, oversampling; registers SR/DR/BRR/CR1; BRR = 0x008B calculation; the UART_String_TX program (with stm32f4xx.h) explained line by line: GPIOA clock, PA2 AF mode, AF7, USART2 clock, BRR, TE, UE, loop waiting for TXE and writing each character.`, marks: 8 },
      { q: 'Explain how the STM32 receives UART data and write an echo program at 9600 baud.', a: md`Start-bit detection, oversampling and majority vote, RXNE and error flags (ORE, NE, FE, PE); the RX_TX.c program with PA3 AF7, RE enable, BRR 0x0683, RXNE wait/read, TXE wait/write.`, marks: 8 },
    ],
    numericals: [
      {
        q: 'Find USART_BRR for 115200 baud with f_ck = 16 MHz and 16× oversampling.',
        given: ['f_ck = 16 MHz', 'baud = 115200', 'OVER8 = 0'],
        find: 'BRR',
        formula: 'USARTDIV = f_ck / (16 × baud); BRR = mantissa << 4 | round(frac × 16)',
        steps: ['USARTDIV = 16 000 000 / 1 843 200 = 8.6806', 'Mantissa = 8 → 0x008', 'Fraction = 0.6806 × 16 = 10.89 → 11 = 0xB', 'BRR = 0x008B'],
        answer: '0x008B',
        value: 0x8b,
      },
      {
        q: 'Find USART_BRR for 9600 baud with f_ck = 16 MHz and 8× oversampling (OVER8 = 1).',
        given: ['f_ck = 16 MHz', 'baud = 9600', 'OVER8 = 1'],
        find: 'BRR',
        formula: 'USARTDIV = f_ck / (8 × baud); fraction in 3 bits = round(frac × 8)',
        steps: ['USARTDIV = 16 000 000 / 76 800 = 208.33', 'Mantissa = 208 = 0x0D0', 'Fraction = 0.333 × 8 = 2.67 → 3', 'BRR = 0x0D03 (bit 3 kept 0)'],
        answer: '0x0D03 (the slide’s 0x1183 uses a mis-division)',
        value: 0x0d03,
      },
    ],
  },
  revision: {
    notes: ['Frame: idle 1, start 0, data LSB first, [parity], stop 1.', 'USARTDIV = f/(16·baud); 16 MHz: 9600 → 0x0683, 115200 → 0x008B.', 'PA2 TX, PA3 RX, AF7; USART2 clock APB1ENR bit 17.', 'CR1: UE 13, TE 3, RE 2. SR: TXE 7, TC 6, RXNE 5.', 'TX: wait TXE → write DR. RX: wait RXNE → read DR.', 'Oversampling 16 (samples 8, 9, 10) or 8 (4, 5, 6); NE on disagreement.'],
    takeaways: ['LSB first.', 'TX ↔ RX crossed, common ground.', 'Check the slide’s OVER8 9600 example (208.33, not 280.33).'],
    mcqs: [
      { q: 'Idle state of a UART line:', options: ['LOW', 'HIGH', 'floating', 'toggling'], answer: 1, explain: 'Pulled high.' },
      { q: 'BRR for 9600 baud at 16 MHz (×16):', options: ['0x008B', '0x0683', '0x1183', '0x0068'], answer: 1, explain: '104 + 3/16.' },
      { q: 'Which flag shows a byte has been received?', options: ['TXE', 'TC', 'RXNE', 'ORE'], answer: 2, explain: 'Read data register not empty.' },
      { q: 'Alternate function number for USART2 on PA2/PA3:', options: ['AF1', 'AF4', 'AF7', 'AF9'], answer: 2, explain: 'AF7.' },
      { q: 'UART data bits are sent…', options: ['MSB first', 'LSB first', 'in parallel', 'in BCD'], answer: 1, explain: 'Day10_5 slide 14.' },
    ],
  },
};

export default topic;
