import type { Practical } from '../../types';
import { md } from '../md';

const CHAR = md`#include "stm32f446xx.h"
int main()
{		// PIN Configuration
    RCC->AHB1ENR |= (1<<0);    // GPIO clock enabled for UART Tx Pin PA2 - GPIOA
    GPIOA->MODER |= (1<<5);    // Alternate function mode select for USART2 Tx Pin PA2
    GPIOA->AFR[0] &= (~(1<<11));   // Alternate function select mode for USART2 Tx Pin PA2
    GPIOA->AFR[0] |= (1<<10) | (1<<9) | (1<<8); // Alternate function select mode to be UART Tx channel
		// USART Configuration
    RCC->APB1ENR |= (1<<17);   // USART2 clock enable
    USART2->BRR = 0x008B; // Baudrate of USART2 to be 115200 @ 16 Mhz
    USART2->CR1 |= (1<<3);     // Tx enable
    USART2->CR1 |= (1<<13);    // USART2 enable
    while(1)
    {
        while(!(USART2->SR & (1U<<7))) {};  // wait for Tx buffer emptiness
        USART2->DR = 'V';                   // Write byte to USART2 Bus
    }
}`;

const STR = md`#include "stm32f446xx.h"
int main()
{	  // PIN Configuration
    RCC->AHB1ENR |= (1<<0);    // GPIO clock enabled for UART Tx Pin PA2 - GPIOA
    GPIOA->MODER |= (1<<5);    // Alternate function mode select for USART2 Tx Pin PA2
    GPIOA->AFR[0] &= (~(1<<11));   // Alternate function select mode for USART2 Tx Pin PA2
    GPIOA->AFR[0] |= (1<<10) | (1<<9) | (1<<8); // Alternate function select mode to be UART Tx channel
		// USART Configuration
    RCC->APB1ENR |= (1<<17);   // USART2 clock enable
    USART2->BRR = 0x008B; // Baudrate of USART2 to be 115200 @ 16 Mhz
    USART2->CR1 |= (1<<3);     // Tx enable
    USART2->CR1 |= (1<<13);    // USART2 enable
     // The string to send
    char message[] = "Embedded Systems";
    // Loop through each character in the string
    for (int i = 0; message[i] != '\0'; i++)
    {
        while (!(USART2->SR & (1U << 7))) {};  // Wait until TXE (Transmit Data Register Empty)
        USART2->DR = message[i];               // Send the current character
    }

    while (1)
    {
       // Infinite loop to keep the program running
    }
}`;

const p: Practical = {
  id: 'p12-uart-tx',
  order: 12,
  title: 'UART transmit: a character and a string (USART2, 115200 baud)',
  unit: 3,
  objective: 'Configure USART2 on PA2 (AF7) for 115200 baud at 16 MHz and transmit a character repeatedly and a string once, viewing the output on a PC terminal through a USB-TTL adapter.',
  components: ['STM32F401CCU6 Black Pill', 'FT232RL or HW-417 USB-to-TTL adapter', 'PC with Docklight / PuTTY / Tera Term at 115200 8N1', 'Jumper wires (PA2 → adapter RX, GND → GND)'],
  connections: [
    { pin: 'PA2', to: 'USB-TTL RX', mode: 'Alternate function AF7 (USART2_TX)' },
    { pin: 'GND', to: 'USB-TTL GND', mode: 'Common ground' },
  ],
  expected: md`**uart_TX:** the terminal fills with «VVVVVVVV…» continuously. **UART_String_TX:** the terminal shows «Embedded Systems» once after reset (press NRST to send again). Terminal settings must be 115200 baud, 8 data bits, no parity, 1 stop bit.`,
  sources: [{ file: 'USART/EXP_7_UART_TX/uart_TX.txt' }, { file: 'USART/EXP_7_UART_TX/UART_String_TX.txt' }, { file: 'Day10_5_UART_TX.pptx', detail: 'slides 36–49' }],
  circuit: { uart: { tx: 'PA2', label: 'FT232RL / HW-417 USB-TTL' } },
  programs: [
    {
      id: 'char',
      title: "uart_TX.txt — send 'V'",
      file: 'USART/EXP_7_UART_TX/uart_TX.txt',
      code: CHAR,
      corrected: {
        code: md`#include "stm32f4xx.h"          // F401 project header (was stm32f446xx.h)
int main(void)
{
    RCC->AHB1ENR |= (1U << 0);                              // GPIOA clock
    GPIOA->MODER  = (GPIOA->MODER & ~(3U << 4)) | (2U << 4);  // PA2 = 10 (AF)
    GPIOA->AFR[0] = (GPIOA->AFR[0] & ~(0xFU << 8)) | (7U << 8); // PA2 = AF7
    RCC->APB1ENR |= (1U << 17);                             // USART2 clock
    USART2->BRR = 0x008B;                                   // 115200 @ 16 MHz
    USART2->CR1 |= (1U << 3) | (1U << 13);                  // TE, UE
    while (1) {
        while (!(USART2->SR & (1U << 7))) { }               // TXE
        USART2->DR = 'V';
    }
}`,
        changes: ['Header changed from «stm32f446xx.h» (STM32F446 device) to «stm32f4xx.h» configured for the F401 — the register layout of GPIOA/USART2 is the same, so the original only works if the F446 header happens to be on the include path.', 'MODER field cleared before writing 10.', 'AF field written as a 4-bit value.'],
      },
      explain: [
        { lines: [1, 1], what: 'Device header (F446 — should be F401).', why: 'Supplies GPIOA, RCC, USART2 definitions; the F446 header defines the same addresses for these peripherals.' },
        { lines: [4, 4], what: 'GPIOA clock.', why: 'PA2 is on port A.', register: 'RCC_AHB1ENR bit 0' },
        { lines: [5, 5], what: 'PA2 → alternate function (MODER2 = 10).', why: 'Bit 5 set (bit 4 stays 0) → 10: the pin is handed to a peripheral.', register: 'GPIOA_MODER bits 5:4', ifRemoved: 'PA2 stays a GPIO input — USART2 cannot drive it, nothing is received.' },
        { lines: [6, 7], what: 'Select AF7 for PA2.', why: 'AFRL bits 11:8 = 0111 = AF7 = USART2.', register: 'GPIOA_AFR[0] (AFRL) bits 11:8', internal: 'Pins 0–7 use AFRL; 4 bits per pin → PA2 at bits 11:8.' },
        { lines: [9, 9], what: 'USART2 clock.', why: 'USART2 is on APB1.', register: 'RCC_APB1ENR bit 17', ifRemoved: 'USART2 registers cannot be written; TXE never set → hang.' },
        { lines: [10, 10], what: 'BRR = 0x008B → 115200 baud.', why: 'USARTDIV = 16 MHz / (16 × 115200) = 8.68 → mantissa 8, fraction round(0.68 × 16) = 11 (0xB).', register: 'USART_BRR', internal: 'Actual rate 115 108 baud (−0.08 % error).' },
        { lines: [11, 12], what: 'TE then UE.', why: 'Enable the transmitter and the USART.', register: 'USART_CR1 bits 3 and 13' },
        { lines: [15, 15], what: 'Wait for TXE.', why: 'Busy-wait until the data register can accept a new byte.', register: 'USART_SR bit 7', ifRemoved: 'Characters overwrite each other in DR; garbled output.' },
        { lines: [16, 16], what: "Write 'V' (0x56) to DR.", why: 'Writing DR clears TXE and the byte is moved into the shift register and sent: start bit, 0x56 LSB first, stop bit.', register: 'USART_DR' },
      ],
    },
    {
      id: 'string',
      title: 'UART_String_TX.txt — send “Embedded Systems”',
      file: 'USART/EXP_7_UART_TX/UART_String_TX.txt',
      code: STR,
      explain: [
        { lines: [4, 12], what: 'Same USART2 set-up as the character program.', why: 'PA2 AF7, USART2 clock, 115200 baud, TE, UE.' },
        { lines: [14, 14], what: 'String stored as a char array.', why: '"Embedded Systems" = 16 characters + terminating «\\0».' },
        { lines: [16, 16], what: 'Loop until the null terminator.', why: 'Sends each character once.' },
        { lines: [18, 19], what: 'TXE wait, then write the character.', why: 'One byte at a time through DR.', register: 'USART_SR bit 7, USART_DR', internal: 'At 115200 baud each 10-bit frame takes 86.8 µs; the whole string ≈ 1.39 ms.' },
        { lines: [22, 25], what: 'Idle forever.', why: 'Send once only; re-run by pressing reset.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'HSI 16 MHz → APB1 = 16 MHz.', kind: 'start' },
    { label: 'GPIOA clock, PA2 = AF7', detail: 'MODER2 = 10, AFRL[11:8] = 0111.', kind: 'init' },
    { label: 'USART2 clock, BRR = 0x008B', detail: '115200 baud.', kind: 'init' },
    { label: 'CR1: TE, UE', detail: 'Transmitter on.', kind: 'init' },
    { label: 'TXE == 1 ?', detail: 'Wait for an empty data register.', kind: 'decision' },
    { label: 'DR = next character', detail: "'V' forever, or next string character until '\\0'.", kind: 'io' },
    { label: 'Repeat / idle', detail: 'Loop.', kind: 'loop' },
  ],
  sim: { id: 'uart', preset: 'string' },
  exam: {
    viva: [
      { q: 'Why is PA2 set to alternate function mode?', a: 'So the USART2 peripheral, not the GPIO output register, drives the pin; AF7 selects USART2.' },
      { q: 'Explain BRR = 0x008B.', a: '16 MHz/(16×115200) = 8.68: mantissa 8 in bits 15:4, fraction 0.68×16 ≈ 11 in bits 3:0 → 0x8B.' },
      { q: 'What is the difference between TXE and TC?', a: 'TXE: DR empty, write the next byte. TC: the last frame has completely left the shift register.' },
      { q: 'Why must the PC terminal use the same baud rate?', a: 'UART is asynchronous; the receiver times bits using its own clock at the agreed rate.' },
    ],
    registerQs: [
      { q: 'Which register enables the USART2 clock and which bit?', a: 'RCC_APB1ENR bit 17.' },
      { q: 'Write BRR for 9600 baud at 16 MHz.', a: '0x0683.' },
      { q: 'Which CR1 bits are set and why?', a: 'TE (bit 3) enables transmission; UE (bit 13) enables the USART.' },
    ],
    pinQs: [{ q: 'Which adapter pin connects to PA2?', a: 'The adapter’s RX (cross-over), plus a common GND.' }],
    outputQs: [
      { q: 'The terminal is at 9600 baud. What do you see?', a: 'Garbage characters (framing errors) — rates do not match.' },
      { q: 'How long does one character take at 115200 8N1?', a: '10 bits / 115200 ≈ 86.8 µs.' },
    ],
    debugQs: [
      { q: 'Nothing appears on the terminal. Checklist?', a: 'PA2 → adapter RX (not TX), common GND, correct COM port and baud, MODER2 = 10, AF7, USART2 clock, TE/UE set.' },
      { q: 'The program does not compile: stm32f446xx.h not found.', a: 'Use stm32f4xx.h with the F401 device selected (the supplied file names the wrong device).' },
    ],
    errors: ['Connecting TX to TX.', 'Missing common ground.', 'AF4 instead of AF7.', 'MODER2 set to 01 (GPIO output) instead of 10.', 'Wrong header for the device.'],
    modifications: ['Send at 9600 baud (BRR 0x0683).', 'Write a uart_puts() function.', 'Send the ADC value as text every 500 ms.', 'Send "\\r\\n" after the string for a new line.', 'Use TXEIE interrupt instead of polling.'],
    explainToExaminer: md`“PA2 is switched to alternate function 7 so USART2 drives it. I enable the USART2 clock on APB1, set BRR to 0x008B for 115200 baud at 16 MHz, and enable the transmitter and the USART in CR1. To send, I wait until TXE shows the data register is empty and write the character into DR; the hardware adds the start and stop bits and shifts the byte out LSB first. The string program does that for every character until the null terminator.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= (1<<0);', 'GPIOA->MODER |= (1<<5);', 'GPIOA->AFR[0] &= ~(1<<11); GPIOA->AFR[0] |= (7<<8);', 'RCC->APB1ENR |= (1<<17);', 'USART2->BRR = 0x008B;', 'USART2->CR1 |= (1<<3) | (1<<13);', 'while(!(USART2->SR & (1U<<7))); USART2->DR = c;'],
    patterns: [{ name: 'uart_putc', code: 'void uart_putc(char c) {\n    while (!(USART2->SR & (1U << 7))) { }\n    USART2->DR = c;\n}' }],
    skeleton: md`int main(void){
    GPIOA clock; PA2 AF7; USART2 clock; BRR; TE|UE;
    while(1){ wait TXE; DR = 'V'; }
}`,
  },
  topics: ['uart', 'serial-basics', 'gpio-registers'],
};

export default p;
