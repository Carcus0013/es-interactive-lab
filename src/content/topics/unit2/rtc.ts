import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'rtc',
  unit: 2,
  order: 13,
  title: 'Real-time clock (RTC)',
  short: 'Keeping calendar time: the 32.768 kHz crystal, prescalers to 1 Hz, BCD time/date registers, backup power, alarms and wake-up.',
  status: 'additional',
  sources: [{ file: 'Syllabus (Day01 slide 4)', detail: 'Real-Time Clock listed in Unit 2; no lecture material supplied' }, { file: 'rm0368', detail: '§17 Real-time clock (external reading)' }],
  externalNote: md`Not covered by your slides or labs. Register names (RTC_TR, RTC_DR, PRER) follow the STM32F401 reference manual supplied in your Data_Sheet folder.`,
  keywords: ['RTC', 'real-time clock', '32.768 kHz', 'LSE', 'prescaler', 'PREDIV_A', 'PREDIV_S', 'BCD', 'calendar', 'alarm', 'wake-up', 'VBAT', 'backup domain', 'DS1307'],
  importance: 1,
  sims: ['rtc'],
  related: ['systick', 'gp-timers', 'i2c'],
  fundamentals: {
    what: md`A **real-time clock** is a low-power timer that keeps the time of day and calendar date (seconds, minutes, hours, day, month, year), usually from a **32.768 kHz** watch crystal, and keeps running from a backup battery when main power is off.`,
    why: md`Embedded systems often need real time, not just intervals: timestamps for data loggers, scheduled actions (irrigation at 6 am), alarms, and the date on a receipt — even after a power cut.`,
    problem: md`SysTick and general timers count clock cycles but stop in low-power modes and lose everything on reset; the RTC keeps accurate calendar time at µA current, survives resets, and can wake the MCU at a set time.`,
    how: md`32 768 = 2¹⁵, so dividing by 128 (asynchronous prescaler) and 256 (synchronous prescaler) gives exactly **1 Hz**. Each tick increments seconds; the RTC rolls over minutes, hours, days, months, leap years automatically and stores them in **BCD**. An alarm compares the time with a programmed value.`,
    where: md`Clocks, data loggers, smart meters, attendance systems, IoT devices that sleep for hours. Many projects use an external I²C RTC chip (DS1307 at address 0x68, DS3231) with its own coin cell.`,
  },
  detailed: md`
> [!additional]
> Syllabus topic without supplied lecture material.

## Clock chain (STM32 RTC)

$$
f_ck_apre = f_RTCCLK / (PREDIV_A + 1) = 32768 / 128 = 256 Hz
f_ck_spre = f_ck_apre / (PREDIV_S + 1) = 256 / 256 = 1 Hz
$$

The RTC clock can come from **LSE** (32.768 kHz crystal, most accurate), **LSI** (≈ 32 kHz internal RC, inaccurate) or HSE/divider.

## BCD storage

The time register holds each field as **binary-coded decimal**: 12:34:56 → hours 0x12, minutes 0x34, seconds 0x56. Each decimal digit occupies 4 bits, which makes display easy:

~~~c
uint8_t sec_bcd = 0x56;
uint8_t tens = sec_bcd >> 4;      // 5
uint8_t units = sec_bcd & 0x0F;   // 6
uint8_t sec = tens * 10 + units;  // 56
~~~

## Features

| Feature | Use |
|---|---|
| Calendar with leap-year handling | date/time keeping |
| Alarms A and B | interrupt at a given time |
| Periodic wake-up timer | wake from Stop/Standby every N seconds |
| Backup registers (powered by V_BAT) | keep a few words of data during power loss |
| Tamper detection and timestamp | security |
| Digital calibration | correct crystal error (ppm) |

The RTC lives in the **backup domain**: powered by V_BAT when V_DD is off, and protected from accidental writes (backup-domain write protection must be disabled before configuring it).

## Accuracy

A crystal error of 20 ppm = 20 × 10⁻⁶ × 86 400 s ≈ **1.7 s per day**. Wrong prescaler values give large errors (e.g. PREDIV_S = 255 with PREDIV_A = 126 → 1.0079 Hz → +11 min/day).

## External RTC over I²C (DS1307)

Write the register pointer (0x00) then read 7 bytes: seconds, minutes, hours, day, date, month, year — all BCD. This combines this topic with the I²C lab driver.
`,
  visual: md`
::sim{rtc}
`,
  exam: {
    definitions: [
      { term: 'Real-time clock', def: 'A low-power counter that maintains time of day and calendar, running from a backup supply when main power is off.' },
      { term: 'BCD', def: 'Binary-coded decimal: each decimal digit stored in its own 4 bits.' },
      { term: 'Backup domain', def: 'Part of the STM32 (RTC, backup registers, LSE) that can be powered by V_BAT when V_DD is removed.' },
    ],
    formulas: [
      { name: 'RTC 1 Hz tick', expr: 'f = f_LSE / ((PREDIV_A + 1)(PREDIV_S + 1))', example: '32768 / (128 × 256) = 1 Hz' },
      { name: 'Drift from crystal error', expr: 'drift/day = ppm × 10⁻⁶ × 86400 s', example: '20 ppm → 1.73 s/day' },
    ],
    frequent: ['Why 32.768 kHz?', 'Explain the RTC and its applications.'],
    mistakes: ['Using a general timer for calendar time across resets.', 'Forgetting BCD conversion when displaying.'],
    diagrams: ['Crystal → async prescaler → sync prescaler → calendar'],
    shortQs: [
      { q: 'Why are RTC crystals 32.768 kHz?', a: md`32 768 = 2¹⁵, so a 15-stage binary divider (or 128 × 256 prescalers) produces exactly 1 Hz; low frequency also means very low power.`, marks: 2 },
      { q: 'Convert the BCD value 0x47 to decimal minutes.', a: md`4 × 10 + 7 = 47 minutes.`, marks: 1 },
      { q: 'Give two applications of an RTC in embedded systems.', a: md`Timestamping logged sensor data; scheduled actions/alarms (e.g. watering at 6:00); waking a sleeping device periodically.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the working of a real-time clock in a microcontroller system, including clock source, prescalers, calendar registers and backup supply.', a: md`LSE crystal, PREDIV_A/PREDIV_S to 1 Hz with calculation, BCD calendar registers with rollover and leap years, alarms/wake-up, V_BAT backup domain, accuracy in ppm, external I²C RTC alternative.`, marks: 6 },
      { q: 'Design a data logger that records temperature every minute with a timestamp. Which peripherals would you use?', a: md`RTC (time + 1-minute wake-up alarm), ADC (temperature sensor), Flash/SD (storage), UART (download), low-power stop mode between samples; sequence of operations.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['32.768 kHz / 128 / 256 = 1 Hz.', 'Time/date stored in BCD.', 'Runs from V_BAT in the backup domain.', 'Alarms and periodic wake-up from low-power modes.'],
    takeaways: ['RTC = calendar time; SysTick/timers = intervals.'],
    mcqs: [
      { q: 'Standard RTC crystal frequency:', options: ['16 MHz', '32.768 kHz', '25 MHz', '1 MHz'], answer: 1, explain: '2¹⁵ Hz.' },
      { q: 'BCD 0x59 represents…', options: ['89', '59', '0x3B', '95'], answer: 1, explain: 'Digits 5 and 9.' },
      { q: 'What keeps the RTC running when main power is off?', options: ['SysTick', 'V_BAT backup supply', 'The ADC', 'The PLL'], answer: 1, explain: 'Backup domain.' },
      { q: 'PREDIV_A = 127 and PREDIV_S = 255 with LSE give…', options: ['256 Hz', '1 Hz', '128 Hz', '32 kHz'], answer: 1, explain: '32768/128/256.' },
      { q: '20 ppm crystal error drifts about…', options: ['1.7 s/day', '20 s/day', '1 min/day', '0.02 s/day'], answer: 0, explain: '20e-6 × 86400.' },
    ],
  },
};

export default topic;
