import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"

volatile int adcData;
const int threshold = 1024;

int main(void)
{
    // Enable GPIOA, GPIOC and ADC1 clocks
    RCC->AHB1ENR |= (1U << 0);
    RCC->AHB1ENR |= (1U << 2);
    RCC->APB2ENR |= (1U << 8);

    // PA0 as analog input
    GPIOA->MODER |= (3U << 0);

    // PC14 as output
    GPIOC->MODER &= ~(1U << 29);
    GPIOC->MODER |= (1U << 28);

    // ADC configuration
    ADC1->SMPR2 = 0;
    ADC->CCR = 0;

    ADC1->CR1 = 0;
    ADC1->CR2 = 0;

    ADC1->CR2 |= (1U << 1);     // Continuous conversion
    ADC1->SQR3 = 0;             // Channel 0
    ADC1->SQR1 = 0;  // conversion length

    // Enable EOC interrupt
    ADC1->CR1 |= (1U << 5);

    // Enable ADC interrupt in NVIC
    NVIC_EnableIRQ(ADC_IRQn);

    // Enable ADC
    ADC1->CR2 |= (1U << 0);

    // Start conversion
    ADC1->CR2 |= (1U << 30);

    while (1)
    {
    }
}


void ADC_IRQHandler(void)
{
    if (ADC1->SR & (1U << 1))
    {
        adcData = ADC1->DR;

        if (adcData > threshold)
        {
            GPIOC->ODR |= (1U << 14);
        }
        else
        {
            GPIOC->ODR &= ~(1U << 14);
        }
    }
}`;

const p: Practical = {
  id: 'p11-adc-interrupt',
  order: 11,
  title: 'ADC end-of-conversion interrupt (pot → LED1)',
  unit: 3,
  objective: 'Replace EOC polling with the ADC interrupt: every finished conversion triggers ADC_IRQHandler, which reads the result and controls LED1.',
  components: ['STM32F401CCU6 Black Pill', 'Potentiometer on PA0', 'LED1 on PC14'],
  connections: [
    { pin: 'PA0', to: 'Potentiometer wiper', mode: 'Analog, ADC1_IN0' },
    { pin: 'PC14', to: 'LED1', mode: 'Output' },
  ],
  expected: md`Same behaviour as P07 (LED1 ON above ≈ 0.83 V) but the main loop is empty. Note: in continuous mode at 8 MHz a conversion finishes every ~1.9 µs, so the CPU spends most of its time entering and leaving the ISR — a good illustration of why DMA or a timer trigger is used for fast sampling.`,
  sources: [{ file: 'Lab_7/pot_int.txt' }, { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'slides 14–15 (ADC interrupts, poll/interrupt/DMA)' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }], analog: [{ pin: 'PA0', label: 'Potentiometer', kind: 'pot' }] },
  programs: [
    {
      id: 'potint',
      title: 'pot_int.txt',
      file: 'Lab_7/pot_int.txt',
      code: CODE,
      explain: [
        { lines: [3, 3], what: 'volatile result variable.', why: 'Written inside the ISR and possibly read elsewhere; volatile stops the compiler caching it in a register.', ifRemoved: 'Code in main that reads adcData might never see updates under optimisation.' },
        { lines: [9, 11], what: 'Clocks: GPIOA, GPIOC, ADC1.', register: 'AHB1ENR bits 0, 2; APB2ENR bit 8', why: 'As in P07.' },
        { lines: [14, 18], what: 'PA0 analog, PC14 output.', register: 'MODER fields', why: 'Pot input and LED output.' },
        { lines: [21, 29], what: 'ADC configuration.', why: 'Sampling 3 cycles, ÷2 clock, reset CR1/CR2, continuous, channel 0, length 1.', register: 'SMPR2, CCR, CR1, CR2, SQR3, SQR1' },
        { lines: [32, 32], what: 'EOCIE = 1.', why: 'Ask the ADC to raise an interrupt when EOC is set.', register: 'ADC_CR1 bit 5 (EOCIE)', ifRemoved: 'No interrupt request: the handler never runs, LED never changes.' },
        { lines: [35, 35], what: 'Enable ADC_IRQn in the NVIC.', why: 'Peripheral interrupts need both the peripheral enable (EOCIE) and the NVIC enable.', register: 'NVIC_ISER0 bit 18 (ADC_IRQn = 18)', ifRemoved: 'EOC is flagged but the CPU is never interrupted.' },
        { lines: [38, 41], what: 'ADON then SWSTART.', why: 'Power on and start continuous conversions — the first EOC interrupt follows ~2 µs later.', register: 'ADC_CR2 bits 0, 30' },
        { lines: [43, 45], what: 'Empty loop.', why: 'All processing is in the ISR.' },
        { lines: [49, 64], what: 'ADC_IRQHandler.', why: 'Shared handler for the ADC; checks EOC, reads DR (which clears EOC and so the interrupt request) and drives the LED.', register: 'ADC_SR bit 1, ADC_DR, GPIOC_ODR bit 14', internal: 'Exception 34 (IRQ 18) → vector 0x88. Not reading DR would leave EOC set and the ISR would re-enter endlessly.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Clocks, PA0 analog, PC14 output', detail: 'GPIO set-up.', kind: 'init' },
    { label: 'ADC config + EOCIE', detail: 'Continuous ch0, interrupt on EOC.', kind: 'init' },
    { label: 'NVIC_EnableIRQ(ADC_IRQn), ADON, SWSTART', detail: 'Interrupt path enabled, conversions start.', kind: 'init' },
    { label: 'Empty while(1)', detail: 'Waiting.', kind: 'loop' },
    { label: 'ADC_IRQHandler on each EOC', detail: 'Read DR → compare → LED ON/OFF → return.', kind: 'isr' },
  ],
  sim: { id: 'adc' },
  exam: {
    viva: [
      { q: 'Which two enables are needed for the ADC interrupt?', a: 'EOCIE in ADC_CR1 (peripheral side) and NVIC_EnableIRQ(ADC_IRQn) (core side).' },
      { q: 'How is the interrupt request cleared?', a: 'Reading ADC_DR clears EOC, which removes the request.' },
      { q: 'Why is adcData volatile?', a: 'It is shared between the ISR and the rest of the program.' },
      { q: 'Is an interrupt per conversion efficient in continuous mode?', a: 'No — at ~1.9 µs per conversion the CPU is almost always in the ISR; use DMA or a timer trigger for periodic sampling.' },
    ],
    registerQs: [
      { q: 'Which bit of ADC_CR1 enables the EOC interrupt?', a: 'Bit 5, EOCIE.' },
      { q: 'What is ADC_IRQn on the STM32F401 and its vector address?', a: 'IRQ 18 → exception 34 → 0x0000 0088.' },
    ],
    pinQs: [{ q: 'Which channel and pin are converted?', a: 'Channel 0 on PA0 (potentiometer).' }],
    outputQs: [{ q: 'What does the LED do while the knob is at the 3.3 V end?', a: 'Stays ON.' }],
    debugQs: [
      { q: 'The ISR is never entered. Check what?', a: 'EOCIE, NVIC_EnableIRQ(ADC_IRQn), ADC clock, ADON/SWSTART, and the handler name ADC_IRQHandler.' },
      { q: 'The main loop never runs a new statement you added. Why?', a: 'The ADC interrupt fires continuously (every ~2 µs) and leaves little time; reduce the rate (longer sampling time, single mode with timer trigger).' },
    ],
    errors: ['Forgetting NVIC enable.', 'Misspelled handler.', 'Not reading DR in the ISR.', 'Missing volatile.'],
    modifications: ['Single-conversion mode restarted every 10 ms from SysTick.', 'Longest sampling time (480 cycles) to reduce interrupt rate.', 'Average 16 samples in the ISR.', 'Use the LDR channel.'],
    explainToExaminer: md`“The ADC set-up is the same as before, but instead of polling EOC I set EOCIE in CR1 and enable ADC_IRQn in the NVIC. Each completed conversion interrupts the CPU; the handler checks EOC, reads ADC_DR — which also clears the flag — and turns LED1 on or off by comparing with the threshold. The main loop is empty.”`,
  },
  memorise: {
    essentials: ['volatile int adcData;', 'ADC init block (channel 0, CONT)', 'ADC1->CR1 |= (1U<<5);  // EOCIE', 'NVIC_EnableIRQ(ADC_IRQn);', 'ADON; SWSTART;', 'void ADC_IRQHandler(void){ if (ADC1->SR & (1U<<1)) { adcData = ADC1->DR; ... } }'],
    patterns: [{ name: 'Peripheral interrupt = 2 enables', code: 'PERIPH->CRx |= IE_BIT;\nNVIC_EnableIRQ(PERIPH_IRQn);' }],
    skeleton: md`volatile int adcData;
int main(void){ clocks; pins; ADC init; ADC1->CR1 |= (1U<<5); NVIC_EnableIRQ(ADC_IRQn); ADON; SWSTART; while(1){} }
void ADC_IRQHandler(void){ if (ADC1->SR & (1U<<1)) { adcData = ADC1->DR; LED logic; } }`,
  },
  topics: ['adc-stm32', 'nvic', 'interrupts-basics', 'io-sync'],
};

export default p;
