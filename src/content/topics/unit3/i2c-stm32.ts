import type { Topic } from '../../../types';
import { md } from '../../md';

const topic: Topic = {
  id: 'i2c-stm32',
  unit: 3,
  order: 10,
  title: 'Configuring the STM32 I²C peripheral',
  short: 'I2C1 on PB6/PB7: GPIO AF4 open-drain setup, CR1 (PE, START, STOP, SWRST), CR2 FREQ, CCR and TRISE calculations, SR1/SR2 flags and the master-transmit sequence from the lab.',
  status: 'course',
  sources: [
    { file: 'Day10_8_I2C_Introduction.pptx', detail: 'slides 23–48 (registers, OTYPER, CR1 reset/START, CR2, CCR = 80, TRISE = 17)' },
    { file: 'EMBEDDED_LAB_MATERIALS/I2C/I2C_LCD_example.c', detail: 'I2C1_Init and I2C1_Write' },
  ],
  keywords: ['I2C1', 'PB6', 'PB7', 'AF4', 'open drain', 'CR1', 'PE', 'START', 'STOP', 'SWRST', 'CR2', 'FREQ', 'CCR', 'TRISE', 'SR1', 'SR2', 'SB', 'ADDR', 'TXE', 'BTF', 'AF', 'BUSY', 'OAR1', 'DR'],
  importance: 1,
  sims: ['i2c', 'lcd'],
  practicals: ['p14-i2c-lcd'],
  related: ['i2c', 'lcd', 'gpio-registers'],
  fundamentals: {
    what: md`The STM32F401 has three I²C peripherals; the lab uses **I2C1** with **SCL = PB6** and **SDA = PB7** (alternate function **AF4**). The peripheral generates START/STOP, shifts bytes, handles ACK and reports progress in status registers SR1/SR2.`,
    why: md`Bit-banging I²C in software is slow and timing-sensitive. The hardware peripheral produces correct timing at 100/400 kHz and lets software work byte-by-byte by watching flags.`,
    problem: md`Correct clock configuration (CR2, CCR, TRISE) gives the right SCL frequency and rise-time compliance; the flag-driven sequence guarantees each phase (START, address, data, STOP) finishes before the next.`,
    how: md`Configure PB6/PB7 as AF4, open-drain, with pull-ups. Reset the peripheral (SWRST), set **CR2.FREQ** = PCLK1 in MHz, **CCR** for the SCL period, **TRISE** for the maximum rise time, then set **PE**. To write: wait !BUSY → START → wait **SB** → write address to DR → wait **ADDR** → read SR2 → wait **TXE** → write data → wait **BTF** → STOP.`,
    where: md`«I2C1_Init()» and «I2C1_Write()» in the LCD lab; the same sequence talks to EEPROMs, RTCs and sensors.`,
  },
  detailed: md`
## Registers (Day10_8 slide 24)

| Register | Role |
|---|---|
| CR1 | PE (bit 0) enable; START (8); STOP (9); ACK (10); SWRST (15) |
| CR2 | FREQ[5:0] = APB1 clock in MHz; interrupt/DMA enables |
| OAR1 | own address (slave mode) |
| DR | data to transmit / received |
| SR1 | SB (0), ADDR (1), BTF (2), RxNE (6), TxE (7), AF (10) … |
| SR2 | BUSY (1), MSL (0) … |
| CCR | clock control: CCR[11:0], F/S (15) |
| TRISE | maximum rise time |

## GPIO setup for I²C (slides 25–29)

~~~c I2C1_Init (lab code) — pins
RCC->AHB1ENR |= (1 << 1);                    // GPIOB clock
RCC->APB1ENR |= (1 << 21);                   // I2C1 clock
GPIOB->MODER &= ~((3 << 12) | (3 << 14));
GPIOB->MODER |=  ((2 << 12) | (2 << 14));    // PB6, PB7 alternate function
GPIOB->OTYPER |= (1 << 6) | (1 << 7);        // open-drain (required by I2C)
GPIOB->OSPEEDR |= (3 << 12) | (3 << 14);     // high speed
GPIOB->PUPDR |= (1 << 12) | (1 << 14);       // internal pull-ups
GPIOB->AFR[0] |= (4 << 24) | (4 << 28);      // AF4 = I2C1
~~~

“Open-drain: the output driver can only pull the pin to ground. To get a defined high level, an external pull-up resistor is required … crucial for bus-like protocols such as I²C, which require multiple devices to share the same line” (slide 28).

## Timing configuration

~~~c
I2C1->CR1 |= (1 << 15);    // SWRST: reset the peripheral (recovers a stuck bus)
I2C1->CR1 &= ~(1 << 15);
I2C1->CR2   = 16;          // FREQ = 16 MHz (PCLK1)
I2C1->CCR   = 80;          // 100 kHz SCL
I2C1->TRISE = 17;          // (1000 ns / 62.5 ns) + 1
I2C1->CR1 |= (1 << 0);     // PE: enable
~~~

### CCR (slides 38–41)

$$
CCR = (T_r(SCL) + T_w(SCLH)) / T_PCLK1 = (1000 ns + 4000 ns) / 62.5 ns = 80
equivalently, standard mode:  CCR = f_PCLK1 / (2 × f_SCL) = 16 MHz / 200 kHz = 80
$$

T_PCLK1 = 1/16 MHz = 62.5 ns. In standard mode SCL high time = low time = CCR × T_PCLK1 = 5 µs → 10 µs period → 100 kHz.

### TRISE (slide 42)

$$
TRISE = t_r,max / T_PCLK1 + 1 = 1000 ns / 62.5 ns + 1 = 17
$$

(Standard mode allows 1000 ns rise time; fast mode 300 ns.)

## Master transmit sequence (lab I2C1_Write)

~~~c
void I2C1_Write(uint8_t addr, uint8_t data) {
    while (I2C1->SR2 & (1 << 1));      // BUSY: wait for a free bus
    I2C1->CR1 |= (1 << 8);             // START
    while (!(I2C1->SR1 & (1 << 0)));   // SB: start generated
    I2C1->DR = addr;                   // 8-bit address (0x4E)
    while (!(I2C1->SR1 & (1 << 1)));   // ADDR: address sent and ACKed
    (void)I2C1->SR2;                   // reading SR1 then SR2 clears ADDR
    while (!(I2C1->SR1 & (1 << 7)));   // TXE: DR empty
    I2C1->DR = data;
    while (!(I2C1->SR1 & (1 << 2)));   // BTF: byte transfer finished
    I2C1->CR1 |= (1 << 9);             // STOP
}
~~~

The START bit (slide 35) is cleared by hardware once the condition is generated; the same bit creates a **repeated START** for reads.

> [!warning] Robustness
> If the slave does not answer, ADDR never sets and the loop hangs. Production code checks **SR1.AF** (acknowledge failure), sends STOP, clears AF and returns an error — and uses timeouts on every wait.
`,
  visual: md`
::sim{i2c}

::diagram{lcd-i2c}
`,
  exam: {
    definitions: [
      { term: 'I2C_CCR', def: 'Clock control register that sets the SCL high/low time in PCLK1 cycles.' },
      { term: 'I2C_TRISE', def: 'Register holding the maximum allowed SCL rise time in PCLK1 cycles plus one.' },
      { term: 'SB flag', def: 'SR1 bit 0: START condition generated.' },
      { term: 'ADDR flag', def: 'SR1 bit 1: address sent and acknowledged (master); cleared by reading SR1 then SR2.' },
      { term: 'BTF flag', def: 'SR1 bit 2: byte transfer finished (data register and shift register empty).' },
    ],
    formulas: [
      { name: 'CCR (standard mode)', expr: 'CCR = (T_r + T_w(SCLH)) / T_PCLK1 = f_PCLK1 / (2 f_SCL)', example: '16 MHz, 100 kHz → 80' },
      { name: 'TRISE', expr: 'TRISE = t_r,max / T_PCLK1 + 1', example: '1000 ns / 62.5 ns + 1 = 17' },
    ],
    frequent: ['Configure I2C1 at register level.', 'Calculate CCR and TRISE.', 'Explain the master write sequence with flags.'],
    mistakes: ['Configuring CCR/TRISE while PE = 1.', 'Push-pull instead of open-drain on SDA/SCL.', 'Wrong AF (AF4 for I2C1).', 'Not reading SR2 after ADDR (ADDR stays set).'],
    diagrams: ['STM32 ↔ I²C device wiring with pull-ups', 'Flag sequence flowchart'],
    shortQs: [
      { q: 'Calculate CCR and TRISE for 100 kHz SCL with PCLK1 = 16 MHz.', a: md`T_PCLK1 = 62.5 ns. CCR = (1000 + 4000) / 62.5 = 80 (or 16 MHz / 200 kHz). TRISE = 1000/62.5 + 1 = 17.`, marks: 2 },
      { q: 'Why are PB6 and PB7 configured as open-drain?', a: md`I²C lines are shared; each device may only pull them LOW, and the pull-ups make them HIGH. Push-pull outputs could short against another device driving LOW.`, marks: 2 },
      { q: 'How is the ADDR flag cleared?', a: md`By reading SR1 followed by reading SR2 — hence «(void)I2C1->SR2;» in the lab code.`, marks: 1 },
    ],
    longQs: [
      { q: 'Write and explain the register-level initialisation of I2C1 on the STM32F401 for 100 kHz and a function to send one byte to a slave.', a: md`GPIO (clock, AF mode, OTYPER, OSPEEDR, PUPDR, AFR AF4), I2C1 clock, SWRST, CR2 = 16, CCR = 80 with derivation, TRISE = 17, PE; the I2C1_Write sequence with each flag explained; NACK handling.`, marks: 8 },
      { q: 'Explain the I²C master-transmit flag sequence of the STM32 with a flowchart.', a: md`BUSY → START → SB → DR = addr → ADDR → read SR2 → TXE → DR = data → BTF → STOP, with what the hardware does on the bus at each step.`, marks: 6 },
    ],
    numericals: [
      {
        q: 'Find CCR for a 100 kHz standard-mode SCL with PCLK1 = 42 MHz, and TRISE.',
        given: ['f_PCLK1 = 42 MHz', 'f_SCL = 100 kHz', 't_r,max = 1000 ns'],
        find: 'CCR, TRISE',
        formula: 'CCR = f_PCLK1 / (2 f_SCL); TRISE = t_r / T_PCLK1 + 1',
        steps: ['CCR = 42 MHz / 200 kHz = 210', 'T_PCLK1 = 23.8 ns; 1000 / 23.8 = 42 → TRISE = 43'],
        answer: 'CCR = 210, TRISE = 43',
        value: 210,
      },
    ],
  },
  revision: {
    notes: ['I2C1: PB6 SCL, PB7 SDA, AF4, open-drain, pull-ups; clock APB1ENR bit 21.', 'CR1: PE 0, START 8, STOP 9, ACK 10, SWRST 15.', 'CR2 FREQ = 16; CCR = 80; TRISE = 17 (16 MHz, 100 kHz).', 'Write: BUSY → START → SB → addr → ADDR → SR2 → TXE → data → BTF → STOP.'],
    takeaways: ['Configure with PE = 0, then enable.', 'Read SR2 to clear ADDR.'],
    mcqs: [
      { q: 'Alternate function for I2C1 on PB6/PB7:', options: ['AF2', 'AF4', 'AF7', 'AF0'], answer: 1, explain: 'AF4.' },
      { q: 'CCR for 100 kHz with PCLK1 = 16 MHz:', options: ['16', '17', '80', '160'], answer: 2, explain: '16 MHz / 200 kHz.' },
      { q: 'Which flag shows the START condition was generated?', options: ['ADDR', 'SB', 'BTF', 'TXE'], answer: 1, explain: 'SR1.SB.' },
      { q: 'TRISE for 16 MHz standard mode:', options: ['16', '17', '62', '80'], answer: 1, explain: '1000/62.5 + 1.' },
      { q: 'Which CR1 bit resets the I²C peripheral?', options: ['PE', 'START', 'SWRST', 'ACK'], answer: 2, explain: 'Bit 15.' },
    ],
  },
};

export default topic;
