import type { Unit } from '../types';

// Verbatim syllabus text from EMBEDDED_THEORY_MATERIALS/Day01-23CSE304 CourseOverview.pptx (slides 3–4).
export const COURSE = {
  code: '23CSE304',
  name: 'Embedded Systems',
  credits: '3-0-2-4',
  school: 'Amrita School of Computing, Amrita Vishwa Vidyapeetham',
  semester: 'V Sem B.Tech CSE',
  textbook: 'Jonathan W. Valvano, “Embedded Systems: Introduction to ARM Cortex-M Microcontrollers”, 2016 (5th ed. supplied).',
  references: [
    'Furber S. B., “ARM System-on-Chip Architecture”, Pearson, 2000.',
    'Lutenberg, Gomez, Pernia, “A Beginner’s Guide to Designing Embedded System Applications on Arm Cortex-M Microcontrollers”, Arm Education Media, 2022.',
    'Joseph Yiu, “System-on-Chip Design with Arm Cortex-M Processors”, Arm Education Media, 2019.',
  ],
  outcomes: [
    ['CO1', 'Understand the fundamentals, functions, and architecture of embedded systems.'],
    ['CO2', 'Develop applications making use of GPIOs and peripheral units using Embedded C.'],
    ['CO3', 'Develop applications for the usage of Timers, Interrupts, and Debugging of embedded applications.'],
    ['CO4', 'Design an embedded system using an ARM processor.'],
  ] as [string, string][],
  evaluation: [
    ['Mid-term exam', '20'],
    ['Continuous assessment – theory (online quizzes)', '10'],
    ['Continuous assessment – lab evaluations 1 & 2', '25'],
    ['Continuous assessment – case study', '15'],
    ['End-semester exam (50-mark paper, 2 hours)', '30'],
  ] as [string, string][],
};

export const UNITS: Unit[] = [
  {
    id: 1,
    title: 'Embedded systems & the ARM Cortex-M4',
    syllabus:
      'Basics of Embedded Systems – Definition, Characteristics, Architecture of Microprocessors: General definitions of computers, microprocessors, microcontrollers, and digital signal processors. Introduction to ARM Cortex M4 Microcontroller – Architecture – Registers – Reset, Memory. Operating modes – Addressing modes and operands. Instructions for memory access, logical, arithmetic, and shift operations. Introduction to Thumb ISA.',
    blurb: 'What an embedded system is, and how the Cortex-M4 inside your STM32 is organised: registers, memory, modes, bit-banding and the Thumb instruction set.',
  },
  {
    id: 2,
    title: 'GPIO & I/O interfacing',
    syllabus:
      'GPIO programming- GPIO Configuration, Interfacing IO devices and its type – LEDs, Switches, Buzzer, Seven Segment Display, LCD, Analog I/O interfacing - DAC and ADC, PWM, Real-Time Clock, I/O synchronization',
    blurb: 'Register-level GPIO on the STM32F401, LEDs and switches, displays, the ADC and other analog I/O, and how software synchronises with devices.',
  },
  {
    id: 3,
    title: 'Interrupts, timers & serial communication',
    syllabus:
      'Interrupt structure - Vector interrupt table, Interrupt service routines – Edge triggered, Timer … (truncated on the syllabus slide; the NVIC lecture continues it as “Timer Periodic Interrupts, NVIC”. UART and I²C were taught in the same lecture series.)',
    blurb: 'Exceptions, the NVIC and vector table, edge-triggered EXTI interrupts, SysTick, and the UART and I²C peripherals used in the lab.',
  },
];
