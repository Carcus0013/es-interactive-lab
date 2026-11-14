import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'memory-map',
  unit: 1,
  order: 9,
  title: 'Reset sequence, memory map and buses',
  short: 'What happens at reset, the 4 GB Cortex-M4 address map (code, SRAM, peripherals, system), endianness, memory-mapped I/O and the MPU.',
  status: 'course',
  sources: [
    { file: 'Day04_Lecture02_The_Arm_Cortex_M4_Processor_Architecture.pptx', detail: 'slides 16–20 (memory map, regions, MPU example)' },
    { file: 'EMBEDDED_TEXTBOOK.pdf (Valvano)', detail: '§3.1.2 Reset, §3.1.3 Memory' },
    { file: 'rm0368 (STM32F401 reference manual)', detail: '§2.3 memory map, Table 1 boundary addresses' },
    { file: 'Bit_banding_notes.pdf', detail: 'memory regions, little-endian' },
  ],
  keywords: ['reset', 'vector table', 'reset vector', 'MSP', 'memory map', 'Flash 0x08000000', 'SRAM 0x20000000', 'peripheral 0x40000000', 'PPB', 'little endian', 'MPU', 'memory-mapped I/O'],
  importance: 2,
  sims: ['memmap'],
  related: ['bit-banding', 'm4-registers', 'operating-modes', 'gpio-registers'],
  fundamentals: {
    what: md`The Cortex-M4 has a 32-bit address bus, so it sees one **4 GB address space**. Fixed regions are reserved for code, SRAM, peripherals, external memory and the processor's own system registers. Peripheral registers are **memory-mapped**: «GPIOC->ODR» is simply a 32-bit location at 0x4002 0814. The **reset** sequence loads the stack pointer and program counter from the first two words of this map.`,
    why: md`Knowing where things live lets you read a reference manual, compute register addresses (base + offset), use bit-banding, debug with a memory window, and understand why a stray pointer corrupts a peripheral.`,
    problem: md`A fixed map means the same compiler, startup code and debugger work on every Cortex-M chip; memory-mapped I/O means no special I/O instructions — ordinary «LDR»/«STR» (pointer reads and writes in C) control the hardware.`,
    how: md`At reset the core reads address 0x0000 0000 into **MSP** and address 0x0000 0004 (the **reset vector**) into **PC**, enters thread mode, privileged, and starts executing. On the STM32 the Flash at 0x0800 0000 is aliased to address 0 when BOOT0 = 0, so the vector table in Flash is found.`,
    where: md`Every lab program: «#include "stm32f4xx.h"» defines «GPIOC» as a pointer to 0x4002 0800; the linker places code at 0x0800 0000 and variables at 0x2000 0000; Keil's memory window shows these addresses.`,
  },
  detailed: md`
## Reset (Valvano §3.1.2)

When power is applied or NRST is pressed:

1. The processor enters **thread mode**, **privileged**, using **MSP**.
2. The 32-bit word at address **0x0000 0000** is loaded into **SP (MSP)** — the initial top of stack.
3. The word at **0x0000 0004** — the **reset vector** — is loaded into **PC**. Its bit 0 is 1 (Thumb), which sets the T bit.
4. **LR** is set to 0xFFFF FFFF.
5. Execution starts at «Reset_Handler» in the startup file, which initialises memory and calls «SystemInit()» then «main()».

The SP value must be word-aligned (bits 1:0 = 0); instructions are halfword-aligned.

## The memory map

::diagram{memmap}

| Region | Address range | Size | Contents on STM32F401 |
|---|---|---|---|
| Code | 0x0000 0000 – 0x1FFF FFFF | 0.5 GB | Flash 256 KB at **0x0800 0000** (aliased to 0), system bootloader at 0x1FFF 0000 |
| SRAM | 0x2000 0000 – 0x3FFF FFFF | 0.5 GB | 64 KB SRAM at **0x2000 0000**; bit-band 0x2000 0000–0x200F FFFF; alias 0x2200 0000 |
| Peripheral | 0x4000 0000 – 0x5FFF FFFF | 0.5 GB | APB1, APB2, AHB1 (GPIO, RCC), AHB2 (USB); bit-band 0x4000 0000–0x400F FFFF; alias 0x4200 0000 |
| External RAM | 0x6000 0000 – 0x9FFF FFFF | 1 GB | not used on F401 |
| External device | 0xA000 0000 – 0xDFFF FFFF | 1 GB | not used on F401 |
| System (PPB) | 0xE000 0000 – 0xFFFF FFFF | 0.5 GB | System Control Space at 0xE000 E000: **SysTick 0xE000 E010**, **NVIC 0xE000 E100**, SCB 0xE000 ED00, MPU, debug |

> [!source] Day04 L02 slides 17–18
> Flash “holds the program code … mapped to address 0x08000000 (common in STM32)”. SRAM “fast read/write memory for variables and stacks, located starting at 0x20000000”. System Control Space “mapped at 0xE0000000 … NVIC, SysTick, SCB, FPU control”. Peripheral space “mapped at 0x40000000 … each peripheral has its own register block”.

### Register address = peripheral base + offset

| Peripheral (bus) | Base | Example register |
|---|---|---|
| GPIOA (AHB1) | 0x4002 0000 | GPIOA_ODR = 0x4002 0014 |
| GPIOB (AHB1) | 0x4002 0400 | GPIOB_ODR = 0x4002 0414 |
| GPIOC (AHB1) | 0x4002 0800 | GPIOC_ODR = 0x4002 0814 |
| RCC (AHB1) | 0x4002 3800 | RCC_AHB1ENR = 0x4002 3830 |
| ADC1 (APB2) | 0x4001 2000 | ADC1_DR = 0x4001 204C |
| SYSCFG (APB2) | 0x4001 3800 | EXTICR1 = 0x4001 3808 |
| EXTI (APB2) | 0x4001 3C00 | EXTI_PR = 0x4001 3C14 |
| USART2 (APB1) | 0x4000 4400 | USART2_DR = 0x4000 4404 |
| I2C1 (APB1) | 0x4000 5400 | I2C1_CCR = 0x4000 541C |

In C, the header turns this into a struct pointer:

~~~c What stm32f4xx.h does for you (simplified)
typedef struct {
    volatile uint32_t MODER, OTYPER, OSPEEDR, PUPDR, IDR, ODR, BSRR, LCKR, AFR[2];
} GPIO_TypeDef;                                   // offsets 0x00, 0x04, 0x08 ...
#define GPIOC ((GPIO_TypeDef *) 0x40020800)
GPIOC->ODR |= (1U << 13);                          // a store to 0x40020814
~~~

## Buses inside the STM32F401

Valvano lists what can happen in parallel: **I-Code** fetches opcodes from Flash; **D-Code** reads constants from Flash; the **System bus** reads/writes SRAM and peripherals; the **PPB** reaches NVIC and SysTick. The AHB-to-APB bridges connect slower peripherals: APB1 (≤ 42 MHz: USART2, I2C1, TIM2–5) and APB2 (≤ 84 MHz: ADC1, SYSCFG, EXTI, USART1). This is why each peripheral has an enable bit in a different **RCC_xxxENR** register.

## Endianness

Cortex-M uses **little-endian**: the least significant byte is stored at the lowest address. 0x1234 5678 at 0x2000 0850 is stored 78 56 34 12. Strings are stored first character first in both conventions. *(Valvano §3.1.3; the STM32F401 is little-endian per the bit-band notes.)*

## Memory Protection Unit (Day04 L02 slides 19–20)

The optional MPU divides memory into up to **8 regions**, each with a base address, a power-of-two size (32 B … 4 GB), access permissions (read-only, read/write, no access, execute-never), privilege level and attributes (cacheable, shareable). Example from the lecture:

| Region | Base | Size | Access | Use |
|---|---|---|---|---|
| 0 | 0x0000 0000 | 512 KB | Read-only | Flash code |
| 1 | 0x2000 0000 | 128 KB | Read/write | SRAM: globals, stacks |
| 3 | 0x2002 1000 | 4 KB | No access | Guard region — detects stack overflow |
| 4 | 0x4000 0000 | 1 MB | Read/write | Peripheral registers |

An access that breaks a rule causes a MemManage fault instead of silently corrupting memory.
`,
  visual: md`
Click each region, look up any address (try 0x4002 0814 or 0xE000 E010) and see little-endian byte order:

::sim{memmap}

::diagram{memmap}
`,
  exam: {
    definitions: [
      { term: 'Reset vector', def: 'The address stored at 0x0000 0004 that is loaded into the PC at reset (address of the reset handler).' },
      { term: 'Memory-mapped I/O', def: 'Peripheral registers occupy addresses in the normal memory space and are accessed with ordinary load/store instructions.' },
      { term: 'Little-endian', def: 'Byte ordering in which the least significant byte of a multi-byte value is stored at the lowest address.' },
      { term: 'Vector table', def: 'Table at the start of the code region holding the initial SP value followed by the addresses of all exception handlers.' },
      { term: 'MPU region', def: 'An address range with defined size, permissions and attributes enforced by the Memory Protection Unit.' },
    ],
    formulas: [{ name: 'Peripheral register address', expr: 'address = peripheral_base + register_offset', example: 'RCC_AHB1ENR = 0x4002 3800 + 0x30 = 0x4002 3830' }],
    frequent: ['Draw the Cortex-M4 memory map.', 'Explain what happens at reset.', 'Compute a register address from base + offset (needed before every bit-band calculation).'],
    mistakes: ['Putting SRAM at 0x0800 0000 and Flash at 0x2000 0000 (swapped).', 'Saying SysTick is in the peripheral region (it is in the PPB at 0xE000 E010).', 'Forgetting the MSP is loaded from address 0 and the PC from address 4.', 'Writing big-endian byte order for Cortex-M.'],
    diagrams: ['4 GB memory map with regions and bit-band areas'],
    shortQs: [
      { q: 'What happens when the Cortex-M4 is reset?', a: md`It enters privileged thread mode using MSP; loads MSP from address 0x0000 0000 and PC from the reset vector at 0x0000 0004 (bit 0 = 1 sets the T bit); sets LR = 0xFFFFFFFF; then executes the reset handler, which eventually calls main().`, marks: 2 },
      { q: 'At what addresses are Flash, SRAM, GPIOC and SysTick on the STM32F401?', a: md`Flash 0x0800 0000 (aliased at 0), SRAM 0x2000 0000, GPIOC 0x4002 0800, SysTick 0xE000 E010.`, marks: 2 },
      { q: 'Show how 0x1234 5678 is stored at 0x2000 0000 in a little-endian system.', a: md`0x2000 0000: 78, 0x2000 0001: 56, 0x2000 0002: 34, 0x2000 0003: 12.`, marks: 2 },
    ],
    longQs: [
      { q: 'Draw and explain the memory map of the ARM Cortex-M4 processor. Indicate where the STM32F401 places its Flash, SRAM, GPIO ports and the System Control Space.', a: md`Draw six regions from 0x0000 0000 to 0xFFFF FFFF with sizes; mark Flash 0x0800 0000, SRAM 0x2000 0000 (+bit-band and alias), peripherals 0x4000 0000 (+bit-band and alias, GPIOA 0x4002 0000, GPIOB …0400, GPIOC …0800, RCC 0x4002 3800), PPB 0xE000 0000 (SysTick, NVIC, SCB). Explain memory-mapped I/O, the buses that serve each region and why the map is fixed across Cortex-M devices.`, marks: 8 },
      { q: 'Explain the Memory Protection Unit of the Cortex-M4 with an example region configuration.', a: md`Purpose (reliability/security), up to 8 regions, attributes (base, power-of-two size, permissions, privilege, memory type), fault on violation; give the lecture's table with a stack guard region; mention it differs from an MMU (no address translation).`, marks: 6 },
    ],
  },
  revision: {
    notes: [
      'Reset: MSP ← [0x0], PC ← [0x4] (reset vector), thread mode, privileged, LR = 0xFFFFFFFF.',
      'Code 0x0000 0000 (Flash 0x0800 0000), SRAM 0x2000 0000, peripherals 0x4000 0000, PPB 0xE000 0000.',
      'GPIOA 0x4002 0000, GPIOB 0x4002 0400, GPIOC 0x4002 0800, RCC 0x4002 3800.',
      'SysTick 0xE000 E010, NVIC 0xE000 E100.',
      'Little-endian: LSB at lowest address.',
      'MPU: 8 regions with permissions; violation → MemManage fault.',
    ],
    takeaways: ['Register address = base + offset — always show it.', 'Peripherals are just memory locations.', 'SysTick/NVIC are in the core’s PPB, not the peripheral region.'],
    mcqs: [
      { q: 'At reset the PC is loaded from address…', options: ['0x0000 0000', '0x0000 0004', '0x2000 0000', '0xE000 E010'], answer: 1, explain: 'Address 0 holds the initial MSP; address 4 holds the reset vector.' },
      { q: 'Where does the STM32F401 SRAM start?', options: ['0x0800 0000', '0x2000 0000', '0x4000 0000', '0x6000 0000'], answer: 1, explain: 'SRAM region base.' },
      { q: 'The SysTick registers are in which region?', options: ['Peripheral', 'SRAM', 'System / PPB', 'External RAM'], answer: 2, explain: '0xE000 E010 is in the System Control Space.' },
      { q: 'GPIOB_ODR address is…', options: ['0x4002 0014', '0x4002 0414', '0x4002 0814', '0x4002 0410'], answer: 1, explain: '0x4002 0400 + 0x14.' },
      { q: 'In little-endian storage of 0xAABBCCDD at address A, the byte at A is…', options: ['0xAA', '0xBB', '0xCC', '0xDD'], answer: 3, explain: 'Least significant byte first.' },
    ],
  },
};

export default topic;
