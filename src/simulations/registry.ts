import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { UnitId } from '../types';

export interface SimProps {
  preset?: string;
}

export interface SimMeta {
  id: string;
  title: string;
  summary: string;
  unit: UnitId;
  topics: string[];
  /** honest statement of what the model does and does not reproduce */
  model: string;
  Component: LazyExoticComponent<ComponentType<SimProps>>;
}

const L = (f: () => Promise<{ default: ComponentType<SimProps> }>) => lazy(f);

export const SIMS: SimMeta[] = [
  {
    id: 'cpu',
    title: 'Cortex-M4 register machine',
    summary: 'Step through Thumb-2 assembly and watch R0–R15, the NZCV flags, the stack and memory change.',
    unit: 1,
    topics: ['m4-registers', 'addressing-modes', 'memory-instructions', 'alu-instructions', 'thumb-isa'],
    model:
      'Executes a subset of ~30 Thumb-2 instructions with correct 32-bit arithmetic and NZCV flag rules. It does not model pipeline timing, exceptions, alignment faults or instruction encodings.',
    Component: L(() => import('./CpuSim')),
  },
  {
    id: 'pipeline',
    title: '3-stage pipeline',
    summary: 'Fetch, decode and execute overlapping in time — and what a taken branch does to the pipeline.',
    unit: 1,
    topics: ['m4-features'],
    model: 'Idealised one-cycle-per-stage pipeline. Real Cortex-M4 timing adds wait states, multi-cycle instructions and branch speculation.',
    Component: L(() => import('./PipelineSim')),
  },
  {
    id: 'memmap',
    title: 'Memory map explorer',
    summary: 'The 4 GB Cortex-M4 address space with the STM32F401 peripherals, bit-band regions and endianness.',
    unit: 1,
    topics: ['memory-map', 'bit-banding'],
    model: 'Addresses are taken from RM0368 (STM32F401) and the Cortex-M4 memory map. Region sizes are drawn to a logarithmic scale.',
    Component: L(() => import('./MemMapSim')),
  },
  {
    id: 'bitband',
    title: 'Bit-band alias calculator',
    summary: 'Turn any register address + bit number into its alias word address, with every intermediate step.',
    unit: 1,
    topics: ['bit-banding'],
    model: 'Exact calculation per the Cortex-M4 bit-band formula. Validates that the address lies in a bit-band region.',
    Component: L(() => import('./BitBandSim')),
  },
  {
    id: 'modes',
    title: 'Thread / Handler mode & privilege',
    summary: 'Switch between thread and handler mode, change CONTROL, and see which stack pointer and privilege apply.',
    unit: 1,
    topics: ['operating-modes'],
    model: 'State machine of the Armv7-M mode/privilege rules (CONTROL.nPRIV, CONTROL.SPSEL, exception entry/return). No real instructions are executed.',
    Component: L(() => import('./ModesSim')),
  },
  {
    id: 'bits',
    title: 'Register bit-manipulation lab',
    summary: 'Apply |=, &= ~, ^=, = and BSRR writes to a 32-bit register and compare the side-effects.',
    unit: 2,
    topics: ['bit-manipulation', 'gpio-registers'],
    model: 'Exact 32-bit unsigned arithmetic, identical to what the C compiler generates.',
    Component: L(() => import('./BitsSim')),
  },
  {
    id: 'gpio',
    title: 'GPIO board simulator',
    summary: 'A virtual Black Pill + lab kit: configure MODER/PUPDR/OTYPER, press switches, drive LEDs, read IDR/ODR.',
    unit: 2,
    topics: ['gpio-registers', 'stm32-board', 'leds-switches', 'pull-resistors'],
    model:
      'Register-accurate for MODER, OTYPER, PUPDR, IDR, ODR and BSRR on the lab-kit pins, including clock gating via RCC_AHB1ENR. Electrical behaviour (current, voltage levels) is simplified to logic levels.',
    Component: L(() => import('./GpioSim')),
  },
  {
    id: 'pullup',
    title: 'Pull-up / pull-down & floating inputs',
    summary: 'See why an unconnected input floats, and how pull resistors give it a defined level.',
    unit: 2,
    topics: ['pull-resistors'],
    model: 'Floating input is shown as random noise around the threshold band; real floating behaviour depends on leakage and coupling.',
    Component: L(() => import('./PullSim')),
  },
  {
    id: 'debounce',
    title: 'Switch bounce & debouncing',
    summary: 'A mechanical contact bounces for milliseconds. Compare raw reads with a counter-based debouncer.',
    unit: 2,
    topics: ['leds-switches'],
    model: 'Bounce pattern is randomly generated (typical 1–10 ms). Debounce algorithm is the same one you would write in C.',
    Component: L(() => import('./DebounceSim')),
  },
  {
    id: 'sevenseg',
    title: 'Seven-segment display',
    summary: 'Encode digits for common-cathode and common-anode displays and see the GPIO byte.',
    unit: 2,
    topics: ['seven-segment'],
    model: 'Logic-level model of segment lines a–g + dp. Current-limiting and multiplexing timing are described, not simulated electrically.',
    Component: L(() => import('./SevenSegSim')),
  },
  {
    id: 'lcd',
    title: '16×2 LCD (HD44780 over I²C)',
    summary: 'Send commands and characters; watch DDRAM, the cursor, and the exact PCF8574 bytes the lab program sends.',
    unit: 2,
    topics: ['lcd', 'i2c-stm32'],
    model:
      'Implements the HD44780 instruction set used in the lab (clear, home, entry mode, display control, set DDRAM address, write data) and the 4-bit PCF8574 byte sequence. Character set is ASCII only; CGRAM is not modelled.',
    Component: L(() => import('./LcdSim')),
  },
  {
    id: 'adc',
    title: 'ADC: sampling, quantisation, conversion',
    summary: 'Change Vin, Vref and resolution; watch sampling, the quantisation staircase and the digital result.',
    unit: 2,
    topics: ['adc-fundamentals', 'adc-stm32'],
    model: 'Ideal ADC (no offset, gain or noise error). Uses code = floor(Vin × 2ⁿ / Vref), clipped to 2ⁿ − 1, and also shows the 4095/3.3 convention used in the lecture.',
    Component: L(() => import('./AdcSim')),
  },
  {
    id: 'sar',
    title: 'SAR ADC step-by-step',
    summary: 'Watch the successive-approximation register test each bit from MSB to LSB.',
    unit: 2,
    topics: ['adc-fundamentals', 'adc-stm32'],
    model: 'Ideal binary-search SAR with an ideal internal DAC — the same procedure as the worked example in the lecture.',
    Component: L(() => import('./SarSim')),
  },
  {
    id: 'flashadc',
    title: 'Flash (parallel) ADC',
    summary: 'A resistor ladder and 2ⁿ−1 comparators produce a thermometer code in one step.',
    unit: 2,
    topics: ['adc-fundamentals'],
    model: 'Ideal comparators and equal ladder resistors.',
    Component: L(() => import('./FlashAdcSim')),
  },
  {
    id: 'dac',
    title: 'DAC & waveform synthesis',
    summary: 'R-2R / binary-weighted DAC output for any code, and a sine look-up table played through it.',
    unit: 2,
    topics: ['dac'],
    model: 'Ideal DAC: Vout = code × Vref / 2ⁿ. Output filtering is not modelled. (Additional syllabus coverage.)',
    Component: L(() => import('./DacSim')),
  },
  {
    id: 'pwm',
    title: 'PWM generator',
    summary: 'Set timer clock, PSC, ARR and CCR; see the waveform, frequency, duty, LED brightness and motor speed.',
    unit: 2,
    topics: ['pwm', 'gp-timers'],
    model:
      'Uses the STM32 timer relations f = f_clk / ((PSC+1)(ARR+1)) and duty = CCR/(ARR+1) for edge-aligned PWM mode 1. LED brightness and motor speed are proportional to average voltage (simplified).',
    Component: L(() => import('./PwmSim')),
  },
  {
    id: 'rtc',
    title: 'Real-time clock prescaler chain',
    summary: 'From a 32.768 kHz crystal to a 1 Hz calendar tick through asynchronous and synchronous prescalers.',
    unit: 2,
    topics: ['rtc'],
    model: 'STM32 RTC prescaler arithmetic (PREDIV_A, PREDIV_S). Calendar rollover is simplified. (Additional syllabus coverage.)',
    Component: L(() => import('./RtcSim')),
  },
  {
    id: 'iosync',
    title: 'I/O synchronisation: polling vs interrupts',
    summary: 'Compare blind-cycle, busy-wait, interrupt and periodic polling on the same event stream.',
    unit: 2,
    topics: ['io-sync'],
    model: 'Abstract timeline model of CPU time. Latency figures are illustrative, not cycle-accurate.',
    Component: L(() => import('./IoSyncSim')),
  },
  {
    id: 'systick',
    title: 'SysTick timer',
    summary: 'A 24-bit down-counter with reload, COUNTFLAG and the SysTick exception; compute LOAD for any delay.',
    unit: 3,
    topics: ['systick', 'systick-interrupt'],
    model:
      'Register-accurate STK_CTRL/LOAD/VAL behaviour (count LOAD→0, reload, COUNTFLAG set on 1→0, cleared on read). Counting is slowed down so you can watch it.',
    Component: L(() => import('./SysTickSim')),
  },
  {
    id: 'timer',
    title: 'General-purpose timer (PSC / ARR)',
    summary: 'Prescaler, up-counter, auto-reload, update event and interrupt — the timer that generates PWM and delays.',
    unit: 3,
    topics: ['gp-timers', 'pwm'],
    model: 'STM32 TIMx up-counting mode with PSC and ARR. Counting is slowed down for visibility. (Additional syllabus coverage.)',
    Component: L(() => import('./TimerSim')),
  },
  {
    id: 'interrupt',
    title: 'Interrupt & NVIC simulator',
    summary: 'Fire IRQs with priorities; watch stacking, the ISR, nesting, tail-chaining and return.',
    unit: 3,
    topics: ['interrupts-basics', 'nvic'],
    model:
      'Event-level model of the NVIC: priority comparison, pre-emption, pending/active states, 8-word stacking, tail-chaining and late arrival. Cycle counts (12-cycle entry, 6-cycle tail-chain) are the nominal Cortex-M4 figures without wait states.',
    Component: L(() => import('./InterruptSim')),
  },
  {
    id: 'exti',
    title: 'EXTI edge-triggered interrupt',
    summary: 'Map a pin to an EXTI line, pick rising/falling edges, and watch PR bits and IRQ requests as you press a switch.',
    unit: 3,
    topics: ['exti'],
    model: 'Register-accurate SYSCFG_EXTICR, EXTI_IMR/RTSR/FTSR/PR and IRQ grouping for STM32F401.',
    Component: L(() => import('./ExtiSim')),
  },
  {
    id: 'serialmodes',
    title: 'Serial vs parallel; simplex / half / full duplex',
    summary: 'Animated comparison of how bits move in each transmission mode.',
    unit: 3,
    topics: ['serial-basics'],
    model: 'Conceptual animation.',
    Component: L(() => import('./SerialModesSim')),
  },
  {
    id: 'uart',
    title: 'UART transmitter & receiver',
    summary: 'Type a message and watch start, data, parity and stop bits leave TX and be decoded at RX; compute BRR.',
    unit: 3,
    topics: ['uart'],
    model:
      'Bit-exact UART framing (LSB first, idle high, optional parity, 1/2 stop bits) and exact USART_BRR arithmetic for OVER8 = 0/1. Time is slowed down so you can watch individual bits.',
    Component: L(() => import('./UartSim')),
  },
  {
    id: 'i2c',
    title: 'I²C bus',
    summary: 'START, 7-bit address + R/W, ACK/NACK, data bytes and STOP on SDA/SCL, with addressable slaves.',
    unit: 3,
    topics: ['i2c', 'i2c-stm32'],
    model: 'Bit-exact I²C framing (MSB first, data valid while SCL high, START/STOP while SCL high). Clock stretching and arbitration are not modelled.',
    Component: L(() => import('./I2cSim')),
  },
  {
    id: 'spi',
    title: 'SPI shift-register exchange',
    summary: 'MOSI, MISO, SCLK and CS with all four CPOL/CPHA modes; master and slave swap bytes.',
    unit: 3,
    topics: ['spi'],
    model: 'Bit-exact SPI mode 0–3 timing (MSB first). (Additional syllabus coverage.)',
    Component: L(() => import('./SpiSim')),
  },
];

export const SIM_BY_ID: Record<string, SimMeta> = Object.fromEntries(SIMS.map((s) => [s.id, s]));
