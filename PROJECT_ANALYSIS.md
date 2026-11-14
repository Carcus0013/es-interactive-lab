# PROJECT ANALYSIS — 23CSE304 Embedded Systems (Amrita School of Computing)

Source folder analysed: `C:\Users\HP\Claude_Code\ES` (recursive, 101 files, ~291 MB).
Extraction method: `.pptx`/`.docx` parsed as Office Open XML (slide text + speaker notes), `.PPT` (legacy binary) via string extraction, PDFs via `pdftotext -layout`. Code that existed only as **slide images** (SysTick-interrupt program, bit-band LED program, I²C CCR derivation) was read from the extracted images. Raw text extracts live in `materials-analysis/text/` and a machine-readable inventory in `materials-analysis/inventory.json`.

> **Reference HTML:** the brief mentions an "uploaded reference HTML". No HTML file exists anywhere in the ES folder, so the platform's organisation is designed from the brief itself.

---

## 1. File inventory

### 1.1 Course administration
| File | Type | Content |
|---|---|---|
| `EMBEDDED_THEORY_MATERIALS/Day01-23CSE304 CourseOverview.pptx` | 12 slides | **Official syllabus** (Units 1–3), text/reference books, COs, evaluation plan, case-study rules |
| `EMBEDDED_CASE_STUDY/Case_Study_Guidelines_26.pdf` | 2 pp | Case-study rules 2026-27 (STM32F401, wireless link, ADC/GPIO, NVIC, display, SPI/I²S/I²C/UART), rubric |
| `EMBEDDED_CASE_STUDY/FINAL_23CSE304_ES_CASE_STUDY.pdf` | ~10 pp | Topic-allocation list (**contains other students' names/roll numbers — not reproduced in the platform**; only used to confirm typical project themes) |

### 1.2 Theory lectures (`EMBEDDED_THEORY_MATERIALS/`, with duplicates in the root folder)
| Deck | Slides | Topic | Notes |
|---|---|---|---|
| Day02-Introduction to Embedded System | 26 | Definition, MCU components, on-board components, structure, types, applications, digital camera | root copy = older version |
| Day03-Introduction to Embedded System | 23 | 11 characteristics of ES with tables (pacemaker, airbag ACU, safety standards) | root copy differs in one word ("diskless" vs "riskless") |
| Day04_Lecture01_CortexM4Processor_Introduction | 34 | Arm families, Cortex-M table, interrupts (maskable/NMI), low-power modes (WFI/WFE, sleep-on-exit), M4 features, JTAG/SWD, MPU, block diagram, pipeline, NVIC, WIC, bus, registers, xPSR | rich speaker notes |
| Lecture01_CortexM4Processor_Introduction | 27 | Older version; adds **Programmer's model: Thread/Handler mode & privilege levels** | |
| Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture | 30–31 | A/R/M comparison table, Cortex-M traits, ARMv7-M, Thumb-2, DSP/SIMD/MAC, FPU, memory map, bit-band regions, MPU (8-region example), caches/prefetch, AHB-Lite, bus matrix, bit-banding intro | |
| Day05_Lecture01_GPIO_Configuration_Registers (+ GPIO_Configuration_Registers, Lab_3 copy) | 32–34 | GPIO register set, RCC, AHB1ENR, MODER/OTYPER/OSPEEDR/PUPDR/IDR/ODR/BSRR with code | register tables are images |
| Day05_Lecture02_Pull-Up and Pull down | 7 | Floating inputs, logic thresholds, pull-up/pull-down | |
| Day05_Set_Or_Reset a bit in 32 bit register | 2 | `|=` / `&= ~` worked in binary | |
| Day06_LED blink using bit band concepts | 18 | Bit-banding, alias formula, PC13 bit-band LED blink program (code in images) | |
| `Bit_banding_notes.pdf` (Sumesh A K) | 4 pp | Bit-band regions, PC13 worked example → **0x424102B4**, exercises | root copy = different render, same text |
| Day08_1_STM32F401CCU6_ADC (+ STM32F401CCU6_ADC (1)) | 53 / 28 | STM32 ADC: 12-bit SAR, 19 channels, regular/injected, single/continuous/scan/discontinuous, triggers, polling/interrupt/DMA, registers CR1/CR2/SR/DR/SQRx/SMPRx/CCR, resolution, Exp 4.1–4.3 (pot, pot+LED, LDR+LED) | |
| Day08_2_Analog_to_Digital_Converter_ADC | 29 | Sampling, quantisation, encoding, resolution table, comparator, Flash, SAR (worked 3-bit example), dual-slope, sigma-delta, pipelined | |
| Day09_Systick_Timer (+ Systick_Timer-2) | 13 | SysTick features, clock tree (HCLK or HCLK/8), CTRL/LOAD/VAL, reload formula, init sequence, 1 s toggle | |
| Day10_4_Systick_Timer_With_Interupt (+ Lab_6 copy) | 16 | Maskable vs NMI, SysTick ISR, full interrupt program (image) | |
| Day10_1_Nested Vectored Interrupt Controller | 15 | Interrupt basics, 256 exceptions, nesting, NVIC duties, **exception entry steps, stacking of 8 registers, EXC_RETURN**, tail-chaining, late arrival | |
| Day10_2_NVIC (+ Nested Vectored Interrupt Controller (NVIC), Lab_7 copy) | 22 | **Unit-3 syllabus line**, why GPIO interrupts, APB2ENR/SYSCFG, EXTICR1-4, IMR, RTSR/FTSR, NVIC enable, PR, experiment PA6/PB10 → PC14 | |
| Day10_5_UART_TX (+ UART_TX, Lab_7/USART copies) | 50 / 27 | Serial vs parallel, simplex/duplex, sync/async, UART vs USART, packet (start/data/parity/stop), baud, STM32 USART features, TX procedure, TXE/TC, oversampling ×16/×8, **BRR worked examples**, PA2 AF7 setup, FT232RL/HW-417, Docklight | |
| Day10_6_UART_RX & TX | 23 | PA2/PA3, AFRL setup, RXNE/TXE echo | |
| Day10_8_I2C_Introduction | 49 | I²C basics, frames, START/STOP, addressing, R/W, ACK/NACK, Sm/Fm, block diagram, I²C vs UART table, CR1/CR2/OAR1/DR/SR1/SR2, OTYPER open-drain, **CCR = (Tr+Tw)/Tpclk1 = 80**, TRISE = 17 | |
| Day10_09_I2C, I2C.pptx | 27 / 17 | Condensed I²C decks | |
| Lecture07_I2C PRESENTATION.PPT | legacy | Philips history, bus terminology (F/S/C/D/P), 100k/400k/3.4M modes, address+R/W byte, ACK semantics | |
| STM32F401CCU6_Intro_GPIO | 14 | STM32F401 features list, PC13 LED driver (active-low) | |
| STM32_Register_Level_Programming.docx | 25 k chars | Register masking explained, software delay, GPIO register descriptions, BSRR/BRR, LCKR, HAL intro | Some content is copied from Nucleo/Discovery/F1 sources (PA5, PD12) — **contains errors** (IDR/ODR "0 = High"), flagged in platform |

### 1.3 Laboratory (`EMBEDDED_LAB_MATERIALS/`)
| Folder | Files | Content |
|---|---|---|
| Lab_1 | EXP_1_LED_PC_13, EXP_2_LED_PC_14, EXP_3_LED_PB_9 (.txt), Emb-kit Manual.docx, keil5-stm32-notes.docx (screenshots only), STM32F401CCU6_Intro_GPIO.pptx | LED ON programs; **kit pin map**; 4 extra programs in kit manual |
| Lab_2 | blink.txt, LED_Blinking.txt | PC13 and PB9 blink |
| Lab_3 | Button_LED.txt, GPIO_Configuration_Registers.pptx | PA0 key → PC13 |
| Lab_4 | switch interface PB10_LED_interface_PC14.docx | PB10 → PC14 |
| Lab_5 | ADC_Potentiometer_reading.docx, ADC_with_LED_control_using_potentiometer.c.txt, ADC_LDR_interfacing_LED_Control.txt | ADC experiments |
| Lab_6 | Systick_without_interupt.txt, Systick_Timer_With_Interupt.pptx, manuals | SysTick polling / interrupt |
| Lab_7 | GPIO_Interupts.c, pot_int.txt, stm32f4_usart2_config.txt, NVIC/UART decks | EXTI, ADC EOC interrupt, USART2 |
| USART | EXP_7 uart_TX.txt, UART_String_TX.txt; EXP_8 RX_TX.c (+ RX_TX.txt = unrelated ThingsBoard/Tailscale notes) | UART experiments |
| I2C | I2C_LCD_example.c | I²C1 + PCF8574 + HD44780 LCD + ADC |
| LAB_EVAL_1_PAPERS | set_1.docx, set_2.docx | **Lab Evaluation-1 question papers** (Photo storage, Parking) |
| Data_Sheet | stm32f401cc.pdf (datasheet), RM0368 (reference manual), PM0214 (Cortex-M4 programming manual), DUI0553 (Cortex-M4 Generic User Guide), WeAct Black Pill V1.2 / V3.0 schematics | Primary hardware references |

### 1.4 PYQs (`EMBEDDED_PYQ'S/`)
| File | Papers inside |
|---|---|
| `23CSE304_MIDTERM_PYQS.pdf` | Mid-Term **Aug 2025 – Set A** and **Aug 2025 – Set B** (labelled here A/B; the PDF has no set labels) |
| `Mid -Term Qp_Slot_1_SET1.pdf` | Mid-Term **Aug 2026 – Slot 1 Set 1** |
| `Mid -Term Qp_Slot_1_SET2.pdf` | Mid-Term **Aug 2026 – Slot 1 Set 2** (header says "B.Tech Degree Examinations") |

### 1.5 Textbook
`EMBEDDED_TEXTBOOK/EMBEDDED_TEXTBOOK.pdf` — J. W. Valvano, *Embedded Systems: Introduction to ARM Cortex-M Microcontrollers*, Vol. 1, 5th ed. (2014) — the **prescribed text book**. Ch. 3 matches Unit 1 word-for-word (Registers, Reset, Memory, Operating Modes, Addressing Modes & Operands, Memory-access/Logical/Shift/Arithmetic instructions). Ch. 9.1 = I/O synchronisation, 10.2 = DAC, 8.7 = PWM. (Examples are for TI TM4C, not STM32.)

### 1.6 Duplicates
The root folder duplicates many theory decks (some byte-identical, some older revisions). The `EMBEDDED_THEORY_MATERIALS` version was treated as canonical; differing root copies were diffed — differences are cosmetic (one word, one extra empty slide).

---

## 2. Identified syllabus (from Day01 Course Overview, slide 3–4)

**Course:** 23CSE304 Embedded Systems (3-0-2-4), V Sem B.Tech CSE, 2025-26 Odd. (Slide 2 still shows the old code 19CSE303.) Pre-requisite: Computer Organization & Architecture.

- **UNIT 1:** Basics of Embedded Systems – Definition, Characteristics, Architecture of Microprocessors: general definitions of computers, microprocessors, microcontrollers and digital signal processors. Introduction to ARM Cortex-M4 microcontroller – Architecture – Registers – Reset, Memory. Operating modes – Addressing modes and operands. Instructions for memory access, logical, arithmetic and shift operations. Introduction to Thumb ISA.
- **UNIT 2:** GPIO programming – GPIO configuration, interfacing I/O devices and its types – LEDs, Switches, Buzzer, Seven Segment Display, LCD, Analog I/O interfacing – DAC and ADC, PWM, Real-Time Clock, I/O synchronization.
- **UNIT 3:** Interrupt structure – Vector interrupt table, Interrupt service routines – Edge triggered, Timer *(text box truncated in the source slide)*.
  - The Day10_2 NVIC deck title slide continues it: "…Edge triggered, **Timer Periodic Interrupts, NVIC**".
  - Lectures delivered after NVIC in the same "Day10" series cover **UART (TX, RX&TX)** and **I²C**; the case study requires UART/SPI/I²C. These are therefore treated as Unit 3 content *as taught* (inference recorded here, not stated in the syllabus slide).

**Course outcomes:** CO1 fundamentals & architecture; CO2 GPIO & peripherals in Embedded C; CO3 timers, interrupts, debugging; CO4 design an ES with an ARM processor.

**Evaluation:** Mid-term 20, CAT quizzes 10, Lab evaluation 25 (10 + 15), Case study 15, **End-semester 30 (50-mark, 2-hour paper)**.

---

## 3. Unit-wise topic breakdown and source mapping

Legend — **C** = covered by faculty lecture/lab material, **T** = covered only by the prescribed textbook, **A** = *ADDITIONAL SYLLABUS COVERAGE* (in syllabus or required by case study, not in supplied lectures; written from external knowledge and labelled so).

### Unit 1 — Embedded basics & ARM Cortex-M4
| # | Topic | Status | Sources |
|---|---|---|---|
| 1.1 | What is an embedded system — definition, components, MCU vs board | C | Day02 |
| 1.2 | Characteristics of embedded systems | C | Day03 |
| 1.3 | Types and applications of embedded systems | C | Day02 |
| 1.4 | Computers, microprocessors, microcontrollers, DSPs; RISC vs CISC | C+T | Day02, L01, Valvano 3.5 |
| 1.5 | Arm architecture & processor families (A/R/M, ARMv7-M) | C | Day04 L01/L02 |
| 1.6 | Cortex-M4 features & block diagram (pipeline, NVIC, WIC, MPU, bus, debug, FPU/DSP) | C | Day04 L01/L02 |
| 1.7 | Low-power modes & debug interfaces (WFI/WFE, sleep-on-exit, JTAG/SWD) | C | Day04 L01 |
| 1.8 | Cortex-M4 register set (R0–R15, MSP/PSP, LR, PC, xPSR, PRIMASK/FAULTMASK/BASEPRI/CONTROL) | C | Day04 L01 |
| 1.9 | Reset sequence & memory map (endianness, buses, MPU) | C+T | L02, Valvano 3.1.2–3.1.3 |
| 1.10 | Operating modes & privilege levels | C+T | Lecture01, Valvano 3.1.4 |
| 1.11 | Bit-banding | C | Day06, L02, Bit-band notes |
| 1.12 | Addressing modes & operands | T | Valvano 3.3.2 |
| 1.13 | Memory-access instructions | T | Valvano 3.3.3 |
| 1.14 | Logical, shift & arithmetic instructions (+ flags) | T | Valvano 3.3.4–3.3.6, L01 (flags) |
| 1.15 | Thumb / Thumb-2 ISA | C+T | L01, L02, Valvano |

### Unit 2 — GPIO & I/O interfacing
| # | Topic | Status | Sources |
|---|---|---|---|
| 2.1 | STM32F401CCU6, Black Pill & lab kit; RCC clock gating | C | Intro_GPIO, Day05 L01, Kit manual |
| 2.2 | GPIO configuration registers | C | Day05 L01, Register-Level doc |
| 2.3 | Register bit manipulation (set/clear/toggle, RMW, BSRR) | C | Day05 Set/Reset, Register-Level doc |
| 2.4 | Pull-up / pull-down resistors, open-drain vs push-pull | C | Day05 L02, Day05 L01 |
| 2.5 | Interfacing LEDs & switches (active-low/high, debouncing) | C | Labs 1–4, Kit manual |
| 2.6 | Buzzer interfacing | **A** | syllabus only |
| 2.7 | Seven-segment display | **A** | syllabus only (Valvano Ch.1 mention) |
| 2.8 | LCD (HD44780) via I²C backpack | C (lab code) | I2C_LCD_example.c |
| 2.9 | ADC fundamentals & ADC types | C | Day08_2 |
| 2.10 | STM32F401 ADC peripheral & registers | C | Day08_1 |
| 2.11 | DAC | **A** / T | Valvano 10.2 |
| 2.12 | PWM | **A** / T | Valvano 8.7 |
| 2.13 | Real-Time Clock | **A** | syllabus only |
| 2.14 | I/O synchronisation (blind-cycle, busy-wait, interrupt, periodic polling, DMA) | C+T | Day10_2 slide 2, Day08_1 slide 15, Valvano 9.1 |

### Unit 3 — Interrupts, timers & serial communication
| # | Topic | Status | Sources |
|---|---|---|---|
| 3.1 | Interrupt & exception fundamentals, vector table | C | Day10_1, L01 |
| 3.2 | NVIC: priority, nesting, exception entry/exit, tail-chaining, late arrival | C | Day10_1 |
| 3.3 | Edge-triggered GPIO interrupts (EXTI/SYSCFG) | C | Day10_2, Lab_7 |
| 3.4 | SysTick timer (polling) | C | Day09 |
| 3.5 | SysTick periodic interrupts | C | Day10_4 |
| 3.6 | General-purpose timers (PSC/ARR) & timer PWM | **A** | not in lectures |
| 3.7 | Serial communication fundamentals | C | Day10_5 |
| 3.8 | UART / USART on STM32 (frame, baud, BRR, oversampling, registers) | C | Day10_5, Day10_6 |
| 3.9 | I²C protocol | C | Day10_8, Day10_09, Lecture07 |
| 3.10 | STM32 I²C peripheral configuration (CR1/CR2/CCR/TRISE/SR1/SR2) | C | Day10_8, I2C_LCD_example.c |
| 3.11 | SPI | **A** | named in UART deck & case study only |

---

## 4. Practical experiments & programs found

| ID | Experiment | Program file(s) | Peripherals |
|---|---|---|---|
| P01 | LED ON — PC13 / PC14 / PB9 | EXP_1/2/3 | RCC, GPIO |
| P02 | LED blinking (PC13, PB9, PB9+PC14 alternate) | blink.txt, LED_Blinking.txt, Kit manual | GPIO, software delay |
| P03 | User key PA0 → LED PC13 | Button_LED.txt, Kit manual | GPIO input, PUPDR |
| P04 | Switch PB10 → LED PC14; two switches → two LEDs | Lab_4 docx, Kit manual | GPIO |
| P05 | LED blink using bit-banding | Day06 slides (image code) | Bit-band alias |
| P06 | ADC potentiometer reading (PA0, ch0) | ADC_Potentiometer_reading.docx | ADC1 |
| P07 | ADC threshold → LED (pot ch0, LDR ch1) | ADC_with_LED…, ADC_LDR… | ADC1, GPIO |
| P08 | SysTick 1 Hz toggle (polling COUNTFLAG) | Systick_without_interupt.txt | SysTick |
| P09 | SysTick 1 Hz toggle (interrupt) | Day10_4 slide 15 (image code) | SysTick, exception |
| P10 | GPIO external interrupts PA6/PB10 → PC14 | GPIO_Interupts.c | SYSCFG, EXTI, NVIC |
| P11 | ADC end-of-conversion interrupt | pot_int.txt | ADC1, NVIC |
| P12 | UART transmit (char, string) | uart_TX.txt, UART_String_TX.txt | USART2 TX |
| P13 | UART receive & echo | RX_TX.c, stm32f4_usart2_config.txt | USART2 RX/TX |
| P14 | I²C LCD showing potentiometer value | I2C_LCD_example.c | I2C1, PCF8574, HD44780, ADC1 |
| P15 | Lab Eval-1 Set 1 — Photo Storage System | *question only* → solution written | GPIO, counters |
| P16 | Lab Eval-1 Set 2 — Smart Parking System | *question only* → solution written | GPIO, counters |

**Lab kit pin map (Emb-kit Manual):** LED1 = PC14, LED2 = PB9 (extension board, active-high), switches S1 = PB10, S2 = PA6, POT = PA0 (ADC ch0), LDR = PA1 (ADC ch1), on-board USER LED = PC13 (**active-low**: cathode on PC13), USER KEY = PA0. USART2 TX/RX = PA2/PA3 (AF7). I²C1 SCL/SDA = PB6/PB7 (AF4).

### Issues found in supplied code (preserved as-is in the platform; corrected versions shown separately)
1. `EXP_1/2/3` — `main()` has no `while(1)`; it works only because the C runtime traps after `main` returns.
2. Kit manual dual-switch program — stray `[` before a comment (syntax error); `MODER |= (0U<<20)` is a **no-op** (OR-ing zero) — input mode works only because the reset value is already 00.
3. `LED_Blinking.txt` — comment "26th 1 and 27th 0" is wrong (bits 18/19 for PB9).
4. `Button_LED.txt` / kit manual — LED is **ON while key is released** and turns OFF when pressed (pull-up + active-low LED); the comments imply the opposite.
5. UART TX programs include `stm32f446xx.h` (STM32F446 header) instead of `stm32f4xx.h` for the F401 kit.
6. `GPIO_Interupts.c` — `EXTI->PR |= …` (read-modify-write on a write-1-to-clear register can clear other pending lines); no debouncing.
7. `ADC_LDR_interfacing` — comment says "channel 0" while it configures channel 1 (code correct).
8. `I2C_LCD_example.c` — no NACK (AF) handling (hangs if LCD absent); `%u` used with `int`; `delay_ms` is uncalibrated.
9. `STM32_Register_Level_Programming.docx` — IDR/ODR tables list "0 = High, 1 = Low" (inverted, copied error); examples target Nucleo-F411 (PA5) and F4-Discovery (PD12), not the course kit.
10. PYQ Aug 2025 Set A Q5(a) calls `0x4002001C` the "output data register"; per RM0368 the ODR offset is 0x14 (0x1C is LCKR). The alias calculation is unaffected.
11. Day08_1 slide 37 writes "3.3/2¹² = 3.3/4095"; 2¹² = 4096 (both conventions explained in the platform).

---

## 5. Available PYQs

| Paper | Part A (20) | Part B (30) |
|---|---|---|
| Mid-Term Aug 2025 Set A | MCU vs MPU (smart home/PC) [2]; ES architecture for wearable [4]; Thread vs Handler, unprivileged→privileged [3]; N/Z/C/V flags [3]; bit-band bit 5 @ 0x4002001C [4]; clear bit 5 vs `REG=0` [4] | Smart Lighting with Door Sensor & Manual Override (PA0, PB10, LDR PA1, PC13/PC14/PB9) |
| Mid-Term Aug 2025 Set B | RISC vs CISC (smartwatch/desktop) [2]; Cortex-M4 core registers [4]; LR in subroutine calls [3]; PSR contents & flags [3]; bit-band bit 6 @ 0x40020014 [4]; set bit 6 vs `REG=(1<<6)` [4] | Smart Fan Speed & Status Indicator (PA6, POT ch0, PB10, PC13/PC14/PB9) |
| Mid-Term Aug 2026 Slot 1 Set 1 | Washing machine as ES + characteristics [6]; Thread vs Handler [3]; SysTick reload 1 ms @ 84 MHz/8 [3]; GPIOA_ODR + bit-band bit 7 [4]; clear bit 7 vs `REG=0` [4] | Smart Lighting (PA0, PB10, LDR, PC13, PB9) |
| Mid-Term Aug 2026 Slot 1 Set 2 | Automobile ES + characteristics [6]; LR [3]; SysTick reload 1 ms @ 16 MHz/8 [3]; GPIOB_ODR + bit-band bit 4 [4]; set bit 4 vs `REG=0x10` [4] | Smart Fan (as 2025 B) |
| Lab Evaluation-1 Set 1 | — | Photo Storage System (25 marks) |
| Lab Evaluation-1 Set 2 | — | Smart Vehicle Parking (25 marks) |

**Not available:** any **end-semester** paper, CAT quiz papers, Lab Evaluation-2 papers. Units 2 (ADC theory, DAC, PWM, RTC) and 3 (NVIC, UART, I²C) have **no PYQ evidence**; the platform marks their importance from lecture emphasis only.

**Observed PYQ frequency (4 theory papers):** bit-banding alias calculation 4/4; bit set/clear vs direct assignment 4/4; Thread/Handler & privilege 2/4; LR 2/4; PSR/flags 2/4; SysTick reload 2/4; ES characteristics via application 2/4; MCU vs MPU / RISC vs CISC / core registers / ES architecture 1/4 each. Part B is always a GPIO + ADC register-level program.

---

## 6. Important diagrams (to reproduce in exams)
Embedded-system block diagram; MCU internal block diagram; Cortex-M4 block diagram; register bank (R0–R15 + special); xPSR bit layout; 3-stage pipeline; memory map with bit-band regions & alias regions; bit-band mapping; GPIO pin structure / MODER bit-pairs; pull-up/pull-down circuits; push-pull vs open-drain; LED active-low/high circuits; switch with pull-up; ADC block diagram; SAR ADC loop; flash ADC; quantisation staircase; SysTick block diagram (CLKSOURCE mux → STCVR, reload, COUNTFLAG); NVIC + vector table; exception stack frame (8 registers); tail-chaining/late-arrival timelines; EXTI line mapping (EXTICR); UART frame; UART TX/RX cross connection; I²C bus with pull-ups; I²C START/STOP and data-valid timing; I²C write/read frames.

## 7. Microcontrollers & hardware platforms
- **STM32F401CCU6** (Arm Cortex-M4F, 84 MHz max, 256 KB Flash, 64 KB SRAM) on **WeAct Black Pill** V1.2 / V3.0 (STM32F401CEU6 variant schematic also supplied). Default clock in all lab code: **HSI 16 MHz**.
- Lab extension board: 2 LEDs, 2 switches, potentiometer, LDR.
- Interfaces used: FT232RL / HW-417 USB-TTL (UART, Docklight terminal), PCF8574 I²C backpack + 16×2 HD44780 LCD.
- IDE: Keil µVision 5 with CMSIS headers (`stm32f4xx.h`).
- Mentioned for comparison only: Arduino Uno, ESP32, TI TM4C (textbook), Nucleo-F411RE / F4-Discovery (register doc).

## 8. Missing or unclear information
1. Unit 3 syllabus text is truncated in the official slide; completion inferred from the NVIC deck and the lecture sequence.
2. No end-semester PYQs; no CAT quiz or Lab Eval-2 papers.
3. No lecture material for buzzer, seven-segment display, DAC, PWM, RTC, general-purpose timers, SPI → *ADDITIONAL SYLLABUS COVERAGE*.
4. Unit-1 ISA topics (addressing modes, instruction classes) have no slides — sourced from the prescribed textbook (Valvano Ch. 3).
5. Register bit-field tables in most decks are screenshots from RM0368; the platform re-derives them from the supplied RM0368/PM0214 PDFs.
6. The LDR divider orientation on the kit is not documented; the lab program treats *ADC > threshold* as the "LED ON" condition. Solutions make the comparison direction a single, clearly marked macro.
7. `keil5-stm32-notes.docx` contains only screenshots (no extractable text).
8. `USART/EXP_8_UART_RX/RX_TX.txt` is unrelated (ThingsBoard/Tailscale IoT setup notes).
