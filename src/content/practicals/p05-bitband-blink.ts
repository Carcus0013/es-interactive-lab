import type { Practical } from '../../types';
import { md } from '../md';

const CODE = md`#include <stdint.h>

// Peripheral and Bit-Band Base Addresses
#define PERIPH_BASE        0x40000000
#define PERIPH_BB_BASE     0x42000000

// GPIO and RCC Register Addresses
#define RCC_AHB1ENR        0x40023830
#define GPIOC_MODER        0x40020800
#define GPIOC_ODR          0x40020814

// Bit positions
#define RCC_IOPC_EN_BIT    2
#define GPIOC_MODER13_0    26
#define GPIOC_MODER13_1    27
#define GPIOC_ODR13_BIT    13

// Bit-band alias address calculation macro
#define BITBAND_PERI(addr, bit) \
    ((volatile uint32_t *)(PERIPH_BB_BASE + (((addr) - PERIPH_BASE) * 32) + ((bit) * 4)))

void delay(volatile uint32_t time)
{
    while(time--);
}

int main(void)
{
    // 1. Enable GPIOC clock
    *BITBAND_PERI(RCC_AHB1ENR, RCC_IOPC_EN_BIT) = 1;

    // 2. Configure PC13 as General Purpose Output
    // Clear MODER13[1] (bit 27)
    *BITBAND_PERI(GPIOC_MODER, GPIOC_MODER13_1) = 0;
    // Set MODER13[0] (bit 26)
    *BITBAND_PERI(GPIOC_MODER, GPIOC_MODER13_0) = 1;

    while (1)
    {
        // Turn ON LED (PC13 LOW)
        *BITBAND_PERI(GPIOC_ODR, GPIOC_ODR13_BIT) = 0;
        delay(500000);

        // Turn OFF LED (PC13 HIGH)
        *BITBAND_PERI(GPIOC_ODR, GPIOC_ODR13_BIT) = 1;
        delay(500000);
    }
}`;

const p: Practical = {
  id: 'p05-bitband-blink',
  order: 5,
  title: 'LED blink using bit-banding',
  unit: 1,
  objective: 'Blink the PC13 LED without any read-modify-write: enable the clock, configure the pin and drive it by writing 1/0 to bit-band alias addresses.',
  components: ['STM32F401CCU6 Black Pill', 'On-board LED PC13'],
  connections: [{ pin: 'PC13', to: 'On-board LED (active-low)', mode: 'Output via bit-band writes' }],
  expected: md`The PC13 LED blinks continuously, exactly like the ODR version — but every register change is a single, atomic store to an alias word. In the debugger you can see the stores going to 0x4247 0608, 0x4241 006C, 0x4241 0068 and 0x4241 02B4.`,
  sources: [{ file: 'Day06_LED blink using bit band concepts.pptx', detail: 'slides 10–18 (program shown as images)' }, { file: 'Bit_banding_notes.pdf', detail: 'PC13 alias 0x424102B4' }],
  circuit: { leds: [{ pin: 'PC13', label: 'USER LED', activeLow: true }] },
  programs: [
    {
      id: 'bb',
      title: 'Bit-band blink (Day06)',
      file: 'Day06 slides 10–18 (transcribed from slide images)',
      code: CODE,
      explain: [
        { lines: [1, 1], what: 'Include <stdint.h> only — no device header.', why: 'The program defines every address itself, so it needs only «uint32_t».' },
        { lines: [4, 5], what: 'Peripheral bit-band region base and alias base.', why: 'The two constants of the bit-band formula for the peripheral region.', register: '0x4000 0000 → alias 0x4200 0000' },
        { lines: [8, 10], what: 'Absolute register addresses from RM0368.', why: 'RCC base 0x4002 3800 + 0x30; GPIOC base 0x4002 0800 (+0x00 MODER, +0x14 ODR).' },
        { lines: [13, 16], what: 'Bit positions inside those registers.', why: 'GPIOCEN = bit 2; MODER13 = bits 27:26; ODR13 = bit 13.' },
        { lines: [19, 20], what: 'BITBAND_PERI macro: alias address as a volatile pointer.', why: 'alias = 0x4200 0000 + (addr − 0x4000 0000) × 32 + bit × 4.', internal: 'For ODR13: 0x4200 0000 + 0x20814 × 32 + 52 = 0x4241 02B4. «volatile» forces every write to reach the bus.', ifRemoved: 'Without volatile the compiler could merge or drop the writes.' },
        { lines: [22, 25], what: 'Software delay.', why: 'Counts down a volatile argument so the loop is not optimised away.' },
        { lines: [30, 30], what: 'Enable GPIOC clock through its alias.', why: 'Writing 1 to the alias of RCC_AHB1ENR bit 2 sets only that bit, atomically.', register: 'alias 0x4247 0608 (= 0x4200 0000 + 0x23830 × 32 + 8)', internal: 'The bus matrix performs the read-modify-write of RCC_AHB1ENR in hardware.' },
        { lines: [34, 36], what: 'MODER13 = 01 using two bit writes.', why: 'Clear bit 27, set bit 26 — one alias word each.', register: 'aliases 0x4241 006C (bit 27) and 0x4241 0068 (bit 26)' },
        { lines: [41, 41], what: 'PC13 LOW → LED ON.', why: 'Active-low LED. One STR to 0x4241 02B4; no other ODR bit can be disturbed.', register: 'GPIOC_ODR bit 13 via alias 0x4241 02B4' },
        { lines: [45, 45], what: 'PC13 HIGH → LED OFF.', why: 'Write 1 to the same alias.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start-up done, HSI 16 MHz.', kind: 'start' },
    { label: 'Alias write: RCC GPIOCEN = 1', detail: '*0x42470608 = 1 — GPIOC clock on.', kind: 'init' },
    { label: 'Alias writes: MODER13 = 01', detail: '*0x4241006C = 0, *0x42410068 = 1.', kind: 'init' },
    { label: 'Alias write: ODR13 = 0 (LED ON)', detail: '*0x424102B4 = 0 — atomic.', kind: 'loop' },
    { label: 'delay(500000)', detail: 'Busy-wait.', kind: 'loop' },
    { label: 'Alias write: ODR13 = 1 (LED OFF)', detail: '*0x424102B4 = 1.', kind: 'io' },
    { label: 'delay, repeat', detail: 'Loop forever.', kind: 'loop' },
  ],
  sim: { id: 'bitband', preset: 'pc13' },
  exam: {
    viva: [
      { q: 'What is the advantage of writing the LED through the bit-band alias?', a: 'The write is atomic (single store, hardware RMW), so an interrupt cannot corrupt other ODR bits; it also needs no masking.' },
      { q: 'Why multiply the byte offset by 32 and the bit number by 4?', a: 'Each byte has 8 bits and each bit maps to a 4-byte alias word, so a byte occupies 32 alias bytes; consecutive bits are 4 bytes apart.' },
      { q: 'Could SysTick->CTRL be accessed with BITBAND_PERI?', a: 'No — SysTick is at 0xE000 E010, outside the 1 MB peripheral bit-band region.' },
    ],
    registerQs: [
      { q: 'Compute the alias of RCC_AHB1ENR bit 2.', a: '0x4200 0000 + (0x4002 3830 − 0x4000 0000) × 32 + 2 × 4 = 0x4200 0000 + 0x0047 0600 + 8 = 0x4247 0608.' },
      { q: 'Compute the alias of GPIOC_MODER bit 26.', a: '0x4200 0000 + 0x20800 × 32 + 104 = 0x4241 0000 + 0x68 = 0x4241 0068.' },
    ],
    pinQs: [{ q: 'Which alias would blink PB9 instead?', a: 'GPIOB_ODR = 0x4002 0414 → 0x4200 0000 + 0x20414 × 32 + 9 × 4 = 0x4240 8280 + 0x24 = 0x4240 82A4.' }],
    outputQs: [{ q: 'What happens if BITBAND_PERI(GPIOC_ODR, 14) is written instead of 13?', a: 'PC14 is driven instead; PC13 is not an output change, so the on-board LED stays as it was.' }],
    debugQs: [{ q: 'The LED does not blink and the debugger shows a HardFault. A likely cause?', a: 'A wrong address in a macro (outside any region, or a typo) causing a bus fault on the alias write.' }],
    errors: ['Using the SRAM alias base 0x2200 0000.', 'Forgetting to subtract PERIPH_BASE.', 'Bit number × 4 forgotten.', 'Dropping volatile from the pointer cast.'],
    modifications: ['Blink PB9 via its alias.', 'Read a switch through a bit-band alias: «if (*BITBAND_PERI(0x40020410, 10) == 0)» for PB10 IDR.', 'Toggle by reading and writing the same alias: «*a = !*a;».'],
    explainToExaminer: md`“Instead of |= and &= ~ on whole registers, I compute each bit's alias address with the bit-band formula and write 1 or 0 to it. The bus converts that store into an atomic read-modify-write of the real register. So enabling the clock, setting MODER13 to 01 and driving ODR13 are all single, uninterruptible stores — for example ODR13's alias is 0x4241 02B4.”`,
  },
  memorise: {
    essentials: ['#define PERIPH_BASE 0x40000000', '#define PERIPH_BB_BASE 0x42000000', '#define BITBAND_PERI(a,b) ((volatile uint32_t*)(PERIPH_BB_BASE + (((a)-PERIPH_BASE)*32) + ((b)*4)))', '*BITBAND_PERI(RCC_AHB1ENR, 2) = 1;', '*BITBAND_PERI(GPIOC_MODER, 27) = 0; *BITBAND_PERI(GPIOC_MODER, 26) = 1;', '*BITBAND_PERI(GPIOC_ODR, 13) = 0 / 1;'],
    patterns: [{ name: 'Alias formula', code: 'alias = 0x42000000 + (addr - 0x40000000)*32 + bit*4' }],
    skeleton: md`#define BB(a,b) ((volatile uint32_t*)(0x42000000 + (((a)-0x40000000)*32) + ((b)*4)))
int main(void){
    *BB(0x40023830, 2) = 1;          // GPIOC clock
    *BB(0x40020800, 27) = 0;         // MODER13 = 01
    *BB(0x40020800, 26) = 1;
    while(1){ *BB(0x40020814,13) = 0; delay(500000); *BB(0x40020814,13) = 1; delay(500000); }
}`,
  },
  topics: ['bit-banding', 'memory-map', 'gpio-registers'],
};

export default p;
