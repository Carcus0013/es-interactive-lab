import { Arrow, Box, Svg, T, Wire, alpha, col } from '../svg';

/* Basic structure of an embedded system (Day02 slide 13–15) */
export function EsBlock() {
  return (
    <Svg w={760} h={360} title="Basic structure of an embedded system">
      <Box x={20} y={40} w={120} h={46} label="Sensors" sub="temp, light, IMU" t="ch2" strong />
      <Box x={20} y={150} w={120} h={46} label="Input devices" sub="keys, switches" t="ch2" strong />
      <Box x={170} y={40} w={110} h={46} label="Signal cond." sub="amplify, filter" />
      <Box x={300} y={40} w={70} h={46} label="ADC" t="ch1" strong />
      <Box x={400} y={110} w={150} h={110} label="Processor" sub="MCU / MPU / DSP" t="gold" strong size={15} />
      <Box x={400} y={250} w={150} h={46} label="Memory" sub="Flash (code), SRAM (data)" />
      <Box x={400} y={20} w={150} h={46} label="Clock & reset" sub="crystal / RC osc." />
      <Box x={590} y={40} w={70} h={46} label="DAC" t="ch1" strong />
      <Box x={680} y={30} w={70} h={66} label="Actuators" sub="motor, valve" t="ch3" strong size={12} />
      <Box x={590} y={150} w={160} h={46} label="Output devices" sub="LED, LCD, buzzer" t="ch3" strong />
      <Box x={590} y={250} w={160} h={46} label="Communication" sub="UART, I²C, SPI, USB" t="ch4" strong />
      <Box x={20} y={260} w={260} h={70} label="Power supply" sub="battery / regulator (LDO 3.3 V)" dashed />
      <Arrow x1={140} y1={63} x2={170} y2={63} />
      <Arrow x1={280} y1={63} x2={300} y2={63} />
      <Wire d="M370 63 H385 V140 H400" arrow />
      <Wire d="M140 173 H400" arrow />
      <Arrow x1={475} y1={220} x2={475} y2={250} both />
      <Arrow x1={475} y1={66} x2={475} y2={110} />
      <Wire d="M550 140 H570 V63 H590" arrow />
      <Arrow x1={660} y1={63} x2={680} y2={63} />
      <Arrow x1={550} y1={173} x2={590} y2={173} />
      <Wire d="M550 200 H570 V273 H590" arrow />
      <T x={150} y={348} size={11} t="dim">Power and clock reach every block (not drawn).</T>
    </Svg>
  );
}

/* Microprocessor-based system vs microcontroller (Day02 slides 9–11; PYQ MT25A Q1) */
export function McuVsMpu() {
  const chip = (x: number, title: string, onchip: boolean) => (
    <g>
      <rect x={x} y={30} width={330} height={250} rx={8} fill="none" stroke={col.line} strokeDasharray="5 4" />
      <T x={x + 165} y={18} size={14} weight={700}>
        {title}
      </T>
      <rect x={x + 15} y={45} width={onchip ? 300 : 110} height={onchip ? 220 : 80} rx={6} fill={alpha('gold', 0.08)} stroke={col.gold} strokeWidth={1.8} />
      <T x={x + (onchip ? 165 : 70)} y={60} size={11} t="gold">
        single chip
      </T>
      <Box x={x + 30} y={72} w={80} h={40} label="CPU" t="gold" strong />
      {[
        ['Flash', 'program'],
        ['SRAM', 'data'],
        ['Timers', ''],
        ['GPIO', ''],
        ['ADC', ''],
        ['UART/I²C', ''],
      ].map(([l, s], i) => {
        const bx = onchip ? x + 130 + (i % 2) * 90 : x + 15 + (i % 3) * 105;
        const by = onchip ? 72 + Math.floor(i / 2) * 62 : 150 + Math.floor(i / 3) * 62;
        return <Box key={l} x={bx} y={by} w={onchip ? 80 : 95} h={40} label={l} sub={s || undefined} size={12} />;
      })}
      {!onchip && <T x={x + 165} y={135} size={11} t="dim">external chips on the PCB bus</T>}
    </g>
  );
  return (
    <Svg w={720} h={300} title="Microprocessor system versus microcontroller">
      {chip(10, 'Microprocessor system (PC)', false)}
      {chip(380, 'Microcontroller (smart-home node)', true)}
    </Svg>
  );
}

/* Cortex-M4 processor block diagram (Day04 L01 slide 21) */
export function M4Block() {
  return (
    <Svg w={760} h={400} title="Arm Cortex-M4 processor block diagram">
      <rect x={10} y={10} width={740} height={380} rx={10} fill="none" stroke={col.gold} strokeWidth={1.5} />
      <T x={380} y={28} size={13} t="gold" weight={600}>
        Cortex-M4 processor (Arm IP) — vendor adds Flash, SRAM, peripherals around it
      </T>
      <Box x={40} y={60} w={150} h={60} label="NVIC" sub="up to 240 IRQs + NMI" t="ch3" strong />
      <Box x={40} y={140} w={150} h={46} label="WIC (optional)" sub="wake-up from deep sleep" dashed />
      <Box x={230} y={60} w={290} h={150} label="" t="gold" strong />
      <T x={375} y={78} size={14} weight={700}>
        Processor core
      </T>
      <Box x={250} y={95} w={120} h={46} label="Register bank" sub="R0–R15, xPSR" size={12} />
      <Box x={380} y={95} w={120} h={46} label="ALU + MAC" sub="DSP, SIMD, divide" size={12} />
      <Box x={250} y={150} w={250} h={46} label="3-stage pipeline" sub="fetch → decode → execute (+ branch speculation)" size={12} />
      <Box x={560} y={60} w={160} h={60} label="FPU (optional)" sub="IEEE-754 single precision" t="ch2" strong />
      <Box x={560} y={140} w={160} h={46} label="MPU (optional)" sub="8 regions" dashed />
      <Box x={230} y={240} w={290} h={50} label="Bus matrix" sub="AHB-Lite interfaces, bit-band logic, write buffer" t="ch4" strong />
      <Box x={40} y={240} w={150} h={50} label="Debug access port" sub="JTAG / SWD" dashed />
      <Box x={560} y={240} w={160} h={50} label="Trace (optional)" sub="ETM, ITM, DWT, FPB" dashed />
      <Box x={150} y={320} w={200} h={46} label="Code interface" sub="I-Code + D-Code → Flash" />
      <Box x={400} y={320} w={200} h={46} label="SRAM & peripheral interface" sub="System bus" size={12} />
      <Arrow x1={190} y1={90} x2={230} y2={90} both />
      <Arrow x1={520} y1={90} x2={560} y2={90} both />
      <Arrow x1={375} y1={210} x2={375} y2={240} both />
      <Wire d="M300 290 V320" arrow />
      <Wire d="M450 290 V320" arrow />
      <Arrow x1={190} y1={265} x2={230} y2={265} />
      <Arrow x1={520} y1={265} x2={560} y2={265} />
    </Svg>
  );
}

/* Register bank + special registers (Day04 L01 slide 27) */
export function RegisterBank() {
  const regs = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12'];
  return (
    <Svg w={700} h={470} title="Cortex-M4 register bank and special registers">
      <T x={110} y={16} size={13} weight={700}>
        Register bank
      </T>
      {regs.map((r, i) => (
        <g key={r}>
          <rect x={60} y={30 + i * 26} width={100} height={24} fill={col.raised} stroke={i < 8 ? col.ch2 : col.ch4} />
          <T x={110} y={42 + i * 26} mono size={12}>
            {r}
          </T>
        </g>
      ))}
      <Wire d="M52 32 H44 V236 H52" t="ch2" />
      <T x={38} y={134} anchor="end" size={11} t="ch2">
        Low regs
      </T>
      <Wire d="M52 240 H44 V366 H52" t="ch4" />
      <T x={38} y={303} anchor="end" size={11} t="ch4">
        High regs
      </T>
      <T x={250} y={145} anchor="start" size={12} t="dim">
        R0–R12: general purpose
      </T>
      {[
        ['R13 (SP)', 'Stack pointer — banked: MSP / PSP'],
        ['R14 (LR)', 'Link register — return address'],
        ['R15 (PC)', 'Program counter'],
      ].map(([r, d], i) => (
        <g key={r}>
          <rect x={60} y={372 + i * 28} width={100} height={26} fill={alpha('gold', 0.12)} stroke={col.gold} />
          <T x={110} y={385 + i * 28} mono size={12} t="gold">
            {r}
          </T>
          <T x={172} y={385 + i * 28} anchor="start" size={12}>
            {d}
          </T>
        </g>
      ))}
      <T x={540} y={16} size={13} weight={700}>
        Special registers
      </T>
      {[
        ['xPSR', 'APSR, IPSR, EPSR (flags, ISR no., T bit)'],
        ['PRIMASK', '1 = block all configurable interrupts'],
        ['FAULTMASK', '1 = block everything except NMI'],
        ['BASEPRI', 'block priorities ≥ this value'],
        ['CONTROL', 'nPRIV (privilege), SPSEL (MSP/PSP), FPCA'],
      ].map(([r, d], i) => (
        <g key={r}>
          <rect x={420} y={34 + i * 62} width={110} height={26} fill={alpha('ch3', 0.12)} stroke={col.ch3} />
          <T x={475} y={47 + i * 62} mono size={12} t="ch3">
            {r}
          </T>
          <T x={420} y={74 + i * 62} anchor="start" size={11} t="dim">
            {d}
          </T>
        </g>
      ))}
      <T x={540} y={350} size={11} t="dim">
        PRIMASK, FAULTMASK, BASEPRI = interrupt mask registers
      </T>
    </Svg>
  );
}

/* xPSR layout (Day04 L01 slide 31–33) */
export function Xpsr() {
  const W = 640 / 32;
  const fields: [number, number, string, 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'gold' | 'dim'][] = [
    [31, 31, 'N', 'ch1'],
    [30, 30, 'Z', 'ch1'],
    [29, 29, 'C', 'ch1'],
    [28, 28, 'V', 'ch1'],
    [27, 27, 'Q', 'ch1'],
    [26, 25, 'ICI/IT', 'ch3'],
    [24, 24, 'T', 'ch3'],
    [23, 20, 'res', 'dim'],
    [19, 16, 'GE*', 'ch2'],
    [15, 10, 'ICI/IT', 'ch3'],
    [9, 9, 'res', 'dim'],
    [8, 0, 'ISR_NUMBER', 'ch4'],
  ];
  const x0 = 40;
  return (
    <Svg w={720} h={230} title="Combined program status register xPSR">
      {fields.map(([hi, lo, name, t]) => {
        const x = x0 + (31 - hi) * W;
        const w = (hi - lo + 1) * W;
        return (
          <g key={hi}>
            <rect x={x} y={60} width={w} height={44} fill={alpha(t, 0.15)} stroke={col[t]} />
            <T x={x + w / 2} y={82} size={w < 25 ? 12 : 12} mono weight={700} t={t}>
              {name}
            </T>
            <T x={x + 2} y={48} anchor="start" size={9} t="dim" mono>
              {hi}
            </T>
          </g>
        );
      })}
      <T x={x0} y={128} anchor="start" size={12} t="ch1">
        APSR: N negative, Z zero, C carry (unsigned overflow), V overflow (signed), Q saturation
      </T>
      <T x={x0} y={152} anchor="start" size={12} t="ch3">
        EPSR: T = Thumb state (always 1 on Cortex-M); ICI/IT = interrupted LDM/STM progress or IT-block state
      </T>
      <T x={x0} y={176} anchor="start" size={12} t="ch4">
        IPSR: ISR_NUMBER = exception number now executing (0 = thread mode)
      </T>
      <T x={x0} y={204} anchor="start" size={11} t="dim">
        *GE[3:0] (bits 19–16) are SIMD greater-or-equal flags on Cortex-M4 (from PM0214; not on the slide).
      </T>
    </Svg>
  );
}

/* 3-stage pipeline (Day04 L01 slide 22) */
export function PipelineDiagram() {
  const stages = ['Fetch', 'Decode', 'Execute'];
  const cols = [col.ch2, col.ch1, col.ch4];
  return (
    <Svg w={640} h={220} title="Three-stage pipeline overlap">
      {[0, 1, 2, 3].map((ins) => (
        <g key={ins}>
          <T x={70} y={40 + ins * 40} anchor="end" size={12}>
            Instr {ins + 1}
          </T>
          {stages.map((s, k) => (
            <g key={s}>
              <rect x={90 + (ins + k) * 90} y={26 + ins * 40} width={86} height={28} rx={4} fill={cols[k]} fillOpacity={0.18} stroke={cols[k]} />
              <T x={133 + (ins + k) * 90} y={40 + ins * 40} size={12}>
                {s}
              </T>
            </g>
          ))}
        </g>
      ))}
      <Arrow x1={90} y1={200} x2={630} y2={200} t="dim" />
      <T x={360} y={188} size={11} t="dim">
        time (clock cycles) — once full, one instruction completes per cycle
      </T>
    </Svg>
  );
}

/* Memory map with bit-band regions (Day06 slide 12, L02 slides 17–18) */
export function MemMapDiagram() {
  const regions: [string, string, string, 'gold' | 'ch2' | 'ch3' | 'ch4' | 'dim' | 'ch1'][] = [
    ['0xE000 0000', 'System (PPB)', 'NVIC, SysTick, SCB, MPU, debug', 'ch3'],
    ['0xA000 0000', 'External device', '1 GB', 'dim'],
    ['0x6000 0000', 'External RAM', '1 GB', 'dim'],
    ['0x4000 0000', 'Peripheral', 'GPIO, RCC, ADC, USART… + bit-band', 'ch2'],
    ['0x2000 0000', 'SRAM', 'variables, stack, heap + bit-band', 'ch4'],
    ['0x0000 0000', 'Code', 'Flash at 0x0800 0000, aliased at 0', 'gold'],
  ];
  return (
    <Svg w={720} h={420} title="Cortex-M4 memory map with bit-band regions">
      {regions.map(([a, n, d, t], i) => (
        <g key={a}>
          <rect x={300} y={20 + i * 62} width={150} height={60} fill={alpha(t, 0.14)} stroke={col[t]} />
          <T x={375} y={42 + i * 62} weight={700}>
            {n}
          </T>
          <T x={375} y={60 + i * 62} size={10} t="dim">
            {d.length > 26 ? d.slice(0, 26) + '…' : d}
          </T>
          <T x={292} y={80 + i * 62} anchor="end" mono size={11} t="dim">
            {a}
          </T>
        </g>
      ))}
      {/* peripheral bit-band */}
      <g>
        <rect x={520} y={150} width={180} height={34} fill={alpha('ch2', 0.12)} stroke={col.ch2} />
        <T x={610} y={167} size={11}>
          Alias 32 MB 0x4200 0000–0x43FF FFFF
        </T>
        <rect x={520} y={196} width={180} height={34} fill={alpha('ch2', 0.25)} stroke={col.ch2} />
        <T x={610} y={213} size={11}>
          Bit-band 1 MB 0x4000 0000–0x400F FFFF
        </T>
        <Wire d="M450 230 L520 213" t="ch2" dashed />
        <Arrow x1={610} y1={184} x2={610} y2={196} t="ch2" />
      </g>
      <g>
        <rect x={520} y={272} width={180} height={34} fill={alpha('ch4', 0.12)} stroke={col.ch4} />
        <T x={610} y={289} size={11}>
          Alias 32 MB 0x2200 0000–0x23FF FFFF
        </T>
        <rect x={520} y={318} width={180} height={34} fill={alpha('ch4', 0.25)} stroke={col.ch4} />
        <T x={610} y={335} size={11}>
          Bit-band 1 MB 0x2000 0000–0x200F FFFF
        </T>
        <Wire d="M450 292 L520 335" t="ch4" dashed />
        <Arrow x1={610} y1={306} x2={610} y2={318} t="ch4" />
      </g>
      <T x={30} y={60} anchor="start" size={12}>
        STM32F401CCU6:
      </T>
      {['Flash 256 KB @ 0x0800 0000', 'SRAM 64 KB @ 0x2000 0000', 'GPIOA 0x4002 0000', 'GPIOB 0x4002 0400', 'GPIOC 0x4002 0800', 'RCC 0x4002 3800', 'ADC1 0x4001 2000', 'USART2 0x4000 4400', 'I2C1 0x4000 5400', 'SysTick 0xE000 E010'].map((s, i) => (
        <T key={s} x={30} y={84 + i * 22} anchor="start" size={11} t="dim" mono>
          {s}
        </T>
      ))}
    </Svg>
  );
}

/* Bit-band mapping (Bit_banding_notes fig 2–3) */
export function BitBandMap() {
  return (
    <Svg w={720} h={300} title="Bit-band mapping: each bit becomes a 32-bit alias word">
      <T x={170} y={20} weight={700}>
        Bit-band region (one 32-bit word)
      </T>
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={30 + i * 35} y={36} width={35} height={34} fill={i === 2 ? alpha('gold', 0.3) : col.raised} stroke={col.line} />
          <T x={47 + i * 35} y={53} mono size={11}>
            b{7 - i}
          </T>
        </g>
      ))}
      <T x={330} y={53} anchor="start" size={11} t="dim">
        … bits 31–8
      </T>
      <T x={180} y={88} size={11} t="dim" mono>
        word at 0x4002 0814 (GPIOC_ODR)
      </T>
      <T x={540} y={20} weight={700}>
        Alias region (one word per bit)
      </T>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={440} y={36 + i * 38} width={200} height={32} fill={i === 5 - 0 ? col.raised : col.raised} stroke={i === 5 ? col.gold : col.line} />
          <T x={540} y={52 + i * 38} mono size={11} t={i === 5 ? 'gold' : 'ink'}>
            {`0x4241 02${(0x80 + i * 4).toString(16).toUpperCase()}  → bit ${i}`}
          </T>
        </g>
      ))}
      <Wire d="M117 70 C 200 160 330 240 440 245" t="gold" arrow />
      <T x={260} y={250} size={11} t="gold">
        bit 5 ↔ alias word 0x4241 0294
      </T>
      <T x={360} y={286} size={12}>
        alias = 0x4200 0000 + (0x4002 0814 − 0x4000 0000) × 32 + bit × 4
      </T>
    </Svg>
  );
}

/* Thread / handler modes (Lecture01 programmer's model) */
export function ModesDiagram() {
  return (
    <Svg w={680} h={260} title="Operating modes and privilege levels">
      <Box x={30} y={40} w={200} h={70} label="Thread mode" sub="privileged (after reset)" t="ch2" strong />
      <Box x={30} y={160} w={200} h={70} label="Thread mode" sub="unprivileged" t="ch4" strong />
      <Box x={450} y={100} w={200} h={70} label="Handler mode" sub="always privileged, uses MSP" t="ch3" strong />
      <Arrow x1={230} y1={70} x2={450} y2={120} label="exception" t="ch3" />
      <Arrow x1={450} y1={150} x2={230} y2={190} label="exception return" t="ch3" lx={330} ly={190} />
      <Arrow x1={120} y1={110} x2={120} y2={160} label="" t="dim" />
      <T x={127} y={135} anchor="start" size={11} t="dim">
        write CONTROL.nPRIV = 1
      </T>
      <Wire d="M450 115 C 380 30 300 30 232 52" t="gold" arrow dashed />
      <T x={345} y={30} size={11} t="gold">
        handler may clear nPRIV → back to privileged thread
      </T>
      <T x={340} y={244} size={11} t="dim">
        Unprivileged software cannot set itself privileged; it must raise an exception (e.g. SVC).
      </T>
    </Svg>
  );
}
