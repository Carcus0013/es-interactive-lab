import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'i2c',
  unit: 3,
  order: 9,
  title: 'The I²C protocol',
  short: 'Two-wire synchronous bus: master/slave, SDA and SCL with pull-ups, START/STOP, 7-bit address + R/W, ACK/NACK, write and read transactions, speeds, I²C vs UART.',
  status: 'course',
  sources: [
    { file: 'Day10_8_I2C_Introduction.pptx', detail: 'slides 2–22' },
    { file: 'Day10_09_I2C.pptx, I2C.pptx', detail: 'condensed versions' },
    { file: 'Lecture07_I2C PRESENTATION.PPT', detail: 'history, F/S/C/D/P terminology, speeds, ACK semantics' },
  ],
  keywords: ['I2C', 'IIC', 'TWI', 'SDA', 'SCL', 'master', 'slave', 'START', 'STOP', 'repeated start', 'address', '7-bit', '10-bit', 'R/W', 'ACK', 'NACK', 'pull-up', 'open drain', 'standard mode', 'fast mode', '100 kbps', '400 kbps', '3.4 Mbps', '400 pF', 'Philips'],
  importance: 2,
  sims: ['i2c'],
  practicals: ['p14-i2c-lcd'],
  related: ['i2c-stm32', 'lcd', 'serial-basics', 'pull-resistors'],
  fundamentals: {
    what: md`**I²C** (Inter-Integrated Circuit), developed by Philips in 1982, is a **synchronous, half-duplex, multi-master, multi-slave** serial bus using two bidirectional open-drain lines: **SDA** (serial data) and **SCL** (serial clock), both pulled HIGH by resistors. The master generates the clock and addresses slaves by a unique 7-bit (or 10-bit) address.`,
    why: md`Embedded boards carry many slow peripherals — sensors, EEPROMs, RTCs, LCD backpacks. Giving each its own pins is wasteful; I²C connects up to ~128 devices with just two wires and software addressing.`,
    problem: md`Interfacing simplicity: two lines for all devices, no address-decoding hardware, built-in acknowledgement of every byte, and collision detection/arbitration for multiple masters.`,
    how: md`A transaction starts with **START** (SDA falls while SCL is HIGH), then the master sends the 7-bit address and a **R/W** bit; the addressed slave pulls SDA LOW for **ACK**. Data bytes follow (MSB first), each acknowledged by the receiver. **STOP** (SDA rises while SCL is HIGH) ends it. Data may change only while SCL is LOW.`,
    where: md`Lab: STM32 → PCF8574 LCD backpack at 0x27. Also EEPROMs (1010xxx), DS1307 RTC (0x68), MPU-6050 IMU (0x68), BMP280 (0x76), OLED displays (0x3C).`,
  },
  detailed: md`
## The bus (Day10_8 slides 2–6)

::diagram{i2c-bus}

- **SDA**: data; **SCL**: clock, always driven by the master.
- Both lines are open-drain with pull-up resistors: idle = both HIGH. Any device can pull a line LOW; none can drive it HIGH — so no short circuits and a wired-AND for ACK and arbitration.
- At least one master; several masters allowed with equal priority.
- Addressing: **7 bits → up to 128 addresses** (some reserved); often the upper 4 bits identify the device type (1010 = serial EEPROM) and the lower 3 are set by pins, allowing 8 of the same device.
- The number of devices is also limited by the total bus capacitance, **400 pF**.

## Bus terminology (Lecture07, slide 11)

| Symbol | Name | Condition |
|---|---|---|
| F | Free | SDA and SCL both HIGH |
| S / Sr | Start / repeated start | SDA HIGH → LOW while SCL HIGH |
| C | Change | SCL LOW: the transmitter puts the next bit on SDA |
| D | Data | SDA stable and valid while SCL HIGH |
| P | Stop | SDA LOW → HIGH while SCL HIGH |

::diagram{i2c-timing}

## Message format (slides 7–10)

| START | 7-bit address | R/W | ACK | Data byte 1 | ACK | … | Data byte n | ACK/NACK | STOP |
|---|---|---|---|---|---|---|---|---|---|

- Address byte = **address << 1 | R/W** (R/W = 0 write, 1 read). For the LCD at 0x27: write byte **0x4E**, read byte 0x4F.
- **ACK**: the receiver pulls SDA LOW during the 9th clock. **NACK**: SDA left HIGH — no device at that address, receiver busy/full, or (master reading) “send no more”. The master then sends STOP (Lecture07).

### Writing to a slave (slide 14)
1. Master sends START. 2. Sends address with R/W = 0; the matching slave ACKs, others ignore. 3. Sends data byte(s), each ACKed by the slave. 4. Sends STOP.

### Reading from a slave (slide 15)
1. START. 2. Address with R/W = 1. 3. Slave sends data bytes; master ACKs each except the last, which it NACKs. 4. STOP.

Register reads usually use a **repeated START**: write the register address, then Sr + address/R without releasing the bus.

## Speeds (Lecture07)

| Mode | Rate |
|---|---|
| Standard mode (Sm) | 100 kbit/s |
| Fast mode (Fm) | 400 kbit/s |
| High-speed mode | 3.4 Mbit/s |

## I²C vs UART (slide 22)

| Feature | I²C | UART |
|---|---|---|
| Type | Synchronous (clock) | Asynchronous |
| Wires | 2 (SDA, SCL) | 2 (TX, RX) |
| Devices | Many, multi-master | Typically two, point-to-point |
| Speed | 100 kbps – 3.4 Mbps | 9600 bps – several Mbps |
| Duplex | Half | Full |
| Addressing | 7- or 10-bit | None |
| Complexity | Higher | Simpler |
| Use | Many devices on one bus | Point-to-point links |

## Advantages (Lecture07)

Only two lines for all ICs; software addressing (no decoders); every byte acknowledged; multi-master with collision detection and arbitration; wide device ecosystem (EEPROMs, temperature sensors, RTCs).
`,
  visual: md`
Choose a slave address (try one nobody has, 0x3C), write or read, and step through START, address, ACK/NACK, data and STOP:

::sim{i2c preset=lcd}

::diagram{i2c-bus}

::diagram{i2c-timing}
`,
  exam: {
    definitions: [
      { term: 'I²C', def: 'Inter-Integrated Circuit: a two-wire (SDA, SCL), synchronous, half-duplex, multi-master serial bus with addressed slaves.' },
      { term: 'START condition', def: 'SDA goes from HIGH to LOW while SCL is HIGH, beginning a transaction.' },
      { term: 'STOP condition', def: 'SDA goes from LOW to HIGH while SCL is HIGH, ending a transaction.' },
      { term: 'ACK', def: 'Acknowledge: the receiver pulls SDA LOW during the 9th clock pulse to confirm the byte.' },
      { term: 'NACK', def: 'Not-acknowledge: SDA left HIGH in the 9th clock — no receiver or end of reading.' },
      { term: 'Repeated START', def: 'A START issued without a preceding STOP, used to change direction without releasing the bus.' },
    ],
    formulas: [{ name: 'Address byte', expr: 'byte = (7-bit address << 1) | R/W', example: '0x27 write → 0x4E' }],
    frequent: ['Explain the I²C protocol with START, STOP, ACK/NACK and data transfer.', 'Draw the I²C bus and timing diagram.', 'Compare I²C and UART.', 'Write and read sequences.'],
    mistakes: ['Saying data may change while SCL is HIGH (that would be a START/STOP).', 'Calling I²C full duplex.', 'Forgetting the pull-up resistors.', 'Sending the 7-bit address without shifting for R/W.', 'Sending LSB first (I²C is MSB first).'],
    diagrams: ['I²C bus with master, slaves and pull-ups', 'START/STOP and data-valid timing', 'Frame: S | address | R/W | ACK | data | ACK | P'],
    shortQs: [
      { q: 'Define START and STOP conditions in I²C.', a: md`START: SDA HIGH → LOW while SCL is HIGH. STOP: SDA LOW → HIGH while SCL is HIGH. All other SDA changes occur only while SCL is LOW.`, marks: 2 },
      { q: 'Why are pull-up resistors needed on SDA and SCL?', a: md`All devices have open-drain outputs that can only pull LOW; the resistors provide the HIGH (idle) level and allow multiple devices to share the lines without conflict.`, marks: 2 },
      { q: 'What address byte does the master send to write to a device at 0x50?', a: md`0x50 << 1 | 0 = 0xA0.`, marks: 1 },
      { q: 'When does the master send a NACK?', a: md`When reading, after the last byte it wants, to tell the slave to stop transmitting before the STOP condition.`, marks: 2 },
    ],
    longQs: [
      { q: 'Explain the I²C protocol: bus structure, START/STOP, addressing, data transfer, ACK/NACK, with a timing diagram of a master write.', a: md`Bus diagram with pull-ups; terminology F/S/C/D/P; frame format; write sequence; timing diagram (SDA vs SCL) with the address 0x27 example; ACK/NACK semantics; speeds and the 400 pF limit; advantages.`, marks: 8 },
      { q: 'Compare I²C and UART and explain where each is used in an embedded system.', a: md`Use the slide 22 table and add examples: UART for PC console/GPS/Bluetooth module, I²C for LCD backpack, EEPROM, RTC and sensors sharing two pins.`, marks: 6 },
    ],
  },
  revision: {
    notes: ['2 wires SDA/SCL, open-drain + pull-ups, idle HIGH.', 'START = SDA↓ while SCL HIGH; STOP = SDA↑ while SCL HIGH.', 'Byte MSB first; data changes only while SCL LOW.', 'Address byte = addr << 1 | R/W; 0x27 → 0x4E.', '9th clock: ACK (LOW) / NACK (HIGH).', '100 k / 400 k / 3.4 Mbit/s; ≤ 400 pF; 7-bit → 128 addresses.'],
    takeaways: ['Half duplex, synchronous, multi-master.', 'Master always drives SCL.'],
    mcqs: [
      { q: 'An I²C START condition is…', options: ['SDA rises while SCL HIGH', 'SDA falls while SCL HIGH', 'SCL falls while SDA HIGH', 'SDA falls while SCL LOW'], answer: 1, explain: 'Day10_8 slide 12.' },
      { q: 'Who generates SCL?', options: ['The slave', 'The master', 'The pull-up', 'Both'], answer: 1, explain: 'Clock is controlled by the master.' },
      { q: 'Maximum addressable devices with 7-bit addressing:', options: ['7', '64', '128', '1024'], answer: 2, explain: '2⁷.' },
      { q: 'Fast-mode I²C speed:', options: ['100 kbit/s', '400 kbit/s', '1 Mbit/s', '3.4 Mbit/s'], answer: 1, explain: 'Fm = 400 kbit/s.' },
      { q: 'A slave acknowledges a byte by…', options: ['sending STOP', 'pulling SDA LOW in the 9th clock', 'pulling SCL HIGH', 'sending its address'], answer: 1, explain: 'ACK.' },
    ],
  },
};

export default topic;
