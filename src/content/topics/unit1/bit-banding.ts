import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'bit-banding',
  unit: 1,
  order: 11,
  title: 'Bit-banding',
  short: 'Atomic single-bit access: every bit of the first 1 MB of SRAM and peripheral space has its own 32-bit alias word.',
  status: 'course',
  sources: [
    { file: 'Day06_LED blink using bit band concepts.pptx', detail: 'slides 2–18 (formula, macro, PC13 program)' },
    { file: 'Bit_banding_notes.pdf (Sumesh A K)', detail: 'regions, PC13 worked example, exercises' },
    { file: 'Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx', detail: 'slides 18, 28–29' },
  ],
  keywords: ['bit band', 'alias', 'atomic', 'read-modify-write', '0x42000000', '0x22000000', 'BITBAND_PERI'],
  importance: 3,
  pyq: ['MT25A-5a', 'MT25B-5a', 'MT26S1-4a', 'MT26S2-4a'],
  practicals: ['p05-bitband-blink'],
  sims: ['bitband', 'memmap'],
  related: ['memory-map', 'bit-manipulation', 'gpio-registers'],
  fundamentals: {
    what: md`Bit-banding is a hardware feature of the Cortex-M3/M4 that gives **every single bit** of two 1 MB memory regions its **own 32-bit word address** (the *alias* address). Writing 1 or 0 to that alias word sets or clears exactly one bit of the real memory; reading it returns 0 or 1.`,
    why: md`Memory is byte-addressed: the smallest thing a normal store can change is a byte. To change one bit, software must **read** the whole register, **modify** the bit with a mask, and **write** it back. That takes three instructions, and an interrupt can arrive between the read and the write.`,
    problem: md`It removes the **read-modify-write race condition**. If an ISR changes another bit of the same register between your read and your write, your write puts back the *old* value and silently undoes the ISR's change. A bit-band write is converted by the bus into an **atomic** read-modify-write that cannot be interrupted.`,
    how: md`The bus matrix watches the two 32 MB alias regions. An access to alias word «0x4200 0000 + offset×32 + bit×4» is remapped to bit «bit» of the byte/word at «0x4000 0000 + offset». For a write, the hardware performs the read-modify-write itself; for a read, it returns the selected bit in bit 0.`,
    where: md`Toggling GPIO pins from both «main()» and an ISR, setting peripheral enable bits, polling single status flags (e.g. ADC EOC, USART TXE), and storing Boolean flags in SRAM that are shared between tasks and interrupts.`,
  },
  detailed: md`
## The two bit-band regions

The Cortex-M4 4 GB address map reserves two small regions that support bit-band access, plus two large alias regions:

| Region | Bit-band (real) range | Size | Alias range | Alias size |
|---|---|---|---|---|
| SRAM | 0x2000 0000 – 0x200F FFFF | 1 MB | 0x2200 0000 – 0x23FF FFFF | 32 MB |
| Peripheral | 0x4000 0000 – 0x400F FFFF | 1 MB | 0x4200 0000 – 0x43FF FFFF | 32 MB |

Why is the alias 32 times bigger? 1 MB contains 8 Mbit. Each bit gets a 4-byte word, so the alias needs 8 M × 4 B = **32 MB**.

> [!source] Lecture wording (Day06 slide 2)
> "The Cortex-M4 splits its memory into two areas: Bit-Band Region — the actual memory where your data and peripherals live. Alias Region — a separate, 'fake' memory area. Every single bit in the Bit-Band region is mapped to a unique full word in the Alias region."

> [!analogy]
> The bit-band region is a ceiling light that is hard to reach; the alias word is the wall switch wired to it. Flip the switch (write the alias) and only that light changes (Day06 slide 2).

## The formula

$$
alias_address = alias_base + (byte_offset × 32) + (bit_number × 4)
byte_offset   = register_address − bitband_base
$$

- «alias_base» = **0x4200 0000** for peripherals, **0x2200 0000** for SRAM.
- «bitband_base» = **0x4000 0000** for peripherals, **0x2000 0000** for SRAM.
- **×32** — each *byte* of the real region expands to 8 bits × 4 bytes = 32 bytes of alias space.
- **×4** — each *bit* becomes a full 32-bit word, so consecutive bits are 4 bytes apart.

> [!note] Bit numbering: 0–7 or 0–31?
> Day06 slide 4 says "BitNumber is 0 to 7" because the formula is defined per **byte**. For a 32-bit register you may use the *word* address as the offset and a bit number 0–31: bit 13 of the word at offset 0x20814 is bit 5 of the byte at offset 0x20815, and both give the same alias (0x20814×32 + 13×4 = 0x20815×32 + 5×4). Every PYQ uses the word-address form with bits 0–31.

## Worked example from the course notes: PC13

From the bit-band notes (RM0368 page 38 and 165):

1. GPIOC base = 0x4002 0800, ODR offset = 0x14 → **GPIOC_ODR = 0x4002 0814**.
2. Byte offset from peripheral base = 0x4002 0814 − 0x4000 0000 = **0x0002 0814**.
3. ×32 is a left shift by 5: 0x20814 << 5 = **0x0041 0280**.
4. Alias word for bit 0 = 0x4200 0000 + 0x0041 0280 = **0x4241 0280**.
5. Bit 13 → + 13×4 = 52 = 0x34 → **0x4241 02B4**.

Writing «*(volatile uint32_t*)0x424102B4 = 0;» drives PC13 low and turns the on-board LED **on** (it is active-low).

::sim{bitband}

## Doing it in C — the lecture macro

~~~c Day06 slides 10–14
#define PERIPH_BASE      0x40000000
#define PERIPH_BB_BASE   0x42000000
#define GPIOC_ODR        0x40020814

#define BITBAND_PERI(addr, bit) \
    ((volatile uint32_t *)(PERIPH_BB_BASE + (((addr) - PERIPH_BASE) * 32) + ((bit) * 4)))

*BITBAND_PERI(GPIOC_ODR, 13) = 0;   // PC13 low  -> LED ON
*BITBAND_PERI(GPIOC_ODR, 13) = 1;   // PC13 high -> LED OFF
~~~

- The macro produces a **pointer**; the leading «*» dereferences it so the assignment writes the alias word.
- «volatile» stops the compiler from caching or removing the write, because the location is hardware, not ordinary memory.
- Only bit 0 of the value you write matters: writing 1 sets the bit, writing 0 clears it.

## Normal RMW vs bit-band — what the CPU actually does

| | «GPIOC->ODR \|= (1U<<13);» | «*BITBAND_PERI(GPIOC_ODR,13) = 1;» |
|---|---|---|
| Instructions | LDR (read), ORR (modify), STR (write) | one STR to the alias address |
| Interruptible between steps? | **Yes** — an ISR can run between LDR and STR | **No** — the bus performs an atomic read-modify-write |
| Other bits | Preserved only if no one else changes them meanwhile | Always preserved |
| Readability | Needs masks and shifts | Reads like a Boolean variable |

> [!exam] How bit-banding improves real-time GPIO control (asked in all four mid-term papers)
> Atomic (no race with ISRs, no need to disable interrupts); one instruction instead of three (faster, deterministic timing); no masking/shifting (simpler, fewer bugs); lets several tasks/ISRs share the pins of one port safely; single status bits can be tested directly.

> [!warning]
> Bit-banding works **only** inside the two 1 MB regions. The SysTick and NVIC registers (0xE000 xxxx) and Flash (0x0800 xxxx) are **not** bit-band addressable. GPIOA–H, RCC, ADC, USART, I²C all lie inside 0x4000 0000–0x400F FFFF on the STM32F401, so they are.

> [!external]
> Bit-banding is optional in the Armv7-M architecture and was removed from the newer Cortex-M7/M33 cores. Programmers on those cores use the GPIO BSRR register or exclusive-access instructions (LDREX/STREX) instead. (Source: Arm Cortex-M architecture documentation, outside your slides.)
`,
  visual: md`
The diagram shows one bit of GPIOC_ODR expanding into its own alias word. Use the memory-map explorer to see where the regions sit, then try the calculator with your own register.

::diagram{bitband-map}

::diagram{memmap}

::sim{memmap}
`,
  exam: {
    definitions: [
      { term: 'Bit-band region', def: 'A 1 MB area of SRAM (0x2000 0000) or peripheral space (0x4000 0000) whose individual bits can be accessed through an alias region.' },
      { term: 'Bit-band alias region', def: 'A 32 MB area (0x2200 0000 / 0x4200 0000) in which each 32-bit word maps to exactly one bit of the bit-band region.' },
      { term: 'Atomic operation', def: 'An operation that completes as a single indivisible step; no interrupt or other bus master can observe or change the data part-way through.' },
      { term: 'Read-modify-write (RMW)', def: 'The three-step sequence read register → change bits with a mask → write back, used to alter some bits while preserving others.' },
    ],
    formulas: [
      { name: 'Bit-band alias address', expr: 'alias = alias_base + (addr − region_base) × 32 + bit × 4', vars: 'Peripheral: region_base 0x4000 0000, alias_base 0x4200 0000. SRAM: 0x2000 0000 → 0x2200 0000.', example: 'GPIOC_ODR (0x4002 0814) bit 13 → 0x4241 02B4' },
      { name: 'GPIO register address', expr: 'address = port_base + register_offset', vars: 'GPIOA 0x4002 0000, GPIOB 0x4002 0400, GPIOC 0x4002 0800; ODR offset 0x14, IDR 0x10, MODER 0x00', example: 'GPIOB_ODR = 0x4002 0414' },
    ],
    frequent: [
      'Calculate the alias address for bit n of a GPIO ODR (every mid-term paper, 4 marks with part ii).',
      'Find the register address from base + offset before applying the formula (Aug 2026 papers).',
      'Explain how bit-banding improves GPIO control in real-time applications.',
      'Why multiply by 32 and by 4?',
    ],
    mistakes: [
      'Forgetting to subtract the region base (0x4000 0000) before multiplying by 32.',
      'Adding the bit number instead of bit × 4.',
      'Mixing decimal and hexadecimal: 13 × 4 = 52 decimal = 0x34, not 0x52.',
      'Using the SRAM alias base 0x2200 0000 for a peripheral register.',
      'Using the wrong ODR offset: ODR is at 0x14 (IDR 0x10, BSRR 0x18, LCKR 0x1C).',
      'Claiming bit-banding works for any address (it does not work for SysTick/NVIC at 0xE000 E000).',
    ],
    diagrams: ['Memory map showing both bit-band regions and their alias regions', 'One word expanded into bits mapped to alias words'],
    shortQs: [
      { q: 'Why is the bit-band alias region 32 MB when the bit-band region is only 1 MB?', a: md`1 MB = 2^{20} bytes = 2^{23} bits. Each bit gets its own 4-byte word, so the alias needs 2^{23} × 4 = 2^{25} bytes = **32 MB**.`, marks: 2 },
      { q: 'State two advantages of bit-band operations over normal read-modify-write.', a: md`(1) **Atomic** — the bus performs the read-modify-write in one uninterruptible transfer, so an ISR cannot corrupt the register. (2) **Faster and simpler** — one store instruction instead of load/OR/store, with no masks or shifts.`, marks: 2 },
      { q: 'Which STM32F401 registers can NOT be accessed through bit-banding? Give one example.', a: md`Anything outside 0x2000 0000–0x200F FFFF and 0x4000 0000–0x400F FFFF, e.g. the SysTick registers at 0xE000 E010, the NVIC (0xE000 E100) or Flash (0x0800 0000).`, marks: 2 },
      { q: 'Compute the bit-band alias address for bit 0 at SRAM address 0x2000 0004 (exercise 1 in the course notes).', a: md`alias = 0x2200 0000 + (0x2000 0004 − 0x2000 0000) × 32 + 0 × 4 = 0x2200 0000 + 0x80 = **0x2200 0080**.`, marks: 2 },
    ],
    longQs: [
      {
        q: 'Explain the bit-banding feature of the ARM Cortex-M4. Derive the alias address formula, compute the alias address of PC13 in GPIOC_ODR, and explain how bit-banding improves GPIO control in real-time applications.',
        a: md`**Definition.** Bit-banding maps each bit of two 1 MB regions (SRAM 0x2000 0000, peripherals 0x4000 0000) to a 32-bit word in a 32 MB alias region (0x2200 0000, 0x4200 0000). A write of 1/0 to the alias word sets/clears the bit atomically; a read returns the bit in bit 0.

**Derivation.** Every byte of the real region has 8 bits; every bit needs one 4-byte word, so each byte occupies 8 × 4 = 32 bytes of alias space, and consecutive bits are 4 bytes apart:
alias = alias_base + byte_offset × 32 + bit × 4, where byte_offset = address − region_base.

**PC13.** GPIOC_ODR = 0x4002 0800 + 0x14 = 0x4002 0814. Offset = 0x20814. ×32 = 0x410280. Word alias = 0x4241 0280. Bit 13: +52 (0x34) → **0x4241 02B4**.

**Real-time benefit.** (i) Atomic — no read-modify-write race with ISRs and no need to disable interrupts; (ii) deterministic and fast — single store; (iii) readable code — no masks; (iv) several tasks can safely share pins of one port; (v) a status flag can be polled with one load.

**Diagram.** Draw the memory map with both bit-band regions and their alias regions, and one register word fanned out to alias words.`,
        marks: 8,
      },
      {
        q: 'Write a C program for the STM32F401 that blinks the on-board LED on PC13 using bit-band alias addresses only (no |= or &=). Explain each macro.',
        a: md`Use the macro from the Day06 lecture:
~~~c
#include <stdint.h>
#define PERIPH_BASE    0x40000000
#define PERIPH_BB_BASE 0x42000000
#define RCC_AHB1ENR    0x40023830
#define GPIOC_MODER    0x40020800
#define GPIOC_ODR      0x40020814
#define BITBAND_PERI(a,b) ((volatile uint32_t *)(PERIPH_BB_BASE + (((a)-PERIPH_BASE)*32) + ((b)*4)))

void delay(volatile uint32_t t) { while (t--); }

int main(void) {
    *BITBAND_PERI(RCC_AHB1ENR, 2)  = 1;   // GPIOC clock on
    *BITBAND_PERI(GPIOC_MODER, 27) = 0;   // MODER13 = 01 (output)
    *BITBAND_PERI(GPIOC_MODER, 26) = 1;
    while (1) {
        *BITBAND_PERI(GPIOC_ODR, 13) = 0; // LED ON (active-low)
        delay(500000);
        *BITBAND_PERI(GPIOC_ODR, 13) = 1; // LED OFF
        delay(500000);
    }
}
~~~
PERIPH_BASE/PERIPH_BB_BASE are the region and alias bases; the register macros are absolute addresses from RM0368; BITBAND_PERI computes the alias pointer; «volatile» forces every access to reach the hardware. See practical P05 for the line-by-line walkthrough.`,
        marks: 8,
      },
    ],
    numericals: [
      {
        q: 'Calculate the bit-band alias address for bit 6 of the register at 0x4002 0014 (GPIOA_ODR). [Aug 2025 Set B]',
        given: ['Register address = 0x4002 0014', 'Bit = 6', 'Peripheral region base = 0x4000 0000', 'Alias base = 0x4200 0000'],
        find: 'Alias word address',
        formula: 'alias = 0x4200 0000 + (addr − 0x4000 0000) × 32 + bit × 4',
        steps: ['Offset = 0x4002 0014 − 0x4000 0000 = 0x0002 0014', 'Offset × 32 = 0x20014 << 5 = 0x0040 0280', 'Bit × 4 = 6 × 4 = 24 = 0x18', 'Alias = 0x4200 0000 + 0x0040 0280 + 0x18 = 0x4240 0298'],
        answer: '0x4240 0298',
        concept: 'Bit-band mapping: one bit → one 32-bit alias word.',
      },
      {
        q: 'Compute the bit-band alias address of PB10 in GPIOB_ODR (exercise 2 in the course notes).',
        given: ['GPIOB base = 0x4002 0400', 'ODR offset = 0x14', 'Bit = 10'],
        find: 'Alias word address',
        formula: 'alias = 0x4200 0000 + (addr − 0x4000 0000) × 32 + bit × 4',
        steps: ['GPIOB_ODR = 0x4002 0400 + 0x14 = 0x4002 0414', 'Offset = 0x0002 0414', '× 32 = 0x0040 8280', 'bit × 4 = 40 = 0x28', 'Alias = 0x4200 0000 + 0x0040 8280 + 0x28 = 0x4240 82A8'],
        answer: '0x4240 82A8',
      },
    ],
  },
  revision: {
    notes: [
      'Regions: SRAM 0x2000 0000–0x200F FFFF ↔ alias 0x2200 0000; peripherals 0x4000 0000–0x400F FFFF ↔ alias 0x4200 0000.',
      'alias = alias_base + (addr − base) × 32 + bit × 4.',
      'Write 1/0 to the alias → set/clear the bit atomically; read → 0 or 1.',
      'Solves the read-modify-write race with interrupts; one instruction instead of three.',
      'GPIOx_ODR = port base + 0x14. GPIOA 0x4002 0000, GPIOB 0x4002 0400, GPIOC 0x4002 0800.',
    ],
    takeaways: [
      '×32 because 1 byte = 8 bits × 4 bytes per alias word; ×4 because each bit is a whole word.',
      'Always show the three steps in the exam: offset, ×32, + bit×4.',
      'Use volatile pointers when accessing alias addresses in C.',
    ],
    mcqs: [
      { q: 'What is the alias base address for the peripheral bit-band region on a Cortex-M4?', options: ['0x2200 0000', '0x4000 0000', '0x4200 0000', '0xE000 0000'], answer: 2, explain: 'Peripheral bit-band region 0x4000 0000 maps to the alias region starting at 0x4200 0000.' },
      { q: 'How many bytes of alias space does one byte of the bit-band region occupy?', options: ['4', '8', '32', '1'], answer: 2, explain: '8 bits × 4 bytes per alias word = 32 bytes.' },
      { q: 'Alias address of bit 0 of GPIOA_ODR (0x4002 0014)?', options: ['0x4240 0280', '0x4200 0280', '0x4240 0014', '0x4220 0280'], answer: 0, explain: '0x20014 × 32 = 0x400280; 0x4200 0000 + 0x400280 = 0x4240 0280.' },
      { q: 'Which statement about a write to a bit-band alias address is TRUE?', options: ['It changes all 32 bits of the target word', 'It is converted into an atomic read-modify-write by the bus', 'It only works in handler mode', 'It needs interrupts to be disabled first'], answer: 1, explain: 'The bus matrix performs the RMW itself, so no interrupt can intervene.' },
      { q: 'Which address range is NOT bit-band addressable?', options: ['0x2000 0100', '0x4002 0814', '0xE000 E010 (SysTick)', '0x4001 2000 (ADC1)'], answer: 2, explain: 'Only the first 1 MB of SRAM and of peripheral space support bit-banding; the System Control Space does not.' },
    ],
  },
};

export default topic;
