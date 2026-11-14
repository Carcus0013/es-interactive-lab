import type { Practical } from '../../types';
import { md } from '../md';

const POT = md`#include "stm32f4xx.h"
int adcData;
const int threshold = 1024;
int main(void) {
    // 1. Enable GPIOA clock by writing 1 to bit 0 of AHB1ENR
    RCC->AHB1ENR |= (1U << 0);
	 // 2. Enable GPIOC clock by writing 1 to bit 2 of AHB1ENR (for PC14)
    RCC->AHB1ENR |= (1U << 2);   // Enable clock for GPIOC

    // 3. Enable ADC1 clock by writing 1 to bit 8 of APB2ENR
    RCC->APB2ENR |= (1 << 8);

    // 4. Set PA0 to analog mode by setting bits 0 and 1 of MODER to 1
    GPIOA->MODER |= (3U << 0);

	// 5. Set PC14 to output mode for the LED
    GPIOC->MODER &= ~(1U << 29); // Clear bit 29
    GPIOC->MODER |= (1U << 28);  // Set bit 28 (PC14 as output)

    /* ADC1 Configurations */
    // 6. Set sampling time to 3 cycles for channel 0
    ADC1->SMPR2 = 0;

    // 7. Set ADC prescaler to PCLK2/2 (default) - CCR = 0
    ADC->CCR = 0;

    // 8. Reset CR1 and CR2 registers to initialize ADC settings
    ADC1->CR1 = 0;
    ADC1->CR2 = 0;

	 // 9. Enable continuous conversion mode by setting the CONT bit in CR2
    ADC1->CR2 |= (1U << 1);
    //10. Choose the ADC channel by setting the first conversion in SQR3
    ADC1->SQR3 = 0;

    // 11. Set conversion sequence length to 1
    ADC1->SQR1 = 0;

    // 12. Enable ADC by setting the ADON bit in CR2 (bit 0)
    ADC1->CR2 |= 1;

		  // 13. Wait until the ADC is ready (ADON bit is set)
    while((ADC1->CR2 & 1) == 0) {}

			//14. Start the conversion by setting the SWSTART bit (bit 30) in CR2
       ADC1->CR2 |= (1 << 30);

    // 15. Start the ADC conversion process and read data
    while (1) {


        // Wait until the conversion is complete (EOC bit in SR is set)
        while (!(ADC1->SR & (1 << 1))) {}

        // Read the converted data from the ADC data register (DR)
        adcData = ADC1->DR;

					 // Check if the ADC value exceeds the threshold
        if (adcData > threshold) {
            // Turn on the LED (PC14) if the ADC value is greater than the threshold
            GPIOC->ODR |= (1U << 14);
        } else {
            // Turn off the LED (PC14) if the ADC value is less than or equal to the threshold
            GPIOC->ODR &= ~(1U << 14);
				}
    }
}`;

const LDR = md`#include "stm32f4xx.h"
int adcData;
const int threshold = 1024;
int main(void) {
    // 1. Enable GPIOA clock by writing 1 to bit 0 of AHB1ENR
    RCC->AHB1ENR |= (1U << 0);
    // 2. Enable GPIOC clock by writing 1 to bit 2 of AHB1ENR (for PC14)
    RCC->AHB1ENR |= (1U << 2);   // Enable clock for GPIOC

    // 3. Enable ADC1 clock by writing 1 to bit 8 of APB2ENR
    RCC->APB2ENR |= (1 << 8);

    // 4. Set PA1 to analog mode (MODER bits 2 and 3 = 11)
    GPIOA->MODER |= (1U << 2);
    GPIOA->MODER |= (1U << 3);

    // 5. Set PC14 to output mode for the LED
    GPIOC->MODER &= ~(1U << 29); // Clear bit 29
    GPIOC->MODER |= (1U << 28);  // Set bit 28 (PC14 as output)

    /* ADC1 Configurations */
    // 6. Set sampling time to 3 cycles for channel 0
    ADC1->SMPR2 = 0;

    // 7. Set ADC prescaler to PCLK2/2 (default) - CCR = 0
    ADC->CCR = 0;

    // 8. Reset CR1 and CR2 registers to initialize ADC settings
    ADC1->CR1 = 0;
    ADC1->CR2 = 0;

    // 9. Enable continuous conversion mode by setting the CONT bit in CR2
    ADC1->CR2 |= (1U << 1);
    //10. Choose the ADC channel by setting the first conversion in SQR3
    ADC1->SQR3 = 1;

    // 11. Set conversion sequence length to 1
    ADC1->SQR1 = 0;

    // 12. Enable ADC by setting the ADON bit in CR2 (bit 0)
    ADC1->CR2 |= 1;

    // 13. Wait until the ADC is ready (ADON bit is set)
    while((ADC1->CR2 & 1) == 0) {}

    //14. Start the conversion by setting the SWSTART bit (bit 30) in CR2
    ADC1->CR2 |= (1 << 30);

    // 15. Start the ADC conversion process and read data
    while (1) {


        // Wait until the conversion is complete (EOC bit in SR is set)
        while (!(ADC1->SR & (1 << 1))) {}

        // Read the converted data from the ADC data register (DR)
        adcData = ADC1->DR;

        // Check if the ADC value exceeds the threshold
        if (adcData > threshold) {
            // Turn on the LED (PC14) if the ADC value is greater than the threshold
            GPIOC->ODR |= (1U << 14);
        } else {
            // Turn off the LED (PC14) if the ADC value is less than or equal to the threshold
            GPIOC->ODR &= ~(1U << 14);
        }
    }
}`;

const p: Practical = {
  id: 'p07-adc-threshold',
  order: 7,
  title: 'ADC threshold control: potentiometer / LDR → LED1',
  unit: 2,
  objective: 'Read the potentiometer (PA0, ch0) or the LDR (PA1, ch1) continuously and switch LED1 (PC14) ON when the reading exceeds a threshold (Experiments 4.2 and 4.3).',
  components: ['STM32F401CCU6 Black Pill', 'Potentiometer on PA0', 'LDR voltage divider on PA1', 'LED1 on PC14'],
  connections: [
    { pin: 'PA0', to: 'Potentiometer wiper', mode: 'Analog, ADC1_IN0' },
    { pin: 'PA1', to: 'LDR / fixed-resistor divider mid-point', mode: 'Analog, ADC1_IN1' },
    { pin: 'PC14', to: 'LED1 (active-high)', mode: 'Output' },
  ],
  expected: md`**Pot:** LED1 switches ON once the knob passes about a quarter turn (adcData > 1024 ≈ 0.83 V) and OFF below it. **LDR:** LED1 switches when the light level moves the divider voltage across 0.83 V; which direction (dark or bright) turns it on depends on which side of the divider the LDR is on — check by covering the LDR and watching adcData.`,
  sources: [{ file: 'Lab_5/ADC_with_LED_control_using_potentiometer.c.txt' }, { file: 'Lab_5/ADC_LDR_interfacing_LED_Control.txt' }, { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'Experiments 4.2, 4.3 (slides 44–52)' }],
  circuit: { leds: [{ pin: 'PC14', label: 'LED1' }], analog: [{ pin: 'PA0', label: 'Potentiometer', kind: 'pot' }, { pin: 'PA1', label: 'LDR', kind: 'ldr' }] },
  programs: [
    {
      id: 'pot',
      title: 'Potentiometer → LED1',
      file: 'Lab_5/ADC_with_LED_control_using_potentiometer.c.txt',
      code: POT,
      explain: [
        { lines: [2, 3], what: 'Result variable and the threshold.', why: '1024 out of 4095 ≈ 25 % of 3.3 V ≈ 0.83 V. «const» stores it in Flash.' },
        { lines: [6, 8], what: 'GPIOA and GPIOC clocks.', why: 'PA0 (input) and PC14 (LED) are on different ports.', register: 'RCC_AHB1ENR bits 0, 2' },
        { lines: [11, 11], what: 'ADC1 clock.', why: 'APB2 peripheral.', register: 'RCC_APB2ENR bit 8' },
        { lines: [14, 14], what: 'PA0 analog.', why: 'MODER0 = 11.', register: 'GPIOA_MODER bits 1:0' },
        { lines: [17, 18], what: 'PC14 output.', why: 'Clear bit 29, set bit 28 → MODER14 = 01.', register: 'GPIOC_MODER bits 29:28' },
        { lines: [22, 22], what: 'All channels 0–9: 3-cycle sampling.', why: 'SMPR2 = 0 sets every SMPx field in SMPR2 to 000.', register: 'ADC_SMPR2' },
        { lines: [25, 25], what: 'ADC prescaler ÷2 (and temp sensor off).', why: 'Writing 0 to the whole CCR also clears TSVREFE/VBATE.', register: 'ADC_CCR' },
        { lines: [28, 29], what: 'Reset CR1/CR2.', why: 'Known state: 12-bit, single channel, ADC off.' },
        { lines: [32, 32], what: 'Continuous mode.', register: 'ADC_CR2 bit 1 CONT', why: 'Keeps converting.' },
        { lines: [34, 34], what: 'Channel 0 first in sequence.', register: 'ADC_SQR3 = 0', why: 'PA0 = IN0.' },
        { lines: [37, 37], what: 'One conversion in the sequence.', register: 'ADC_SQR1 L = 0', why: 'L = n − 1.' },
        { lines: [40, 46], what: 'ADON, (wait), SWSTART.', why: 'Power on then software-start the continuous conversions.', register: 'ADC_CR2 bits 0 and 30' },
        { lines: [53, 56], what: 'Wait EOC, read DR.', why: 'Polling for each new result.', register: 'ADC_SR bit 1, ADC_DR' },
        { lines: [59, 65], what: 'Compare with threshold and drive LED1.', why: 'Above 1024 → ODR14 = 1 (ON); otherwise 0 (OFF).', register: 'GPIOC_ODR bit 14', internal: 'Simple comparator with no hysteresis: near 1024 the LED may flicker as noise crosses the threshold.' },
      ],
    },
    {
      id: 'ldr',
      title: 'LDR → LED1',
      file: 'Lab_5/ADC_LDR_interfacing_LED_Control.txt',
      code: LDR,
      corrected: {
        code: md`// Only the differences from the pot program matter:
GPIOA->MODER |= (3U << 2);     // PA1 analog (bits 3:2 = 11) — one statement
ADC1->SQR3 = 1;                // channel 1 = PA1
// comment fix: SMPR2 = 0 sets 3-cycle sampling for channels 0–9, including channel 1
// Optional hysteresis to stop flicker near the threshold:
if (adcData > threshold + 50)      GPIOC->ODR |=  (1U << 14);
else if (adcData < threshold - 50) GPIOC->ODR &= ~(1U << 14);`,
        changes: ['Comment on line 22 says “channel 0” — the program actually converts channel 1 (SMPR2 = 0 covers it anyway).', 'Optional hysteresis band so the LED does not chatter when the light level sits near the threshold.'],
      },
      explain: [
        { lines: [14, 15], what: 'PA1 analog: MODER1 = 11.', why: 'Bits 3:2 (2 × 1). Written as two separate bit sets.', register: 'GPIOA_MODER bits 3:2' },
        { lines: [35, 35], what: 'Channel 1 selected.', why: 'PA1 = ADC1_IN1.', register: 'ADC_SQR3 = 1' },
        { lines: [60, 66], what: 'Threshold → LED1.', why: 'LDR resistance falls in light; with the LDR on the 3.3 V side of the divider the PA1 voltage rises in light, so “> threshold” means bright. With the LDR on the GND side it is the opposite.', internal: 'V_PA1 = 3.3 × R_bottom / (R_LDR + R_bottom) (LDR on top).' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Clocks: GPIOA, GPIOC, ADC1', detail: 'AHB1ENR bits 0, 2; APB2ENR bit 8.', kind: 'init' },
    { label: 'PA0/PA1 analog, PC14 output', detail: 'MODER fields.', kind: 'init' },
    { label: 'ADC init + start', detail: 'SMPR2, CCR, CR1/CR2, CONT, SQR3, SQR1, ADON, SWSTART.', kind: 'init' },
    { label: 'Wait EOC, read DR', detail: 'adcData = 0…4095.', kind: 'loop' },
    { label: 'adcData > 1024 ?', detail: 'Compare with threshold.', kind: 'decision' },
    { label: 'Drive LED1', detail: 'Yes → PC14 HIGH (ON); No → LOW (OFF). Repeat.', kind: 'loop' },
  ],
  sim: { id: 'adc', preset: 'ldr' },
  exam: {
    viva: [
      { q: 'What voltage does threshold = 1024 correspond to?', a: '1024 × 3.3 / 4096 ≈ 0.825 V.' },
      { q: 'How does an LDR produce a voltage for the ADC?', a: 'It forms a voltage divider with a fixed resistor; its resistance changes with light, so the mid-point voltage changes.' },
      { q: 'Why might the LED flicker near the threshold, and how do you fix it?', a: 'Noise makes readings cross the threshold repeatedly; use hysteresis (two thresholds) or average several samples.' },
    ],
    registerQs: [
      { q: 'What is the only ADC register value that differs between the pot and LDR programs?', a: 'ADC_SQR3: 0 for the pot (channel 0), 1 for the LDR (channel 1); plus the MODER bits of PA0 vs PA1.' },
      { q: 'Why is SMPR2 used and not SMPR1?', a: 'SMPR2 holds sampling times for channels 0–9; SMPR1 for 10–18.' },
    ],
    pinQs: [{ q: 'Which MODER bits make PA1 analog?', a: 'Bits 3:2 = 11.' }],
    outputQs: [{ q: 'The pot is at mid position. Is LED1 on?', a: 'Yes: ≈ 2048 > 1024.' }],
    debugQs: [
      { q: 'LED1 never turns on even at full pot. Causes?', a: 'PC14 not an output (MODER), GPIOC clock off, or wrong channel so adcData stays low.' },
      { q: 'The LDR program reacts to the pot instead. Why?', a: 'SQR3 left at 0 → channel 0 (PA0) is converted.' },
    ],
    errors: ['Wrong channel number in SQR3.', 'Writing «ADC->CCR = 0» and «ADC1->CCR» confusion (CCR belongs to the common ADC block).', 'Assuming dark = high reading without checking the divider.', 'No hysteresis → LED chatter.'],
    modifications: ['Three-level indicator: PB9 + PC14 for low/medium/high.', 'Switch LED on when it is dark (invert the comparison).', 'Average 16 samples before comparing.', 'Display adcData on the LCD (P14).', 'Use the EOC interrupt (P11).', 'Mid-term Smart Lighting design (LDR → PB9, see PYQ).'],
    explainToExaminer: md`“This builds on the pot program. The ADC converts continuously; after each EOC I read ADC_DR into adcData and compare it with a threshold of 1024, about 0.83 V. Above it I set ODR bit 14 to turn LED1 on, otherwise I clear it. For the LDR only the pin (PA1) and the channel in SQR3 (1) change.”`,
  },
  memorise: {
    essentials: ['Clocks: AHB1ENR bits 0, 2; APB2ENR bit 8', 'PA0: MODER |= 3<<0 (PA1: 3<<2)', 'PC14: MODER &= ~(1<<29); |= (1<<28)', 'ADC init block with SQR3 = 0 (pot) / 1 (LDR)', 'while(1){ wait EOC; adcData = DR; if (adcData > threshold) ODR |= 1<<14; else ODR &= ~(1<<14); }'],
    patterns: [{ name: 'Threshold with hysteresis', code: 'if (v > TH + H) on(); else if (v < TH - H) off();' }],
    skeleton: md`int adcData; const int threshold = 1024;
int main(void){
    clocks; PA0 analog; PC14 output; ADC init (CH 0); ADON; SWSTART;
    while(1){
        while(!(ADC1->SR & (1<<1)));
        adcData = ADC1->DR;
        if (adcData > threshold) GPIOC->ODR |= (1U<<14); else GPIOC->ODR &= ~(1U<<14);
    }
}`,
  },
  topics: ['adc-stm32', 'adc-fundamentals', 'leds-switches'],
};

export default p;
