import type { Practical } from '../../types';
import { md } from '../md';

const EXP1 = md`#include "stm32f4xx.h"
int main (void)
{
RCC->AHB1ENR |= (1<<2);
GPIOC->MODER |= (1<<26);
GPIOC->ODR &=	~(1<<13);
}`;

const EXP2 = md`#include "stm32f4xx.h"
int main (void)
{
RCC->AHB1ENR |= (1<<2);
GPIOC->MODER |= (1<<28);
GPIOC->ODR |=	(1<<14);
}`;

const EXP3 = md`#include "stm32f4xx.h"
int main (void)
{
RCC->AHB1ENR |= (1<<1); //clock to port B
GPIOB->MODER |= (1<<18); // 18 th pin 1
GPIOB->MODER &= ~(1<<19); // 19th pin 0
GPIOB->ODR |=	(1<<9);	// turn ON LED on PB 9
}`;

const p: Practical = {
  id: 'p01-led-on',
  order: 1,
  title: 'Turn ON an LED (PC13, PC14, PB9)',
  unit: 2,
  objective: 'Configure a GPIO pin as a digital output at register level and switch on the on-board LED (PC13, active-low) and the kit LEDs (PC14 and PB9, active-high).',
  components: ['STM32F401CCU6 Black Pill', 'On-board user LED on PC13', 'Extension board LED1 (PC14) and LED2 (PB9) with series resistors', 'USB cable + ST-Link (SWD) for download', 'Keil µVision 5'],
  connections: [
    { pin: 'PC13', to: 'On-board LED cathode (anode → 3.3 V through resistor)', mode: 'Output, push-pull, active-low' },
    { pin: 'PC14', to: 'LED1 → resistor → GND', mode: 'Output, active-high' },
    { pin: 'PB9', to: 'LED2 → resistor → GND', mode: 'Output, active-high' },
  ],
  expected: md`- **EXP_1:** the blue/green on-board LED next to PC13 lights and stays on.
- **EXP_2:** LED1 on the extension board lights.
- **EXP_3:** LED2 on the extension board lights.
Nothing changes after that — the programs write the output once.`,
  sources: [
    { file: 'EMBEDDED_LAB_MATERIALS/Lab_1/EXP_1_LED_PC_13.txt' },
    { file: 'EMBEDDED_LAB_MATERIALS/Lab_1/EXP_2_LED_PC_14.txt' },
    { file: 'EMBEDDED_LAB_MATERIALS/Lab_1/EXP_3_LED_PB_9.txt' },
    { file: 'STM32F401CCU6_Intro_GPIO.pptx', detail: 'slides 8–14' },
  ],
  circuit: {
    leds: [
      { pin: 'PC13', label: 'USER LED', activeLow: true },
      { pin: 'PC14', label: 'LED1' },
      { pin: 'PB9', label: 'LED2' },
    ],
  },
  programs: [
    {
      id: 'exp1',
      title: 'EXP_1 — PC13',
      file: 'Lab_1/EXP_1_LED_PC_13.txt',
      code: EXP1,
      corrected: {
        code: md`#include "stm32f4xx.h"
int main(void)
{
    RCC->AHB1ENR |= (1U << 2);        // GPIOC clock on
    GPIOC->MODER &= ~(3U << 26);      // clear MODER13
    GPIOC->MODER |=  (1U << 26);      // MODER13 = 01 (output)
    GPIOC->ODR   &= ~(1U << 13);      // PC13 LOW -> on-board LED ON (active-low)
    while (1) {
        // stay here; embedded programs must never return from main
    }
}`,
        changes: [
          'Added «while(1)» — the original returns from «main()»; it works only because the C start-up code traps the return in a loop.',
          'Clear both MODER bits before setting — robust even if the register was not at its reset value.',
          'Used «1U» (unsigned) shifts and comments.',
        ],
      },
      explain: [
        { lines: [1, 1], what: 'Include the CMSIS device header.', why: 'It defines «RCC», «GPIOC» etc. as pointers to the register structures at their real addresses.', internal: '«GPIOC» expands to «((GPIO_TypeDef *) 0x40020800)», so «GPIOC->ODR» is the 32-bit word at 0x4002 0814.', ifRemoved: 'Compile errors: RCC and GPIOC undeclared.' },
        { lines: [2, 3], what: 'Program entry point.', why: 'The reset handler calls «main()» after the start-up code initialises memory and the clock (HSI 16 MHz).' },
        { lines: [4, 4], what: 'Enable the clock of GPIO port C.', why: 'All peripheral clocks are off after reset; port C ignores writes until its clock runs.', register: 'RCC_AHB1ENR (0x4002 3830) bit 2 = GPIOCEN', internal: 'Read-modify-write: OR with 0x0000 0004 sets bit 2 and keeps any other enabled ports.', ifRemoved: 'MODER/ODR writes are ignored — the LED never lights (the most common lab bug).' },
        { lines: [5, 5], what: 'Make PC13 a general-purpose output.', why: 'MODER13 (bits 27:26) must be 01; reset value is 00 (input).', register: 'GPIOC_MODER bit 26 = 1 (bit 27 stays 0 from reset)', internal: '13 × 2 = 26: each pin owns two MODER bits.', ifRemoved: 'PC13 stays an input; ODR has no effect on the pin.' },
        { lines: [6, 6], what: 'Drive PC13 LOW → LED ON.', why: 'The on-board LED’s cathode is connected to PC13 and its anode to 3.3 V, so current flows when the pin is 0 (active-low).', register: 'GPIOC_ODR bit 13 = 0', internal: 'AND with ~(1<<13) = 0xFFFF DFFF clears only bit 13; the N-MOS transistor of the output stage pulls the pin to GND.', ifRemoved: 'ODR13 stays 0 from reset anyway, so the LED would still light — but you should not rely on reset values.' },
        { lines: [7, 7], what: 'End of main — returns!', why: 'There is no OS to return to; the program ends here.', internal: 'The Keil C library calls «exit()», which loops forever. The pin keeps its last value, so the LED stays on.', ifRemoved: '—' },
      ],
    },
    {
      id: 'exp2',
      title: 'EXP_2 — PC14',
      file: 'Lab_1/EXP_2_LED_PC_14.txt',
      code: EXP2,
      corrected: {
        code: md`#include "stm32f4xx.h"
int main(void)
{
    RCC->AHB1ENR |= (1U << 2);                         // GPIOC clock
    GPIOC->MODER = (GPIOC->MODER & ~(3U << 28)) | (1U << 28);   // PC14 output
    GPIOC->ODR  |= (1U << 14);                         // PC14 HIGH -> LED1 ON
    while (1) { }
}`,
        changes: ['Added «while(1)».', 'Cleared MODER14 before setting it.'],
      },
      explain: [
        { lines: [4, 4], what: 'Enable GPIOC clock.', why: 'PC14 is on port C.', register: 'RCC_AHB1ENR bit 2' },
        { lines: [5, 5], what: 'PC14 as output.', why: 'MODER14 = bits 29:28 → 01.', register: 'GPIOC_MODER bit 28 = 1', internal: '14 × 2 = 28.', ifRemoved: 'Pin remains input; LED off.' },
        { lines: [6, 6], what: 'Drive PC14 HIGH → LED1 ON.', why: 'LED1 is wired pin → resistor → LED → GND (active-high): current flows when the pin is 1.', register: 'GPIOC_ODR bit 14 = 1', internal: 'The P-MOS of the push-pull stage connects the pin to 3.3 V.', ifRemoved: 'ODR14 = 0 → LED off.' },
      ],
    },
    {
      id: 'exp3',
      title: 'EXP_3 — PB9',
      file: 'Lab_1/EXP_3_LED_PB_9.txt',
      code: EXP3,
      corrected: { code: md`#include "stm32f4xx.h"
int main(void)
{
    RCC->AHB1ENR |= (1U << 1);      // clock to port B
    GPIOB->MODER |=  (1U << 18);    // MODER9 bit 18 = 1
    GPIOB->MODER &= ~(1U << 19);    // MODER9 bit 19 = 0  -> 01 output
    GPIOB->ODR   |=  (1U << 9);     // PB9 HIGH -> LED2 ON
    while (1) { }
}`, changes: ['Added «while(1)»; otherwise identical — this program already clears bit 19 explicitly, which is the robust way to write a 2-bit field.'] },
      explain: [
        { lines: [4, 4], what: 'Enable GPIOB clock.', why: 'PB9 belongs to port B.', register: 'RCC_AHB1ENR bit 1 = GPIOBEN', ifRemoved: 'No effect on PB9.' },
        { lines: [5, 6], what: 'MODER9 = 01 (output), written bit by bit.', why: 'Set bit 18 and clear bit 19 so the field is exactly 01 whatever it was before.', register: 'GPIOB_MODER bits 19:18', internal: 'GPIOB_MODER resets to 0x0000 0280 (PB3/PB4 debug pins) — bits 19:18 are already 00, but clearing explicitly is good practice.', ifRemoved: 'If line 6 were removed and bit 19 happened to be 1, the field would be 11 (analog) and the LED would not light.' },
        { lines: [7, 7], what: 'PB9 HIGH → LED2 ON.', why: 'Active-high LED.', register: 'GPIOB_ODR bit 9' },
      ],
    },
  ],
  flow: [
    { label: 'Reset → start-up code', detail: 'MSP and PC loaded from the vector table; SystemInit leaves the clock at HSI 16 MHz; «main()» is called.', kind: 'start' },
    { label: 'Enable GPIO port clock', detail: '«RCC->AHB1ENR |= (1<<2);» — port C (or port B for PB9) starts receiving a clock.', kind: 'init' },
    { label: 'Configure pin as output', detail: 'MODER field of the pin = 01 (general-purpose output, push-pull by default).', kind: 'init' },
    { label: 'Write ODR', detail: 'PC13: write 0 (active-low). PC14/PB9: write 1 (active-high). The LED lights.', kind: 'io' },
    { label: 'main() returns / loops', detail: 'Original: returns into the library’s exit loop. Corrected: «while(1)». The pin keeps its value.', kind: 'end' },
  ],
  sim: { id: 'gpio', preset: 'exp1' },
  exam: {
    viva: [
      { q: 'Why must the RCC clock be enabled first?', a: 'Peripheral clocks are gated off after reset to save power; a GPIO port without a clock ignores register writes.' },
      { q: 'Why does PC13 need a 0 to switch the LED on, but PC14 a 1?', a: 'The on-board LED is wired from 3.3 V to PC13 (pin sinks current, active-low) because PC13–PC15 cannot source current; the kit LEDs are wired from the pin to GND (active-high).' },
      { q: 'What does the header stm32f4xx.h provide?', a: 'CMSIS definitions: register structures and base-address macros (RCC, GPIOA…), bit names and core functions.' },
      { q: 'What happens when main() returns on a bare-metal system?', a: 'There is no OS; the C library start-up code catches the return in an infinite loop (or the CPU executes garbage on other toolchains). Always end with while(1).' },
    ],
    registerQs: [
      { q: 'Which RCC register and bit enable GPIOB?', a: 'RCC_AHB1ENR bit 1 (GPIOBEN).' },
      { q: 'Which MODER bits configure PB9 and what value makes it an output?', a: 'Bits 19:18 (2 × 9); value 01.' },
      { q: 'What is the address of GPIOC_ODR?', a: '0x4002 0800 + 0x14 = 0x4002 0814.' },
    ],
    pinQs: [
      { q: 'Which pins are the kit LEDs on?', a: 'On-board USER LED PC13 (active-low); LED1 PC14 and LED2 PB9 (active-high).' },
      { q: 'Can PC13 be used to source current to an LED?', a: 'No — per the datasheet PC13–PC15 can sink only ~3 mA and must not be used as current sources.' },
    ],
    outputQs: [
      { q: 'What is seen if line 6 of EXP_1 is changed to GPIOC->ODR |= (1<<13)?', a: 'PC13 goes HIGH → no current through the LED → it stays OFF.' },
      { q: 'What happens if EXP_3 enables port C instead of port B?', a: 'GPIOB has no clock, its registers are not written, PB9 stays an input and LED2 stays off.' },
    ],
    debugQs: [
      { q: 'The LED never lights. List three checks.', a: '1) RCC enable bit for the correct port; 2) MODER field = 01 at bits 2n+1:2n; 3) correct ODR polarity (0 for PC13). Also verify the program was downloaded and the board reset.' },
      { q: 'In the Keil debugger GPIOC->MODER reads 0 after line 5. Why?', a: 'The GPIOC clock is off (line 4 missing or wrong bit) — writes to an unclocked peripheral are lost.' },
    ],
    errors: [
      'Enabling the wrong port in RCC_AHB1ENR (bit 0 A, 1 B, 2 C).',
      'Using bit n instead of 2n in MODER (e.g. «1<<13» for PC13).',
      'Setting PC13 HIGH and expecting the on-board LED to light.',
      'Forgetting while(1) when adding more code after the LED write.',
    ],
    modifications: [
      'Turn on all three LEDs in one program.',
      'Use BSRR instead of ODR: «GPIOC->BSRR = (1U<<(13+16));» for PC13 ON.',
      'Turn on PC14 only if PA0 key is pressed (leads to Lab 3).',
      'Make PC13 open-drain (OTYPER) and confirm it still works (it only needs to sink).',
    ],
    explainToExaminer: md`“The program has three register steps. First I enable the clock of port C in RCC_AHB1ENR bit 2, because GPIO ports are clock-gated after reset. Second I set MODER13 — bits 27 and 26 — to 01 so PC13 becomes a push-pull output. Third I clear ODR bit 13: the on-board LED is active-low, its cathode is on PC13, so a 0 lets current flow and the LED turns on. For PC14 and PB9 the LEDs are active-high, so I set the ODR bit instead.”`,
  },
  memorise: {
    essentials: ['RCC->AHB1ENR |= (1U<<port);  // A=0, B=1, C=2', 'GPIOx->MODER &= ~(3U<<(2*n));', 'GPIOx->MODER |=  (1U<<(2*n));  // 01 output', 'GPIOC->ODR &= ~(1U<<13);  // PC13 LED ON (active-low)', 'GPIOx->ODR |= (1U<<n);   // PC14/PB9 LED ON (active-high)', 'while(1){}'],
    patterns: [
      { name: 'Clock enable', code: 'RCC->AHB1ENR |= (1U << PORT_BIT);' },
      { name: 'Pin n as output', code: 'GPIOx->MODER = (GPIOx->MODER & ~(3U << (2*n))) | (1U << (2*n));' },
    ],
    skeleton: md`#include "stm32f4xx.h"
int main(void) {
    RCC->AHB1ENR |= (1U<<2);        // 1 clock
    GPIOC->MODER &= ~(3U<<26);      // 2 mode
    GPIOC->MODER |=  (1U<<26);
    GPIOC->ODR   &= ~(1U<<13);      // 3 output (PC13 LED ON)
    while (1) { }
}`,
  },
  topics: ['stm32-board', 'gpio-registers', 'bit-manipulation', 'leds-switches'],
};

export default p;
