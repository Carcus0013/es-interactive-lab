import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"
uint8_t data;
int main()
{		// PIN Configuration
    RCC->AHB1ENR |= (1<<0);    // GPIO clock enabled for UART Rx Pin PA3 & Tx Pin PA2 - GPIOA
    GPIOA->MODER |= (1<<5);    // Alternate function mode select for USART2 Tx Pin PA2
    GPIOA->MODER |= (1<<7);    // Alternate function mode select for USART2 Rx Pin PA3
	GPIOA->AFR[0] &= (~(1<<15));   // Alternate function select mode for USART2 Rx Pin PA3
  GPIOA->AFR[0] |= (1<<14) | (1<<13) | (1<<12); // Alternate function select mode to be UART Rx channel
	GPIOA->AFR[0] &= (~(1<<11));   // Alternate function select mode for USART2 Tx Pin PA2
  GPIOA->AFR[0] |= (1<<10) | (1<<9) | (1<<8); // Alternate function select mode to be UART Tx channel
		// USART Configuration
    RCC->APB1ENR |= (1<<17);   // USART2 clock enable
    USART2->BRR = 0x0683; // Baudrate of USART2 to be 9600 @ 16 Mhz
    USART2->CR1 |= (1<<2);     // Rx enable
	  USART2->CR1 |= (1<<3);     // Tx enable
    USART2->CR1 |= (1<<13);    // USART2 enable
    while(1)
    {
				while(!(USART2->SR & (1U<<5))) {};  // wait for Rx buffer is not emptiness
        data = USART2->DR;                  // Receive byte of data to USART2 Bus
				while(!(USART2->SR & (1U<<7))) {};  // wait for Tx buffer emptiness
        USART2->DR = data;                   // Write recieved byte to USART2 Bus
    }
}`;

const p: Practical = {
  id: 'p13-uart-echo',
  order: 13,
  title: 'UART receive and echo (USART2, 9600 baud)',
  unit: 3,
  objective: 'Enable both the USART2 receiver (PA3) and transmitter (PA2) at 9600 baud and echo every received character back to the PC terminal.',
  components: ['STM32F401CCU6 Black Pill', 'USB-TTL adapter (FT232RL / HW-417)', 'PC terminal (Docklight) at 9600 8N1'],
  connections: [
    { pin: 'PA2', to: 'Adapter RX', mode: 'AF7 USART2_TX' },
    { pin: 'PA3', to: 'Adapter TX', mode: 'AF7 USART2_RX' },
    { pin: 'GND', to: 'Adapter GND', mode: 'Common ground' },
  ],
  expected: md`Every key typed in the terminal is sent to the STM32 and immediately sent back, so it appears on screen (with local echo off). Typing “hello” shows “hello”.`,
  sources: [{ file: 'USART/EXP_8_UART_RX/RX_TX.c' }, { file: 'Lab_7/stm32f4_usart2_config.txt', detail: 'same program (“Send and Receive”)' }, { file: 'Day10_6_UART_RX & TX.pptx' }],
  circuit: { uart: { tx: 'PA2', rx: 'PA3', label: 'USB-TTL adapter' } },
  programs: [
    {
      id: 'echo',
      title: 'RX_TX.c',
      file: 'USART/EXP_8_UART_RX/RX_TX.c',
      code: CODE,
      explain: [
        { lines: [2, 2], what: 'Global byte buffer.', why: 'Holds the received character between RX and TX.' },
        { lines: [5, 5], what: 'GPIOA clock.', why: 'PA2 and PA3.', register: 'RCC_AHB1ENR bit 0' },
        { lines: [6, 7], what: 'PA2 and PA3 → alternate function.', why: 'MODER2 bit 5 and MODER3 bit 7 → 10 each.', register: 'GPIOA_MODER bits 5:4 and 7:6' },
        { lines: [8, 9], what: 'PA3 → AF7.', why: 'AFRL bits 15:12 = 0111.', register: 'GPIOA_AFR[0] bits 15:12' },
        { lines: [10, 11], what: 'PA2 → AF7.', why: 'AFRL bits 11:8 = 0111.', register: 'GPIOA_AFR[0] bits 11:8' },
        { lines: [13, 13], what: 'USART2 clock.', register: 'RCC_APB1ENR bit 17', why: 'APB1 peripheral.' },
        { lines: [14, 14], what: 'BRR = 0x0683 → 9600 baud.', why: '16 MHz / (16 × 9600) = 104.17 → 104 = 0x68, 0.17 × 16 ≈ 3.', register: 'USART_BRR' },
        { lines: [15, 17], what: 'RE, TE, UE.', why: 'Receiver, transmitter, USART enable.', register: 'USART_CR1 bits 2, 3, 13', ifRemoved: 'Without RE the receiver ignores PA3 and RXNE never sets → program waits forever.' },
        { lines: [20, 21], what: 'Wait for RXNE, read DR.', why: 'RXNE = a complete byte has been received (start bit detected, 8 bits sampled with 16× oversampling, stop bit checked). Reading DR clears RXNE.', register: 'USART_SR bit 5, USART_DR' },
        { lines: [22, 23], what: 'Wait for TXE, write the same byte.', why: 'Echo it back.', register: 'USART_SR bit 7, USART_DR', internal: 'At 9600 baud a byte takes ~1.04 ms; since RX and TX run at the same rate the echo keeps up with typing.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'PA2/PA3 AF7', detail: 'MODER = 10, AFRL = 0111 for both pins.', kind: 'init' },
    { label: 'USART2 clock, BRR 0x0683, RE/TE/UE', detail: '9600 8N1.', kind: 'init' },
    { label: 'RXNE set?', detail: 'Wait for a received byte.', kind: 'decision' },
    { label: 'data = DR', detail: 'Read (clears RXNE).', kind: 'io' },
    { label: 'Wait TXE, DR = data', detail: 'Echo and repeat.', kind: 'loop' },
  ],
  sim: { id: 'uart', preset: 'echo' },
  exam: {
    viva: [
      { q: 'What does RXNE mean and how is it cleared?', a: 'Read data register not empty: a byte is waiting. Reading USART_DR clears it.' },
      { q: 'What happens if a second byte arrives before DR is read?', a: 'Overrun: ORE is set and the new byte is lost.' },
      { q: 'Why is the same DR register used for both RX and TX?', a: 'DR is two registers at one address: writes go to the transmit data register, reads come from the receive data register.' },
    ],
    registerQs: [
      { q: 'Which AFRL bits configure PA3?', a: 'Bits 15:12 (4 × 3).' },
      { q: 'Which CR1 bit enables the receiver?', a: 'Bit 2, RE.' },
    ],
    pinQs: [{ q: 'Which adapter pin goes to PA3?', a: 'The adapter’s TX.' }],
    outputQs: [{ q: 'You type “A”. What exactly goes over PA2?', a: 'Idle 1, start 0, 0x41 LSB first (1,0,0,0,0,0,1,0), stop 1.' }],
    debugQs: [
      { q: 'Characters appear doubled. Why?', a: 'The terminal’s local echo is on as well as the MCU echo.' },
      { q: 'Nothing is echoed but transmit-only programs work. Check?', a: 'PA3 MODER/AF7, RE bit, adapter TX → PA3 wiring.' },
    ],
    errors: ['Configuring only PA2 for AF.', 'Forgetting RE.', 'Baud mismatch (BRR 0x008B with a 9600 terminal).'],
    modifications: ['Convert lowercase to uppercase before echoing.', 'Toggle LED1 when “t” is received.', 'Use the RXNE interrupt (RXNEIE + USART2_IRQHandler).', 'Build a line buffer and respond to commands like “LED ON”.'],
    explainToExaminer: md`“Both PA2 and PA3 are set to AF7 so USART2 owns them; USART2 runs at 9600 baud (BRR 0x0683) with receiver, transmitter and the USART enabled. In the loop I wait for RXNE, read the byte from DR, wait for TXE and write the same byte back to DR. It is polling-based full-duplex communication.”`,
  },
  memorise: {
    essentials: ['GPIOA->MODER |= (1<<5) | (1<<7);', 'GPIOA->AFR[0] |= (7<<8) | (7<<12);', 'RCC->APB1ENR |= (1<<17);', 'USART2->BRR = 0x0683;', 'USART2->CR1 |= (1<<2) | (1<<3) | (1<<13);', 'while(!(USART2->SR & (1<<5))); d = USART2->DR;', 'while(!(USART2->SR & (1<<7))); USART2->DR = d;'],
    patterns: [{ name: 'uart_getc', code: 'char uart_getc(void) {\n    while (!(USART2->SR & (1U << 5))) { }\n    return USART2->DR;\n}' }],
    skeleton: md`int main(void){ PA2/PA3 AF7; USART2 clk; BRR=0x0683; RE|TE|UE;
    while(1){ c = getc(); putc(c); } }`,
  },
  topics: ['uart', 'serial-basics', 'io-sync'],
};

export default p;
