import { useState } from 'react';
import { Link } from '../utils/router';
import { usePrefersReducedMotion } from '../hooks/useStepper';

interface Periph {
  id: string;
  label: string;
  pins: string;
  x: number;
  y: number;
  /** trace path from MCU edge to the peripheral pad */
  d: string;
  tone: string;
  text: string;
  topic: string;
}

// Coordinates in a 900 × 520 board. MCU occupies 360–540 × 170–350.
const P: Periph[] = [
  { id: 'gpio', label: 'GPIO and LEDs', pins: 'PC13 PC14 PB9', x: 40, y: 40, d: 'M360 200 H300 L240 140 H150 V82', tone: 'led', text: 'Each pin is configured by MODER/OTYPER/PUPDR and driven through ODR or BSRR. PC13 is active-low; the kit LEDs are active-high.', topic: 'gpio-registers' },
  { id: 'switch', label: 'Switches', pins: 'PA0 PA6 PB10', x: 40, y: 200, d: 'M360 240 H150', tone: 'ch2', text: 'Inputs with internal pull-ups: a released switch reads 1, a pressed switch reads 0 in IDR.', topic: 'leds-switches' },
  { id: 'adc', label: 'ADC: pot and LDR', pins: 'PA0 IN0, PA1 IN1', x: 40, y: 360, d: 'M360 300 H300 L240 380 H150 V398', tone: 'ch1', text: '12-bit successive-approximation converter: 0–3.3 V becomes 0–4095. Started by SWSTART, finished when EOC is set.', topic: 'adc-stm32' },
  { id: 'nvic', label: 'NVIC and EXTI', pins: 'EXTI6, EXTI10', x: 370, y: 20, d: 'M420 170 V80', tone: 'ch3', text: 'Edge-triggered GPIO interrupts and peripheral IRQs are prioritised by the NVIC, which fetches the ISR address from the vector table.', topic: 'nvic' },
  { id: 'systick', label: 'SysTick timer', pins: '24-bit down-counter', x: 560, y: 20, d: 'M500 170 V120 H620 V80', tone: 'ch4', text: 'Counts LOAD → 0 at the core clock (or HCLK/8), sets COUNTFLAG and can raise a periodic exception.', topic: 'systick' },
  { id: 'uart', label: 'USART2', pins: 'PA2 TX, PA3 RX', x: 720, y: 40, d: 'M540 210 H640 L700 140 H770 V82', tone: 'ch4', text: 'Asynchronous serial: start bit, 8 data bits LSB-first, stop bit. BRR = 0x0683 gives 9600 baud at 16 MHz.', topic: 'uart' },
  { id: 'i2c', label: 'I²C1 and LCD', pins: 'PB6 SCL, PB7 SDA', x: 720, y: 200, d: 'M540 250 H770', tone: 'ch2', text: 'Two open-drain wires with pull-ups. The lab drives a 16×2 LCD through a PCF8574 at address 0x27.', topic: 'i2c' },
  { id: 'pwm', label: 'Timer and PWM', pins: 'TIMx CCR/ARR', x: 720, y: 360, d: 'M540 300 H640 L700 380 H770 V398', tone: 'ch1', text: 'A timer compares its counter with CCR to make a square wave whose duty cycle sets LED brightness or motor speed.', topic: 'pwm' },
  { id: 'spi', label: 'SPI', pins: 'SCK MOSI MISO CS', x: 560, y: 450, d: 'M500 350 V420 H620 V450', tone: 'ch3', text: 'Four-wire full-duplex synchronous bus: master and slave swap a byte every 8 clocks.', topic: 'spi' },
  { id: 'mem', label: 'Flash & SRAM', pins: '256 KB, 64 KB', x: 370, y: 450, d: 'M420 350 V450', tone: 'gold', text: 'Code runs from Flash at 0x0800 0000; variables and the stack live in SRAM at 0x2000 0000.', topic: 'memory-map' },
];

const toneVar = (t: string) => `rgb(var(--${t}))`;

export default function BoardHero() {
  const [hot, setHot] = useState<string>('adc');
  const reduced = usePrefersReducedMotion();
  const active = P.find((p) => p.id === hot)!;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_17rem]">
      <svg viewBox="0 0 900 520" className="h-auto w-full" role="img" aria-label="Interactive diagram of the STM32F401 and its peripherals">
        <defs>
          <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill="rgb(var(--line))" />
          </pattern>
        </defs>
        <rect x="6" y="6" width="888" height="508" rx="18" fill="rgb(var(--panel))" stroke="rgb(var(--line))" />
        <rect x="6" y="6" width="888" height="508" rx="18" fill="url(#hero-grid)" opacity="0.6" />
        {/* mounting holes */}
        {[
          [28, 28],
          [872, 28],
          [28, 492],
          [872, 492],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="rgb(var(--mask))" stroke="rgb(var(--gold))" strokeWidth="2" />
        ))}
        {/* traces */}
        {P.map((p) => {
          const on = p.id === hot;
          return (
            <g key={p.id}>
              <path d={p.d} fill="none" stroke={on ? toneVar(p.tone) : 'rgb(var(--gold) / 0.35)'} strokeWidth={on ? 4 : 3} strokeLinejoin="round" strokeLinecap="round" />
              {on && !reduced && <path d={p.d} fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeDasharray="4 20" className="animate-flow" strokeLinecap="round" />}
            </g>
          );
        })}
        {/* MCU package */}
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i}>
              <rect x={372 + i * 14} y={160} width="6" height="10" fill="rgb(var(--dim))" />
              <rect x={372 + i * 14} y={350} width="6" height="10" fill="rgb(var(--dim))" />
              <rect x={350} y={182 + i * 14} width="10" height="6" fill="rgb(var(--dim))" />
              <rect x={540} y={182 + i * 14} width="10" height="6" fill="rgb(var(--dim))" />
            </g>
          ))}
          <rect x="360" y="170" width="180" height="180" rx="6" fill="rgb(var(--mask))" stroke="rgb(var(--line))" strokeWidth="2" />
          <circle cx="378" cy="188" r="5" fill="rgb(var(--raised))" />
          <text x="450" y="245" textAnchor="middle" fill="rgb(var(--ink))" fontSize="20" fontWeight="700" style={{ fontStretch: '80%' }}>
            STM32F401
          </text>
          <text x="450" y="268" textAnchor="middle" fill="rgb(var(--dim))" fontSize="13">
            Cortex-M4F, up to 84 MHz
          </text>
          <text x="450" y="292" textAnchor="middle" fill="rgb(var(--gold))" fontSize="12">
            HSI 16 MHz in the labs
          </text>
        </g>
        {/* peripheral pads */}
        {P.map((p) => {
          const on = p.id === hot;
          return (
            <g
              key={p.id}
              tabIndex={0}
              role="button"
              aria-label={`${p.label}: ${p.text}`}
              aria-pressed={on}
              onMouseEnter={() => setHot(p.id)}
              onFocus={() => setHot(p.id)}
              onClick={() => setHot(p.id)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <rect x={p.x} y={p.y} width="160" height="62" rx="6" fill={on ? 'rgb(var(--raised))' : 'rgb(var(--mask))'} stroke={on ? toneVar(p.tone) : 'rgb(var(--line))'} strokeWidth={on ? 2 : 1.2} />
              <circle cx={p.x + 16} cy={p.y + 20} r="5" fill={on ? toneVar(p.tone) : 'rgb(var(--gold) / 0.5)'} />
              <text x={p.x + 30} y={p.y + 25} fill="rgb(var(--ink))" fontSize="15" fontWeight="600" style={{ fontStretch: '85%' }}>
                {p.label}
              </text>
              <text x={p.x + 14} y={p.y + 47} fill="rgb(var(--dim))" fontSize="12" fontFamily="'JetBrains Mono Variable', monospace">
                {p.pins}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="rounded-md border border-line bg-panel p-4" aria-live="polite">
        <div className="text-xs text-dim">Hover or tab through the board</div>
        <h3 className="mt-1 text-xl font-semibold" style={{ color: toneVar(active.tone) }}>
          {active.label}
        </h3>
        <p className="mt-1 font-mono text-xs text-dim">{active.pins}</p>
        <p className="mt-3 text-[0.95rem] leading-relaxed">{active.text}</p>
        <Link to={`/topic/${active.topic}`} className="btn mt-4">
          Open the lesson
        </Link>
      </div>
    </div>
  );
}
