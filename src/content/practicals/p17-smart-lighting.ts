import type { Practical } from '../../types';
import { md } from '../md';

export const LIGHTING_CODE = md`#include "stm32f4xx.h"

/* LDR threshold (12-bit). Lab convention: LED ON when ADC > threshold.
   If your divider reads LOWER in the dark, change '>' to '<' in IS_DARK. */
#define LDR_THRESHOLD   2000
#define IS_DARK(v)      ((v) > LDR_THRESHOLD)

volatile uint32_t adcData = 0;          /* watch this in the debugger   */

void delay_ms(uint32_t ms)
{
    SysTick->LOAD = 16000 - 1;          /* 1 ms at 16 MHz               */
    SysTick->VAL  = 0;
    SysTick->CTRL = 5;
    while (ms--) {
        while (!(SysTick->CTRL & (1U << 16))) { }
    }
    SysTick->CTRL = 0;
}

int main(void)
{
    uint32_t prevOvr = 1;               /* previous PB10 level           */
    uint32_t manualLed = 0;             /* PB9 state chosen by override  */

    /* 1. clocks: GPIOA, GPIOB, GPIOC and ADC1 */
    RCC->AHB1ENR |= (1U << 0) | (1U << 1) | (1U << 2);
    RCC->APB2ENR |= (1U << 8);

    /* 2. inputs with pull-up: PA0 door switch, PB10 manual override */
    GPIOA->MODER &= ~(3U << 0);
    GPIOA->PUPDR = (GPIOA->PUPDR & ~(3U << 0)) | (1U << 0);
    GPIOB->MODER &= ~(3U << 20);
    GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);

    /* 3. PA1 analog: LDR on ADC1 channel 1 */
    GPIOA->MODER |= (3U << 2);

    /* 4. outputs: PC13 door lamp (active-low), PB9 room light */
    GPIOC->MODER = (GPIOC->MODER & ~(3U << 26)) | (1U << 26);
    GPIOB->MODER = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);
    GPIOC->ODR |=  (1U << 13);          /* PC13 OFF                      */
    GPIOB->ODR &= ~(1U << 9);           /* PB9 OFF                       */

    /* 5. ADC1: channel 1, continuous, 12-bit */
    ADC1->SMPR2 &= ~(7U << 3);          /* ch1 sampling time = 3 cycles  */
    ADC->CCR = 0;                       /* ADCCLK = PCLK2 / 2            */
    ADC1->CR1 = 0;
    ADC1->CR2 = 0;
    ADC1->CR2 |= (1U << 1);             /* CONT                          */
    ADC1->SQR3 = 1;                     /* 1st conversion = channel 1    */
    ADC1->SQR1 = 0;                     /* L = 0 -> one conversion       */
    ADC1->CR2 |= (1U << 0);             /* ADON                          */
    delay_ms(1);                        /* stabilisation time            */
    ADC1->CR2 |= (1U << 30);            /* SWSTART                       */

    while (1) {
        /* (a) door sensor: PA0 pressed (0) -> door open -> PC13 ON */
        if ((GPIOA->IDR & (1U << 0)) == 0)
            GPIOC->ODR &= ~(1U << 13);
        else
            GPIOC->ODR |=  (1U << 13);

        /* newest LDR reading */
        if (ADC1->SR & (1U << 1))
            adcData = ADC1->DR;

        /* (c) manual override on PB10 */
        uint32_t ovr = (GPIOB->IDR >> 10) & 1U;     /* 0 = pressed       */
        if (prevOvr == 1 && ovr == 0) {             /* a new press       */
            manualLed = !((GPIOB->ODR >> 9) & 1U);  /* toggle PB9        */
        }
        prevOvr = ovr;

        if (ovr == 0) {
            /* override held: automatic control disabled */
            if (manualLed) GPIOB->ODR |=  (1U << 9);
            else           GPIOB->ODR &= ~(1U << 9);
        } else {
            /* (b) automatic lighting from the LDR */
            if (IS_DARK(adcData)) GPIOB->ODR |=  (1U << 9);
            else                  GPIOB->ODR &= ~(1U << 9);
        }

        delay_ms(10);                   /* 10 ms loop: debounce          */
    }
}`;

const p: Practical = {
  id: 'p17-smart-lighting',
  order: 17,
  title: 'Mid-term Part B: Smart Lighting with Door Sensor and Manual Override — solution',
  unit: 2,
  objective: 'Door switch on PA0 lights PC13 while the door is open; the LDR on PA1 (ADC channel 1) switches PB9 automatically in low light; holding the PB10 override disables the automatic control and each press toggles PB9.',
  components: ['STM32F401CCU6 Black Pill + extension board', 'USER KEY on PA0 as door sensor', 'S1 on PB10 as manual override', 'LDR divider on PA1', 'LEDs PC13 (door) and PB9 (room light)'],
  connections: [
    { pin: 'PA0', to: 'Door switch (USER KEY)', mode: 'Input, pull-up' },
    { pin: 'PB10', to: 'Manual override (S1)', mode: 'Input, pull-up' },
    { pin: 'PA1', to: 'LDR voltage divider', mode: 'Analog, ADC1_IN1' },
    { pin: 'PC13', to: 'Door lamp (on-board LED)', mode: 'Output, active-low' },
    { pin: 'PB9', to: 'Room light (LED2)', mode: 'Output, active-high' },
  ],
  expected: md`| Input | Result |
|---|---|
| PA0 pressed (door open) | PC13 ON; released → OFF |
| Dark (ADC reading on the dark side of the threshold), PB10 released | PB9 ON |
| Bright, PB10 released | PB9 OFF |
| Press PB10 | auto control suspended; PB9 flips to the opposite of what it showed; stays that way while held |
| Release PB10 | automatic LDR control resumes |

The Aug 2025 Set A paper also lists an LED on PC14, but no behaviour is specified for it, so it is left OFF.`,
  sources: [
    { file: "EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf", detail: 'Aug 2025 Set A, Q6' },
    { file: "EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET1.pdf", detail: 'Aug 2026 Slot 1 Set 1, Q5' },
  ],
  circuit: {
    leds: [{ pin: 'PC13', label: 'Door lamp', activeLow: true }, { pin: 'PB9', label: 'Room light' }],
    switches: [{ pin: 'PA0', label: 'Door switch', pull: 'up' }, { pin: 'PB10', label: 'Override', pull: 'up' }],
    analog: [{ pin: 'PA1', label: 'LDR', kind: 'ldr' }],
  },
  programs: [
    {
      id: 'sol',
      title: 'Solution (register level)',
      file: 'smart_lighting.c — written for this platform',
      authored: true,
      code: LIGHTING_CODE,
      explain: [
        { lines: [3, 6], what: 'Threshold and the darkness test as macros.', why: 'The question says “ADC value − set threshold”. Putting the comparison in one macro lets you flip it in one place if your kit’s divider reads lower in the dark.', internal: 'The supplied LDR lab turns the LED on when ADC > threshold, so that is the default here.' },
        { lines: [8, 8], what: 'volatile ADC result.', why: 'The rubric awards 10 marks for “ADC value demonstration” — show adcData in the Keil Watch window while covering the LDR.' },
        { lines: [10, 19], what: 'SysTick 1 ms delay (polling).', why: 'Accurate loop timing for debouncing.', register: 'STK_LOAD, STK_VAL, STK_CTRL, COUNTFLAG' },
        { lines: [23, 24], what: 'Override state.', why: '«prevOvr» detects each new press; «manualLed» is the PB9 state chosen by the override.' },
        { lines: [27, 28], what: 'Clocks: GPIOA, GPIOB, GPIOC, ADC1.', register: 'RCC_AHB1ENR bits 0–2, RCC_APB2ENR bit 8', why: 'Every peripheral used needs its clock.' },
        { lines: [31, 34], what: 'PA0 and PB10 inputs with pull-ups.', why: 'Both switches connect the pin to GND when pressed → read 0 when pressed.', register: 'GPIOA MODER/PUPDR bits 1:0, GPIOB bits 21:20' },
        { lines: [37, 37], what: 'PA1 analog.', why: 'LDR input to ADC channel 1.', register: 'GPIOA_MODER bits 3:2 = 11' },
        { lines: [40, 43], what: 'PC13 and PB9 outputs, both OFF.', why: 'PC13 is active-low (OFF = 1); PB9 active-high (OFF = 0).', register: 'GPIOC_MODER 27:26, GPIOB_MODER 19:18, ODR' },
        { lines: [46, 55], what: 'ADC1 set-up for channel 1, continuous.', why: 'Same register sequence as the lab programs, with SQR3 = 1. SMP1 (bits 5:3) = 000.', register: 'SMPR2, CCR, CR1, CR2 (CONT, ADON, SWSTART), SQR3, SQR1' },
        { lines: [59, 62], what: '(a) Door sensor → PC13.', why: 'Pressed (0) = door open → clear ODR13 → LED ON. Released → LED OFF.', register: 'GPIOA_IDR bit 0, GPIOC_ODR bit 13' },
        { lines: [65, 66], what: 'Take the newest conversion without blocking.', why: 'In continuous mode a result is ready every ~2 µs; checking EOC (instead of waiting) keeps the loop responsive.', register: 'ADC_SR.EOC, ADC_DR' },
        { lines: [69, 73], what: '(c) Detect each press of the override.', why: 'On a 1→0 edge the desired PB9 state becomes the opposite of what PB9 shows now — “toggle the LED ON or OFF with each press”.', register: 'GPIOB_IDR bit 10, GPIOB_ODR bit 9' },
        { lines: [75, 78], what: 'Override held → manual state, auto disabled.', why: 'While PB10 is held the LDR is ignored.' },
        { lines: [79, 83], what: '(b) Otherwise automatic lighting.', why: 'Dark → PB9 ON, bright → PB9 OFF. Releasing PB10 therefore resumes automatic control immediately.' },
        { lines: [85, 85], what: '10 ms loop.', why: 'Samples switches every 10 ms: debounces the override edge.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start.', kind: 'start' },
    { label: 'Configure clocks and pins', detail: 'GPIOA/B/C and ADC1 clocks; PA0 and PB10 inputs with pull-up; PA1 analog; PC13 and PB9 outputs.', kind: 'init' },
    { label: 'Start ADC1 channel 1', detail: 'Continuous mode: SQR3 = 1, CONT, ADON, SWSTART.', kind: 'init' },
    { label: 'Door pressed? → PC13', detail: 'PA0 = 0 → PC13 ON, else OFF.', kind: 'decision' },
    { label: 'Read LDR if EOC', detail: 'adcData = ADC1->DR.', kind: 'io' },
    { label: 'Override held?', detail: 'New press → toggle manual state. Held → PB9 = manual.', kind: 'decision' },
    { label: 'Else auto: dark → PB9 ON', detail: 'Compare with the threshold; delay 10 ms; repeat.', kind: 'loop' },
  ],
  sim: { id: 'adc', preset: 'ldr' },
  exam: {
    viva: [
      { q: 'Which ADC channel is the LDR on and how is it selected?', a: 'Channel 1 (PA1); ADC1->SQR3 = 1 makes it the first (only) conversion.' },
      { q: 'How does the program know the door is open?', a: 'PA0 has a pull-up, so it reads 0 while the switch is pressed — that is treated as “door open”.' },
      { q: 'Why is edge detection used on PB10 but not on PA0?', a: 'PA0 follows the level (LED while pressed). PB10 must toggle once per press, so only the press edge may change the manual state.' },
      { q: 'How would you demonstrate the ADC value to the examiner?', a: 'Run in debug, add adcData to the Watch window, cover/uncover the LDR and show the value crossing the threshold as PB9 switches.' },
    ],
    registerQs: [
      { q: 'List every register written to configure the ADC.', a: 'RCC_APB2ENR bit 8, GPIOA_MODER bits 3:2, ADC_SMPR2, ADC_CCR, ADC_CR1, ADC_CR2 (CONT, ADON, SWSTART), ADC_SQR3 = 1, ADC_SQR1 = 0.' },
      { q: 'How is PC13 turned on?', a: 'GPIOC->ODR &= ~(1U<<13) — the LED is active-low.' },
    ],
    pinQs: [{ q: 'PA0 is also the potentiometer pin on the kit. Is that a conflict here?', a: 'No: in this design PA0 is only the digital door switch; the analog input is PA1 (LDR).' }],
    outputQs: [
      { q: 'It is dark and PB10 is pressed once and held. What does PB9 do?', a: 'PB9 was ON (auto, dark); the press toggles it OFF and it stays OFF while held; on release it returns ON.' },
      { q: 'Door switch held, room bright, override not pressed?', a: 'PC13 ON, PB9 OFF.' },
    ],
    debugQs: [
      { q: 'PB9 turns on in bright light instead of darkness. Fix?', a: 'Your divider is wired the other way; change IS_DARK to (v) < LDR_THRESHOLD, or tune the threshold from the observed adcData values.' },
      { q: 'adcData never changes. Causes?', a: 'Wrong channel in SQR3, PA1 not analog, ADC1 clock missing, or SWSTART not set.' },
    ],
    errors: ['Selecting channel 0 (pot) instead of 1.', 'Treating PC13 as active-high.', 'Toggling PB9 on every loop while PB10 is held (no edge detection).', 'Blocking on EOC before reading the switches (still works, but slower response).'],
    modifications: ['Latched override: each press toggles override mode on/off instead of hold-to-override.', 'Add hysteresis to the LDR threshold.', 'Use EXTI for the door switch.', 'Show the LDR value on the I²C LCD.'],
    explainToExaminer: md`“PA0 and PB10 are inputs with pull-ups, PA1 is analog for the LDR on ADC channel 1, PC13 and PB9 are outputs. The ADC runs continuously; each loop I copy the latest result if EOC is set. The door switch directly controls PC13 (active-low). If the override button is held, the automatic control is ignored and PB9 shows the state chosen at the last press — every new press flips it. Otherwise PB9 follows the LDR: dark turns it on. A 10 ms SysTick delay paces the loop and debounces the switches.”`,
  },
  memorise: {
    essentials: ['clocks: AHB1ENR bits 0,1,2; APB2ENR bit 8', 'PA0, PB10: MODER 00, PUPDR 01', 'PA1: MODER |= 3<<2', 'PC13, PB9: MODER 01; PC13 OFF = ODR 1', 'ADC: SMPR2, CCR=0, CR1=0, CR2=0, CONT, SQR3=1, SQR1=0, ADON, SWSTART', 'door: if (!(GPIOA->IDR & 1)) PC13 ON else OFF', 'if (ADC1->SR & 2) adcData = ADC1->DR;', 'override edge → manual = !PB9; held → PB9 = manual; else PB9 = dark'],
    patterns: [{ name: 'Non-blocking ADC read', code: 'if (ADC1->SR & (1U << 1)) adcData = ADC1->DR;' }],
    skeleton: md`init (clocks, 2 inputs, PA1 analog, 2 outputs, ADC ch1 continuous)
while(1){
   door → PC13
   read ADC if EOC
   override edge → toggle manual
   held ? PB9 = manual : PB9 = (dark ? ON : OFF)
   delay 10 ms
}`,
  },
  topics: ['adc-stm32', 'leds-switches', 'gpio-registers', 'pull-resistors'],
};

export default p;
