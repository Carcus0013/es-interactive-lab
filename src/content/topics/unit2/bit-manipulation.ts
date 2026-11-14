import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'bit-manipulation',
  unit: 2,
  order: 3,
  title: 'Setting, clearing and toggling bits in a 32-bit register',
  short: 'REG |= (1U<<n), REG &= ~(1U<<n), REG ^= (1U<<n), multi-bit fields and why direct assignment REG = … is dangerous.',
  status: 'course',
  sources: [
    { file: 'Day05_Set_Or_Reset a bit in 32 bit register.pptx', detail: 'slides 1–2' },
    { file: 'STM32_Register_Level_Programming.docx', detail: '“Register Bit Masking” section' },
  ],
  keywords: ['bit mask', 'set bit', 'clear bit', 'toggle', '|=', '&=', '~', '^=', '<<', 'read-modify-write', 'direct assignment', 'REG = 0'],
  importance: 3,
  pyq: ['MT25A-5b', 'MT25B-5b', 'MT26S1-4b', 'MT26S2-4b'],
  sims: ['bits'],
  practicals: ['p01-led-on', 'p02-led-blink'],
  related: ['gpio-registers', 'bit-banding', 'alu-instructions'],
  fundamentals: {
    what: md`**Bit manipulation** means changing or testing individual bits of a register with bitwise operators and a **mask**: «|=» sets bits, «&= ~» clears bits, «^=» toggles bits and «&» tests bits — leaving every other bit unchanged.`,
    why: md`One 32-bit control register controls many independent hardware features. Changing one feature must not disturb the others — e.g. turning on GPIOC's clock must not turn off GPIOA's.`,
    problem: md`Direct assignment «REG = value» overwrites **all 32 bits**, silently clearing features that other code enabled. Masked read-modify-write changes only the targeted bits.`,
    how: md`«(1U << n)» builds a mask with only bit n set. OR with a 1 forces that bit to 1; AND with ~mask (all 1s except bit n) forces it to 0; XOR with 1 inverts it. All other bits are combined with the identity value (OR 0, AND 1, XOR 0) and stay unchanged.`,
    where: md`Every line of register-level lab code: «RCC->AHB1ENR |= (1U<<2);», «GPIOC->ODR &= ~(1U<<13);», «GPIOC->ODR ^= (1<<14);», «if (GPIOA->IDR & (1U<<0))».`,
  },
  detailed: md`
## The four operations

| Goal | C statement | Mask | Truth used |
|---|---|---|---|
| **Set** bit n | «REG \|= (1U << n);» | 0…010…0 | x OR 1 = 1, x OR 0 = x |
| **Clear** bit n | «REG &= ~(1U << n);» | 1…101…1 | x AND 0 = 0, x AND 1 = x |
| **Toggle** bit n | «REG ^= (1U << n);» | 0…010…0 | x XOR 1 = NOT x, x XOR 0 = x |
| **Test** bit n | «if (REG & (1U << n))» | 0…010…0 | non-zero only if bit n is 1 |

### Worked in binary (Day05 Set/Reset slides)

~~~text Set bit 10
REG          = 0000 0000 0000 0000 0000 0000 0000 0000
(1U<<10)     = 0000 0000 0000 0000 0000 0100 0000 0000
REG |= mask  = 0000 0000 0000 0000 0000 0100 0000 0000
~~~

~~~text Clear bit 10
(1U<<10)     = 0000 0000 0000 0000 0000 0100 0000 0000
~(1U<<10)    = 1111 1111 1111 1111 1111 1011 1111 1111
REG &= ~mask → bit 10 becomes 0, all others unchanged
~~~

### What the line really means (Register-Level doc)

«GPIOA->ODR |= (1<<5);» expands to:

~~~c
uint32_t target_reg = GPIOA->ODR;    // read
uint32_t mask = (1 << 5);            // 0x00000020
target_reg = target_reg | mask;      // modify
GPIOA->ODR = target_reg;             // write
~~~

## Direct assignment vs read-modify-write (the PYQ comparison)

Suppose a control register holds 0x0000 00F2 (bits 1, 4, 5, 6, 7 set — five features on).

| Statement | Result | Effect on other bits |
|---|---|---|
| «REG &= ~(1U << 5);» | 0x0000 00D2 | only bit 5 cleared; bits 1, 4, 6, 7 keep their features ON ✔ |
| «REG = 0;» | 0x0000 0000 | **every** feature disabled, not just bit 5 ✘ |
| «REG \|= (1U << 6);» (from 0x0000 0012) | 0x0000 0052 | only bit 6 set ✔ |
| «REG = (1U << 6);» | 0x0000 0040 | bit 6 set but bits 1 and 4 **cleared** ✘ |
| «REG = 0x10;» (to set bit 4) | 0x0000 0010 | bit 4 set but all others cleared ✘ |

> [!exam] Why masking is “safer” — write these four points
> 1. Only the targeted bit changes; all other configuration bits are preserved.
> 2. Code written by different modules/functions can share a register without undoing each other.
> 3. It does not depend on knowing the register's current value.
> 4. Direct assignment is only appropriate when you intend to set the **whole** register (e.g. initial configuration, or write-only registers like BSRR, where 0s have no effect).

## Multi-bit fields

For 2-bit fields such as MODER, clear the whole field then OR the new value:

~~~c PB9 as output (MODER9 = 01, bits 19:18)
GPIOB->MODER &= ~(3U << 18);   // clear bits 19 and 18
GPIOB->MODER |=  (1U << 18);   // write 01
// or in one statement:
GPIOB->MODER = (GPIOB->MODER & ~(3U << 18)) | (1U << 18);
~~~

> [!warning] «REG |= (0U << n)» does nothing
> The kit manual's «GPIOB->MODER |= (0U<<20);» intends “set PB10 to input” but OR-ing with 0 changes nothing. It works only because the reset value is already 00. Clearing needs «&= ~(3U<<20)».

## Why «1U» and not «1»

«1» is a signed int. «1 << 31» shifts into the sign bit — undefined behaviour in C. «1U» is unsigned, so «1U << 31» = 0x8000 0000 safely. The lab code mixes both; prefer «1U».

## Read-modify-write is not atomic

Between the read and the write an interrupt can change the register; the write then restores the stale value. Fixes: **BSRR** for GPIO outputs, **bit-banding**, or briefly disabling interrupts.
`,
  visual: md`
Pick an operation, set the starting register value by clicking bits, and compare the masked operation with direct assignment:

::sim{bits preset=pyq}
`,
  exam: {
    definitions: [
      { term: 'Bit mask', def: 'A constant with 1s in the bit positions to be operated on, e.g. (1U << n).' },
      { term: 'Read-modify-write', def: 'Reading a register, changing selected bits in a CPU register, and writing the result back.' },
      { term: 'Direct assignment', def: 'Writing a complete value to a register (REG = value), which replaces all bits.' },
    ],
    formulas: [
      { name: 'Set bit n', expr: 'REG |= (1U << n)' },
      { name: 'Clear bit n', expr: 'REG &= ~(1U << n)' },
      { name: 'Toggle bit n', expr: 'REG ^= (1U << n)' },
      { name: 'Write a k-bit field at position p', expr: 'REG = (REG & ~(mask << p)) | (value << p)', vars: 'mask = 2ᵏ − 1 (3 for 2-bit fields)' },
    ],
    frequent: [
      'Write a C statement to clear/set bit n without modifying other bits and compare with REG = 0 / REG = (1<<n) / REG = 0x10 — in all four mid-term papers (4 marks).',
      'Show the binary working of set and clear.',
    ],
    mistakes: [
      'Writing «REG &= (1U<<n)» to clear (that clears every **other** bit).',
      'Writing «REG |= ~(1U<<n)» (sets every other bit).',
      'Using «REG = (1<<n)» to set a bit in a shared register.',
      'Using «|= (0U<<n)» to clear.',
      'Forgetting the field is 2 bits wide for MODER/PUPDR.',
    ],
    diagrams: ['Binary illustration: register, mask, ~mask, result'],
    shortQs: [
      { q: 'Write a C statement that disables only bit 5 of REG without modifying other bits.', a: md`«REG &= ~(1U << 5);» — ~(1U<<5) = 0xFFFF FFDF has 0 only at bit 5; AND clears bit 5 and keeps all other bits.`, marks: 2 },
      { q: 'Write code to enable bit 6 without affecting the other bits.', a: md`«REG \|= (1U << 6);» — OR with 0x40 forces bit 6 to 1; OR with 0 leaves the rest unchanged.`, marks: 2 },
      { q: 'What does REG ^= (1U << 14) do and where is it used in the lab?', a: md`Toggles bit 14 (1 → 0 or 0 → 1). Used in the SysTick programs to toggle the LED on PC14 every second: «GPIOC->ODR ^= (1 << 14);».`, marks: 2 },
    ],
    longQs: [
      {
        q: 'A 32-bit control register enables several hardware features and some bits are already set. (i) Write a C statement to disable only bit 5. (ii) Compare this approach with direct assignment REG = 0. [4]',
        a: md`(i) «REG &= ~(1U << 5);»
(1U<<5) = 0x0000 0020; ~ gives 0xFFFF FFDF; AND clears bit 5 only.
Example: REG = 0x0000 00F2 → 0x0000 00D2.
(ii) «REG = 0;» clears all 32 bits — every feature that was enabled (bits 1, 4, 6, 7 in the example) is switched off, causing unintended behaviour. The masked statement is a read-modify-write that preserves other bits, works without knowing the current value, and lets modules share the register. Direct assignment is only appropriate when deliberately initialising the whole register.`,
        marks: 4,
      },
      {
        q: 'Analyse the bitwise operation required to set bit 4 while preserving the other bits, and compare with REG = 0x10 in terms of its effect on other bits. [4]',
        a: md`Set: «REG \|= (1U << 4);» mask 0x10 = 0000 0000 … 0001 0000. OR keeps every other bit (x OR 0 = x) and forces bit 4 (x OR 1 = 1).
Example REG = 0x0000 0A03: \|= gives 0x0000 0A13 (bits 0, 1, 9, 11 kept).
«REG = 0x10;» gives 0x0000 0010: bit 4 set, but bits 0, 1, 9 and 11 are cleared, disabling those features. So |= is safe for shared control registers; = 0x10 is only correct if you intend every other bit to be 0.`,
        marks: 4,
      },
    ],
    numericals: [
      {
        q: 'REG = 0x0000 00F2. Find REG after REG &= ~(1U << 5), and after REG = 0 instead.',
        given: ['REG = 0xF2 = 1111 0010', 'n = 5'],
        find: 'REG after each statement',
        formula: 'REG & ~(1U << 5) ; REG = 0',
        steps: ['~(1U<<5) = 0xFFFFFFDF', '0xF2 & 0xDF = 1101 0010 = 0xD2', 'REG = 0 → 0x00 (bits 1, 4, 6, 7 also lost)'],
        answer: '0x0000 00D2 (vs 0x0000 0000)',
        value: 0xd2,
      },
    ],
  },
  revision: {
    notes: ['Set: |= (1U<<n). Clear: &= ~(1U<<n). Toggle: ^= (1U<<n). Test: & (1U<<n).', 'Fields: REG = (REG & ~(3U<<2n)) | (v<<2n).', 'REG = value overwrites all bits — only for full initialisation or write-only registers.', '|= (0U<<n) is a no-op.', 'Use 1U to avoid signed shift into bit 31.'],
    takeaways: ['OR sets, AND-NOT clears, XOR toggles.', 'Always contrast with direct assignment in exam answers.'],
    mcqs: [
      { q: 'Which statement clears bit 3 only?', options: ['REG &= (1U<<3)', 'REG &= ~(1U<<3)', 'REG |= ~(1U<<3)', 'REG = ~(1U<<3)'], answer: 1, explain: 'AND with a mask that is 0 only at bit 3.' },
      { q: 'REG = 0x12; REG |= (1U<<6); REG = ?', options: ['0x40', '0x52', '0x12', '0x53'], answer: 1, explain: '0x12 | 0x40 = 0x52.' },
      { q: 'Effect of REG = (1U<<6) when REG was 0x12:', options: ['0x52', '0x40 — other bits lost', '0x12', '0x00'], answer: 1, explain: 'Assignment replaces all bits.' },
      { q: 'GPIOB->MODER |= (0U<<20) …', options: ['clears bits 20–21', 'does nothing', 'sets bit 20', 'resets the port'], answer: 1, explain: 'OR with zero changes nothing.' },
      { q: '~(1U<<10) equals…', options: ['0x00000400', '0xFFFFFBFF', '0xFFFFF7FF', '0x00000BFF'], answer: 1, explain: 'All ones except bit 10.' },
    ],
  },
};

export default topic;
