import { Arrow, Box, Svg, T, Waveform, Wire, alpha, col } from '../svg';

/* SysTick functional diagram (Day10_4 slide 12) */
export function SysTickBlock() {
  return (
    <Svg w={760} h={250} title="SysTick timer functional diagram">
      <T x={60} y={80} anchor="end" size={12}>
        HCLK/8
      </T>
      <T x={60} y={150} anchor="end" size={12}>
        HCLK
      </T>
      <T x={30} y={180} anchor="start" size={10} t="dim">
        (external ref.)
      </T>
      <path d="M90 50 L140 75 L140 165 L90 190 Z" fill={col.raised} stroke={col.ch2} />
      <T x={103} y={80} size={12}>
        0
      </T>
      <T x={103} y={150} size={12}>
        1
      </T>
      <Wire d="M64 80 H90 M64 150 H90" arrow />
      <T x={115} y={30} size={11} t="ch2">
        CLKSOURCE (CTRL bit 2)
      </T>
      <Wire d="M115 40 V62" t="ch2" arrow />
      <path d="M200 95 h30 a25 25 0 0 1 0 50 h-30 z" fill={col.raised} stroke={col.ink} />
      <T x={225} y={120} size={11}>
        AND
      </T>
      <Wire d="M140 120 H200" />
      <T x={170} y={175} size={11} t="ch4">
        ENABLE (bit 0)
      </T>
      <Wire d="M170 165 V135 H200" t="ch4" />
      <Box x={330} y={30} w={240} h={50} label="STK_LOAD (RVR)" sub="24-bit reload value" t="gold" strong />
      <Box x={330} y={110} w={240} h={60} label="STK_VAL (CVR)" sub="24-bit down-counter: LOAD → … → 0" t="ch1" strong />
      <Wire d="M255 120 H330" arrow />
      <Arrow x1={450} y1={80} x2={450} y2={110} label="reload at 0" lx={505} ly={96} />
      <Box x={620} y={110} w={120} h={60} label="COUNTFLAG" sub="CTRL bit 16" t="ch3" strong size={12} />
      <Wire d="M570 140 H620" arrow />
      <Box x={620} y={190} w={120} h={46} label="SysTick_Handler" sub="if TICKINT (bit 1)" t="ch3" size={11} />
      <Arrow x1={680} y1={170} x2={680} y2={190} />
      <T x={380} y={225} size={12}>
        Period = (LOAD + 1) / f_clk; COUNTFLAG clears when CTRL is read
      </T>
    </Svg>
  );
}

/* NVIC and vector table (Day10_1, Day10_2) */
export function NvicVector() {
  const vt: [string, string][] = [
    ['0x0000 0000', 'Initial MSP value'],
    ['0x0000 0004', 'Reset_Handler  (1)'],
    ['0x0000 0008', 'NMI_Handler  (2)'],
    ['0x0000 000C', 'HardFault  (3)'],
    ['0x0000 002C', 'SVC  (11)'],
    ['0x0000 003C', 'SysTick_Handler  (15)'],
    ['0x0000 0058', 'EXTI0_IRQHandler  (IRQ6)'],
    ['0x0000 0088', 'ADC_IRQHandler  (IRQ18)'],
    ['0x0000 009C', 'EXTI9_5_IRQHandler  (IRQ23)'],
    ['0x0000 00D8', 'USART2_IRQHandler  (IRQ38)'],
    ['0x0000 00E0', 'EXTI15_10_IRQHandler  (IRQ40)'],
  ];
  return (
    <Svg w={760} h={420} title="NVIC with peripheral interrupt lines and the vector table">
      {['EXTI lines', 'ADC (EOC)', 'USART2', 'Timers', 'NMI'].map((s, i) => (
        <g key={s}>
          <Box x={20} y={40 + i * 56} w={120} h={38} label={s} size={12} t={i === 4 ? 'bad' : 'ch2'} />
          <Arrow x1={140} y1={59 + i * 56} x2={200} y2={59 + i * 56} t={i === 4 ? 'bad' : 'dim'} />
        </g>
      ))}
      <rect x={200} y={30} width={150} height={290} rx={8} fill={alpha('ch3', 0.1)} stroke={col.ch3} strokeWidth={1.6} />
      <T x={275} y={52} weight={700} t="ch3">
        NVIC
      </T>
      {['ISER enable', 'ICER disable', 'ISPR pending', 'IABR active', 'IPR priority', 'STIR sw trigger'].map((s, i) => (
        <T key={s} x={275} y={84 + i * 34} size={12} mono>
          {s}
        </T>
      ))}
      <Arrow x1={350} y1={170} x2={410} y2={170} label="highest priority" ly={156} />
      <Box x={20} y={340} w={330} h={50} label="Cortex-M4 core" sub="stacks context, fetches vector, runs ISR" t="gold" strong />
      <Wire d="M275 320 V340" arrow />
      <T x={570} y={18} weight={700}>
        Vector table (in Flash)
      </T>
      {vt.map(([a, n], i) => (
        <g key={a}>
          <rect x={410} y={30 + i * 34} width={330} height={32} fill={i < 2 ? alpha('gold', 0.12) : col.raised} stroke={col.line} />
          <T x={418} y={46 + i * 34} anchor="start" mono size={11} t="dim">
            {a}
          </T>
          <T x={520} y={46 + i * 34} anchor="start" size={12}>
            {n}
          </T>
        </g>
      ))}
      <T x={575} y={410} size={11} t="dim">
        entry address = 4 × exception number; IRQn = exception number − 16
      </T>
    </Svg>
  );
}

/* Exception stack frame (Day10_1 slide 8) */
export function StackFrame() {
  const regs = ['xPSR', 'PC (return address)', 'LR', 'R12', 'R3', 'R2', 'R1', 'R0'];
  return (
    <Svg w={680} h={340} title="Exception stack frame pushed automatically on interrupt entry">
      <T x={200} y={18} weight={700}>
        Stack (grows down) after entry
      </T>
      {regs.map((r, i) => (
        <g key={r}>
          <rect x={120} y={30 + i * 34} width={180} height={32} fill={i === 1 ? alpha('gold', 0.15) : col.raised} stroke={col.ch3} />
          <T x={210} y={46 + i * 34} mono size={12}>
            {r}
          </T>
          <T x={112} y={46 + i * 34} anchor="end" mono size={10} t="dim">
            {`old SP − ${(i + 1) * 4}`}
          </T>
        </g>
      ))}
      <Wire d="M310 302 H340" t="ch3" arrow />
      <T x={348} y={302} anchor="start" size={12} t="ch3">
        new SP (8 words = 32 bytes lower)
      </T>
      <T x={360} y={60} anchor="start" size={12}>
        1. Finish current instruction
      </T>
      <T x={360} y={84} anchor="start" size={12}>
        2. Push R0–R3, R12, LR, PC, xPSR
      </T>
      <T x={360} y={108} anchor="start" size={12}>
        3. LR ← EXC_RETURN (0xFFFFFFF9 etc.)
      </T>
      <T x={360} y={132} anchor="start" size={12}>
        4. IPSR ← exception number
      </T>
      <T x={360} y={156} anchor="start" size={12}>
        5. PC ← vector table entry, run ISR
      </T>
      <T x={360} y={180} anchor="start" size={12}>
        6. BX LR (EXC_RETURN) → pop 8 words
      </T>
      <T x={360} y={220} anchor="start" size={11} t="dim">
        These are the caller-saved registers (AAPCS), so an
      </T>
      <T x={360} y={238} anchor="start" size={11} t="dim">
        ISR can be an ordinary C function.
      </T>
    </Svg>
  );
}

/* Tail chaining and late arrival (Day10_1 slides 11–14) */
export function TailChain() {
  const row = (y: number, label: string, parts: [number, number, string, 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'dim' | 'gold'][]) => (
    <g>
      <T x={150} y={y + 14} anchor="end" size={12}>
        {label}
      </T>
      {parts.map(([x, w, l, t], i) => (
        <g key={i}>
          <rect x={160 + x} y={y} width={w} height={28} fill={alpha(t, 0.2)} stroke={col[t]} />
          <T x={160 + x + w / 2} y={y + 14} size={10.5}>
            {l}
          </T>
        </g>
      ))}
    </g>
  );
  return (
    <Svg w={760} h={240} title="Tail-chaining versus plain back-to-back interrupts">
      {row(30, 'Without tail-chain', [
        [0, 60, 'main', 'dim'],
        [60, 50, 'push', 'ch3'],
        [110, 90, 'ISR 1', 'ch1'],
        [200, 50, 'pop', 'ch3'],
        [250, 50, 'push', 'ch3'],
        [300, 90, 'ISR 2', 'ch2'],
        [390, 50, 'pop', 'ch3'],
        [440, 60, 'main', 'dim'],
      ])}
      {row(90, 'Tail-chaining', [
        [0, 60, 'main', 'dim'],
        [60, 50, 'push', 'ch3'],
        [110, 90, 'ISR 1', 'ch1'],
        [200, 25, '6 cyc', 'gold'],
        [225, 90, 'ISR 2', 'ch2'],
        [315, 50, 'pop', 'ch3'],
        [365, 60, 'main', 'dim'],
      ])}
      {row(150, 'Late arrival', [
        [0, 60, 'main', 'dim'],
        [60, 50, 'push', 'ch3'],
        [110, 90, 'ISR high', 'ch1'],
        [200, 25, 'tc', 'gold'],
        [225, 90, 'ISR low', 'ch2'],
        [315, 50, 'pop', 'ch3'],
      ])}
      <T x={420} y={208} size={11} t="dim">
        Late arrival: low-priority IRQ starts stacking, high-priority IRQ arrives during stacking → its vector is fetched instead.
      </T>
      <T x={420} y={226} size={11} t="dim">
        Stack/unstack ≈ 12 cycles each; tail-chain ≈ 6 cycles (Cortex-M4 nominal).
      </T>
    </Svg>
  );
}

/* EXTI mapping (Day10_2 slides 6–11) */
export function ExtiMap() {
  return (
    <Svg w={760} h={300} title="External interrupt line mapping on STM32F401">
      {['PA6', 'PB6', 'PC6', 'PD6', 'PE6', 'PH6'].map((p, i) => (
        <g key={p}>
          <T x={60} y={40 + i * 26} anchor="end" mono size={12} t={i === 0 ? 'gold' : 'dim'}>
            {p}
          </T>
          <Wire d={`M66 ${40 + i * 26} H110`} t={i === 0 ? 'gold' : 'line'} />
        </g>
      ))}
      <path d="M110 20 L170 50 L170 170 L110 200 Z" fill={col.raised} stroke={col.ch2} />
      <T x={140} y={110} size={11}>
        MUX
      </T>
      <T x={140} y={222} size={11} t="ch2">
        SYSCFG_EXTICR2 [11:8]
      </T>
      <T x={140} y={238} size={10} t="dim">
        0000=A 0001=B 0010=C …
      </T>
      <Wire d="M170 110 H220" arrow t="gold" />
      <T x={200} y={98} size={11} t="gold">
        EXTI6
      </T>
      <Box x={220} y={80} w={120} h={60} label="Edge detect" sub="RTSR / FTSR" t="ch1" size={12} />
      <Box x={370} y={80} w={90} h={60} label="IMR" sub="unmask" size={12} />
      <Box x={490} y={80} w={90} h={60} label="PR" sub="pending, w1c" t="ch3" size={12} />
      <Arrow x1={340} y1={110} x2={370} y2={110} />
      <Arrow x1={460} y1={110} x2={490} y2={110} />
      <Arrow x1={580} y1={110} x2={620} y2={110} />
      <Box x={620} y={70} w={120} h={80} label="NVIC" sub="EXTI9_5_IRQn" t="ch3" strong size={13} />
      <T x={430} y={190} size={12} anchor="middle">
        Lines 0–4 have their own IRQs (EXTI0…EXTI4); lines 5–9 share EXTI9_5; lines 10–15 share EXTI15_10.
      </T>
      <T x={430} y={212} size={12} anchor="middle">
        Only ONE port can own a given line number: PA6 and PB6 cannot both interrupt on EXTI6.
      </T>
      <T x={430} y={250} size={11} t="dim" anchor="middle">
        EXTICR[0..3] = EXTICR1..4; line n uses EXTICR[n/4], bits 4×(n%4)+3 … 4×(n%4); SYSCFG clock = RCC_APB2ENR bit 14
      </T>
    </Svg>
  );
}

/* UART frame (Day10_5 slides 13–14) */
export function UartFrame() {
  // 'A' = 0x41 = 0100 0001, LSB first: 1 0 0 0 0 0 1 0, even parity of three? 0x41 has two 1s -> even parity bit 0
  const lv: (0 | 1)[] = [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1];
  const labels = ['idle', 'idle', 'start', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'P', 'stop', 'idle'];
  return (
    <Svg w={760} h={190} title="UART frame for the character A with even parity">
      <Waveform x={60} y={50} w={680} h={50} levels={lv} t="ch1" label="TX" />
      {labels.map((l, i) => (
        <T key={i} x={60 + (i + 0.5) * (680 / 14)} y={125} size={11} t={l === 'start' || l === 'stop' ? 'gold' : l === 'P' ? 'ch3' : 'dim'} mono>
          {l}
        </T>
      ))}
      {lv.map((b, i) => (
        <T key={i} x={60 + (i + 0.5) * (680 / 14)} y={30} size={11} mono>
          {b}
        </T>
      ))}
      <T x={400} y={160} size={12}>
        'A' = 0x41 = 0100 0001 sent LSB first; even parity → P = 0; 1 bit time = 1 / baud (9600 baud → 104.17 µs)
      </T>
    </Svg>
  );
}

export function UartConnection() {
  return (
    <Svg w={700} h={220} title="UART connection between two devices">
      <Box x={40} y={40} w={180} h={140} label="" t="gold" strong />
      <T x={130} y={58} weight={700}>
        STM32F401 (USART2)
      </T>
      <Box x={480} y={40} w={180} h={140} label="" t="ch2" strong />
      <T x={570} y={58} weight={700}>
        USB-TTL (FT232RL)
      </T>
      <T x={200} y={90} anchor="end" mono size={12}>
        PA2 TX
      </T>
      <T x={200} y={130} anchor="end" mono size={12}>
        PA3 RX
      </T>
      <T x={200} y={165} anchor="end" mono size={12}>
        GND
      </T>
      <T x={500} y={90} anchor="start" mono size={12}>
        RX
      </T>
      <T x={500} y={130} anchor="start" mono size={12}>
        TX
      </T>
      <T x={500} y={165} anchor="start" mono size={12}>
        GND
      </T>
      <Wire d="M220 90 L480 130" t="ch1" arrow width={2} />
      <Wire d="M480 90 L220 130" t="ch2" arrow width={2} />
      <Wire d="M220 165 H480" t="dim" width={2} />
      <T x={350} y={200} size={12}>
        TX → RX crossed, common ground, both sides set to the same baud rate
      </T>
    </Svg>
  );
}

/* I2C bus with pull-ups (Day10_8 slide 2–6) */
export function I2cBus() {
  return (
    <Svg w={760} h={260} title="I2C bus with master, slaves and pull-up resistors">
      <Wire d="M60 70 H720" t="ch1" width={2.5} />
      <Wire d="M60 120 H720" t="ch2" width={2.5} />
      <T x={50} y={70} anchor="end" mono t="ch1">
        SDA
      </T>
      <T x={50} y={120} anchor="end" mono t="ch2">
        SCL
      </T>
      <T x={650} y={20} size={11} t="ch1">
        V_DD
      </T>
      <Wire d="M630 30 H690 M640 30 V70 M680 30 V120" t="ink" />
      <rect x={634} y={38} width={12} height={22} fill={col.raised} stroke={col.ink} />
      <rect x={674} y={60} width={12} height={34} fill={col.raised} stroke={col.ink} />
      <T x={600} y={48} size={10} t="dim">
        R_p
      </T>
      {[
        ['Master', 'STM32 I2C1', 'gold'],
        ['Slave 0x27', 'LCD PCF8574', 'ch4'],
        ['Slave 0x50', 'EEPROM', 'ch4'],
        ['Slave 0x68', 'RTC DS1307', 'ch4'],
      ].map(([a, b, t], i) => (
        <g key={a}>
          <Box x={80 + i * 150} y={160} w={130} h={56} label={a} sub={b} t={t as 'gold'} strong size={12} />
          <Wire d={`M${120 + i * 150} 160 V70`} t="ch1" />
          <Wire d={`M${170 + i * 150} 160 V120`} t="ch2" />
          <circle cx={120 + i * 150} cy={70} r={3} fill={col.ch1} />
          <circle cx={170 + i * 150} cy={120} r={3} fill={col.ch2} />
        </g>
      ))}
      <T x={380} y={240} size={12}>
        All devices are open-drain: any device can pull a line LOW; the resistors pull it HIGH when everyone releases it.
      </T>
    </Svg>
  );
}

/* I2C timing (Day10_8 slide 8–13) */
export function I2cTiming() {
  // START, 7 address bits (0x27 = 0100111), W=0, ACK=0, then STOP
  const n = 24;
  const scl: (0 | 1)[] = [];
  const sda: (0 | 1)[] = [];
  const addr = [0, 1, 0, 0, 1, 1, 1, 0, 0]; // 7 addr + W + ACK
  scl.push(1, 1);
  sda.push(1, 0); // START: SDA falls while SCL high
  addr.forEach((b) => {
    scl.push(0, 1);
    sda.push(b as 0 | 1, b as 0 | 1);
  });
  scl.push(0, 1, 1);
  sda.push(0, 0, 1); // STOP: SDA rises while SCL high
  while (scl.length < n) {
    scl.push(1);
    sda.push(1);
  }
  const step = 680 / n;
  const labels = ['A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'W', 'ACK'];
  return (
    <Svg w={760} h={230} title="I2C START, address byte, ACK and STOP timing">
      <Waveform x={60} y={40} w={680} h={36} levels={sda} t="ch1" label="SDA" />
      <Waveform x={60} y={110} w={680} h={36} levels={scl} t="ch2" label="SCL" />
      <rect x={60 + step} y={30} width={step} height={130} fill={alpha('gold', 0.12)} />
      <T x={60 + step * 1.5} y={175} size={11} t="gold">
        S
      </T>
      {labels.map((l, i) => (
        <T key={l} x={60 + step * (3 + i * 2) + step / 2} y={175} size={10.5} mono t={l === 'ACK' ? 'ch4' : 'dim'}>
          {l}
        </T>
      ))}
      <rect x={60 + step * 21} y={30} width={step} height={130} fill={alpha('gold', 0.12)} />
      <T x={60 + step * 21.5} y={175} size={11} t="gold">
        P
      </T>
      <T x={400} y={205} size={12}>
        Address 0x27 + W(0): data changes only while SCL is LOW and is sampled while SCL is HIGH; the slave pulls SDA LOW for ACK.
      </T>
    </Svg>
  );
}

/* SPI bus */
export function SpiBus() {
  return (
    <Svg w={760} h={230} title="SPI master and slave connections">
      <Box x={40} y={40} w={170} h={150} label="" t="gold" strong />
      <T x={125} y={58} weight={700}>
        Master
      </T>
      <Box x={550} y={40} w={170} h={150} label="" t="ch2" strong />
      <T x={635} y={58} weight={700}>
        Slave
      </T>
      {[
        ['SCLK', 'ch2', 85, true],
        ['MOSI', 'ch1', 115, true],
        ['MISO', 'ch3', 145, false],
        ['CS (NSS)', 'ch4', 175, true],
      ].map(([n, t, y, toSlave]) => (
        <g key={n as string}>
          <T x={200} y={y as number} anchor="end" mono size={12}>
            {n as string}
          </T>
          <T x={560} y={y as number} anchor="start" mono size={12}>
            {n as string}
          </T>
          {toSlave ? (
            <Arrow x1={210} y1={y as number} x2={550} y2={y as number} t={t as 'ch1'} width={2} />
          ) : (
            <Arrow x1={550} y1={y as number} x2={210} y2={y as number} t={t as 'ch1'} width={2} />
          )}
        </g>
      ))}
      <T x={380} y={215} size={12}>
        Full duplex: every clock shifts one bit out on MOSI and one bit in on MISO. CS is active-low, one line per slave.
      </T>
    </Svg>
  );
}
