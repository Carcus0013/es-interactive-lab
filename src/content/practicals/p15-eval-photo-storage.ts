import type { Practical } from '../../types';
import { md } from '../md';

export const PHOTO_CODE = md`#include "stm32f4xx.h"

#define MAX_PHOTOS  3

/* ---------- 1 ms delay using SysTick (polling COUNTFLAG) ---------- */
void delay_ms(uint32_t ms)
{
    SysTick->LOAD = 16000 - 1;          /* 1 ms at 16 MHz HSI          */
    SysTick->VAL  = 0;
    SysTick->CTRL = 5;                  /* enable, CPU clock, no IRQ   */
    while (ms--) {
        while (!(SysTick->CTRL & (1U << 16))) { }   /* COUNTFLAG       */
    }
    SysTick->CTRL = 0;
}

/* ---------- blink an active-high LED 'times' times, end OFF ---------- */
void blink(GPIO_TypeDef *port, uint32_t pin, uint32_t times)
{
    for (uint32_t i = 0; i < times; i++) {
        port->ODR |=  (1U << pin);      /* ON  */
        delay_ms(200);
        port->ODR &= ~(1U << pin);      /* OFF */
        delay_ms(200);
    }
}

int main(void)
{
    uint32_t photos = 0;                /* number of stored photos     */
    uint32_t fullAlarm = 0;             /* 1 -> PC13 blinks            */
    uint32_t prevUp = 1, prevDown = 1, prevDel = 1;
    uint32_t tick = 0;

    /* clocks for ports A, B, C */
    RCC->AHB1ENR |= (1U << 0) | (1U << 1) | (1U << 2);

    /* inputs with pull-up: PA6 (S2 upload), PB10 (S1 download), PA0 (KEY delete) */
    GPIOA->MODER &= ~((3U << 12) | (3U << 0));
    GPIOB->MODER &= ~(3U << 20);
    GPIOA->PUPDR = (GPIOA->PUPDR & ~((3U << 12) | (3U << 0))) | (1U << 12) | (1U << 0);
    GPIOB->PUPDR = (GPIOB->PUPDR & ~(3U << 20)) | (1U << 20);

    /* outputs: PB9 (upload LED), PC14 (download LED), PC13 (memory-full LED) */
    GPIOB->MODER = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);
    GPIOC->MODER = (GPIOC->MODER & ~((3U << 28) | (3U << 26))) | (1U << 28) | (1U << 26);

    GPIOB->ODR &= ~(1U << 9);           /* PB9 OFF                     */
    GPIOC->ODR &= ~(1U << 14);          /* PC14 OFF                    */
    GPIOC->ODR |=  (1U << 13);          /* PC13 OFF (active-low)       */

    while (1) {
        uint32_t up   = (GPIOA->IDR >> 6)  & 1U;   /* 0 = pressed */
        uint32_t down = (GPIOB->IDR >> 10) & 1U;
        uint32_t del  =  GPIOA->IDR        & 1U;

        /* ---- upload: falling edge on PA6 ---- */
        if (prevUp == 1 && up == 0) {
            if (photos < MAX_PHOTOS) {
                photos++;
                blink(GPIOB, 9, 5);     /* success: blink PB9 five times */
            } else {
                fullAlarm = 1;          /* full: count unchanged, alarm  */
            }
        }

        /* ---- download: falling edge on PB10 ---- */
        if (prevDown == 1 && down == 0) {
            if (photos > 0) {
                blink(GPIOC, 14, 5);    /* photo available: blink PC14   */
            }
        }

        /* ---- delete: falling edge on PA0 ---- */
        if (prevDel == 1 && del == 0) {
            if (photos > 0) {
                photos--;
                if (fullAlarm) {        /* was full -> space available   */
                    fullAlarm = 0;
                    GPIOC->ODR |= (1U << 13);   /* PC13 OFF            */
                }
            }
        }

        prevUp = up;  prevDown = down;  prevDel = del;

        /* ---- memory-full indicator: toggle PC13 every 250 ms ---- */
        tick++;
        if (fullAlarm && (tick % 25 == 0)) {
            GPIOC->ODR ^= (1U << 13);
        }

        delay_ms(10);                   /* 10 ms loop = switch debounce  */
    }
}`;

const p: Practical = {
  id: 'p15-eval-photo-storage',
  order: 15,
  title: 'Lab Evaluation 1 (Set 1): Photo Storage System — solution',
  unit: 2,
  objective: 'Upload (PA6), download (PB10) and delete (PA0) photos in a 3-photo store using push buttons, with LED indications, using direct register programming.',
  components: ['STM32F401CCU6 Black Pill + extension board', 'S2 (PA6) upload, S1 (PB10) download, USER KEY (PA0) delete', 'PB9 upload LED, PC14 download LED, PC13 memory-full LED'],
  connections: [
    { pin: 'PA6', to: 'S2 — upload', mode: 'Input, pull-up' },
    { pin: 'PB10', to: 'S1 — download', mode: 'Input, pull-up' },
    { pin: 'PA0', to: 'USER KEY — delete', mode: 'Input, pull-up' },
    { pin: 'PB9', to: 'Upload status LED', mode: 'Output (active-high)' },
    { pin: 'PC14', to: 'Download status LED', mode: 'Output (active-high)' },
    { pin: 'PC13', to: 'Memory-full LED (on-board)', mode: 'Output (active-low)' },
  ],
  expected: md`| Action | Condition | Result |
|---|---|---|
| Press S2 | photos < 3 | photos + 1, PB9 blinks 5×, then OFF |
| Press S2 | photos = 3 | count unchanged, PC13 starts blinking continuously |
| Press S1 | photos ≥ 1 | PC14 blinks 5× (count unchanged — downloading does not remove the photo) |
| Press S1 | photos = 0 | nothing |
| Press KEY | photos ≥ 1 | photos − 1; if PC13 was blinking, it stops |
| Press KEY | photos = 0 | nothing |`,
  sources: [{ file: 'EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_1.docx', detail: 'question only — no program supplied; this solution is written for the platform' }],
  circuit: {
    leds: [{ pin: 'PB9', label: 'Upload LED' }, { pin: 'PC14', label: 'Download LED' }, { pin: 'PC13', label: 'Memory full', activeLow: true }],
    switches: [{ pin: 'PA6', label: 'S2 upload', pull: 'up' }, { pin: 'PB10', label: 'S1 download', pull: 'up' }, { pin: 'PA0', label: 'KEY delete', pull: 'up' }],
  },
  programs: [
    {
      id: 'sol',
      title: 'Solution (register level)',
      file: 'photo_storage.c — written for this platform',
      authored: true,
      code: PHOTO_CODE,
      explain: [
        { lines: [3, 3], what: 'Capacity constant.', why: 'The store holds at most three photos.' },
        { lines: [6, 15], what: 'delay_ms using SysTick polling.', why: 'Accurate millisecond delays (LOAD = 15 999 → 1 ms at 16 MHz); COUNTFLAG is polled once per millisecond.', register: 'STK_LOAD, STK_VAL, STK_CTRL, COUNTFLAG (bit 16)' },
        { lines: [18, 26], what: 'blink(): ON 200 ms, OFF 200 ms, n times.', why: 'Both status LEDs are active-high, so ON = set the ODR bit; the loop ends with the LED OFF, as required.', register: 'GPIOx_ODR' },
        { lines: [30, 33], what: 'State variables.', why: '«photos» is the storage count; «fullAlarm» remembers the memory-full condition; «prev…» hold the last switch levels for edge detection; «tick» counts 10 ms loops for the PC13 blink.' },
        { lines: [36, 36], what: 'Clocks for GPIOA, GPIOB, GPIOC.', register: 'RCC_AHB1ENR bits 0, 1, 2', why: 'All three ports are used.' },
        { lines: [39, 42], what: 'Three inputs with pull-ups.', why: 'PA6 (MODER/PUPDR bits 13:12), PA0 (bits 1:0), PB10 (bits 21:20). Pressed = 0.', register: 'GPIOA/GPIOB MODER = 00, PUPDR = 01' },
        { lines: [45, 46], what: 'Three outputs.', why: 'PB9 (bits 19:18), PC14 (29:28), PC13 (27:26) = 01.', register: 'GPIOB/GPIOC MODER' },
        { lines: [48, 50], what: 'All LEDs OFF at start.', why: 'PC13 is active-low, so OFF means ODR13 = 1.' },
        { lines: [53, 55], what: 'Read the three switches.', why: 'Shift the IDR bit down to bit 0 → 1 released, 0 pressed.', register: 'GPIOA_IDR bits 6, 0; GPIOB_IDR bit 10' },
        { lines: [58, 65], what: 'Upload on a press (falling edge).', why: 'Edge detection (previous 1, now 0) counts one press once. If space remains, increment and blink PB9 5×; otherwise keep the count and raise the alarm.' },
        { lines: [68, 72], what: 'Download on a press.', why: 'Only if at least one photo is stored; the count is not changed.' },
        { lines: [75, 83], what: 'Delete on a press.', why: 'Decrement if a photo exists; if the store had been full (alarm active), stop the alarm and switch PC13 off.' },
        { lines: [85, 85], what: 'Remember the levels for the next edge test.' , why: 'Without this, holding a button would repeat the action every loop.' },
        { lines: [88, 91], what: 'Memory-full blink.', why: 'Every 25 loops × 10 ms = 250 ms, PC13 toggles while the alarm is active — continuous blinking without blocking the buttons.', register: 'GPIOC_ODR bit 13' },
        { lines: [93, 93], what: '10 ms loop period.', why: 'Samples the switches every 10 ms, which also filters contact bounce (bounce lasts ≲ 10 ms).' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Variables: photos = 0, alarm = 0.', kind: 'start' },
    { label: 'Clocks, 3 inputs, 3 outputs', detail: 'Register set-up: the inputs get pull-ups and all LEDs start OFF.', kind: 'init' },
    { label: 'Read PA6, PB10, PA0', detail: 'Every 10 ms.', kind: 'loop' },
    { label: 'Upload pressed?', detail: 'photos < 3 → photos++, blink PB9 ×5; else alarm = 1.', kind: 'decision' },
    { label: 'Download pressed?', detail: 'photos > 0 → blink PC14 ×5.', kind: 'decision' },
    { label: 'Delete pressed?', detail: 'photos > 0 → photos−−; if alarm → stop, PC13 OFF.', kind: 'decision' },
    { label: 'Alarm → toggle PC13 every 250 ms', detail: 'Then delay 10 ms and repeat.', kind: 'loop' },
  ],
  sim: { id: 'debounce' },
  exam: {
    viva: [
      { q: 'Why is edge detection necessary for the upload button?', a: 'The loop runs every 10 ms; testing the level would upload a photo on every pass while the button is held. Counting only the 1→0 transition gives one upload per press.' },
      { q: 'How is debouncing achieved?', a: 'The switches are sampled only every 10 ms, so bounce transitions shorter than that are not seen as separate presses.' },
      { q: 'Does downloading change the photo count?', a: 'No — the question only requires PC14 to blink when at least one photo exists; the photo stays stored.' },
      { q: 'Why does PC13 use ODR = 1 for OFF?', a: 'It is the active-low on-board LED.' },
    ],
    registerQs: [
      { q: 'Which PUPDR values are written for PA0 and PA6?', a: 'Bits 1:0 = 01 and bits 13:12 = 01 (pull-up).' },
      { q: 'How does delay_ms produce 1 ms?', a: 'LOAD = 16000 − 1 at 16 MHz; one COUNTFLAG per 16 000 cycles = 1 ms.' },
    ],
    pinQs: [{ q: 'Give the input/output pins and their roles.', a: 'Inputs PA6 upload, PB10 download, PA0 delete; outputs PB9 upload LED, PC14 download LED, PC13 memory-full LED.' }],
    outputQs: [
      { q: 'Upload is pressed four times from empty. What happens?', a: 'Presses 1–3: PB9 blinks 5× each, count = 3. Press 4: count stays 3 and PC13 starts blinking continuously.' },
      { q: 'Then delete is pressed once.', a: 'Count = 2 and PC13 stops blinking (OFF).' },
    ],
    debugQs: [
      { q: 'One press of S2 uploads several photos. Why?', a: 'Level instead of edge detection, or no debounce.' },
      { q: 'PC13 is ON constantly instead of OFF at start.', a: 'It was cleared (0) at initialisation — for the active-low LED write 1 for OFF.' },
    ],
    errors: ['Missing GPIOB clock (S1/PB9 do nothing).', 'Counting levels instead of edges.', 'Letting the count exceed 3 or go below 0.', 'Treating PC13 as active-high.'],
    modifications: ['Start the PC13 blink as soon as the third photo is stored (alternative reading of the spec): set fullAlarm when photos becomes 3.', 'Show the count on PB9 as that many blinks when S1 is held.', 'Use EXTI interrupts for the three buttons.', 'Make the blinks non-blocking with SysTick interrupts.'],
    explainToExaminer: md`“I keep a counter of stored photos. The three switches are inputs with pull-ups, read every 10 ms; I act only on a press edge, which also debounces. Upload increments the count if it is below three and blinks PB9 five times; otherwise it raises a memory-full flag that toggles PC13 every 250 ms. Download blinks PC14 five times if at least one photo exists. Delete decrements the count and clears the memory-full flag. Delays are generated with SysTick by polling COUNTFLAG.”`,
  },
  memorise: {
    essentials: ['clocks A, B, C', 'inputs PA6/PB10/PA0 pull-up; outputs PB9/PC14/PC13', 'read: up = (GPIOA->IDR>>6)&1 …', 'edge: if (prev==1 && now==0)', 'upload: if (photos<3){photos++; blink(GPIOB,9,5);} else alarm=1;', 'download: if (photos>0) blink(GPIOC,14,5);', 'delete: if (photos>0){photos--; if(alarm){alarm=0; PC13 OFF;}}', 'if (alarm && ++tick%25==0) GPIOC->ODR ^= (1<<13); delay_ms(10);'],
    patterns: [
      { name: 'Edge detection', code: 'now = (GPIOx->IDR >> n) & 1U;\nif (prev && !now) { /* pressed */ }\nprev = now;' },
      { name: 'Blink n times', code: 'for (i = 0; i < n; i++) { ON; delay_ms(200); OFF; delay_ms(200); }' },
    ],
    skeleton: md`init clocks, pins, LEDs off
while(1){
  read 3 switches
  on upload edge   : count<3 ? (count++, blink PB9) : alarm=1
  on download edge : count>0 ? blink PC14
  on delete edge   : count>0 ? (count--, alarm=0, PC13 off)
  alarm blink PC13 ; delay 10 ms
}`,
  },
  topics: ['leds-switches', 'gpio-registers', 'pull-resistors', 'systick'],
};

export default p;
