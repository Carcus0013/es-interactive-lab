import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'operating-modes',
  unit: 1,
  order: 10,
  title: 'Operating modes and privilege levels',
  short: 'Thread mode vs handler mode, privileged vs unprivileged execution, the CONTROL register, MSP/PSP, and why software cannot promote itself to privileged.',
  status: 'course',
  sources: [
    { file: 'Lecture01_CortexM4Processor_Introduction.pptx', detail: 'Programmer’s model: processor modes and privilege levels' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.1.4 Operating Modes' },
    { file: 'pm0214 (Cortex-M4 programming manual)', detail: '§2.1.1–2.1.3 (external reference for CONTROL/SVC detail)' },
  ],
  keywords: ['thread mode', 'handler mode', 'privileged', 'unprivileged', 'CONTROL', 'nPRIV', 'SPSEL', 'MSP', 'PSP', 'SVC', 'exception'],
  importance: 3,
  pyq: ['MT25A-3', 'MT26S1-2'],
  sims: ['modes'],
  related: ['m4-registers', 'nvic', 'interrupts-basics'],
  fundamentals: {
    what: md`The Cortex-M4 runs code in one of two **modes**: **Thread mode** for normal application code (your «main()») and **Handler mode** for exception/interrupt handlers. Independently, code runs at one of two **privilege levels**: **privileged** (full access to all instructions, registers and memory) or **unprivileged** (restricted).`,
    why: md`An OS or a safety-critical system must protect itself and the hardware from buggy or malicious application code. Separating modes and privilege lets the kernel and ISRs keep control while tasks run with limited rights.`,
    problem: md`Without privilege levels, any task could disable interrupts, reprogram the NVIC/SysTick/MPU or corrupt the kernel's stack. With them, a faulty task triggers a fault instead of crashing the whole system.`,
    how: md`The processor enters thread mode, privileged, after reset. An exception switches it to handler mode, which is **always privileged** and always uses MSP. Privileged thread code may set CONTROL.nPRIV = 1 to drop to unprivileged. Unprivileged code **cannot** clear nPRIV itself — it must raise an exception (normally «SVC»), and the privileged handler can change CONTROL before returning.`,
    where: md`Bare-metal lab programs run entirely in privileged thread mode (plus handler mode for ISRs). RTOSes such as FreeRTOS-MPU run tasks unprivileged on the PSP, with the kernel in handler mode on the MSP.`,
  },
  detailed: md`
## The two modes

| | Thread mode | Handler mode |
|---|---|---|
| Runs | Application code («main()», tasks) | Exception handlers (ISRs, SysTick, faults, SVC) |
| Entered | At reset; on return from the last exception | Automatically on any exception |
| Privilege | Privileged **or** unprivileged (CONTROL.nPRIV) | **Always privileged** |
| Stack pointer | MSP or PSP (CONTROL.SPSEL) | **Always MSP** |
| IPSR (ISR_NUMBER) | 0 | Exception number (e.g. 15 for SysTick) |

> [!source] Lecture (Programmer’s model)
> “Thread mode: used to execute application software. The processor enters Thread mode when it comes out of reset. The CONTROL register controls whether software execution is privileged or unprivileged. Handler mode: used to handle exceptions. The processor returns to Thread mode when it has finished exception processing.”

Valvano describes the same idea as foreground (thread) vs background (handler): switching happens automatically, and «ISR_NUMBER» tells you which.

::diagram{modes}

## Privilege levels

| Privileged | Unprivileged |
|---|---|
| Can use all instructions, including «MSR»/«MRS» to change special registers and «CPS» to mask interrupts | Limited access to «MSR»/«MRS»; cannot use «CPS» |
| Can access the System Control Space (NVIC, SysTick, SCB, MPU) | Accesses to most system registers fault |
| Can access all memory (subject to MPU rules) | Restricted by MPU and system-register rules |

## The CONTROL register

| Bit | Name | Meaning |
|---|---|---|
| 0 | nPRIV | 0 = privileged thread mode, 1 = unprivileged thread mode |
| 1 | SPSEL | 0 = thread mode uses MSP, 1 = thread mode uses PSP (ignored in handler mode) |
| 2 | FPCA | FP context active (FPU in use) |

## Can software switch from unprivileged to privileged? (PYQ)

**No — not directly.** An unprivileged thread that writes CONTROL with «MSR» has no effect on nPRIV. The only route is through an **exception**:

1. The task executes «SVC #n» (supervisor call) — or any other exception occurs.
2. The processor enters **handler mode**, which is always privileged.
3. The SVC handler (OS code) checks the request and, if allowed, clears CONTROL.nPRIV (or performs the privileged operation on the task's behalf).
4. On exception return, thread mode runs privileged.

This guarantees that only trusted handler code decides who gets privilege.

## Which mode is “exclusively privileged”? (PYQ)

**Handler mode** — all exception handlers execute privileged, always. Thread mode can be either.

~~~c Dropping privilege in an RTOS-style start-up (CMSIS)
__set_PSP((uint32_t)&task_stack[STACK_TOP]);   // set up the task stack
__set_CONTROL(__get_CONTROL() | 0x3);         // SPSEL = 1 (PSP), nPRIV = 1 (unprivileged)
__ISB();                                       // make the change take effect
task_main();                                   // now unprivileged thread mode on PSP
~~~
`,
  visual: md`
Try it: drop privilege, then try to regain it with an MSR (ignored), then take an SVC exception and return.

::sim{modes}

::diagram{modes}
`,
  exam: {
    definitions: [
      { term: 'Thread mode', def: 'Processor mode used to execute application software; entered at reset and after exception return.' },
      { term: 'Handler mode', def: 'Processor mode used to execute exception handlers; always privileged and always uses MSP.' },
      { term: 'Privileged execution', def: 'Execution with access to all instructions and system resources.' },
      { term: 'Unprivileged execution', def: 'Execution with restricted access to special registers, system control space and memory.' },
      { term: 'SVC', def: 'Supervisor call instruction that raises an exception so unprivileged code can request a privileged service.' },
    ],
    frequent: ['Differentiate thread mode and handler mode; which is exclusively privileged? (Aug 2025, Aug 2026 — 3 marks)', 'Can software switch from unprivileged to privileged mode? Explain briefly.'],
    mistakes: ['Saying thread mode is always unprivileged (it starts privileged after reset).', 'Saying unprivileged code can write CONTROL to become privileged.', 'Saying handler mode can use the PSP.', 'Mixing up “mode” (thread/handler) and “privilege level” (privileged/unprivileged).'],
    diagrams: ['Three-state diagram: privileged thread, unprivileged thread, handler (with exception / return / CONTROL arrows)'],
    shortQs: [
      { q: 'Differentiate Thread mode and Handler mode in ARM Cortex-M processors. Which of these modes is used exclusively for privileged operations? [3]', a: md`Thread mode runs application code, is entered at reset and after exceptions, can be privileged or unprivileged (CONTROL.nPRIV), and can use MSP or PSP. Handler mode runs exception handlers, is entered automatically on an exception, and always uses MSP. **Handler mode is always (exclusively) privileged.**`, marks: 3 },
      { q: 'Can the system switch from unprivileged mode to privileged mode using software? Explain briefly.', a: md`Not directly: an unprivileged thread cannot write CONTROL.nPRIV. It must cause an exception (e.g. execute «SVC»). The handler runs in privileged handler mode, can clear nPRIV, and on return the thread is privileged. So the switch is possible only through an exception handler, which keeps the system secure.`, marks: 2 },
      { q: 'Which stack pointer is used in handler mode?', a: md`Always the Main Stack Pointer (MSP), regardless of CONTROL.SPSEL.`, marks: 1 },
    ],
    longQs: [
      { q: 'Explain the operating modes and privilege levels of the ARM Cortex-M4 with a state diagram. Describe the role of the CONTROL register and how an RTOS uses these features.', a: md`Modes table, privilege table, CONTROL bits (nPRIV, SPSEL, FPCA), state diagram (reset → privileged thread; exception → handler; return; CONTROL write to unprivileged; SVC route back). RTOS: kernel and ISRs on MSP in handler mode; tasks unprivileged on PSP; SVC for system calls; PendSV for context switch; MPU protects kernel memory.`, marks: 8 },
      { q: 'What happens to the mode, privilege and stack pointer when an interrupt occurs while an unprivileged task runs on the PSP, and when it returns?', a: md`Entry: context (8 words) pushed on the **PSP**; processor switches to handler mode, privileged, using MSP; LR = 0xFFFFFFFD (return to thread, PSP); IPSR = exception number. Return: BX LR with EXC_RETURN pops the frame from PSP and resumes unprivileged thread mode on the PSP.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['Thread mode = application; handler mode = exceptions.', 'Handler mode is always privileged and always uses MSP.', 'Reset → privileged thread mode, MSP.', 'CONTROL: bit0 nPRIV, bit1 SPSEL, bit2 FPCA.', 'Unprivileged → privileged only via an exception (SVC) whose handler changes CONTROL.'],
    takeaways: ['Mode and privilege are two separate things.', 'Answer the “can software switch?” question with “No, only via an exception such as SVC”.'],
    mcqs: [
      { q: 'Which mode is always privileged?', options: ['Thread mode', 'Handler mode', 'Debug mode', 'User mode'], answer: 1, explain: 'Exception handlers always run privileged.' },
      { q: 'After reset the processor is in…', options: ['unprivileged handler mode', 'privileged thread mode', 'unprivileged thread mode', 'sleep mode'], answer: 1, explain: 'Valvano §3.1.2.' },
      { q: 'Which CONTROL bit makes thread mode unprivileged?', options: ['SPSEL', 'nPRIV', 'FPCA', 'TICKINT'], answer: 1, explain: 'CONTROL bit 0.' },
      { q: 'How does unprivileged code obtain a privileged service?', options: ['Write CONTROL directly', 'Execute SVC to raise an exception', 'Disable interrupts', 'Reset the MCU'], answer: 1, explain: 'The SVC handler runs privileged.' },
      { q: 'IPSR reads 0. The processor is in…', options: ['handler mode', 'thread mode', 'a fault', 'deep sleep'], answer: 1, explain: 'ISR_NUMBER 0 means no exception is active.' },
    ],
  },
};

export default topic;
