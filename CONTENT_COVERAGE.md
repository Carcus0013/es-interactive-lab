# Content coverage report

23CSE304 Embedded Systems. Generated from the platform content by `npm run coverage:doc` — do not edit by hand.

## Totals

| Item | Count |
|---|---|
| Syllabus units | 3 |
| Topic pages (each with Learn, In depth, Visualise, Exam prep and Revise & quiz tabs) | 40 |
| Topics from course material / textbook / additional coverage | 30 / 3 / 7 |
| Practical experiments | 18 |
| Interactive simulations | 26 |
| Animated / interactive diagrams | 28 |
| PYQ papers / questions (all solved) | 6 / 28 |
| Question-bank items (all generated practice questions) | 533 |

Status meanings: **Course material** = taught in the supplied lectures or labs; **Prescribed textbook** = in the syllabus and taught from Valvano because no slides were supplied; **ADDITIONAL SYLLABUS COVERAGE** = in the syllabus text but with no supplied lecture, so the platform teaches it from the textbook and standard references and labels it as such.

## Unit 1: Embedded systems & the ARM Cortex-M4

> Basics of Embedded Systems – Definition, Characteristics, Architecture of Microprocessors: General definitions of computers, microprocessors, microcontrollers, and digital signal processors. Introduction to ARM Cortex M4 Microcontroller – Architecture – Registers – Reset, Memory. Operating modes – Addressing modes and operands. Instructions for memory access, logical, arithmetic, and shift operations. Introduction to Thumb ISA.

| Topic | Status | Sources | Practicals | Simulations | PYQs | Bank items |
|---|---|---|---|---|---|---|
| What is an embedded system? | Course material | Day02-Introduction to Embedded System.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | — | — | MT25A-2, MT26S1-1, MT26S2-1 | 11 |
| Characteristics of embedded systems | Course material | Day03-Introduction to Embedded System.pptx | — | — | MT25A-2, MT26S1-1, MT26S2-1 | 12 |
| Types and applications of embedded systems | Course material | Day02-Introduction to Embedded System.pptx | — | — | MT26S2-1 | 11 |
| Computers, microprocessors, microcontrollers and DSPs | Course material | Day02-Introduction to Embedded System.pptx, Day04_Lecture01_CortexM4Processor_Introduction.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | — | — | MT25A-1, MT25B-1 | 11 |
| Arm architecture and processor families | Course material | Day04_Lecture01_CortexM4Processor_Introduction.pptx, Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx | — | — | — | 10 |
| Cortex-M4 features and block diagram | Course material | Day04_Lecture01_CortexM4Processor_Introduction.pptx, Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx | — | pipeline | — | 12 |
| Low-power modes and debug interfaces | Course material | Day04_Lecture01_CortexM4Processor_Introduction.pptx | — | — | — | 11 |
| Cortex-M4 registers: R0–R15, LR, PC and xPSR | Course material | Day04_Lecture01_CortexM4Processor_Introduction.pptx, Lecture01_CortexM4Processor_Introduction.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | — | cpu | MT25A-4, MT25B-2, MT25B-3, MT25B-4, MT26S2-2 | 14 |
| Reset sequence, memory map and buses | Course material | Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano), rm0368 (STM32F401 reference manual), Bit_banding_notes.pdf | P05 | memmap | MT25A-5a, MT25B-5a, MT26S1-4a, MT26S2-4a | 10 |
| Operating modes and privilege levels | Course material | Lecture01_CortexM4Processor_Introduction.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano), pm0214 (Cortex-M4 programming manual) | — | modes | MT25A-3, MT26S1-2 | 12 |
| Bit-banding | Course material | Day06_LED blink using bit band concepts.pptx, Bit_banding_notes.pdf (Sumesh A K), Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx | P05 | bitband, memmap | MT25A-5a, MT25B-5a, MT26S1-4a, MT26S2-4a | 18 |
| Addressing modes and operands | Prescribed textbook | EMBEDDED_TEXTBOOK.pdf (Valvano) | — | cpu | — | 10 |
| Memory-access instructions and the stack | Prescribed textbook | EMBEDDED_TEXTBOOK.pdf (Valvano) | — | cpu | MT25B-3, MT26S2-2 | 12 |
| Logical, shift and arithmetic instructions | Prescribed textbook | EMBEDDED_TEXTBOOK.pdf (Valvano), Day04_Lecture01_CortexM4Processor_Introduction.pptx | — | cpu, bits | MT25A-4, MT25B-4 | 13 |
| Introduction to the Thumb instruction set | Course material | Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx, Day04_Lecture01_CortexM4Processor_Introduction.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | — | cpu | MT25B-1 | 12 |

## Unit 2: GPIO & I/O interfacing

> GPIO programming- GPIO Configuration, Interfacing IO devices and its type – LEDs, Switches, Buzzer, Seven Segment Display, LCD, Analog I/O interfacing - DAC and ADC, PWM, Real-Time Clock, I/O synchronization

| Topic | Status | Sources | Practicals | Simulations | PYQs | Bank items |
|---|---|---|---|---|---|---|
| STM32F401CCU6, the Black Pill and clock gating (RCC) | Course material | STM32F401CCU6_Intro_GPIO.pptx, Day05_Lecture01_GPIO_Configuration_Registers.pptx, Emb-kit Manual.docx, stm32f401cc.pdf (datasheet) | P01 | gpio | — | 11 |
| GPIO configuration registers | Course material | Day05_Lecture01_GPIO_Configuration_Registers.pptx, STM32_Register_Level_Programming.docx, rm0368 | P01, P02, P03, P04, P05, P06, P12, P15, P16, P17, P18 | gpio, bits | LE1S1-1, LE1S2-1, MT25A-6, MT25B-5b, MT25B-6, MT26S1-4a, MT26S1-5, MT26S2-4a, MT26S2-5 | 19 |
| Setting, clearing and toggling bits in a 32-bit register | Course material | Day05_Set_Or_Reset a bit in 32 bit register.pptx, STM32_Register_Level_Programming.docx | P01, P02, P04 | bits | LE1S1-1, LE1S2-1, MT25A-5b, MT25B-5b, MT26S1-4b, MT26S2-4b | 12 |
| Pull-up and pull-down resistors | Course material | Day05_Lecture02_Pull-Up and Pull down.pptx, Day05_Lecture01_GPIO_Configuration_Registers.pptx, stm32f401cc.pdf | P03, P04, P10, P15, P16, P17, P18 | pullup, gpio | LE1S1-1, LE1S2-1, MT25A-6, MT25B-6, MT26S1-5, MT26S2-5 | 12 |
| Interfacing LEDs and switches | Course material | Lab_1 … Lab_4 programs and Emb-kit Manual.docx, STM32F401CCU6_Intro_GPIO.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | P01, P02, P03, P04, P07, P15, P16, P17, P18 | gpio, debounce | LE1S1-1, LE1S2-1, MT25A-6, MT25B-6, MT26S1-5, MT26S2-5 | 16 |
| Buzzer interfacing | ADDITIONAL SYLLABUS COVERAGE | Syllabus (Day01 slide 4) | — | pwm | — | 12 |
| Seven-segment display | ADDITIONAL SYLLABUS COVERAGE | Syllabus (Day01 slide 4), EMBEDDED_TEXTBOOK.pdf (Valvano) | — | sevenseg | — | 12 |
| LCD interfacing (16×2 HD44780 over I²C) | Course material | I2C_LCD_example.c, Day10_8_I2C_Introduction.pptx | P14 | lcd, i2c | — | 11 |
| Analog-to-digital conversion: principles and ADC types | Course material | Day08_2_Analog_to_Digital_Converter_ADC.pptx, Day08_1_STM32F401CCU6_ADC.pptx | P06, P07 | adc, sar, flashadc | — | 18 |
| The STM32F401 ADC peripheral | Course material | Day08_1_STM32F401CCU6_ADC.pptx, Lab_5 and Lab_7 ADC programs | P06, P07, P11, P14, P17, P18 | adc, sar | MT25A-6, MT25B-6, MT26S1-5, MT26S2-5 | 19 |
| Digital-to-analog conversion (DAC) | ADDITIONAL SYLLABUS COVERAGE | EMBEDDED_TEXTBOOK.pdf (Valvano), Syllabus (Day01 slide 4) | — | dac, pwm | — | 12 |
| Pulse-width modulation (PWM) | ADDITIONAL SYLLABUS COVERAGE | EMBEDDED_TEXTBOOK.pdf (Valvano), Syllabus (Day01 slide 4), Mid-term PYQs Aug 2025 Set B / Aug 2026 Set 2 | — | pwm, timer | — | 16 |
| Real-time clock (RTC) | ADDITIONAL SYLLABUS COVERAGE | Syllabus (Day01 slide 4), rm0368 | — | rtc | — | 11 |
| I/O synchronisation | Course material | EMBEDDED_TEXTBOOK.pdf (Valvano), Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx, Day08_1_STM32F401CCU6_ADC.pptx | P03, P08, P11, P13 | iosync | — | 11 |

## Unit 3: Interrupts, timers & serial communication

> Interrupt structure - Vector interrupt table, Interrupt service routines – Edge triggered, Timer … (truncated on the syllabus slide; the NVIC lecture continues it as “Timer Periodic Interrupts, NVIC”. UART and I²C were taught in the same lecture series.)

| Topic | Status | Sources | Practicals | Simulations | PYQs | Bank items |
|---|---|---|---|---|---|---|
| Interrupts, exceptions and the vector table | Course material | Day10_1_Nested Vectored Interrupt Controller.pptx, Day04_Lecture01_CortexM4Processor_Introduction.pptx, Day10_4_Systick_Timer_With_Interupt.pptx, Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx | P09, P10, P11 | interrupt | — | 11 |
| NVIC: priorities, nesting and exception handling | Course material | Day10_1_Nested Vectored Interrupt Controller.pptx, Day04_Lecture01_CortexM4Processor_Introduction.pptx, pm0214 | P09, P10, P11 | interrupt | — | 16 |
| Edge-triggered GPIO interrupts (EXTI) | Course material | Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx, GPIO_Interupts.c, EMBEDDED_TEXTBOOK.pdf (Valvano) | P10 | exti | — | 15 |
| SysTick timer | Course material | Day09_Systick_Timer.pptx, Systick_without_interupt.txt, EMBEDDED_TEXTBOOK.pdf (Valvano) | P02, P08, P09, P15, P16 | systick | MT26S1-3, MT26S2-3 | 20 |
| Timer periodic interrupts with SysTick | Course material | Day10_4_Systick_Timer_With_Interupt.pptx, EMBEDDED_TEXTBOOK.pdf (Valvano) | P09 | systick, interrupt | MT26S1-3, MT26S2-3 | 11 |
| General-purpose timers (prescaler, auto-reload, update interrupt) | ADDITIONAL SYLLABUS COVERAGE | EMBEDDED_TEXTBOOK.pdf (Valvano), rm0368 | — | timer, pwm | — | 14 |
| Serial communication fundamentals | Course material | Day10_5_UART_TX.pptx | P12, P13 | serialmodes | — | 11 |
| UART / USART on the STM32F401 | Course material | Day10_5_UART_TX.pptx, Day10_6_UART_RX & TX.pptx, USART and Lab_7 | P12, P13 | uart | — | 21 |
| The I²C protocol | Course material | Day10_8_I2C_Introduction.pptx, Day10_09_I2C.pptx, I2C.pptx, Lecture07_I2C PRESENTATION.PPT | P14 | i2c | — | 16 |
| Configuring the STM32 I²C peripheral | Course material | Day10_8_I2C_Introduction.pptx, I2C_LCD_example.c | P14 | i2c, lcd | — | 14 |
| SPI (Serial Peripheral Interface) | ADDITIONAL SYLLABUS COVERAGE | Day10_5_UART_TX.pptx, Case_Study_Guidelines_26.pdf, EMBEDDED_TEXTBOOK.pdf (Valvano) | — | spi | — | 13 |

## Practical lab

| # | Experiment | Code | Sources | Simulation |
|---|---|---|---|---|
| P01 | Turn ON an LED (PC13, PC14, PB9) | Verbatim, with corrected version | EXP_1_LED_PC_13.txt, EXP_2_LED_PC_14.txt, EXP_3_LED_PB_9.txt, STM32F401CCU6_Intro_GPIO.pptx (slides 8–14) | gpio |
| P02 | LED blinking with a software delay | Verbatim, with corrected version | blink.txt, LED_Blinking.txt, Emb-kit Manual.docx (program 2 (PB9 + PC14) and a PC13 variant with a 720000 OFF delay) | gpio |
| P03 | User key (PA0) controls the on-board LED (PC13) | Verbatim, with corrected version | Button_LED.txt, Emb-kit Manual.docx (program 3), Day05_Lecture01_GPIO_Configuration_Registers.pptx (slides 15, 28, 31) | gpio |
| P04 | Switches S1/S2 control LED1/LED2 | Verbatim, with corrected version | switch interface PB10_LED_interface_PC14.docx, Emb-kit Manual.docx (program 4 (two switches, two LEDs)) | gpio |
| P05 | LED blink using bit-banding | Verbatim | Day06_LED blink using bit band concepts.pptx (slides 10–18 (program shown as images)), Bit_banding_notes.pdf (PC13 alias 0x424102B4) | bitband |
| P06 | ADC: read the potentiometer on PA0 (channel 0) | Verbatim, with corrected version | ADC_Potentiometer_reading.docx, Day08_1_STM32F401CCU6_ADC.pptx (Experiment 4.1, slides 38–43) | adc |
| P07 | ADC threshold control: potentiometer / LDR → LED1 | Verbatim, with corrected version | ADC_with_LED_control_using_potentiometer.c.txt, ADC_LDR_interfacing_LED_Control.txt, Day08_1_STM32F401CCU6_ADC.pptx (Experiments 4.2, 4.3 (slides 44–52)) | adc |
| P08 | SysTick delay by polling: toggle LED1 every second | Verbatim | Systick_without_interupt.txt, Day09_Systick_Timer.pptx (slides 6–12) | systick |
| P09 | SysTick periodic interrupt: toggle LED1 every second | Verbatim | Day10_4_Systick_Timer_With_Interupt.pptx (slide 15 (code shown as an image; transcribed)), Systick_Timer_With_Interupt.pptx | systick |
| P10 | External (EXTI) interrupts: S2 turns LED1 ON, S1 turns it OFF | Verbatim, with corrected version | GPIO_Interupts.c, Day10_2_Nested Vectored Interrupt Controller (NVIC).pptx (Experiment slides 18–21) | exti |
| P11 | ADC end-of-conversion interrupt (pot → LED1) | Verbatim | pot_int.txt, Day08_1_STM32F401CCU6_ADC.pptx (slides 14–15 (ADC interrupts, poll/interrupt/DMA)) | adc |
| P12 | UART transmit: a character and a string (USART2, 115200 baud) | Verbatim, with corrected version | uart_TX.txt, UART_String_TX.txt, Day10_5_UART_TX.pptx (slides 36–49) | uart |
| P13 | UART receive and echo (USART2, 9600 baud) | Verbatim | RX_TX.c, stm32f4_usart2_config.txt (same program (“Send and Receive”)), Day10_6_UART_RX & TX.pptx | uart |
| P14 | I²C 16×2 LCD showing the potentiometer value | Verbatim, with corrected version | I2C_LCD_example.c, Day10_8_I2C_Introduction.pptx (register configuration) | lcd |
| P15 | Lab Evaluation 1 (Set 1): Photo Storage System — solution | Solution written for the platform | set_1.docx (question only — no program supplied; this solution is written for the platform) | debounce |
| P16 | Lab Evaluation 1 (Set 2): Smart Vehicle Parking — solution | Solution written for the platform | set_2.docx (question only — solution written for the platform) | debounce |
| P17 | Mid-term Part B: Smart Lighting with Door Sensor and Manual Override — solution | Solution written for the platform | 23CSE304_MIDTERM_PYQS.pdf (Aug 2025 Set A, Q6), Mid -Term Qp_Slot_1_SET1.pdf (Aug 2026 Slot 1 Set 1, Q5) | adc |
| P18 | Mid-term Part B: Smart Fan Speed and Status Indicator — solution | Solution written for the platform | 23CSE304_MIDTERM_PYQS.pdf (Aug 2025 Set B, Q6), Mid -Term Qp_Slot_1_SET2.pdf (Aug 2026 Slot 1 Set 2, Q5) | adc |

Every experiment page has the eight required sections: details, circuit, code, line-by-line explanation, animated flowchart, simulation, practical-exam preparation and memorisation aids.

## Previous-year questions

| Paper | Source file | Questions | Marks |
|---|---|---|---|
| Mid-Term Aug 2025, Set A | EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf | 1, 2, 3, 4, 5(a), 5(b), 6 | 50 |
| Mid-Term Aug 2025, Set B | EMBEDDED_PYQ'S/23CSE304_MIDTERM_PYQS.pdf | 1, 2, 3, 4, 5(a), 5(b), 6 | 50 |
| Lab Evaluation 1, Set 1 | EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_1.docx | 1 | 25 |
| Lab Evaluation 1, Set 2 | EMBEDDED_LAB_MATERIALS/LAB_EVAL_1_PAPERS/set_2.docx | 1 | 25 |
| Mid-Term Aug 2026, Slot 1 Set 1 | EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET1.pdf | 1, 2, 3, 4(a), 4(b), 5 | 50 |
| Mid-Term Aug 2026, Slot 1 Set 2 | EMBEDDED_PYQ'S/Mid -Term Qp_Slot_1_SET2.pdf | 1, 2, 3, 4(a), 4(b), 5 | 50 |

| Question | Marks | Kind | Topics |
|---|---|---|---|
| MT25A-1 | 2 | theory | mpu-mcu-dsp |
| MT25A-2 | 4 | theory | es-intro, es-characteristics |
| MT25A-3 | 3 | theory | operating-modes |
| MT25A-4 | 3 | theory | m4-registers, alu-instructions |
| MT25A-5a | 4 | mixed | bit-banding, memory-map |
| MT25A-5b | 4 | mixed | bit-manipulation |
| MT25A-6 | 30 | program | adc-stm32, leds-switches, gpio-registers, pull-resistors |
| MT25B-1 | 2 | theory | mpu-mcu-dsp, thumb-isa |
| MT25B-2 | 4 | theory | m4-registers |
| MT25B-3 | 3 | theory | m4-registers, memory-instructions |
| MT25B-4 | 3 | theory | m4-registers, alu-instructions |
| MT25B-5a | 4 | mixed | bit-banding, memory-map |
| MT25B-5b | 4 | mixed | bit-manipulation, gpio-registers |
| MT25B-6 | 30 | program | adc-stm32, leds-switches, gpio-registers, pull-resistors |
| LE1S1-1 | 25 | program | leds-switches, gpio-registers, pull-resistors, bit-manipulation |
| LE1S2-1 | 25 | program | leds-switches, gpio-registers, pull-resistors, bit-manipulation |
| MT26S1-1 | 6 | theory | es-characteristics, es-intro |
| MT26S1-2 | 3 | theory | operating-modes |
| MT26S1-3 | 3 | numerical | systick, systick-interrupt |
| MT26S1-4a | 4 | mixed | bit-banding, memory-map, gpio-registers |
| MT26S1-4b | 4 | mixed | bit-manipulation |
| MT26S1-5 | 30 | program | adc-stm32, leds-switches, gpio-registers, pull-resistors |
| MT26S2-1 | 6 | theory | es-characteristics, es-intro, es-types |
| MT26S2-2 | 3 | theory | m4-registers, memory-instructions |
| MT26S2-3 | 3 | numerical | systick, systick-interrupt |
| MT26S2-4a | 4 | mixed | bit-banding, memory-map, gpio-registers |
| MT26S2-4b | 4 | mixed | bit-manipulation |
| MT26S2-5 | 30 | program | adc-stm32, leds-switches, gpio-registers, pull-resistors |

## Simulations

Each simulation is a simplified model and says so on its page.

| Id | Title | Unit | What the model does not reproduce |
|---|---|---|---|
| cpu | Cortex-M4 register machine | 1 | Executes a subset of ~30 Thumb-2 instructions with correct 32-bit arithmetic and NZCV flag rules. It does not model pipeline timing, exceptions, alignment faults or instruction encodings. |
| pipeline | 3-stage pipeline | 1 | Idealised one-cycle-per-stage pipeline. Real Cortex-M4 timing adds wait states, multi-cycle instructions and branch speculation. |
| memmap | Memory map explorer | 1 | Addresses are taken from RM0368 (STM32F401) and the Cortex-M4 memory map. Region sizes are drawn to a logarithmic scale. |
| bitband | Bit-band alias calculator | 1 | Exact calculation per the Cortex-M4 bit-band formula. Validates that the address lies in a bit-band region. |
| modes | Thread / Handler mode & privilege | 1 | State machine of the Armv7-M mode/privilege rules (CONTROL.nPRIV, CONTROL.SPSEL, exception entry/return). No real instructions are executed. |
| bits | Register bit-manipulation lab | 2 | Exact 32-bit unsigned arithmetic, identical to what the C compiler generates. |
| gpio | GPIO board simulator | 2 | Register-accurate for MODER, OTYPER, PUPDR, IDR, ODR and BSRR on the lab-kit pins, including clock gating via RCC_AHB1ENR. Electrical behaviour (current, voltage levels) is simplified to logic levels. |
| pullup | Pull-up / pull-down & floating inputs | 2 | Floating input is shown as random noise around the threshold band; real floating behaviour depends on leakage and coupling. |
| debounce | Switch bounce & debouncing | 2 | Bounce pattern is randomly generated (typical 1–10 ms). Debounce algorithm is the same one you would write in C. |
| sevenseg | Seven-segment display | 2 | Logic-level model of segment lines a–g + dp. Current-limiting and multiplexing timing are described, not simulated electrically. |
| lcd | 16×2 LCD (HD44780 over I²C) | 2 | Implements the HD44780 instruction set used in the lab (clear, home, entry mode, display control, set DDRAM address, write data) and the 4-bit PCF8574 byte sequence. Character set is ASCII only; CGRAM is not modelled. |
| adc | ADC: sampling, quantisation, conversion | 2 | Ideal ADC (no offset, gain or noise error). Uses code = floor(Vin × 2ⁿ / Vref), clipped to 2ⁿ − 1, and also shows the 4095/3.3 convention used in the lecture. |
| sar | SAR ADC step-by-step | 2 | Ideal binary-search SAR with an ideal internal DAC — the same procedure as the worked example in the lecture. |
| flashadc | Flash (parallel) ADC | 2 | Ideal comparators and equal ladder resistors. |
| dac | DAC & waveform synthesis | 2 | Ideal DAC: Vout = code × Vref / 2ⁿ. Output filtering is not modelled. (Additional syllabus coverage.) |
| pwm | PWM generator | 2 | Uses the STM32 timer relations f = f_clk / ((PSC+1)(ARR+1)) and duty = CCR/(ARR+1) for edge-aligned PWM mode 1. LED brightness and motor speed are proportional to average voltage (simplified). |
| rtc | Real-time clock prescaler chain | 2 | STM32 RTC prescaler arithmetic (PREDIV_A, PREDIV_S). Calendar rollover is simplified. (Additional syllabus coverage.) |
| iosync | I/O synchronisation: polling vs interrupts | 2 | Abstract timeline model of CPU time. Latency figures are illustrative, not cycle-accurate. |
| systick | SysTick timer | 3 | Register-accurate STK_CTRL/LOAD/VAL behaviour (count LOAD→0, reload, COUNTFLAG set on 1→0, cleared on read). Counting is slowed down so you can watch it. |
| timer | General-purpose timer (PSC / ARR) | 3 | STM32 TIMx up-counting mode with PSC and ARR. Counting is slowed down for visibility. (Additional syllabus coverage.) |
| interrupt | Interrupt & NVIC simulator | 3 | Event-level model of the NVIC: priority comparison, pre-emption, pending/active states, 8-word stacking, tail-chaining and late arrival. Cycle counts (12-cycle entry, 6-cycle tail-chain) are the nominal Cortex-M4 figures without wait states. |
| exti | EXTI edge-triggered interrupt | 3 | Register-accurate SYSCFG_EXTICR, EXTI_IMR/RTSR/FTSR/PR and IRQ grouping for STM32F401. |
| serialmodes | Serial vs parallel; simplex / half / full duplex | 3 | Conceptual animation. |
| uart | UART transmitter & receiver | 3 | Bit-exact UART framing (LSB first, idle high, optional parity, 1/2 stop bits) and exact USART_BRR arithmetic for OVER8 = 0/1. Time is slowed down so you can watch individual bits. |
| i2c | I²C bus | 3 | Bit-exact I²C framing (MSB first, data valid while SCL high, START/STOP while SCL high). Clock stretching and arbitration are not modelled. |
| spi | SPI shift-register exchange | 3 | Bit-exact SPI mode 0–3 timing (MSB first). (Additional syllabus coverage.) |

## Diagrams

`es-block`, `mcu-vs-mpu`, `m4-block`, `register-bank`, `xpsr`, `pipeline`, `memmap`, `bitband-map`, `modes`, `kit-pinout`, `gpio-pin`, `pull-resistors`, `pushpull-od`, `led-circuits`, `adc-block`, `sar-loop`, `seven-seg`, `lcd-i2c`, `systick-block`, `nvic-vector`, `stack-frame`, `tail-chain`, `exti-map`, `uart-frame`, `uart-connection`, `i2c-bus`, `i2c-timing`, `spi-bus`

## Question bank by type

| Type | Unit 1 | Unit 2 | Unit 3 | Total |
|---|---|---|---|---|
| Multiple choice | 75 | 70 | 55 | 200 |
| True / false | 9 | 8 | 9 | 26 |
| Fill in the blank | 7 | 8 | 8 | 23 |
| Short answer | 50 | 44 | 37 | 131 |
| Long answer | 30 | 28 | 22 | 80 |
| Numerical | 7 | 13 | 12 | 32 |
| Programming | 1 | 3 | 4 | 8 |
| Debugging | 0 | 7 | 6 | 13 |
| Register-based | 0 | 6 | 6 | 12 |
| Circuit-based | 0 | 5 | 3 | 8 |

## Known gaps in the supplied material

1. The Unit 3 syllabus text is cut off on the official slide; the rest was inferred from the NVIC lecture deck and the lecture sequence.
2. No end-semester papers, online-quiz papers or Lab Evaluation 2 papers were supplied, so most Unit 3 topics (beyond SysTick) have no PYQ evidence.
3. No lectures were supplied for buzzer, seven-segment display, DAC, PWM, RTC, general-purpose timers or SPI; those pages are labelled ADDITIONAL SYLLABUS COVERAGE.
4. Instruction-set topics (addressing modes, instruction classes) have no slides and are taught from the prescribed textbook.
5. The kit's LDR divider orientation is not documented; solutions keep the darkness comparison in one clearly marked macro.
6. Mistakes found in the supplied code and question papers are kept verbatim and flagged next to a corrected version (see PROJECT_ANALYSIS.md, section 4).
