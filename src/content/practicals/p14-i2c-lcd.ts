import type { Practical } from '../../types';
import { md } from '../md';
import { I2C_LCD_C } from './code/i2c_lcd';

const p: Practical = {
  id: 'p14-i2c-lcd',
  order: 14,
  title: 'I²C 16×2 LCD showing the potentiometer value',
  unit: 3,
  objective: 'Drive a 16×2 HD44780 LCD through a PCF8574 I²C backpack using register-level I2C1, read the potentiometer with ADC1 and display “POT Value:” with the live reading; light PC13 above 3000.',
  components: ['STM32F401CCU6 Black Pill', '16×2 LCD with PCF8574 I²C backpack (address 0x27)', 'Potentiometer on PA0', 'On-board LED PC13', '4 jumper wires: 5 V/3.3 V, GND, SCL, SDA'],
  connections: [
    { pin: 'PB6', to: 'Backpack SCL', mode: 'AF4 I2C1_SCL, open-drain, pull-up' },
    { pin: 'PB7', to: 'Backpack SDA', mode: 'AF4 I2C1_SDA, open-drain, pull-up' },
    { pin: 'PA0', to: 'Potentiometer wiper', mode: 'Analog, ADC1_IN0' },
    { pin: 'PC13', to: 'On-board LED', mode: 'Output' },
  ],
  expected: md`Line 1 shows **POT Value:**, line 2 shows the ADC count (0–4095) updated every 0.5 s (with a brief flicker because the display is cleared each time). PC13 changes state when the value crosses 3000 — note the code drives PC13 **HIGH** above 3000, which turns the active-low on-board LED **OFF** (the comment “LED ON” assumes an active-high LED).`,
  sources: [{ file: 'EMBEDDED_LAB_MATERIALS/I2C/I2C_LCD_example.c' }, { file: 'Day10_8_I2C_Introduction.pptx', detail: 'register configuration' }],
  circuit: { leds: [{ pin: 'PC13', label: 'USER LED', activeLow: true }], analog: [{ pin: 'PA0', label: 'Potentiometer', kind: 'pot' }], i2c: { scl: 'PB6', sda: 'PB7', label: 'PCF8574 backpack @ 0x27' } },
  programs: [
    {
      id: 'lcd',
      title: 'I2C_LCD_example.c',
      file: 'EMBEDDED_LAB_MATERIALS/I2C/I2C_LCD_example.c',
      code: I2C_LCD_C,
      corrected: {
        code: md`/* Key fixes (rest of the program unchanged) */
#define I2C_TIMEOUT 100000U
static int I2C1_Write(uint8_t addr, uint8_t data) {
    uint32_t t = I2C_TIMEOUT;
    while ((I2C1->SR2 & (1U<<1)) && --t);  if (!t) return -1;      // BUSY
    I2C1->CR1 |= (1U<<8);                                         // START
    t = I2C_TIMEOUT; while (!(I2C1->SR1 & (1U<<0)) && --t); if (!t) return -1;
    I2C1->DR = addr;
    t = I2C_TIMEOUT;
    while (!(I2C1->SR1 & ((1U<<1) | (1U<<10))) && --t);           // ADDR or AF (NACK)
    if (!t || (I2C1->SR1 & (1U<<10))) {                            // no device answered
        I2C1->SR1 &= ~(1U<<10);  I2C1->CR1 |= (1U<<9);  return -1; // clear AF, STOP
    }
    (void)I2C1->SR2;
    while (!(I2C1->SR1 & (1U<<7)));  I2C1->DR = data;
    while (!(I2C1->SR1 & (1U<<2)));  I2C1->CR1 |= (1U<<9);
    return 0;
}
volatile uint32_t adcData;                       // unsigned to match "%u"
/* main loop: avoid flicker — no clear, pad the number instead */
LCD_SetCursor(1, 0);
sprintf(buf, "%-6lu", (unsigned long)adcData);   // left-aligned, padded with spaces
LCD_Print(buf);
/* PC13 is active-low: to turn the LED ON above 3000 use */
if (adcData > 3000) GPIOC->ODR &= ~(1U<<13); else GPIOC->ODR |= (1U<<13);`,
        changes: [
          'I2C1_Write had no NACK (AF) handling and no timeouts — with the LCD missing or at address 0x3F the program hung forever waiting for ADDR.',
          '«adcData» is «int» but printed with «%u» — made it unsigned (or use «%d»).',
          'Clearing the display (0x01, ~1.5 ms, visible flicker) every update replaced by overwriting a padded field.',
          'PC13 logic inverted to match the comment (“LED ON if ADC > 3000”) for the active-low on-board LED.',
          '«delay_ms» is an uncalibrated loop (ms × 8000 NOPs ≈ 2–3 ms per “ms” at 16 MHz); SysTick would be exact.',
        ],
      },
      explain: [
        { lines: [5, 5], what: 'LCD backpack address byte.', why: '7-bit address 0x27 shifted left with R/W = 0 → 0x4E, written straight into I2C1->DR.', register: 'used with I2C1_DR' },
        { lines: [13, 17], what: 'Software millisecond delay.', why: 'LCD commands need time to execute (blind-cycle synchronisation).', internal: 'ms × 8000 iterations of NOP + loop overhead — approximate.' },
        { lines: [24, 25], what: 'Clocks for GPIOB and I2C1.', why: 'Pins on port B; I2C1 on APB1.', register: 'RCC_AHB1ENR bit 1, RCC_APB1ENR bit 21' },
        { lines: [28, 29], what: 'PB6, PB7 → alternate function.', why: 'MODER6/7 = 10.', register: 'GPIOB_MODER bits 15:12' },
        { lines: [30, 30], what: 'Open-drain outputs.', why: 'I²C lines are shared and may only be pulled low; the pull-ups make them high.', register: 'GPIOB_OTYPER bits 6, 7', ifRemoved: 'Push-pull drivers could fight the slave during ACK → bus errors.' },
        { lines: [31, 32], what: 'High speed + internal pull-ups.', why: 'Sharp edges; pull-ups (the backpack usually also has 4.7 kΩ resistors).', register: 'GPIOB_OSPEEDR, GPIOB_PUPDR' },
        { lines: [33, 33], what: 'AF4 for PB6/PB7.', why: 'AF4 = I2C1 on these pins; AFRL fields at bits 27:24 and 31:28.', register: 'GPIOB_AFR[0]' },
        { lines: [36, 37], what: 'Software reset pulse.', why: 'SWRST puts the peripheral into a clean state (recovers a stuck bus).', register: 'I2C_CR1 bit 15' },
        { lines: [40, 42], what: 'Timing: FREQ = 16, CCR = 80, TRISE = 17.', why: 'PCLK1 = 16 MHz; CCR = 16 MHz/(2 × 100 kHz) = 80 → 100 kHz SCL; TRISE = 1000 ns/62.5 ns + 1.', register: 'I2C_CR2, I2C_CCR, I2C_TRISE' },
        { lines: [44, 44], what: 'Enable I2C1.', why: 'PE must be set after timing configuration.', register: 'I2C_CR1 bit 0' },
        { lines: [51, 53], what: 'Wait for bus free, generate START, wait SB.', why: 'BUSY (SR2 bit 1) must be 0; START makes SDA fall while SCL is high; SB confirms it.', register: 'I2C_SR2.BUSY, I2C_CR1.START, I2C_SR1.SB' },
        { lines: [55, 57], what: 'Send the address byte and clear ADDR.', why: 'ADDR = address sent and ACKed by the PCF8574; reading SR1 then SR2 clears it.', register: 'I2C_DR, I2C_SR1.ADDR, I2C_SR2', ifRemoved: 'Without reading SR2, ADDR stays set and the transfer stalls.' },
        { lines: [59, 60], what: 'Wait TXE, write the data byte.', why: 'The PCF8574 outputs this byte on P0–P7.', register: 'I2C_SR1.TXE, I2C_DR' },
        { lines: [62, 63], what: 'Wait BTF, then STOP.', why: 'BTF = byte fully shifted out and ACKed; STOP releases the bus.', register: 'I2C_SR1.BTF, I2C_CR1.STOP' },
        { lines: [69, 80], what: 'LCD_SendCmd: two nibbles with EN pulses (RS = 0).', why: 'Upper nibble | 0x0C (EN=1, backlight) then | 0x08 (EN=0) latches it; same for the lower nibble.', internal: '4 I²C transactions per LCD command.' },
        { lines: [82, 93], what: 'LCD_SendData: same with RS = 1.', why: '0x0D / 0x09 add RS (bit 0) so the byte goes to DDRAM as a character.' },
        { lines: [95, 104], what: 'LCD_Init sequence.', why: '0x33, 0x32 → force 4-bit mode; 0x28 → 4-bit, 2 lines, 5×8; 0x0C → display on, cursor off; 0x06 → increment; 0x01 → clear.' },
        { lines: [106, 109], what: 'LCD_SetCursor.', why: 'Row 0 → 0x80 + col; row 1 → 0xC0 + col (DDRAM 0x40 + col).' },
        { lines: [111, 115], what: 'LCD_Print.', why: 'Send characters until the null terminator.' },
        { lines: [120, 139], what: 'ADC1_Init: same register sequence as P06 (PA0, channel 0, continuous).', why: 'Pot on PA0.', register: 'APB2ENR bit 8, MODER0 = 11, SMPR2, CCR, CR1, CR2, SQR3, SQR1, ADON, SWSTART' },
        { lines: [144, 148], what: 'LED_Init: PC13 output.', why: '«(13 * 2)» computes the MODER shift explicitly.', register: 'GPIOC_MODER bits 27:26' },
        { lines: [153, 159], what: 'main: initialise everything.', why: 'I²C before the LCD; ADC; LED.' },
        { lines: [163, 164], what: 'Wait EOC, read the pot.', why: 'Polling.', register: 'ADC_SR.EOC, ADC_DR' },
        { lines: [167, 170], what: 'PC13 on/off by threshold 3000.', why: 'Above 3000 sets PC13 HIGH → the active-low LED actually turns OFF (see corrected version).' },
        { lines: [173, 178], what: 'Clear, write label, move to row 2, print the number.', why: 'sprintf converts the integer to ASCII digits before sending them as characters.' },
        { lines: [180, 180], what: 'Wait ~0.5 s.', why: 'Readable update rate.' },
      ],
    },
  ],
  flow: [
    { label: 'main()', detail: 'Start, HSI 16 MHz.', kind: 'start' },
    { label: 'I2C1_Init', detail: 'PB6/PB7 AF4 open-drain; SWRST; CR2 16; CCR 80; TRISE 17; PE.', kind: 'init' },
    { label: 'LCD_Init', detail: '0x33, 0x32, 0x28, 0x0C, 0x06, 0x01 — each as 4 I²C writes.', kind: 'init' },
    { label: 'ADC1_Init, LED_Init', detail: 'Pot on PA0 continuous; PC13 output.', kind: 'init' },
    { label: 'Wait EOC → adcData', detail: 'Read pot.', kind: 'loop' },
    { label: 'adcData > 3000 ?', detail: 'PC13 HIGH or LOW.', kind: 'decision' },
    { label: 'Update LCD', detail: 'Clear, “POT Value:”, row 2, number.', kind: 'io' },
    { label: 'delay_ms(500), repeat', detail: 'Loop.', kind: 'loop' },
  ],
  sim: { id: 'lcd', preset: 'ready' },
  exam: {
    viva: [
      { q: 'Why is the address 0x4E and not 0x27?', a: 'The I²C address byte carries the 7-bit address in bits 7:1 and R/W in bit 0: 0x27 << 1 | 0 = 0x4E.' },
      { q: 'How does a byte reach the LCD data pins?', a: 'The PCF8574 copies each received I²C byte onto P0–P7, which are wired to RS, RW, EN, backlight and D4–D7.' },
      { q: 'Why does the LCD need EN pulses?', a: 'The HD44780 latches the nibble on the falling edge of EN.' },
      { q: 'Why are the I²C pins open-drain?', a: 'Shared lines: devices pull low, resistors pull high; this enables ACK and multiple devices without shorts.' },
      { q: 'What does sprintf do here?', a: 'Converts the integer ADC value into a string of ASCII digits for the LCD.' },
    ],
    registerQs: [
      { q: 'Derive CCR = 80 and TRISE = 17.', a: 'T_PCLK1 = 62.5 ns. CCR = (1000 + 4000)/62.5 = 80 (or 16 MHz/200 kHz). TRISE = 1000/62.5 + 1 = 17.' },
      { q: 'How is the ADDR flag cleared?', a: 'Read SR1 (done in the wait loop) then read SR2.' },
      { q: 'Which RCC bits are needed?', a: 'AHB1ENR bit 1 (GPIOB), bit 0 (GPIOA), bit 2 (GPIOC); APB1ENR bit 21 (I2C1); APB2ENR bit 8 (ADC1).' },
    ],
    pinQs: [{ q: 'Which pins and AF are used for I2C1?', a: 'PB6 SCL, PB7 SDA, AF4.' }],
    outputQs: [{ q: 'What is shown when the pot is at mid position?', a: '“POT Value:” and about 2048 on the second line.' }],
    debugQs: [
      { q: 'The program hangs in I2C1_Write at the ADDR wait. Causes?', a: 'Wrong address (backpack at 0x3F → use 0x7E), wiring swapped SDA/SCL, no pull-ups, LCD not powered — the slave NACKs and ADDR never sets.' },
      { q: 'The backlight is on but no characters appear.', a: 'Contrast potentiometer on the backpack needs adjusting, or the init sequence/timing is wrong.' },
    ],
    errors: ['Using 0x27 directly in DR.', 'Push-pull SDA/SCL.', 'Wrong AF (AF7).', 'Not reading SR2 after ADDR.', 'Sending numbers instead of ASCII.'],
    modifications: ['Show the voltage in volts with one decimal.', 'Show a bar graph of the pot value on row 2.', 'Display the LDR value on row 1 and the pot on row 2.', 'Add NACK handling and an “LCD not found” LED blink.', 'Update without clearing (no flicker).'],
    explainToExaminer: md`“The program has three drivers. I2C1 is set up on PB6/PB7 as AF4 open-drain, reset, timed for 100 kHz with CCR = 80 and TRISE = 17, then enabled; I2C1_Write sends START, the address 0x4E, one data byte and STOP while checking SB, ADDR, TXE and BTF. The LCD driver splits every command or character into two nibbles and pulses EN through the PCF8574 bits, after the 0x33/0x32/0x28/0x0C/0x06/0x01 init sequence. The ADC reads the pot continuously, and the main loop prints the value on line 2 every half second.”`,
  },
  memorise: {
    essentials: ['PB6/PB7: MODER 10, OTYPER 1, PUPDR 01, AFR[0] |= (4<<24)|(4<<28)', 'RCC->APB1ENR |= (1<<21);', 'I2C1->CR1 SWRST pulse; CR2 = 16; CCR = 80; TRISE = 17; CR1 |= PE', 'Write: BUSY → START → SB → DR=0x4E → ADDR → SR2 → TXE → DR=data → BTF → STOP', 'LCD: nibble | 0x0C then | 0x08 (cmd); | 0x0D then | 0x09 (data)', 'Init: 0x33 0x32 0x28 0x0C 0x06 0x01; cursor 0x80 / 0xC0'],
    patterns: [{ name: 'Nibble send', code: 'I2C1_Write(0x4E, nib | 0x0C);  // EN=1\nI2C1_Write(0x4E, nib | 0x08);  // EN=0' }],
    skeleton: md`I2C1_Init(); LCD_Init(); ADC1_Init(); LED_Init();
while(1){ wait EOC; v = ADC1->DR; LCD_SetCursor(0,0); LCD_Print("POT Value:");
          LCD_SetCursor(1,0); sprintf(buf,"%u",v); LCD_Print(buf); delay_ms(500); }`,
  },
  topics: ['i2c-stm32', 'lcd', 'i2c', 'adc-stm32'],
};

export default p;
