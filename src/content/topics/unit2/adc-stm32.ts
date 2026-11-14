import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'adc-stm32',
  unit: 2,
  order: 10,
  title: 'The STM32F401 ADC peripheral',
  short: 'ADC1 features, channels and groups, conversion modes, clock and sampling time, the registers CR1/CR2/SR/DR/SQRx/SMPRx/CCR, and polling vs interrupt vs DMA.',
  status: 'course',
  sources: [
    { file: 'Day08_1_STM32F401CCU6_ADC.pptx', detail: 'slides 2–52 (features, modes, triggers, poll/interrupt/DMA, registers, Exp 4.1–4.3)' },
    { file: 'Lab_5 and Lab_7 ADC programs', detail: 'ADC_Potentiometer_reading, ADC_with_LED_control, ADC_LDR_interfacing, pot_int' },
  ],
  keywords: ['ADC1', 'ADON', 'CONT', 'SWSTART', 'EOC', 'EOCIE', 'ADC_DR', 'SQR1', 'SQR3', 'SMPR2', 'CCR', 'ADCPRE', 'regular', 'injected', 'single', 'continuous', 'scan', 'discontinuous', 'polling', 'DMA', 'potentiometer', 'LDR', 'channel 0', 'channel 1'],
  importance: 3,
  pyq: ['MT25A-6', 'MT25B-6', 'MT26S1-5', 'MT26S2-5'],
  practicals: ['p06-adc-pot', 'p07-adc-threshold', 'p11-adc-interrupt', 'p14-i2c-lcd'],
  sims: ['adc'],
  related: ['adc-fundamentals', 'gpio-registers', 'io-sync', 'nvic'],
  fundamentals: {
    what: md`**ADC1** on the STM32F401 is a 12-bit successive-approximation converter with up to **19 multiplexed channels** (16 external, internal temperature sensor, V_REFINT and V_BAT). It converts in single, continuous, scan or discontinuous mode and stores the result in a 16-bit data register (right- or left-aligned).`,
    why: md`The potentiometer (PA0), LDR (PA1) and every analog sensor in the case study are read through this peripheral; every mid-term Part-B question uses it.`,
    problem: md`It converts a pin voltage into a number at a programmable rate with minimal CPU involvement, signals completion (EOC flag / interrupt) and can feed DMA for many channels.`,
    how: md`Enable the GPIO and ADC clocks; put the pin in **analog mode** (MODER = 11); set sampling time (SMPRx), prescaler (CCR), mode (CR2.CONT), channel (SQR3) and sequence length (SQR1.L); switch on with **ADON**; start with **SWSTART**; wait for **EOC** in SR; read **DR** (which clears EOC).`,
    where: md`Labs 4.1–4.3 (pot reading, pot → LED, LDR → LED), ADC interrupt lab, I²C LCD showing the pot value, Smart Lighting (LDR) and Smart Fan (pot) mid-term designs.`,
  },
  detailed: md`
## Features (Day08_1 slides 3–4)

- 12-bit SAR; resolution configurable to 12/10/8/6 bits (fewer bits → faster).
- Up to 19 channels: 16 external (ADC_IN0–IN15), temperature sensor, V_REFINT, V_BAT.
- Modes: single, continuous, scan, discontinuous.
- Result in a 16-bit register, left or right aligned.
- Interrupts at end of conversion (regular / injected) and analog watchdog.
- Only ADC1 exists on the F401 (no ADC2/ADC3).

::diagram{adc-block}

On the kit: **PA0 = ADC1_IN0 (potentiometer)**, **PA1 = ADC1_IN1 (LDR)**.

## Regular vs injected channels (slides 5–6)

| | Regular group | Injected group |
|---|---|---|
| Length | up to 16 conversions | up to 4 |
| Result | one shared ADC_DR (needs DMA for many channels) | separate ADC_JDR1–4 |
| Priority | normal | can interrupt a regular conversion |
| Use | periodic sampling | time-critical (motor current) |

## Conversion modes (slides 7–9)

| Mode | Behaviour |
|---|---|
| **Single** (CONT = 0) | One conversion, then stop; EOC set |
| **Continuous** (CONT = 1) | Starts the next conversion as soon as one finishes — used in all lab programs |
| **Scan** (SCAN = 1) | Converts every channel in the SQR sequence once; DMA usually required |
| **Discontinuous** (DISCEN = 1) | Converts n (≤ 8) channels of the sequence per trigger |

Triggers: software (SWSTART) or internal/external events (timer outputs, EXTI) — slide 10.

## Clock and timing (slides 21–34)

- ADC clock = PCLK2 ÷ 2, 4, 6 or 8 (ADC_CCR.ADCPRE). Maximum **36 MHz**. Lab: CCR = 0 → 16 MHz / 2 = **8 MHz**.
- Conversion time = **sampling time + 12 cycles** (12-bit). Lab: SMPR = 000 → 3 cycles → **15 cycles = 1.875 µs** at 8 MHz.
- Longer sampling (up to 480 cycles) charges the internal capacitor more fully: better accuracy for high-impedance sources, but slower.

## Registers used in the labs

| Register | Bits used | Purpose |
|---|---|---|
| RCC_APB2ENR | bit 8 ADC1EN | ADC1 clock |
| GPIOA_MODER | 11 on PA0/PA1 | analog mode |
| ADC_SMPR2 | SMP0, SMP1 (3 bits each) | sampling time ch 0–9 |
| ADC_CCR | ADCPRE [17:16] | ADC clock prescaler |
| ADC_CR1 | RES [25:24], EOCIE bit 5 | resolution, EOC interrupt |
| ADC_CR2 | ADON bit 0, CONT bit 1, SWSTART bit 30 | on, continuous, start |
| ADC_SQR1 | L [23:20] | number of conversions − 1 |
| ADC_SQR3 | SQ1 [4:0] | channel of 1st conversion |
| ADC_SR | EOC bit 1 | conversion complete |
| ADC_DR | [15:0] | result (reading clears EOC) |

## The lab sequence (ADC_Potentiometer_reading)

~~~c
RCC->AHB1ENR |= (1U << 0);        // 1. GPIOA clock
RCC->APB2ENR |= (1 << 8);         // 2. ADC1 clock
GPIOA->MODER |= (3U << 0);        // 3. PA0 analog (11)
ADC1->SMPR2 &= ~(0x7 << 0);       // 4. ch0 sampling = 3 cycles
ADC->CCR &= ~(0x3 << 16);         // 5. ADCCLK = PCLK2/2
ADC1->CR1 = 0;  ADC1->CR2 = 0;    // 6. reset settings (12-bit, single channel)
ADC1->CR2 |= (1U << 1);           // 7. CONT: continuous conversion
ADC1->SQR3 &= ~(0x1F);            // 8. first conversion = channel 0
ADC1->SQR1 &= ~(0xF << 20);       // 9. L = 0 → 1 conversion
ADC1->CR2 |= 1;                   // 10. ADON
while ((ADC1->CR2 & 1) == 0) {}   // 11. (wait for ADON)
ADC1->CR2 |= (1 << 30);           // 12. SWSTART
while (1) {
    while (!(ADC1->SR & (1 << 1))) {}   // wait EOC
    adcData = ADC1->DR;                  // read (clears EOC)
}
~~~

For the LDR, the only change is the pin and channel: «GPIOA->MODER |= (3U<<2);» and «ADC1->SQR3 = 1;».

> [!note] About step 11
> ADON is written by software, so «while((CR2 & 1) == 0)» exits immediately. The reference manual instead requires a short stabilisation time (t_STAB, a few µs) between ADON and the first SWSTART; in continuous mode the first result may simply be discarded.

## Reading results: polling, interrupt, DMA (slide 15)

| Method | How | Pros | Cons |
|---|---|---|---|
| **Polling** | «while(!(SR & EOC));» then read DR | simplest | CPU blocked waiting |
| **Interrupt** | CR1.EOCIE = 1, NVIC_EnableIRQ(ADC_IRQn); read DR in «ADC_IRQHandler» | CPU free between conversions | too many interrupts at high rates (jitter, latency) |
| **DMA** | CR2.DMA = 1; DMA moves each DR value into an SRAM buffer | no CPU per sample; best for many channels/high rates | more setup |

## Threshold control (Lab 5)

~~~c
if (adcData > threshold) GPIOC->ODR |=  (1U << 14);   // LED1 ON
else                     GPIOC->ODR &= ~(1U << 14);   // LED1 OFF
~~~

1024 ≈ 0.83 V. For the LDR: in a voltage divider, light level changes the LDR resistance and therefore the voltage at PA1. Whether “dark” gives a high or a low reading depends on which side of the divider the LDR is on — check your kit by reading «adcData» in the debugger with the LDR covered and uncovered.
`,
  visual: md`
::sim{adc preset=ldr}

::diagram{adc-block}
`,
  exam: {
    definitions: [
      { term: 'ADON', def: 'ADC_CR2 bit 0: powers the ADC on (wakes it from power-down).' },
      { term: 'SWSTART', def: 'ADC_CR2 bit 30: software start of conversion of the regular channels.' },
      { term: 'EOC', def: 'ADC_SR bit 1: end of conversion flag, set by hardware, cleared by reading ADC_DR.' },
      { term: 'Continuous conversion mode', def: 'CONT = 1: the ADC starts a new conversion as soon as the previous one ends.' },
      { term: 'Regular sequence', def: 'Ordered list of up to 16 channels in SQR1–SQR3 converted by the regular group; L = length − 1.' },
    ],
    formulas: [
      { name: 'ADC clock', expr: 'f_ADC = f_PCLK2 / prescaler (2, 4, 6, 8) ≤ 36 MHz', example: '16 MHz / 2 = 8 MHz' },
      { name: 'Conversion time', expr: 'T_conv = (SMP cycles + 12) / f_ADC', example: '(3 + 12) / 8 MHz = 1.875 µs' },
    ],
    frequent: ['ADC register configuration in every Part-B question (LDR on ch1, pot on ch0).', 'Explain ADC modes.', 'Polling vs interrupt vs DMA.', 'Compute conversion time.'],
    mistakes: ['Forgetting MODER = 11 (analog) on the ADC pin.', 'Enabling ADC1 in AHB1ENR instead of APB2ENR bit 8.', 'Putting the channel number in SQR1 instead of SQR3.', 'Setting L = 1 for one channel (L = 0 means one conversion).', 'Not reading DR → EOC never clears → stale or overrun data.', 'Using PA0 as both key input and ADC at the same time.'],
    diagrams: ['STM32 ADC block diagram', 'Potentiometer/LDR to PA0/PA1'],
    shortQs: [
      { q: 'List the registers configured to read the LDR on PA1 continuously.', a: md`RCC_AHB1ENR (GPIOA), RCC_APB2ENR (ADC1), GPIOA_MODER bits 3:2 = 11, ADC_SMPR2 (SMP1), ADC_CCR (prescaler), ADC_CR1 = 0, ADC_CR2 CONT then ADON then SWSTART, ADC_SQR3 = 1, ADC_SQR1 L = 0, then poll ADC_SR.EOC and read ADC_DR.`, marks: 2 },
      { q: 'How is the EOC flag cleared?', a: md`By software, or automatically by reading ADC_DR.`, marks: 1 },
      { q: 'Compare polling and DMA for reading the ADC.', a: md`Polling blocks the CPU until EOC; simple, fine for one slow channel. DMA moves results to memory without the CPU after each conversion; best for many channels/high rates; more configuration.`, marks: 2 },
      { q: 'Calculate the conversion time with PCLK2 = 84 MHz, prescaler ÷4 and 15-cycle sampling.', a: md`ADCCLK = 21 MHz; T = (15 + 12)/21 MHz = 1.29 µs.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the ADC of the STM32F401 including its modes and registers, and write the register-level code to read a potentiometer on PA0.', a: md`Features, regular/injected, single/continuous/scan/discontinuous, clock and sampling, register table, and the 12-step lab code with explanation of each line and EOC polling.`, marks: 8 },
      { q: 'Explain the three ways of reading ADC results on the STM32 and write the interrupt-driven version of the potentiometer program.', a: md`Polling/interrupt/DMA table; interrupt code: same configuration plus «ADC1->CR1 \|= (1U<<5); NVIC_EnableIRQ(ADC_IRQn);» and «void ADC_IRQHandler(void){ if (ADC1->SR & (1U<<1)) { adcData = ADC1->DR; …LED logic… } }», with «volatile int adcData».`, marks: 8 },
    ],
    numericals: [
      {
        q: 'Find the ADC clock and the conversion time for the lab configuration (HSI 16 MHz, CCR = 0, SMPR = 000, 12-bit).',
        given: ['PCLK2 = 16 MHz', 'ADCPRE = 00 → ÷2', 'SMP = 000 → 3 cycles', '12-bit → 12 cycles'],
        find: 'f_ADC and T_conv',
        formula: 'f_ADC = PCLK2 / 2 ; T_conv = (3 + 12) / f_ADC',
        steps: ['f_ADC = 16 / 2 = 8 MHz', 'T_conv = 15 / 8 MHz = 1.875 µs', 'Max rate ≈ 533 kS/s'],
        answer: '8 MHz, 1.875 µs',
        value: 1.875,
        unit: 'µs',
        tolerance: 0.01,
      },
    ],
  },
  revision: {
    notes: ['ADC1: 12-bit SAR, 16 external channels; PA0 = IN0 (pot), PA1 = IN1 (LDR).', 'Clocks: AHB1ENR bit0 (GPIOA), APB2ENR bit8 (ADC1).', 'Pin: MODER = 11.', 'CR2: ADON bit0, CONT bit1, SWSTART bit30. SR: EOC bit1. DR: result.', 'SQR3 = channel; SQR1.L = n − 1. SMPR2 sampling; CCR prescaler (≤ 36 MHz).', 'T_conv = (SMP + 12)/f_ADC; lab = 1.875 µs.'],
    takeaways: ['Clock → analog pin → configure → ADON → SWSTART → wait EOC → read DR.', 'Channel goes in SQR3.'],
    mcqs: [
      { q: 'Which bit starts a regular conversion by software?', options: ['ADON', 'CONT', 'SWSTART', 'EOC'], answer: 2, explain: 'CR2 bit 30.' },
      { q: 'To read the LDR the lab writes ADC1->SQR3 = …', options: ['0', '1', '3', '30'], answer: 1, explain: 'LDR on channel 1.' },
      { q: 'Which register bit tells that the conversion is finished?', options: ['ADC_CR2 bit 0', 'ADC_SR bit 1 (EOC)', 'ADC_DR bit 15', 'ADC_CCR bit 16'], answer: 1, explain: 'EOC flag.' },
      { q: 'GPIO mode required for an ADC input pin:', options: ['00', '01', '10', '11'], answer: 3, explain: 'Analog.' },
      { q: 'Maximum ADC clock for accurate conversions:', options: ['16 MHz', '36 MHz', '84 MHz', '8 MHz'], answer: 1, explain: 'Day08_1 slide 21.' },
    ],
  },
};

export default topic;
