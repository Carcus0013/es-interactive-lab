import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'low-power-debug',
  unit: 1,
  order: 7,
  title: 'Low-power modes and debug interfaces',
  short: 'Run, sleep and deep sleep; WFI, WFE and sleep-on-exit; JTAG vs Serial Wire Debug.',
  status: 'course',
  sources: [{ file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 11–12, 15–19 and notes' }],
  keywords: ['sleep', 'deep sleep', 'WFI', 'WFE', 'sleep-on-exit', 'SCB', 'JTAG', 'SWD', 'SWDIO', 'SWCLK', 'breakpoint', 'watchpoint', 'DMIPS'],
  importance: 1,
  related: ['m4-features', 'interrupts-basics'],
  fundamentals: {
    what: md`Every Cortex-M microcontroller has at least three power modes — **run**, **sleep** and **deep sleep** — entered with the **WFI** (wait for interrupt) or **WFE** (wait for event) instructions. The **debug interface** (JTAG or the 2-wire **SWD**) lets a PC halt the core, read registers and memory, set breakpoints and program Flash.`,
    why: md`Battery devices spend most of their life waiting. Stopping clocks while there is nothing to do multiplies battery life. And without a debug port you could not download or single-step your program.`,
    problem: md`Low-power modes remove wasted energy during idle time; sleep-on-exit even avoids returning to «main()» between interrupts. SWD solves the pin-count problem of JTAG on small packages.`,
    how: md`WFI halts the CPU clock until an interrupt is pending; WFE sleeps unless the event register is set. Sleep keeps system, Flash and peripheral clocks running; deep sleep also stops the system clock, Flash and PLL. SWD uses SWDIO + SWCLK to reach the Debug Access Port inside the chip.`,
    where: md`Wearables, sensor nodes and remote controls sleep >99 % of the time. Every lab session uses SWD: the ST-Link in Keil talks to the Black Pill's SWD header.`,
  },
  detailed: md`
## Power modes (Day04 L01 slide 11)

| Mode | CPU clock | System clock, Flash, PLL | Peripherals | Wake-up |
|---|---|---|---|---|
| Run | on | on | on | — |
| Sleep | **halted** | on | on | any interrupt/event |
| Deep sleep | halted | **off** (PLL off, Flash powered down) | mostly off | WIC-enabled interrupts |

The choice between sleep and deep sleep is made by the **SLEEPDEEP** bit in the System Control Block (SCB) System Control Register *(bit name: PM0214, external to the slides)*.

## Entering low power

- **WFI** — Wait For Interrupt: the core enters the configured sleep mode immediately unless an interrupt is already pending; any interrupt wakes it.
- **WFE** — Wait For Event: checks the event register in the SCB; if not set, it sleeps; an event (or interrupt) wakes it.
- **Sleep-on-exit** — when the last ISR finishes, the core goes straight back to sleep without returning to «main()», saving the unstack/restack time and energy. Ideal for purely interrupt-driven designs.

~~~c Interrupt-driven low-power loop (CMSIS)
int main(void) {
    init_peripherals();          // e.g. SysTick or EXTI interrupt enabled
    SCB->SCR |= SCB_SCR_SLEEPONEXIT_Msk;   // optional: sleep again after every ISR
    while (1) {
        __WFI();                 // sleep until the next interrupt
    }
}
~~~

## Performance figure: DMIPS

DMIPS (Dhrystone MIPS) measures integer performance by how many Dhrystone benchmark iterations run per second. The M4 reaches 1.25 DMIPS/MHz, so at 84 MHz ≈ 105 DMIPS.

## Debug: JTAG vs SWD (Day04 L01 slides 16–19)

| | JTAG | SWD |
|---|---|---|
| Standard | IEEE 1149.1 (Joint Test Action Group) | Arm CoreSight |
| Pins | TCK, TMS, TDI, TDO (+TRST) | **SWDIO**, **SWCLK** |
| Uses | Debug, boundary-scan PCB testing, programming FPGAs/MCUs | Debug and programming of Arm cores |
| Speed | Good | Often faster per pin |
| Notes | Daisy-chains many chips | Bidirectional SWDIO with turnaround cycles; can share JTAG pins |

How SWD works: the debugger talks to the **Debug Access Port (DAP)**, which exposes **Access Ports** (memory access, JTAG access). SWCLK clocks data on SWDIO; turnaround cycles switch the line direction.

Debug features of the M4: halting, single-step, up to 8 breakpoints (FPB) and 4 watchpoints (DWT), ITM for «printf»-style tracing, ETM instruction trace.

> [!tip] In the lab
> Keil µVision → Options → Debug → ST-Link → SW. If the board stops being detected, the SWD pins (PA13/PA14) were probably reconfigured by your program — hold BOOT0 or connect under reset.
`,
  visual: md`
| Time | Busy-wait design | WFI design |
|---|---|---|
| Waiting for an event | CPU spins at full power | CPU clock stopped |
| Event arrives | Loop notices on next check | Interrupt wakes core, ISR runs |
| After handling | Back to spinning | Back to sleep (sleep-on-exit) |

::sim{iosync}
`,
  exam: {
    definitions: [
      { term: 'WFI', def: 'Wait For Interrupt: instruction that puts the processor into sleep until an interrupt occurs.' },
      { term: 'WFE', def: 'Wait For Event: instruction that sleeps unless the event register is set; wakes on an event or interrupt.' },
      { term: 'Sleep-on-exit', def: 'Feature that returns the processor to sleep immediately after the last ISR completes, without returning to thread mode.' },
      { term: 'SWD', def: 'Serial Wire Debug: Arm’s 2-pin (SWDIO, SWCLK) debug and programming interface.' },
      { term: 'JTAG', def: 'IEEE standard test/debug interface (TCK, TMS, TDI, TDO) used for debugging, boundary scan and programming.' },
    ],
    frequent: ['Explain the low-power modes of the Cortex-M4.', 'Difference between WFI and WFE.', 'JTAG vs SWD.'],
    mistakes: ['Saying deep sleep keeps the PLL running.', 'Swapping WFI and WFE.', 'Claiming SWD needs four pins.'],
    diagrams: ['Run → sleep → deep sleep table'],
    shortQs: [
      { q: 'Differentiate sleep and deep sleep modes.', a: md`Sleep halts only the CPU clock; system clock, Flash and peripheral clocks keep running. Deep sleep also stops the system clock and turns off Flash and the PLL, saving more power but taking longer to wake.`, marks: 2 },
      { q: 'What is sleep-on-exit?', a: md`When enabled, after the last pending ISR completes the core goes straight back to sleep instead of returning to the main program, avoiding unnecessary context switches.`, marks: 2 },
      { q: 'Name the two SWD signals and their roles.', a: md`SWCLK — clock from the debugger; SWDIO — bidirectional data line carrying commands and responses.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the low-power features of the Arm Cortex-M4 processor.', a: md`Three modes (run, sleep, deep sleep) with what stops in each; WFI and WFE semantics; sleep-on-exit; WIC for deep-sleep wake-up; up to 240 wake-up interrupts; optional retention mode. Explain why each saves energy and give a wearable example.`, marks: 6 },
      { q: 'Compare JTAG and SWD debug interfaces and list the debug capabilities of the Cortex-M4.', a: md`Table (standard, pins, uses, speed). Capabilities: halt, step, read/write registers and memory, up to 8 breakpoints and 4 watchpoints, Flash programming, ITM printf trace, ETM instruction trace, DAP/AP structure.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Run → sleep (CPU clock off) → deep sleep (system clock, Flash, PLL off).', 'WFI = sleep until interrupt; WFE = sleep unless event flag set.', 'Sleep-on-exit: back to sleep after ISR.', 'SWD = SWDIO + SWCLK; JTAG = TCK, TMS, TDI, TDO.', 'M4: up to 8 breakpoints, 4 watchpoints.'],
    takeaways: ['Low power = do work fast, then sleep.', 'SWD is the 2-pin JTAG alternative used by ST-Link.'],
    mcqs: [
      { q: 'Which instruction puts the core to sleep until an interrupt is pending?', options: ['NOP', 'WFI', 'BKPT', 'SVC'], answer: 1, explain: 'Wait For Interrupt.' },
      { q: 'In deep sleep, which is turned off in addition to the CPU clock?', options: ['Nothing else', 'System clock, Flash and PLL', 'Only the GPIO', 'Only the NVIC registers'], answer: 1, explain: 'Day04 L01 slide 11.' },
      { q: 'How many signal pins does SWD use?', options: ['1', '2', '4', '8'], answer: 1, explain: 'SWDIO and SWCLK.' },
      { q: 'Sleep-on-exit avoids…', options: ['entering interrupts', 'returning to main() between interrupts', 'using the stack', 'clocking the NVIC'], answer: 1, explain: 'The core sleeps again directly after the ISR.' },
      { q: 'DMIPS measures…', options: ['floating-point throughput', 'integer performance using the Dhrystone benchmark', 'memory size', 'power consumption'], answer: 1, explain: 'Dhrystone MIPS.' },
    ],
  },
};

export default topic;
