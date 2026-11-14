import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'lcd',
  unit: 2,
  order: 8,
  title: 'LCD interfacing (16×2 HD44780 over I²C)',
  short: 'How a character LCD works, its command set and DDRAM addresses, 4-bit mode, and the PCF8574 I²C backpack used in the lab program.',
  status: 'course',
  sources: [
    { file: 'EMBEDDED_LAB_MATERIALS/I2C/I2C_LCD_example.c', detail: 'complete driver: LCD_SendCmd, LCD_SendData, LCD_Init, LCD_SetCursor, LCD_Print' },
    { file: 'Day10_8_I2C_Introduction.pptx', detail: 'I²C configuration used by the LCD' },
  ],
  externalNote: md`The HD44780 command meanings and timings come from the controller datasheet (external); the code and pin mapping are from your lab program.`,
  keywords: ['LCD', 'HD44780', '16x2', 'PCF8574', 'I2C backpack', '0x27', '0x4E', 'DDRAM', 'command', 'RS', 'EN', 'RW', 'backlight', '4-bit mode', 'set cursor', '0x80', '0xC0'],
  importance: 2,
  practicals: ['p14-i2c-lcd'],
  sims: ['lcd', 'i2c'],
  related: ['i2c', 'i2c-stm32', 'adc-stm32'],
  fundamentals: {
    what: md`A **16×2 character LCD** shows two lines of 16 characters. It contains an **HD44780** (or compatible) controller with its own memory (DDRAM) and character generator. You send it **commands** (clear, move cursor, display on) and **data** (ASCII codes). The lab connects it through a **PCF8574 I²C backpack**, so only two wires (SCL, SDA) are needed.`,
    why: md`LEDs can show only on/off status; an LCD can show text and numbers — sensor values, menus, messages — which almost every case-study project needs (“display interface” is mandatory).`,
    problem: md`A parallel HD44780 needs 6–11 GPIO pins; the I²C backpack reduces this to 2 pins shared with other I²C devices, at the cost of sending several I²C bytes per character.`,
    how: md`The PCF8574 is an 8-bit I/O expander: each byte written over I²C appears on its pins P0–P7, which are wired to the LCD's RS, RW, EN, backlight and data lines D4–D7. The LCD runs in **4-bit mode**: each 8-bit value is sent as two nibbles, and each nibble is latched by pulsing **EN** high then low.`,
    where: md`Lab program: shows “POT Value:” and the live ADC reading. Typical products: printers, vending machines, appliances, lab instruments.`,
  },
  detailed: md`
## Wiring: PCF8574 → HD44780 (from the lab code)

::diagram{lcd-i2c}

| PCF8574 bit | LCD signal | Value used in code |
|---|---|---|
| P0 | RS (0 = command, 1 = data) | 0x01 |
| P1 | RW (0 = write) | always 0 |
| P2 | EN (latch on falling edge) | 0x04 |
| P3 | Backlight | 0x08 (always on) |
| P4–P7 | D4–D7 (data nibble) | upper 4 bits |

So «high | 0x0C» = nibble + backlight + EN = 1 (command), and «high | 0x08» = nibble + backlight + EN = 0. For data, «0x0D» and «0x09» also set RS = 1.

I²C address: the 7-bit address is **0x27**; the code uses the 8-bit write address **0x4E** = 0x27 << 1 | 0 (R/W = write).

## Sending one byte (lab code)

~~~c LCD_SendCmd
void LCD_SendCmd(uint8_t cmd) {
    uint8_t high = (cmd & 0xF0);          // upper nibble in bits 7:4
    uint8_t low  = ((cmd << 4) & 0xF0);   // lower nibble moved to bits 7:4
    I2C1_Write(PCF8574_ADDR, high | 0x0C);   // EN=1, BL=1, RS=0
    delay_ms(1);
    I2C1_Write(PCF8574_ADDR, high | 0x08);   // EN=0 → LCD latches the nibble
    I2C1_Write(PCF8574_ADDR, low  | 0x0C);
    delay_ms(1);
    I2C1_Write(PCF8574_ADDR, low  | 0x08);
}
~~~

One LCD byte = 4 I²C transactions (each START, 0x4E, data byte, STOP).

## Commands used

| Command | Hex | Meaning |
|---|---|---|
| Init nibbles | 0x33, 0x32 | Synchronise, then switch to 4-bit mode |
| Function set | 0x28 | 4-bit, 2 lines, 5×8 dots |
| Display control | 0x0C | Display ON, cursor OFF, blink OFF (0x0E cursor on, 0x0F blink, 0x08 off) |
| Entry mode | 0x06 | Increment address, no shift |
| Clear display | 0x01 | Fill with spaces, cursor home — needs ≈ 1.5 ms |
| Return home | 0x02 | Cursor to 0x00 |
| Set DDRAM address | 0x80 \| addr | Move cursor |

## DDRAM addresses and LCD_SetCursor

Row 0 starts at DDRAM 0x00, row 1 at **0x40** (not 0x10). The “set DDRAM address” command has bit 7 set, so:

~~~c
void LCD_SetCursor(uint8_t row, uint8_t col) {
    uint8_t addr = (row == 0 ? 0x80 : 0xC0) + col;   // 0x80|0x00 or 0x80|0x40
    LCD_SendCmd(addr);
}
~~~

## Printing numbers

The LCD shows ASCII codes, so a number must be converted to characters first: «sprintf(buf, "%u", adcData); LCD_Print(buf);». The digit 7 is sent as 0x37 ('7'), not 0x07.

> [!warning] Issues in the supplied example
> «sprintf("%u")» is used with an «int» (use «%d» or make adcData unsigned); «delay_ms» is an uncalibrated loop; «I2C1_Write» never checks for NACK, so if the LCD is missing or at 0x3F the program hangs waiting for ADDR. Clearing the screen every 500 ms also causes visible flicker — overwrite the digits instead.
`,
  visual: md`
Send commands and characters and watch the DDRAM, cursor and the exact PCF8574 bytes:

::sim{lcd}

::diagram{lcd-i2c}
`,
  exam: {
    definitions: [
      { term: 'HD44780', def: 'The standard character-LCD controller that accepts commands and ASCII data and drives the display.' },
      { term: 'DDRAM', def: 'Display data RAM in the LCD controller holding the character codes shown; row 0 at 0x00, row 1 at 0x40.' },
      { term: 'PCF8574', def: 'An I²C 8-bit I/O expander used as an LCD backpack, converting I²C bytes into parallel pin levels.' },
      { term: 'EN (enable)', def: 'LCD control line; data/command on D4–D7 is latched on its falling edge.' },
      { term: 'RS (register select)', def: 'LCD control line: 0 = instruction register (command), 1 = data register (character).' },
    ],
    formulas: [
      { name: 'Set-cursor command', expr: 'cmd = 0x80 + (row ? 0x40 : 0x00) + col', example: 'row 1, col 3 → 0xC3' },
      { name: 'I²C write address', expr: 'addr8 = (addr7 << 1) | R/W', example: '0x27 → 0x4E' },
    ],
    frequent: ['Explain LCD interfacing with an MCU.', 'LCD commands and their hex codes.', 'Why 4-bit mode / I²C backpack?'],
    mistakes: ['Using 0x10 as the start of line 2 (it is 0x40).', 'Sending the number 7 instead of the character ‘7’.', 'Forgetting the EN pulse.', 'Using 0x27 as the 8-bit address byte.'],
    diagrams: ['PCF8574–LCD pin mapping', 'MCU → I²C bus → backpack → LCD'],
    shortQs: [
      { q: 'What do the LCD commands 0x01, 0x0C and 0xC0 do?', a: md`0x01 clears the display and homes the cursor; 0x0C turns the display on with the cursor off; 0xC0 sets the DDRAM address to 0x40 — start of the second line.`, marks: 2 },
      { q: 'Why is each LCD byte sent as two nibbles in the lab program?', a: md`The PCF8574 only has 8 outputs: 4 are used for D4–D7 and 4 for RS, RW, EN and backlight, so the LCD runs in 4-bit mode — upper nibble first, then lower nibble, each latched by an EN pulse.`, marks: 2 },
      { q: 'Explain «high | 0x0C» and «high | 0x08» in LCD_SendCmd.', a: md`0x0C sets EN (bit 2) and backlight (bit 3) with RS = 0; 0x08 keeps the backlight but clears EN. Sending both creates the EN high-to-low pulse that latches the nibble as a command.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the interfacing of a 16×2 LCD to the STM32F401 using an I²C backpack. Describe the initialisation sequence and how a string is displayed.', a: md`Wiring diagram (PB6/PB7 AF4 open-drain with pull-ups → PCF8574 at 0x27 → LCD), bit mapping, 4-bit nibble transfer with EN pulses, init sequence 0x33, 0x32, 0x28, 0x0C, 0x06, 0x01, set cursor 0x80/0xC0, LCD_Print loop sending ASCII with RS = 1, number conversion with sprintf.`, marks: 8 },
      { q: 'Write a function that prints an unsigned integer at row 1, column 0 of the LCD without using sprintf.', a: md`~~~c
void LCD_PrintUInt(uint32_t v) {
    char buf[11]; int i = 10; buf[i] = '\0';
    do { buf[--i] = '0' + (v % 10); v /= 10; } while (v);
    LCD_SetCursor(1, 0);
    LCD_Print(&buf[i]);
}
~~~
Explain digit extraction with % and /, ASCII offset '0' (0x30), and the cursor command 0xC0.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['PCF8574 @ 0x27 (write byte 0x4E): P0 RS, P1 RW, P2 EN, P3 BL, P4–P7 D4–D7.', '4-bit mode: high nibble then low nibble, each with EN 1→0.', 'Init: 0x33, 0x32, 0x28, 0x0C, 0x06, 0x01.', 'Line 1 0x80, line 2 0xC0 (+ column).', 'Send ASCII characters, not raw numbers.'],
    takeaways: ['Command = RS 0, data = RS 1.', 'Row 2 = 0x40 DDRAM.'],
    mcqs: [
      { q: 'Command to move the cursor to the start of line 2:', options: ['0x80', '0xC0', '0x40', '0x02'], answer: 1, explain: '0x80 | 0x40.' },
      { q: 'In the lab code, which PCF8574 bit is EN?', options: ['P0', 'P1', 'P2', 'P3'], answer: 2, explain: '0x04 = P2.' },
      { q: '0x4E in the lab code is…', options: ['the 7-bit address', 'the 8-bit write address (0x27 << 1)', 'a command', 'the backlight value'], answer: 1, explain: 'Address byte with R/W = 0.' },
      { q: 'To display the digit 5 you send…', options: ['0x05', '0x35', '0x50', '0xC5'], answer: 1, explain: 'ASCII ‘5’ = 0x35.' },
      { q: 'How many I²C byte transactions does LCD_SendData make per character?', options: ['1', '2', '4', '8'], answer: 2, explain: 'Two nibbles × (EN high, EN low).' },
    ],
  },
};

export default topic;
