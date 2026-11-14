import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'io-sync',
  unit: 2,
  order: 14,
  title: 'I/O synchronisation',
  short: 'How software keeps pace with I/O devices: blind cycle, busy-wait (polling), interrupt, periodic polling and DMA — latency, throughput and when to use each.',
  status: 'course',
  sources: [
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§9.1 I/O Synchronization' },
    { file: 'Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx', detail: 'slide 2 “Why GPIO interrupts?” (polling drawback)' },
    { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'slide 15 (ADC polling, interrupt, DMA)' },
  ],
  keywords: ['synchronisation', 'blind cycle', 'busy wait', 'polling', 'interrupt', 'periodic polling', 'DMA', 'latency', 'throughput', 'bandwidth', 'real-time', 'priority', 'flag'],
  importance: 2,
  sims: ['iosync'],
  related: ['interrupts-basics', 'adc-stm32', 'uart', 'exti'],
  fundamentals: {
    what: md`**I/O synchronisation** is the method software uses to transfer data at the right moment between a fast CPU and slower I/O devices: when an input has new data ready, or when an output device can accept more. Valvano lists **blind cycle, busy-wait, interrupt, periodic polling and DMA**.`,
    why: md`The CPU runs millions of instructions per second; a switch changes a few times a second and a UART byte takes ~1 ms at 9600 baud. Without synchronisation the program reads stale data, overwrites unsent data, or wastes all its time waiting.`,
    problem: md`It balances three needs: low **latency** (respond quickly), high **throughput/bandwidth** (move a lot of data) and efficient CPU use (do other work while waiting).`,
    how: md`Devices expose a **status flag** (busy → done), e.g. ADC EOC, USART TXE/RXNE, EXTI PR. Software either ignores it and waits a fixed time (blind), loops on it (busy-wait), lets hardware interrupt when it changes (interrupt), checks it in a periodic timer ISR (periodic polling), or lets a DMA controller move data on each change.`,
    where: md`Lab programs use **busy-wait** for ADC and UART («while(!(SR & …))»), **interrupts** for EXTI, SysTick and ADC-EOC, and **blind cycle** for LCD command delays.`,
  },
  detailed: md`
## Key terms (Valvano §9.1)

- **Latency** — time between the device needing service and the software starting it. A **real-time system** guarantees a worst-case (bounded) latency.
- **Throughput / bandwidth** — maximum data rate (bytes/s) the system can handle.
- **Priority** — which request is served first when several are pending, and whether a high-priority request may suspend a lower one.

## The five mechanisms

| Mechanism | How it works | When appropriate | Lab example |
|---|---|---|---|
| **Blind cycle** | Start the device, wait a fixed known time, then read/write; no status checked | Device timing is short and predictable | LCD: send command, wait ≥ 37 µs (or 1.5 ms for clear); stepper sequence |
| **Busy-wait (polling)** | Loop reading a status flag until done | Simple systems, one device, real-time response not critical | «while(!(ADC1->SR & (1<<1)));», «while(!(USART2->SR & (1U<<7)));» |
| **Interrupt** | Device hardware requests an interrupt when ready; ISR transfers data | Many devices, or real-time response required | EXTI6/EXTI10 switch interrupts, SysTick ISR, ADC_IRQHandler |
| **Periodic polling** | A timer interrupt checks status flags at a fixed rate | Device cannot interrupt, but you need interrupt-like behaviour | Debounced keypad scanned every 10 ms in SysTick |
| **DMA** | DMA controller moves data between peripheral and memory on each ready event, without the CPU | High bandwidth, many channels | ADC scan → SRAM buffer |

::sim{iosync}

## Polling vs interrupts (Day10_2 slide 2)

> [!source]
> “The microcontroller keeps checking the status of the push button by polling PA6 and PB10 … one of the main drawbacks of the polling method is that microcontroller will have to check the status of input switches on every sequential execution of the code … Therefore, external or GPIO interrupts are used … use of external GPIO interrupts makes embedded system event driven, responsive and they make use of microcontroller’s processing time and resources efficiently.”

| | Busy-wait polling | Interrupt |
|---|---|---|
| CPU while waiting | 100 % busy | free for other work or sleep |
| Latency | very low for the one device being polled; poor for others | low and bounded (≈ 12 cycles + ISR) |
| Complexity | simple | needs NVIC/EXTI setup, ISR, shared variables («volatile») |
| Many devices | latency grows with every device in the loop | priorities handle many devices |
| Power | high | can WFI between events |

## Shared data between ISR and main

Variables written in an ISR and read in «main()» must be declared «volatile» (the lab's «volatile int adcData;») so the compiler re-reads memory each time instead of caching a register copy. Multi-step updates need protection (disable interrupts briefly) to stay consistent.
`,
  visual: md`
Compare the four software mechanisms on the same event stream: watch how much CPU time is left for other work, and the latency.

::sim{iosync}
`,
  exam: {
    definitions: [
      { term: 'Latency', def: 'Time between a device requesting service and the software starting to service it.' },
      { term: 'Blind-cycle synchronisation', def: 'Software waits a fixed amount of time and assumes the I/O operation has completed, without checking status.' },
      { term: 'Busy-wait (polling)', def: 'Software repeatedly checks a device status flag in a loop until it indicates ready/done.' },
      { term: 'Interrupt synchronisation', def: 'The device hardware requests an interrupt when it is ready and an ISR performs the transfer.' },
      { term: 'Periodic polling', def: 'A periodic timer interrupt checks device status flags at a fixed rate.' },
      { term: 'DMA', def: 'Direct memory access: hardware that transfers data between peripherals and memory without CPU involvement.' },
    ],
    frequent: ['Explain I/O synchronisation methods.', 'Compare polling and interrupts.', 'When is blind-cycle appropriate?'],
    mistakes: ['Calling periodic polling “busy waiting”.', 'Forgetting volatile for ISR-shared variables.', 'Saying interrupts always have lower latency than polling (for a single device, tight polling can be faster).'],
    diagrams: ['Flowcharts for busy-wait vs interrupt input', 'CPU timeline comparison'],
    shortQs: [
      { q: 'What is the main drawback of polling a switch?', a: md`The CPU must check the switch on every loop iteration, wasting processing time and power and delaying other tasks; latency for other devices grows as more are polled.`, marks: 2 },
      { q: 'Give one example each of blind-cycle and busy-wait synchronisation from the labs.', a: md`Blind cycle: LCD command followed by a fixed delay («delay_ms(1)»). Busy-wait: «while(!(ADC1->SR & (1<<1)));» waiting for EOC.`, marks: 2 },
      { q: 'Why is adcData declared volatile in the ADC interrupt program?', a: md`It is modified inside ADC_IRQHandler; volatile forces the main code to read the memory copy every time instead of using a stale value cached in a register.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the five I/O synchronisation mechanisms with flowcharts and examples, and state when each is used.', a: md`Define latency/throughput/priority; describe blind cycle, busy-wait, interrupt, periodic polling, DMA with a flowchart each, lab examples and selection criteria; comparison table.`, marks: 8 },
      { q: 'Compare polling and interrupt-driven I/O for reading a push button on the STM32F401, with code for each.', a: md`Polling loop on GPIOx->IDR vs EXTI configuration + ISR (SYSCFG_EXTICR, IMR, FTSR, NVIC_EnableIRQ, clear PR); table of CPU usage, latency, complexity, power.`, marks: 8 },
    ],
  },
  revision: {
    notes: ['Latency = request → service start; real-time = bounded latency.', 'Blind cycle: fixed wait (LCD).', 'Busy-wait: loop on flag (ADC EOC, USART TXE/RXNE).', 'Interrupt: hardware request → ISR (EXTI, SysTick).', 'Periodic polling: timer ISR checks flags.', 'DMA: hardware moves data, no CPU.'],
    takeaways: ['Polling is simple but wastes CPU; interrupts are efficient and responsive.', 'ISR-shared variables must be volatile.'],
    mcqs: [
      { q: 'while(!(USART2->SR & (1U<<7))); is an example of…', options: ['blind cycle', 'busy-wait', 'DMA', 'periodic polling'], answer: 1, explain: 'Looping on a status flag.' },
      { q: 'Best method to move many ADC samples per second with minimal CPU load:', options: ['Blind cycle', 'Busy-wait', 'DMA', 'Polling in main'], answer: 2, explain: 'DMA transfers without the CPU.' },
      { q: 'Blind-cycle synchronisation is suitable when…', options: ['device timing is unpredictable', 'device timing is short and predictable', 'there are many devices', 'interrupts are disabled'], answer: 1, explain: 'Valvano §9.1.' },
      { q: 'A real-time system is one that…', options: ['runs fast', 'guarantees a worst-case latency', 'uses an RTOS', 'has no interrupts'], answer: 1, explain: 'Bounded latency.' },
      { q: 'Periodic polling uses…', options: ['a timer interrupt to check status', 'a while loop in main', 'the DMA', 'no hardware'], answer: 0, explain: 'Check flags at a fixed rate.' },
    ],
  },
};

export default topic;
