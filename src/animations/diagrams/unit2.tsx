import { Arrow, Box, Svg, T, Wire, alpha, col } from '../svg';

/* Resistor zig-zag helper */
function Resistor({ x, y, vertical, label }: { x: number; y: number; vertical?: boolean; label?: string }) {
  const d = vertical
    ? `M${x} ${y} v8 l6 4 -12 8 12 8 -12 8 12 8 -6 4 v8`
    : `M${x} ${y} h8 l4 -6 8 12 8 -12 8 12 8 -12 4 6 h8`;
  return (
    <g>
      <path d={d} fill="none" stroke={col.ink} strokeWidth={1.6} />
      {label && (
        <T x={vertical ? x + 14 : x + 32} y={vertical ? y + 30 : y - 14} anchor={vertical ? 'start' : 'middle'} size={11} t="dim">
          {label}
        </T>
      )}
    </g>
  );
}
function Gnd({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 10} ${y} h20 M${x - 6} ${y + 4} h12 M${x - 2} ${y + 8} h4`} stroke={col.ink} strokeWidth={1.6} />;
}
function Vcc({ x, y, label = '3.3 V' }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <path d={`M${x - 10} ${y} h20`} stroke={col.ink} strokeWidth={1.6} />
      <T x={x} y={y - 10} size={11} t="ch1">
        {label}
      </T>
    </g>
  );
}
function Led({ x, y, on, down = true }: { x: number; y: number; on?: boolean; down?: boolean }) {
  // triangle pointing in current direction (anode → cathode)
  const tri = down ? `M${x - 9} ${y} h18 l-9 14 z` : `M${x - 9} ${y + 14} h18 l-9 -14 z`;
  const bar = down ? `M${x - 9} ${y + 14} h18` : `M${x - 9} ${y} h18`;
  return (
    <g>
      <path d={tri} fill={on ? col.led : 'none'} stroke={col.led} strokeWidth={1.6} />
      <path d={bar} stroke={col.led} strokeWidth={1.6} />
      <path d={`M${x + 12} ${y + 2} l8 -6 M${x + 14} ${y + 9} l8 -6`} stroke={col.led} strokeWidth={1.2} />
    </g>
  );
}
function Switch({ x, y, closed }: { x: number; y: number; closed?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={2.5} fill={col.ink} />
      <circle cx={x + 30} cy={y} r={2.5} fill={col.ink} />
      <line x1={x} y1={y} x2={x + 30} y2={closed ? y : y - 12} stroke={col.ink} strokeWidth={1.6} />
    </g>
  );
}

/* GPIO pin internal structure (RM0368 fig. 17, simplified) */
export function GpioPin() {
  return (
    <Svg w={760} h={360} title="Basic structure of an STM32 GPIO pin">
      <rect x={20} y={20} width={560} height={320} rx={8} fill="none" stroke={col.line} strokeDasharray="5 4" />
      <T x={300} y={36} size={12} t="dim">
        inside the STM32 (one bit of a GPIO port)
      </T>
      <Box x={40} y={60} w={130} h={40} label="IDR" sub="input data reg." t="ch2" size={12} strong />
      <Box x={200} y={60} w={120} h={40} label="Schmitt trigger" size={11} />
      <Box x={40} y={200} w={130} h={40} label="ODR / BSRR" sub="output data" t="gold" size={12} strong />
      <Box x={200} y={200} w={120} h={40} label="Output control" sub="OTYPER, OSPEEDR" size={11} />
      <Box x={40} y={270} w={130} h={40} label="MODER" sub="00 in, 01 out, 10 AF, 11 analog" size={11} />
      <Box x={200} y={130} w={120} h={40} label="Analog switch" sub="to ADC" size={11} t="ch1" />
      <Arrow x1={200} y1={80} x2={170} y2={80} />
      <Arrow x1={170} y1={220} x2={200} y2={220} />
      {/* output driver */}
      <rect x={360} y={180} width={110} height={90} rx={6} fill={col.raised} stroke={col.line} />
      <T x={415} y={196} size={11} weight={600}>
        Output driver
      </T>
      <T x={415} y={218} size={11} t="ch1">
        P-MOS → V_DD
      </T>
      <T x={415} y={252} size={11} t="ch2">
        N-MOS → V_SS
      </T>
      <Arrow x1={320} y1={220} x2={360} y2={220} />
      {/* pull resistors */}
      <rect x={360} y={60} width={110} height={90} rx={6} fill={col.raised} stroke={col.line} />
      <T x={415} y={76} size={11} weight={600}>
        PUPDR
      </T>
      <T x={415} y={100} size={11}>
        pull-up to V_DD (01)
      </T>
      <T x={415} y={124} size={11}>
        pull-down to V_SS (10)
      </T>
      {/* pad */}
      <Wire d="M470 105 H540 M470 225 H540 M320 80 H340 V40 H540 V340" t="dim" />
      <Wire d="M320 150 H340" t="ch1" />
      <rect x={600} y={150} width={60} height={60} rx={6} fill={alpha('gold', 0.2)} stroke={col.gold} strokeWidth={2} />
      <T x={630} y={180} weight={700} t="gold">
        Pin
      </T>
      <Wire d="M540 180 H600" t="gold" width={2} />
      <T x={690} y={170} size={11} t="dim" anchor="start">
        protection
      </T>
      <T x={690} y={186} size={11} t="dim" anchor="start">
        diodes
      </T>
      <T x={170} y={330} size={11} t="dim">
        AFRL/AFRH route the pin to a peripheral (USART, I²C…) when MODER = 10
      </T>
    </Svg>
  );
}

/* Pull-up and pull-down resistors with a push-button (Day05 L02) */
export function PullResistors() {
  return (
    <Svg w={700} h={300} title="Pull-up and pull-down resistor circuits">
      <T x={170} y={20} weight={700}>
        Pull-up (button to GND)
      </T>
      <Vcc x={120} y={50} />
      <Wire d="M120 50 V60" t="ink" />
      <Resistor x={120} y={60} vertical label="R_pu" />
      <Wire d="M120 120 V150 H220" t="ink" />
      <circle cx={120} cy={150} r={3} fill={col.ink} />
      <Wire d="M120 150 V180" t="ink" />
      <Switch x={105} y={195} />
      <Wire d="M120 180 L105 195 M135 195 V240" t="ink" />
      <Gnd x={135} y={240} />
      <rect x={220} y={135} width={60} height={30} rx={4} fill={alpha('ch2', 0.15)} stroke={col.ch2} />
      <T x={250} y={150} size={12} mono>
        GPIO
      </T>
      <T x={170} y={275} size={11} t="dim">
        released → 1 (HIGH), pressed → 0 (LOW)
      </T>

      <T x={520} y={20} weight={700}>
        Pull-down (button to V_DD)
      </T>
      <Vcc x={480} y={50} />
      <Wire d="M480 50 V75" t="ink" />
      <Switch x={465} y={90} />
      <Wire d="M480 75 L465 90 M495 90 V150" t="ink" />
      <circle cx={495} cy={150} r={3} fill={col.ink} />
      <Wire d="M495 150 H580" t="ink" />
      <Wire d="M495 150 V160" t="ink" />
      <Resistor x={495} y={160} vertical label="R_pd" />
      <Wire d="M495 220 V240" t="ink" />
      <Gnd x={495} y={240} />
      <rect x={580} y={135} width={60} height={30} rx={4} fill={alpha('ch2', 0.15)} stroke={col.ch2} />
      <T x={610} y={150} size={12} mono>
        GPIO
      </T>
      <T x={520} y={275} size={11} t="dim">
        released → 0 (LOW), pressed → 1 (HIGH)
      </T>
    </Svg>
  );
}

/* Push-pull vs open-drain (Day05 L01 slide 17; Day10_8 slide 28) */
export function PushPullOpenDrain() {
  return (
    <Svg w={700} h={280} title="Push-pull versus open-drain output stage">
      <T x={170} y={20} weight={700}>
        Push-pull (OTYPER = 0)
      </T>
      <Vcc x={170} y={50} />
      <Box x={130} y={60} w={80} h={36} label="P-MOS" t="ch1" size={12} />
      <Box x={130} y={150} w={80} h={36} label="N-MOS" t="ch2" size={12} />
      <Wire d="M170 50 V60 M170 96 V150 M170 186 V220" t="ink" />
      <Gnd x={170} y={220} />
      <Wire d="M170 123 H260" t="gold" width={2} />
      <T x={290} y={123} size={12} t="gold">
        pin
      </T>
      <T x={170} y={255} size={11} t="dim">
        drives both 1 (P-MOS on) and 0 (N-MOS on) — LEDs, logic
      </T>

      <T x={520} y={20} weight={700}>
        Open-drain (OTYPER = 1)
      </T>
      <Vcc x={600} y={50} label="3.3/5 V" />
      <Wire d="M600 50 V60" t="ink" />
      <Resistor x={600} y={60} vertical label="external R_pu" />
      <Wire d="M600 120 V123" t="ink" />
      <rect x={480} y={60} width={80} height={36} rx={4} fill="none" stroke={col.line} strokeDasharray="4 4" />
      <T x={520} y={78} size={11} t="dim">
        no P-MOS
      </T>
      <Box x={480} y={150} w={80} h={36} label="N-MOS" t="ch2" size={12} />
      <Wire d="M520 123 V150 M520 186 V220" t="ink" />
      <Gnd x={520} y={220} />
      <Wire d="M520 123 H640" t="gold" width={2} />
      <T x={660} y={123} size={12} t="gold">
        pin
      </T>
      <T x={520} y={255} size={11} t="dim">
        can only pull low; high comes from resistor — I²C, wired-AND
      </T>
    </Svg>
  );
}

/* LED connections (Intro_GPIO slide 12; kit manual) */
export function LedCircuits() {
  return (
    <Svg w={700} h={290} title="Active-low and active-high LED connections">
      <T x={170} y={20} weight={700}>
        Active-low: on-board LED PC13
      </T>
      <Vcc x={170} y={52} />
      <Wire d="M170 52 V60" t="ink" />
      <Resistor x={170} y={60} vertical label="R (on board)" />
      <Wire d="M170 120 V130" t="ink" />
      <Led x={170} y={130} on />
      <Wire d="M170 144 V190" t="ink" />
      <rect x={140} y={190} width={60} height={30} rx={4} fill={alpha('ch2', 0.15)} stroke={col.ch2} />
      <T x={170} y={205} mono size={12}>
        PC13
      </T>
      <T x={170} y={245} size={12}>
        ODR bit 13 = 0 → current sinks into pin → LED ON
      </T>
      <T x={170} y={265} size={11} t="dim">
        PC13–15 may only sink ~3 mA (datasheet), so they never source an LED
      </T>

      <T x={520} y={20} weight={700}>
        Active-high: kit LEDs PC14, PB9
      </T>
      <rect x={490} y={52} width={60} height={30} rx={4} fill={alpha('ch2', 0.15)} stroke={col.ch2} />
      <T x={520} y={67} mono size={12}>
        PB9
      </T>
      <Wire d="M520 82 V92" t="ink" />
      <Resistor x={520} y={92} vertical label="330 Ω (typ.)" />
      <Wire d="M520 152 V160" t="ink" />
      <Led x={520} y={160} on />
      <Wire d="M520 174 V200" t="ink" />
      <Gnd x={520} y={200} />
      <T x={520} y={245} size={12}>
        ODR bit = 1 → pin sources current → LED ON
      </T>
    </Svg>
  );
}

/* STM32 ADC block (Day08_1 slides 17–18, simplified) */
export function AdcBlock() {
  return (
    <Svg w={760} h={300} title="STM32F401 ADC block diagram (simplified)">
      <Box x={20} y={40} w={110} h={210} label="" />
      <T x={75} y={56} size={12} weight={600}>
        Inputs
      </T>
      {['IN0 = PA0 (pot)', 'IN1 = PA1 (LDR)', 'IN2 … IN15', 'Temp sensor', 'V_REFINT', 'V_BAT'].map((s, i) => (
        <T key={s} x={30} y={82 + i * 28} anchor="start" size={11} t={i < 2 ? 'gold' : 'dim'}>
          {s}
        </T>
      ))}
      <path d="M160 50 L210 80 L210 220 L160 250 Z" fill={col.raised} stroke={col.ch2} />
      <T x={185} y={150} size={11}>
        MUX
      </T>
      <T x={185} y={268} size={10} t="dim">
        SQRx selects
      </T>
      <Wire d="M130 145 H160" arrow />
      <Box x={240} y={120} w={90} h={60} label="Sample & hold" sub="SMPRx time" size={11} />
      <Box x={360} y={110} w={130} h={80} label="12-bit SAR" sub="RES: 12/10/8/6" t="gold" strong />
      <Box x={520} y={70} w={110} h={44} label="ADC_DR" sub="regular data" t="ch2" size={12} />
      <Box x={520} y={180} w={110} h={44} label="ADC_JDRx" sub="injected" size={12} />
      <Box x={660} y={110} w={90} h={60} label="ADC_SR" sub="EOC → IRQ" t="ch3" size={12} />
      <Arrow x1={210} y1={150} x2={240} y2={150} />
      <Arrow x1={330} y1={150} x2={360} y2={150} />
      <Wire d="M490 135 H505 V92 H520" arrow />
      <Wire d="M490 165 H505 V202 H520" arrow />
      <Wire d="M630 92 H645 V130 H660" arrow />
      <Box x={360} y={20} w={130} h={40} label="ADC_CR2" sub="ADON, CONT, SWSTART" size={11} />
      <Box x={360} y={235} w={130} h={44} label="ADCCLK" sub="PCLK2 / 2,4,6,8 (CCR)" size={11} />
      <Arrow x1={425} y1={60} x2={425} y2={110} />
      <Arrow x1={425} y1={235} x2={425} y2={190} />
      <T x={240} y={40} size={11} t="dim">
        V_REF+ = V_DDA (3.3 V)
      </T>
    </Svg>
  );
}

/* SAR ADC loop (Day08_2 slide 17–19) */
export function SarLoop() {
  return (
    <Svg w={700} h={250} title="Successive approximation ADC">
      <Box x={20} y={90} w={110} h={56} label="Sample & hold" sub="V_in" size={12} />
      <path d="M190 80 L190 160 L260 120 Z" fill={col.raised} stroke={col.ch2} strokeWidth={1.5} />
      <T x={212} y={104} size={14}>
        +
      </T>
      <T x={212} y={138} size={14}>
        −
      </T>
      <T x={225} y={175} size={11} t="dim">
        comparator
      </T>
      <Box x={320} y={92} w={140} h={56} label="SAR logic" sub="tries MSB → LSB" t="gold" strong />
      <Box x={320} y={190} w={140} h={44} label="DAC" sub="V_DAC = code × V_ref / 2ⁿ" size={11} t="ch1" />
      <Box x={530} y={92} w={140} h={56} label="Digital out" sub="n-bit code" t="ch4" />
      <Wire d="M130 104 H190" arrow />
      <Arrow x1={260} y1={120} x2={320} y2={120} label="V_in > V_DAC ?" />
      <Arrow x1={460} y1={120} x2={530} y2={120} />
      <Wire d="M390 148 V190" arrow />
      <Wire d="M320 212 H160 V136 H190" arrow />
      <T x={350} y={30} size={12} t="dim">
        n comparisons → n clock cycles (12-bit: 12 cycles + sampling time)
      </T>
    </Svg>
  );
}

/* Seven-segment layout */
export function SevenSegDiagram() {
  const seg = (d: string, on: boolean, label: string, lx: number, ly: number) => (
    <g key={label}>
      <path d={d} fill={on ? col.led : alpha('led', 0.12)} stroke={col.led} strokeWidth={1} />
      <T x={lx} y={ly} size={13} weight={700}>
        {label}
      </T>
    </g>
  );
  return (
    <Svg w={600} h={260} title="Seven-segment display segment names and digit 2">
      <g transform="translate(60 20)">
        {seg('M20 0 h80 l-10 12 h-60 z', true, 'a', 60, -2)}
        {seg('M102 4 l10 10 v80 l-10 -6 v-74 z', true, 'b', 126, 50)}
        {seg('M102 104 l10 -6 v86 l-10 10 v-80 z', false, 'c', 126, 150)}
        {seg('M20 210 h80 l-10 -12 h-60 z', true, 'd', 60, 224)}
        {seg('M8 104 l10 -6 v80 l-10 10 z', true, 'e', -6, 150)}
        {seg('M8 4 l10 10 v74 l-10 6 z', false, 'f', -6, 50)}
        {seg('M20 103 l8 -8 h64 l8 8 l-8 8 h-64 z', true, 'g', 60, 85)}
        <circle cx={126} cy={205} r={6} fill={alpha('led', 0.12)} stroke={col.led} />
        <T x={142} y={205} size={11}>
          dp
        </T>
      </g>
      <T x={400} y={50} size={13} weight={700}>
        Digit "2" = segments a b g e d
      </T>
      <T x={400} y={80} size={12} mono>
        common cathode: 1 = ON
      </T>
      <T x={400} y={102} size={12} mono t="ch1">
        dp g f e d c b a = 0101 1011 = 0x5B
      </T>
      <T x={400} y={140} size={12} mono>
        common anode: 0 = ON
      </T>
      <T x={400} y={162} size={12} mono t="ch2">
        = ~0x5B & 0xFF = 0xA4
      </T>
      <T x={400} y={200} size={11} t="dim">
        each segment needs its own series resistor
      </T>
    </Svg>
  );
}

/* PCF8574 → HD44780 (I2C_LCD_example.c) */
export function LcdI2c() {
  const bits = ['P7→D7', 'P6→D6', 'P5→D5', 'P4→D4', 'P3→BL', 'P2→EN', 'P1→RW', 'P0→RS'];
  return (
    <Svg w={760} h={260} title="I2C LCD backpack wiring (PCF8574 to HD44780)">
      <Box x={20} y={90} w={140} h={80} label="STM32F401" sub="I2C1: PB6 SCL, PB7 SDA" t="gold" strong size={13} />
      <Wire d="M160 115 H260" t="ch2" width={2} />
      <Wire d="M160 145 H260" t="ch1" width={2} />
      <T x={210} y={105} size={11} t="ch2">
        SCL
      </T>
      <T x={210} y={160} size={11} t="ch1">
        SDA
      </T>
      <Box x={260} y={60} w={150} h={140} label="" />
      <T x={335} y={76} size={12} weight={600}>
        PCF8574 @ 0x27
      </T>
      {bits.map((b, i) => (
        <T key={b} x={275} y={96 + i * 13} anchor="start" size={10.5} mono t={i < 4 ? 'ch4' : 'ch3'}>
          {b}
        </T>
      ))}
      <Wire d="M410 130 H480" t="dim" width={3} />
      <rect x={480} y={70} width={260} height={120} rx={6} fill={alpha('ch4', 0.12)} stroke={col.ch4} />
      <rect x={500} y={95} width={220} height={70} rx={3} fill={alpha('ch4', 0.25)} />
      <T x={610} y={115} mono size={14}>
        POT Value:
      </T>
      <T x={610} y={145} mono size={14}>
        2048
      </T>
      <T x={380} y={230} size={12}>
        Write address byte = 0x27 &lt;&lt; 1 = 0x4E. Each LCD nibble is sent twice: with EN = 1 (…|0x0C), then EN = 0 (…|0x08).
      </T>
    </Svg>
  );
}

/* Lab kit pin map (Emb-kit Manual) */
export function KitPinout() {
  const left: [string, string, string][] = [
    ['PA0', 'User KEY / POT (ADC IN0)', 'ch2'],
    ['PA1', 'LDR (ADC IN1)', 'ch1'],
    ['PA2', 'USART2 TX (AF7)', 'ch4'],
    ['PA3', 'USART2 RX (AF7)', 'ch4'],
    ['PA6', 'Switch S2', 'ch2'],
  ];
  const right: [string, string, string][] = [
    ['PC13', 'User LED (active-low)', 'led'],
    ['PC14', 'LED1 (active-high)', 'led'],
    ['PB9', 'LED2 (active-high)', 'led'],
    ['PB10', 'Switch S1', 'ch2'],
    ['PB6/PB7', 'I²C1 SCL/SDA (AF4)', 'ch3'],
  ];
  return (
    <Svg w={760} h={300} title="Lab kit pin map: STM32F401CCU6 Black Pill and extension board">
      <rect x={280} y={30} width={200} height={240} rx={10} fill={alpha('gold', 0.06)} stroke={col.gold} strokeWidth={1.5} />
      <rect x={330} y={110} width={100} height={80} rx={4} fill={col.mask} stroke={col.line} />
      <T x={380} y={142} size={12} weight={700}>
        STM32F401
      </T>
      <T x={380} y={160} size={11} t="dim">
        CCU6
      </T>
      <T x={380} y={50} size={12} t="gold" weight={600}>
        WeAct Black Pill
      </T>
      {left.map(([p, d, t], i) => (
        <g key={p}>
          <Wire d={`M280 ${70 + i * 42} H230`} t={t as 'ch1'} width={2} />
          <T x={272} y={60 + i * 42} anchor="end" size={11} mono>
            {p}
          </T>
          <T x={222} y={70 + i * 42} anchor="end" size={12}>
            {d}
          </T>
        </g>
      ))}
      {right.map(([p, d, t], i) => (
        <g key={p}>
          <Wire d={`M480 ${70 + i * 42} H530`} t={t as 'ch1'} width={2} />
          <T x={488} y={60 + i * 42} anchor="start" size={11} mono>
            {p}
          </T>
          <T x={538} y={70 + i * 42} anchor="start" size={12}>
            {d}
          </T>
        </g>
      ))}
      <T x={380} y={290} size={11} t="dim">
        Default system clock in every lab program: HSI 16 MHz (no PLL configured)
      </T>
    </Svg>
  );
}
