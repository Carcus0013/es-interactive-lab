import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include "stm32f4xx.h"
int adcData;int main(void) {
// 1. Enable GPIOA clock b
y writing 1 to bit 0 of AHB1ENR
RCC->AHB1ENR |= (1U << 0);
// 2. Enable ADC1 clock by writing 1 to bit 8 of APB2ENR
RCC->APB2ENR |= (1 << 8);
// 3. Set PA0 to analog mode by setting bits 0 and 1 of MODER to 1
GPIOA->MODER |= (3U << 0);
/* ADC1 Configurations */
// 4. Set sampling time to 3 cycles for channel 0
ADC1->SMPR2 &= ~(0x7 << 0);  // Clear bits [2:0]
// 5. Set ADC prescaler to PCLK2/2 (default) - CCR = 0
ADC->CCR &= ~(0x3 << 16);    // Clear bits [17:16] for prescaler
// 6. Reset CR1 and CR2 registers to initialize ADC settings
ADC1->CR1 = 0;
ADC1->CR2 = 0;
// 7. Enable continuous conversion mode by setting the CONT bit in CR2
ADC1->CR2 |= (1U << 1);
//8. Choose the ADC channel by setting the first conversion in SQR3
ADC1->SQR3 &= ~(0x1F);
// 9. Set conversion sequence length to 1
ADC1->SQR1 &= ~(0xF << 20);
// 10. Enable ADC by setting the ADON bit in CR2 (bit 0)
ADC1->CR2 |= 1;
// 11. Wait until the ADC is ready (ADON bit is set)
while((ADC1->CR2 & 1) == 0) {}
//12. Start the conversion by setting the SWSTART bit (bit 30) in CR2
ADC1->CR2 |= (1 << 30);
// 13. Start the ADC conversion process and read data
while (1) {
// Wait until the conversion is complete (EOC bit in SR is set)
while (!(ADC1->SR & (1 << 1))) {}
// Read the converted data from the ADC data register (DR)
adcData = ADC1->DR;
}
}`;

const p: Practical = {
  id: 'p06-adc-pot',
  order: 6,
  title: 'ADC: read the potentiometer on PA0 (channel 0)',
  unit: 2,
  objective: 'Configure ADC1 at register level in continuous mode and read the potentiometer voltage on PA0 (ADC1_IN0) into a variable (Experiment 4.1).',
  components: ['STM32F401CCU6 Black Pill', 'Potentiometer on the extension board (outer pins 3.3 V and GND, wiper to PA0)', 'Keil debugger (Watch window) to observe adcData'],
  connections: [{ pin: 'PA0', to: 'Potentiometer wiper', mode: 'Analog (MODER = 11), ADC1 channel 0' }],
  expected: md`In the Keil **Watch** window, «adcData» changes from **0** (knob at GND end) to **4095** (knob at 3.3 V end) as you turn the potentiometer; mid-position ≈ 2048 (≈ 1.65 V). Nothing visible on the board — this program only measures.`,
  sources: [{ file: 'Lab_5/ADC_Potentiometer_reading.docx' }, { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'Experiment 4.1, slides 38–43' }],
  circuit: { analog: [{ pin: 'PA0', label: 'Potentiometer', kind: 'pot' }] },
  programs: [
    {
      id: 'pot',
      title: 'ADC_Potentiometer_reading',
      file: 'Lab_5/ADC_Potentiometer_reading.docx',
      code: CODE,
      corrected: {
        code: md`#include "stm32f4xx.h"
volatile int adcData;                 // volatile: watched by the debugger / ISRs
int main(void) {
    RCC->AHB1ENR |= (1U << 0);        // 1. GPIOA clock
    RCC->APB2ENR |= (1U << 8);        // 2. ADC1 clock
    GPIOA->MODER |= (3U << 0);        // 3. PA0 analog (11)
    ADC1->SMPR2 &= ~(0x7U << 0);      // 4. ch0 sampling = 3 cycles
    ADC->CCR    &= ~(0x3U << 16);     // 5. ADCCLK = PCLK2/2 = 8 MHz
    ADC1->CR1 = 0;                    // 6. 12-bit, no scan, no interrupts
    ADC1->CR2 = 0;
    ADC1->CR2 |= (1U << 1);           // 7. CONT
    ADC1->SQR3 &= ~0x1FU;             // 8. 1st conversion = channel 0
    ADC1->SQR1 &= ~(0xFU << 20);      // 9. L = 0 -> one conversion
    ADC1->CR2 |= (1U << 0);           // 10. ADON
    for (volatile int d = 0; d < 100; d++) { }   // 11. t_STAB (a few µs)
    ADC1->CR2 |= (1U << 30);          // 12. SWSTART
    while (1) {
        while (!(ADC1->SR & (1U << 1))) { }      // wait EOC
        adcData = ADC1->DR;                      // read (clears EOC)
    }
}`,
        changes: [
          'Lines 3–4 of the supplied .docx break the comment “by writing…” across two lines; line 4 (“y writing 1 to bit 0 of AHB1ENR”) is not a comment and **does not compile**. Rejoined.',
          'Line 2 puts «int adcData;» and «int main(void) {» on one line — legal but confusing; split, and made adcData «volatile».',
          'Step 11 replaced by a short stabilisation delay: ADON is written by software, so «while((CR2 & 1)==0)» never waits; RM0368 asks for t_STAB after ADON before starting.',
        ],
      },
      explain: [
        { lines: [2, 2], what: 'Global result variable and main().', why: 'A global can be watched live in the Keil Watch window.', ifRemoved: '—' },
        { lines: [3, 4], what: 'Broken comment (document artefact).', why: 'Word wrapped “b / y writing…”; the second line is plain text → compile error. See the corrected version.' },
        { lines: [5, 5], what: 'Enable GPIOA clock.', why: 'PA0 belongs to port A; its MODER must be written.', register: 'RCC_AHB1ENR bit 0' },
        { lines: [7, 7], what: 'Enable ADC1 clock.', why: 'ADC1 sits on the APB2 bus.', register: 'RCC_APB2ENR bit 8 (ADC1EN)', ifRemoved: 'All ADC register writes ignored; EOC never sets → the program hangs at line 33.' },
        { lines: [9, 9], what: 'PA0 analog mode.', why: 'MODER0 = 11 disconnects the digital input buffer (Schmitt trigger) and connects the pin to the ADC multiplexer.', register: 'GPIOA_MODER bits 1:0 = 11', ifRemoved: 'Pin stays a digital input; readings are wrong/noisy and the digital buffer draws extra current at mid-voltages.' },
        { lines: [12, 12], what: 'Sampling time = 3 ADC cycles for channel 0.', why: 'SMP0 = 000; shortest sampling → fastest conversion (3 + 12 = 15 cycles).', register: 'ADC_SMPR2 bits 2:0', internal: 'The sample-and-hold capacitor is connected to PA0 for 3 cycles before the SAR starts.' },
        { lines: [14, 14], what: 'ADC clock = PCLK2 ÷ 2.', why: 'ADCPRE = 00 → 16 MHz / 2 = 8 MHz (≤ 36 MHz limit).', register: 'ADC_CCR bits 17:16 (common register ADC->CCR)' },
        { lines: [16, 17], what: 'Reset CR1 and CR2.', why: 'Start from a known state: 12-bit resolution, no scan, no interrupts, ADC off, right alignment.', register: 'ADC_CR1, ADC_CR2' },
        { lines: [19, 19], what: 'Continuous conversion (CONT = 1).', why: 'Each conversion starts the next automatically, so one SWSTART keeps the ADC running.', register: 'ADC_CR2 bit 1', ifRemoved: 'Single mode: only one conversion; EOC would set once and the loop would hang on the second wait.' },
        { lines: [21, 21], what: 'First (only) conversion = channel 0.', why: 'SQ1 bits 4:0 = 00000 → ADC1_IN0 = PA0.', register: 'ADC_SQR3 bits 4:0' },
        { lines: [23, 23], what: 'Sequence length L = 0 → 1 conversion.', why: 'L holds “number of conversions − 1”.', register: 'ADC_SQR1 bits 23:20' },
        { lines: [25, 25], what: 'ADON = 1 — power the ADC on.', why: 'Wakes the ADC from power-down.', register: 'ADC_CR2 bit 0' },
        { lines: [27, 27], what: 'Wait for ADON (always true at once).', why: 'Intended as a “ready” wait; reading back a bit you just set returns 1 immediately.' },
        { lines: [29, 29], what: 'SWSTART — start converting.', why: 'Software trigger for the regular group; with CONT = 1 conversions now run forever.', register: 'ADC_CR2 bit 30' },
        { lines: [33, 33], what: 'Busy-wait for EOC.', why: 'Polling synchronisation: wait until the SAR has finished.', register: 'ADC_SR bit 1 (EOC)' },
        { lines: [35, 35], what: 'Read the 12-bit result.', why: '0–4095 proportional to V_PA0 / 3.3 V. Reading DR also clears EOC.', register: 'ADC_DR bits 11:0' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'HSI 16 MHz → PCLK2 = 16 MHz.', kind: 'start' },
    { label: 'Clocks: GPIOA, ADC1', detail: 'AHB1ENR bit 0, APB2ENR bit 8.', kind: 'init' },
    { label: 'PA0 analog', detail: 'MODER0 = 11.', kind: 'init' },
    { label: 'ADC setup', detail: 'SMPR2 3 cycles, CCR ÷2, CR1/CR2 = 0, CONT, SQR3 = 0, SQR1 L = 0.', kind: 'init' },
    { label: 'ADON, SWSTART', detail: 'Power on, then start continuous conversions.', kind: 'init' },
    { label: 'EOC set?', detail: 'Poll ADC_SR bit 1.', kind: 'decision' },
    { label: 'adcData = ADC1->DR', detail: 'Store 0–4095; EOC clears; repeat.', kind: 'loop' },
  ],
  sim: { id: 'adc' },
  exam: {
    viva: [
      { q: 'Why is PA0 set to analog mode?', a: 'MODER = 11 connects the pin to the ADC and disables the digital input buffer.' },
      { q: 'What value do you expect at 1.65 V?', a: 'About 2048 (half of 4096).' },
      { q: 'Why is continuous mode used?', a: 'So conversions repeat automatically after one SWSTART; the loop just waits for each EOC.' },
      { q: 'How is EOC cleared?', a: 'By reading ADC_DR.' },
    ],
    registerQs: [
      { q: 'Which register selects the channel to convert?', a: 'ADC_SQR3 (SQ1 bits 4:0) for the first conversion; SQR1.L gives the sequence length.' },
      { q: 'Compute the conversion time for this configuration.', a: 'ADCCLK = 8 MHz; (3 + 12) cycles = 15 → 1.875 µs.' },
      { q: 'Which bit starts the conversion?', a: 'ADC_CR2 bit 30 SWSTART.' },
    ],
    pinQs: [{ q: 'Which ADC channel is the potentiometer, and which is the LDR?', a: 'Pot: PA0 = channel 0; LDR: PA1 = channel 1.' }],
    outputQs: [{ q: 'The knob is at the GND end. What does adcData show?', a: 'About 0 (a few counts of noise).' }],
    debugQs: [
      { q: 'The program hangs at the EOC loop. Two causes?', a: 'ADC1 clock not enabled (APB2ENR bit 8), or ADON/SWSTART not set (or CONT off after the first conversion).' },
      { q: 'adcData is always 0 although the pot moves.', a: 'Wrong channel in SQR3, PA0 not in analog mode, or the pot wiper not connected to PA0.' },
    ],
    errors: ['Enabling ADC1 in AHB1ENR.', 'Putting the channel in SQR1.', 'Forgetting CONT then waiting for EOC repeatedly.', 'Using PA0 as key input and ADC at the same time.'],
    modifications: ['Read the LDR (PA1, channel 1).', 'Convert adcData to millivolts: mv = adcData * 3300 / 4095.', 'Use 8-bit resolution (CR1.RES = 10).', 'Send adcData over UART every 500 ms.', 'Use the EOC interrupt (P11).'],
    explainToExaminer: md`“I enable the GPIOA and ADC1 clocks and make PA0 analog. I set the shortest sampling time and ADCCLK = 8 MHz, clear CR1/CR2, choose continuous mode, select channel 0 as the only conversion in SQR3 with length 1, switch the ADC on with ADON and start it with SWSTART. In the loop I wait for EOC and read ADC_DR — a 12-bit number proportional to the pot voltage, 0 to 4095.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= 1; RCC->APB2ENR |= (1<<8);', 'GPIOA->MODER |= (3U<<0);', 'ADC1->SMPR2 = 0; ADC->CCR = 0;', 'ADC1->CR1 = 0; ADC1->CR2 = 0;', 'ADC1->CR2 |= (1<<1);  // CONT', 'ADC1->SQR3 = 0; ADC1->SQR1 = 0;', 'ADC1->CR2 |= 1;  // ADON', 'ADC1->CR2 |= (1<<30);  // SWSTART', 'while(!(ADC1->SR & (1<<1))); adcData = ADC1->DR;'],
    patterns: [{ name: 'ADC init block (memorise as one unit)', code: 'ADC1->SMPR2 = 0; ADC->CCR = 0; ADC1->CR1 = 0; ADC1->CR2 = 0;\nADC1->CR2 |= (1<<1); ADC1->SQR3 = CH; ADC1->SQR1 = 0;\nADC1->CR2 |= 1; ADC1->CR2 |= (1<<30);' }],
    skeleton: md`int adcData;
int main(void){
    clocks (GPIOA, ADC1);  PA0 analog;
    ADC init block (CH = 0);
    while(1){ wait EOC; adcData = ADC1->DR; }
}`,
  },
  topics: ['adc-stm32', 'adc-fundamentals', 'gpio-registers'],
};

export default p;
