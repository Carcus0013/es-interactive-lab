import type { Practical } from '../../types';
import { md } from '../md';

export const FAN_CODE = md`#include "stm32f4xx.h"

/* Speed bands from the potentiometer (12-bit ADC: 0..4095) */
#define SPEED_SPLIT     2048            /* below = low, at/above = high  */
#define SLOW_HALF_MS    500             /* low speed: toggle every 500 ms */
#define FAST_HALF_MS    100             /* high speed: toggle every 100 ms*/

volatile uint32_t adcData = 0;          /* watch this in the debugger    */

void delay_ms(uint32_t ms)
{
    SysTick->LOAD = 16000 - 1;          /* 1 ms at 16 MHz                */
    SysTick->VAL  = 0;
    SysTick->CTRL = 5;
    while (ms--) {
        while (!(SysTick->CTRL & (1U << 16))) { }
    }
    SysTick->CTRL = 0;
}

int main(void)
{
    uint32_t elapsed = 0;               /* ms since PB9 last toggled      */

    /* 1. clocks: GPIOA, GPIOB, GPIOC and ADC1 */
    RCC->AHB1ENR |= (1U << 0) | (1U << 1) | (1U << 2);
    RCC->APB2ENR |= (1U << 8);

    /* 2. inputs with pull-up: PA6 fan switch, PB10 manual override */
    GPIOA->MODER &= ~(3U << 12);
    GPIOA->PUPDR = (GPIOA->PUPDR & ~(3U << 12)) | (1U << 12);
    GPIOB->MODER &= ~(3U << 20);
    GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);

    /* 3. PA0 analog: potentiometer on ADC1 channel 0 */
    GPIOA->MODER |= (3U << 0);

    /* 4. outputs: PC13 fan status (active-low), PC14 override, PB9 speed */
    GPIOC->MODER = (GPIOC->MODER & ~((3U << 26) | (3U << 28))) | (1U << 26) | (1U << 28);
    GPIOB->MODER = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);
    GPIOC->ODR |=  (1U << 13);          /* PC13 OFF                       */
    GPIOC->ODR &= ~(1U << 14);          /* PC14 OFF                       */
    GPIOB->ODR &= ~(1U << 9);           /* PB9 OFF                        */

    /* 5. ADC1: channel 0, continuous, 12-bit */
    ADC1->SMPR2 &= ~(7U << 0);          /* ch0 sampling time = 3 cycles   */
    ADC->CCR = 0;                       /* ADCCLK = PCLK2 / 2             */
    ADC1->CR1 = 0;
    ADC1->CR2 = 0;
    ADC1->CR2 |= (1U << 1);             /* CONT                           */
    ADC1->SQR3 = 0;                     /* 1st conversion = channel 0     */
    ADC1->SQR1 = 0;                     /* L = 0 -> one conversion        */
    ADC1->CR2 |= (1U << 0);             /* ADON                           */
    delay_ms(1);                        /* stabilisation time             */
    ADC1->CR2 |= (1U << 30);            /* SWSTART                        */

    while (1) {
        uint32_t fanOn    = ((GPIOA->IDR >> 6)  & 1U) == 0;   /* PA6 pressed  */
        uint32_t override = ((GPIOB->IDR >> 10) & 1U) == 0;   /* PB10 pressed */

        if (ADC1->SR & (1U << 1))
            adcData = ADC1->DR;

        if (!fanOn) {
            /* (a) fan OFF: everything OFF, pot and override ignored */
            GPIOC->ODR |=  (1U << 13);
            GPIOB->ODR &= ~(1U << 9);
            GPIOC->ODR &= ~(1U << 14);
            elapsed = 0;
        } else {
            GPIOC->ODR &= ~(1U << 13);  /* (a) fan ON: PC13 ON            */
            if (override) {
                /* (c) override: PB9 steady ON, PC14 ON */
                GPIOB->ODR |= (1U << 9);
                GPIOC->ODR |= (1U << 14);
                elapsed = 0;
            } else {
                /* (b) speed band from the potentiometer -> PB9 blink rate */
                uint32_t half = (adcData < SPEED_SPLIT) ? SLOW_HALF_MS : FAST_HALF_MS;
                GPIOC->ODR &= ~(1U << 14);
                elapsed += 10;
                if (elapsed >= half) {
                    GPIOB->ODR ^= (1U << 9);
                    elapsed = 0;
                }
            }
        }

        delay_ms(10);                   /* 10 ms time base                */
    }
}`;

const p: Practical = {
  id: 'p18-smart-fan',
  order: 18,
  title: 'Mid-term Part B: Smart Fan Speed and Status Indicator — solution',
  unit: 2,
  objective: 'PA6 switch turns the “fan” on (PC13 lit); the potentiometer on ADC1 channel 0 selects one of two speed bands shown by the PB9 blink rate; holding PB10 forces PB9 steady ON and lights PC14; with the fan OFF, PB9 and PC14 stay OFF whatever the other inputs do.',
  components: ['STM32F401CCU6 Black Pill + extension board', 'S2 on PA6 as fan power switch', 'S1 on PB10 as manual override', 'Potentiometer on PA0', 'LEDs PC13 (fan status), PC14 (override), PB9 (speed)'],
  connections: [
    { pin: 'PA6', to: 'Fan power switch (S2)', mode: 'Input, pull-up' },
    { pin: 'PB10', to: 'Manual override (S1)', mode: 'Input, pull-up' },
    { pin: 'PA0', to: 'Potentiometer wiper', mode: 'Analog, ADC1_IN0' },
    { pin: 'PC13', to: 'Fan status (on-board LED)', mode: 'Output, active-low' },
    { pin: 'PC14', to: 'Override indicator (LED1)', mode: 'Output, active-high' },
    { pin: 'PB9', to: 'Speed indicator (LED2)', mode: 'Output, active-high' },
  ],
  expected: md`| PA6 | PB10 | Pot (adcData) | PC13 | PB9 | PC14 |
|---|---|---|---|---|---|
| released | any | any | OFF | OFF | OFF |
| pressed | released | < 2048 | ON | slow blink (1 Hz) | OFF |
| pressed | released | ≥ 2048 | ON | fast blink (5 Hz) | OFF |
| pressed | pressed | any | ON | steady ON | ON |

Releasing PB10 while PA6 is still held resumes the blink at the band chosen by the pot.`,
  sources: [
    { file: "EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf", detail: 'Aug 2025 Set B, Q6' },
    { file: "EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET2.pdf", detail: 'Aug 2026 Slot 1 Set 2, Q5' },
  ],
  circuit: {
    leds: [{ pin: 'PC13', label: 'Fan status', activeLow: true }, { pin: 'PC14', label: 'Override' }, { pin: 'PB9', label: 'Speed' }],
    switches: [{ pin: 'PA6', label: 'Fan power', pull: 'up' }, { pin: 'PB10', label: 'Override', pull: 'up' }],
    analog: [{ pin: 'PA0', label: 'Speed pot', kind: 'pot' }],
  },
  programs: [
    {
      id: 'sol',
      title: 'Solution (register level)',
      file: 'smart_fan.c — written for this platform',
      authored: true,
      code: FAN_CODE,
      explain: [
        { lines: [3, 6], what: 'Two speed bands and their blink half-periods.', why: 'The question asks for “two bands only”. Mid-scale (2048 of 0–4095) splits them; 500 ms and 100 ms half-periods give a 1 Hz and a 5 Hz blink — clearly different to an examiner.' },
        { lines: [8, 8], what: 'volatile ADC result.', why: 'The 10-mark “ADC value demonstration” is shown by watching adcData in the debugger while turning the pot.' },
        { lines: [10, 19], what: 'SysTick 1 ms delay (polling).', why: 'Gives the loop a known 10 ms tick that the blink timing counts.', register: 'STK_LOAD, STK_VAL, STK_CTRL, COUNTFLAG' },
        { lines: [23, 23], what: 'Blink timer.', why: 'Counts milliseconds since PB9 last toggled, so the loop never blocks for 500 ms and the switches stay responsive.' },
        { lines: [26, 27], what: 'Clocks: GPIOA, GPIOB, GPIOC, ADC1.', register: 'RCC_AHB1ENR bits 0–2, RCC_APB2ENR bit 8', why: 'Every port and the ADC need their clock before their registers respond.' },
        { lines: [30, 33], what: 'PA6 and PB10 inputs with pull-ups.', why: 'Pressed = pin pulled to GND = reads 0. PA6 is MODER bits 13:12, PB10 bits 21:20.', register: 'GPIOx_MODER, GPIOx_PUPDR' },
        { lines: [36, 36], what: 'PA0 analog.', why: 'Channel 0 of ADC1 is PA0 — the kit’s potentiometer pin.', register: 'GPIOA_MODER bits 1:0 = 11' },
        { lines: [39, 43], what: 'PC13, PC14, PB9 outputs, all OFF.', why: 'PC13 is active-low (OFF = 1); PC14 and PB9 are active-high (OFF = 0).', register: 'GPIOC_MODER bits 27:26 and 29:28, GPIOB_MODER bits 19:18, ODR' },
        { lines: [46, 55], what: 'ADC1 set-up for channel 0, continuous.', why: 'The lab register sequence: sample time, prescaler, 12-bit, continuous, channel 0 first, one conversion, power on, wait, start.', register: 'SMPR2, CCR, CR1, CR2 (CONT, ADON, SWSTART), SQR3, SQR1' },
        { lines: [58, 59], what: 'Read both switches once per loop.', why: 'Each is 1 when pressed (the IDR bit is 0).', register: 'GPIOA_IDR bit 6, GPIOB_IDR bit 10' },
        { lines: [61, 62], what: 'Copy the newest conversion if one is ready.', why: 'Non-blocking: the loop keeps its 10 ms rhythm.', register: 'ADC_SR.EOC (bit 1), ADC_DR' },
        { lines: [64, 69], what: '(a) Fan OFF → all three LEDs OFF.', why: 'The question’s “importantly” clause: with PA6 released, PB9 and PC14 stay OFF irrespective of the pot or override. Checking fanOn first guarantees that priority.' },
        { lines: [71, 71], what: '(a) Fan ON → PC13 ON.', why: 'Clear bit 13 because the on-board LED is active-low.' },
        { lines: [72, 76], what: '(c) Override held → PB9 steady ON, PC14 ON.', why: 'The blink timer is reset so blinking restarts cleanly when PB10 is released.' },
        { lines: [77, 85], what: '(b) Automatic speed indication.', why: 'Pick the half-period from the band, add the 10 ms tick, and toggle PB9 when the half-period has passed. PC14 is turned off because override is not active.', internal: 'XOR on ODR flips only bit 9. Effective blink period ≈ 2 × half + a few loop overheads.' },
        { lines: [89, 89], what: '10 ms time base.', why: 'Sets the timing resolution of the blink and debounces the switches.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Configure clocks and pins', detail: 'GPIOA/B/C and ADC1 clocks; PA6 and PB10 inputs with pull-up; PA0 analog; PC13, PC14 and PB9 outputs.', kind: 'init' },
    { label: 'Start ADC1 channel 0', detail: 'Continuous mode: SQR3 = 0, CONT, ADON, SWSTART.', kind: 'init' },
    { label: 'Read PA6, PB10; read ADC if EOC', detail: 'fanOn, override, adcData.', kind: 'io' },
    { label: 'Fan ON?', detail: 'No → PC13, PB9, PC14 all OFF.', kind: 'decision' },
    { label: 'Override held?', detail: 'Yes → PB9 steady ON, PC14 ON.', kind: 'decision' },
    { label: 'Else blink PB9 by speed band', detail: 'Slow (toggle every 500 ms) below 2048, fast (every 100 ms) otherwise; count 10 ms ticks; repeat.', kind: 'loop' },
  ],
  sim: { id: 'adc', preset: 'pot' },
  exam: {
    viva: [
      { q: 'Why is fanOn checked before override?', a: 'The question says that with the fan OFF, PB9 and PC14 must stay OFF irrespective of the override. Testing fanOn first gives it priority.' },
      { q: 'How are the two speed bands produced without a timer peripheral?', a: 'A software counter adds 10 ms per loop and toggles PB9 when it reaches 500 ms (slow) or 100 ms (fast).' },
      { q: 'Why not use delay_ms(500) for the slow blink?', a: 'The loop would block for half a second, so pressing PA6 or PB10 would be noticed late.' },
      { q: 'What ADC value range corresponds to each band?', a: '0–2047 = low speed, 2048–4095 = high speed (12-bit).' },
    ],
    registerQs: [
      { q: 'Which MODER bits configure PA6 and PC14?', a: 'PA6: bits 13:12 (00 input). PC14: bits 29:28 (01 output).' },
      { q: 'How is channel 0 selected?', a: 'ADC1->SQR3 = 0 (SQ1 = 0) with SQR1 L = 0 for one conversion.' },
    ],
    pinQs: [{ q: 'Which LED is active-low and why does it matter?', a: 'PC13 (on-board): writing 0 turns it ON, so “fan ON” clears bit 13.' }],
    outputQs: [
      { q: 'PA6 released, PB10 pressed, pot at maximum. LEDs?', a: 'All OFF — the fan is off, so override and pot are ignored.' },
      { q: 'PA6 held, pot at 3000, PB10 not pressed?', a: 'PC13 ON, PC14 OFF, PB9 blinks fast (about 5 Hz).' },
    ],
    debugQs: [
      { q: 'PB9 never blinks; it stays ON or OFF. Causes?', a: 'elapsed not incremented or reset every loop, the toggle uses = instead of ^=, or adcData never updated so the band never changes (check SQR3/PA0 analog).' },
      { q: 'PC14 never lights. Check?', a: 'MODER bits 29:28 must be 01; PC14 is active-high on the kit; GPIOC clock enabled.' },
    ],
    errors: ['Letting override light PB9/PC14 while the fan is OFF.', 'Using blocking delays for the blink.', 'Forgetting to turn PC14 off when override is released.', 'Treating PC13 as active-high.'],
    modifications: ['Three bands (slow, medium, fast).', 'Drive a real fan via TIM PWM with duty from the pot.', 'Add hysteresis around 2048 so the band does not flicker at the boundary.', 'Show “LOW”/“HIGH” on the I²C LCD.'],
    explainToExaminer: md`“PA6 and PB10 are pull-up inputs, PA0 is analog on ADC channel 0, and PC13, PC14 and PB9 are outputs. The ADC runs continuously. Each 10 ms loop I read both switches and the latest ADC value. If the fan switch is released, all three LEDs go off — that takes priority over everything. If it is pressed, PC13 lights; then if override is held, PB9 is steady on and PC14 lights; otherwise a software counter toggles PB9 every 500 ms for a low reading or every 100 ms for a high reading.”`,
  },
  memorise: {
    essentials: ['clocks: AHB1ENR bits 0,1,2; APB2ENR bit 8', 'PA6: MODER bits 13:12 = 00, PUPDR = 01', 'PB10: MODER bits 21:20 = 00, PUPDR = 01', 'PA0: MODER |= 3', 'PC13, PC14, PB9: MODER 01', 'ADC: SMPR2, CCR=0, CR1=0, CR2=0, CONT, SQR3=0, SQR1=0, ADON, SWSTART', 'fan off → all OFF; override → PB9 ON + PC14 ON; else blink PB9'],
    patterns: [{ name: 'Non-blocking blink', code: 'elapsed += 10;\nif (elapsed >= half) {\n    GPIOB->ODR ^= (1U << 9);\n    elapsed = 0;\n}' }],
    skeleton: md`init (clocks, 2 inputs, PA0 analog, 3 outputs, ADC ch0 continuous)
while(1){
   fanOn, override, adcData
   if !fanOn: all OFF
   else: PC13 ON; override ? (PB9 ON, PC14 ON) : blink PB9 by band
   delay 10 ms
}`,
  },
  topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
};

export default p;
