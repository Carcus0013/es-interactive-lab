import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'nvic',
  unit: 3,
  order: 2,
  title: 'NVIC: priorities, nesting and exception handling',
  short: 'The Nested Vectored Interrupt Controller: enable/pending/active states, priority and pre-emption, the 7-step exception entry, 8-register stacking, EXC_RETURN, tail-chaining and late arrival.',
  status: 'course',
  sources: [
    { file: 'Day10_1_Nested Vectored Interrupt Controller.pptx', detail: 'slides 3–14 (responsibilities, entry steps, stacking, EXC_RETURN, tail-chaining, late arrival)' },
    { file: 'Day04_Lecture01_CortexM4Processor_Introduction.pptx', detail: 'slides 23–24 (NVIC, nested, vector)' },
    { file: 'pm0214', detail: '§4.2 NVIC registers (external detail)' },
  ],
  keywords: ['NVIC', 'nested', 'vectored', 'priority', 'preemption', 'pending', 'active', 'ISER', 'ICER', 'ISPR', 'IABR', 'IPR', 'STIR', 'stacking', 'context save', 'EXC_RETURN', 'tail chaining', 'late arrival', 'latency', 'NVIC_EnableIRQ', 'NVIC_SetPriority'],
  importance: 2,
  sims: ['interrupt'],
  practicals: ['p10-gpio-interrupts', 'p11-adc-interrupt', 'p09-systick-interrupt'],
  related: ['interrupts-basics', 'exti', 'm4-registers', 'operating-modes'],
  fundamentals: {
    what: md`The **Nested Vectored Interrupt Controller (NVIC)** is an on-core controller in every Cortex-M that manages up to 240 interrupts plus NMI. **Nested**: a higher-priority interrupt can pre-empt a running lower-priority ISR. **Vectored**: the processor jumps directly to the handler whose address is in the vector table.`,
    why: md`Many sources can request service at once; the system must decide which goes first, allow urgent events to interrupt less urgent ones, and keep latency low and predictable.`,
    problem: md`The NVIC prioritises, nests and tracks interrupts in hardware and saves/restores context automatically, cutting interrupt latency (≈ 12 cycles to the first ISR instruction) and removing software overhead (tail-chaining, late arrival).`,
    how: md`Each IRQ has **enable**, **pending**, **active** bits and a **priority**. When a pending, enabled interrupt has higher priority than the current execution priority, the core finishes the current instruction, pushes **R0–R3, R12, LR, PC, xPSR**, loads LR with **EXC_RETURN**, updates IPSR, fetches the vector and runs the ISR. «BX LR» with EXC_RETURN pops the frame and resumes.`,
    where: md`«NVIC_EnableIRQ(EXTI9_5_IRQn);» in the GPIO-interrupt lab, «NVIC_EnableIRQ(ADC_IRQn);» in the ADC-interrupt lab; SysTick's priority set by «SysTick_Config».`,
  },
  detailed: md`
## Responsibilities of the NVIC (Day10_1 slides 6–7)

1. **Managing interrupts** — enable/disable each one; track enabled, pending, active.
2. **Prioritising** — priority levels per interrupt; **0 = highest** (lower number = more urgent).
3. **Nesting** — higher-priority interrupts pre-empt lower-priority ISRs.
4. **Vector table support** — direct jump to each handler.
5. **Software-triggered interrupts** — via the STIR register.
6. **Interrupt states** — *pending* (requested, not yet serviced), *active* (being serviced), *enabled* (allowed).
7. **Power management** — wakes the CPU from WFI/WFE.
8. **Tail-chaining** — back-to-back interrupts without unstack/restack.
9. **Late arrival** — a higher-priority interrupt arriving during stacking takes over.

## Nested interrupts (slide 5)

“Assume the lower priority interrupt's ISR is executing. Suddenly a higher priority interrupt got triggered. The lower priority interrupt is paused and the higher priority interrupt is executed. Once the higher priority interrupt finishes, the lower priority interrupt resumes. This is called a nested interrupt — the higher priority interrupt **pre-empts** the lower one.”

Equal or lower priority never pre-empts: it waits **pending**. If two interrupts with the same priority are pending, the one with the **lower exception number** goes first.

## NVIC registers (CMSIS functions)

| Register | Function | CMSIS |
|---|---|---|
| ISER | Set-enable | «NVIC_EnableIRQ(IRQn)» |
| ICER | Clear-enable | «NVIC_DisableIRQ(IRQn)» |
| ISPR / ICPR | Set / clear pending | «NVIC_SetPendingIRQ», «NVIC_ClearPendingIRQ» |
| IABR | Active bits (read-only) | «NVIC_GetActive» |
| IPR | Priority (8 bits per IRQ; STM32 implements the upper 4 → 16 levels) | «NVIC_SetPriority(IRQn, p)» |
| STIR | Software trigger | — |

## What happens when an interrupt is triggered (Day10_1 slides 8–9)

1. **Request and pending check** — the NVIC checks the interrupt is pending (ISPR), enabled (ISER) and higher priority than the current context.
2. **Current instruction completes.**
3. **Stacking (context save)** — the core automatically pushes **8 registers: R0, R1, R2, R3, R12, LR, PC, xPSR** onto the current stack (MSP or PSP).
4. **EXC_RETURN into LR** — tells the core how to return:

| EXC_RETURN | Return to | Stack |
|---|---|---|
| 0xFFFF FFF1 | Handler mode (nested) | MSP |
| 0xFFFF FFF9 | Thread mode | MSP |
| 0xFFFF FFFD | Thread mode | PSP |
| 0xFFFF FFE1 / E9 / ED | same, with FPU context stacked | |

5. **IPSR** ← exception number.
6. **Vector fetch** — ISR address read from the vector table (in parallel with stacking).
7. **Jump** — PC ← ISR address; handler mode starts.

Return: the ISR ends with «BX LR»; because LR holds EXC_RETURN, the core **unstacks** the 8 registers and resumes exactly where it stopped.

::diagram{stack-frame}

### Why only these 8 registers? (slide 10)

They are the registers a C function may change without saving (AAPCS caller-saved: R0–R3, R12), plus what is needed to resume (LR, PC, xPSR). Because the hardware saves them, an ISR can be an ordinary C function; if it uses R4–R11, the compiler saves those itself.

## Tail-chaining (slide 11)

IRQ1 is being serviced and IRQ2 (same or lower priority) becomes pending. Without optimisation the core would unstack after IRQ1 and immediately restack for IRQ2. **Tail-chaining** skips the pop/push pair and jumps straight to IRQ2's handler, saving time (≈ 6 cycles instead of ≈ 24).

## Late arrival (slide 14)

- A higher-priority interrupt arrives **during stacking** for a lower one → the NVIC fetches the **higher** vector instead; the stacked frame is reused. The lower interrupt then tail-chains after it.
- A higher-priority interrupt arrives **during unstacking** → unstacking is abandoned and the new interrupt is serviced immediately.

::diagram{tail-chain}

## Interrupt latency

Cortex-M4 nominal: **12 cycles** from request to first ISR instruction (zero-wait-state memory), tail-chain 6 cycles. Deterministic latency is one reason Cortex-M is chosen for real-time systems.
`,
  visual: md`
Set priorities and fire interrupts. Try (1) USART2 (prio 3) then EXTI0 (prio 2) while it runs → nesting; (2) EXTI0 and ADC together → same priority, lower exception number first; (3) two interrupts back-to-back with tail-chaining on/off.

::sim{interrupt}

::diagram{stack-frame}

::diagram{tail-chain}
`,
  exam: {
    definitions: [
      { term: 'NVIC', def: 'Nested Vectored Interrupt Controller: on-core unit that enables, prioritises, nests and vectors interrupts.' },
      { term: 'Pre-emption', def: 'A higher-priority interrupt suspending a lower-priority ISR that is currently executing.' },
      { term: 'Pending state', def: 'An interrupt that has been requested but not yet serviced.' },
      { term: 'Active state', def: 'An interrupt whose handler is currently executing (or pre-empted).' },
      { term: 'Stacking', def: 'Automatic hardware push of R0–R3, R12, LR, PC and xPSR on exception entry.' },
      { term: 'Tail-chaining', def: 'Servicing a pending interrupt immediately after another ISR without unstacking and restacking the context.' },
      { term: 'Late arrival', def: 'A higher-priority interrupt arriving during the stacking of a lower one is serviced first using the same stack frame.' },
      { term: 'EXC_RETURN', def: 'Special value loaded into LR on exception entry that defines the return mode and stack.' },
    ],
    formulas: [{ name: 'Stack frame size', expr: '8 registers × 4 bytes = 32 bytes (without FPU)', example: 'SP decreases by 32 on entry' }],
    frequent: ['Explain the NVIC and its features.', 'Steps when an interrupt is triggered in Cortex-M4.', 'Explain tail-chaining and late arrival.', 'Which registers are stacked and why?', 'What is EXC_RETURN?'],
    mistakes: ['Saying a higher priority number means higher priority (0 is highest).', 'Listing R4–R11 as automatically stacked.', 'Saying equal-priority interrupts nest.', 'Confusing tail-chaining (back-to-back) with late arrival (arrives during stacking).'],
    diagrams: ['NVIC with IRQ sources and vector table', 'Exception stack frame', 'Tail-chaining timeline'],
    shortQs: [
      { q: 'Which registers are pushed automatically on interrupt entry in Cortex-M4?', a: md`R0, R1, R2, R3, R12, LR (R14), PC (R15) and xPSR — eight words (32 bytes), plus FPU registers if lazy stacking is active.`, marks: 2 },
      { q: 'What is tail-chaining?', a: md`When an ISR finishes and another interrupt of the same or lower priority is pending, the processor skips the unstack/restack and jumps directly to the next ISR, reducing latency between back-to-back interrupts.`, marks: 2 },
      { q: 'What does LR contain inside an ISR that interrupted main()? What happens at BX LR?', a: md`EXC_RETURN 0xFFFF FFF9 (return to thread mode using MSP). BX LR with this value triggers unstacking of the 8 registers and resumes main() at the saved PC.`, marks: 2 },
      { q: 'Two interrupts with priority 2 become pending at the same time: EXTI0 (IRQ6) and ADC (IRQ18). Which runs first?', a: md`EXTI0 — with equal priority the lower exception/IRQ number wins; ADC stays pending and is tail-chained afterwards.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the sequence of events when an interrupt is triggered in the ARM Cortex-M4 and how the processor returns from the ISR.', a: md`Seven steps (pending/enabled/priority check, finish instruction, stack 8 registers, EXC_RETURN in LR with table, IPSR, vector fetch, jump), stack-frame diagram, return by BX LR → unstacking, mode/stack restoration; mention 12-cycle latency.`, marks: 8 },
      { q: 'Explain the Nested Vectored Interrupt Controller: its responsibilities, nested interrupts, tail-chaining and late arrival, with timing diagrams.', a: md`Nine responsibilities, nested example with priorities, tail-chaining vs normal timeline, late arrival during stacking/unstacking, NVIC register table and CMSIS functions.`, marks: 8 },
    ],
    numericals: [
      {
        q: 'MSP = 0x2001 0000 when main() is interrupted by EXTI0, which is then pre-empted by SysTick. What is MSP inside the SysTick handler (no FPU, no alignment padding)?',
        given: ['MSP = 0x20010000', 'two nested exception entries', 'frame = 32 bytes'],
        find: 'MSP in the inner handler',
        formula: 'MSP_new = MSP − 32 × number_of_frames',
        steps: ['First entry (EXTI0): 0x20010000 − 0x20 = 0x2000FFE0', 'Second entry (SysTick): 0x2000FFE0 − 0x20 = 0x2000FFC0'],
        answer: '0x2000 FFC0',
        value: 0x2000ffc0,
      },
    ],
  },
  revision: {
    notes: ['NVIC: up to 240 IRQs + NMI; priority 0 = highest; STM32 has 16 levels (4 bits).', 'States: enabled, pending, active. Registers: ISER, ICER, ISPR, ICPR, IABR, IPR, STIR.', 'Entry: finish instruction → push R0–R3, R12, LR, PC, xPSR → LR = EXC_RETURN → IPSR → vector → ISR.', 'EXC_RETURN: F1 handler/MSP, F9 thread/MSP, FD thread/PSP.', 'Tail-chaining: skip pop/push between ISRs; late arrival: higher IRQ during stacking takes over.', 'Latency 12 cycles; tail-chain 6.'],
    takeaways: ['Lower number = higher priority.', 'Equal priority never nests.', 'Hardware stacking makes ISRs plain C functions.'],
    mcqs: [
      { q: 'In the NVIC, which priority value is the most urgent?', options: ['0', '7', '15', '255'], answer: 0, explain: 'Lower number = higher priority.' },
      { q: 'How many words are pushed automatically on exception entry (no FPU)?', options: ['4', '8', '13', '16'], answer: 1, explain: 'R0–R3, R12, LR, PC, xPSR.' },
      { q: 'EXC_RETURN value for returning to thread mode using MSP:', options: ['0xFFFFFFF1', '0xFFFFFFF9', '0xFFFFFFFD', '0xFFFFFFFF'], answer: 1, explain: 'Day10_1 slide 8.' },
      { q: 'A higher-priority IRQ arrives while a lower one is being stacked. This is…', options: ['tail-chaining', 'late arrival', 'nesting after entry', 'a fault'], answer: 1, explain: 'Late-arrival optimisation.' },
      { q: 'CMSIS function to enable the EXTI9_5 interrupt:', options: ['EXTI_Enable()', 'NVIC_EnableIRQ(EXTI9_5_IRQn)', 'SysTick_Config()', '__enable_irq()'], answer: 1, explain: 'Sets the ISER bit.' },
    ],
  },
};

export default topic;
