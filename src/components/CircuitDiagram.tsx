import type { CircuitSpec } from '../types';
import { Svg, T, Wire, alpha, col } from '../animations/svg';

/** Draws the Black Pill on the left and each connected component on its own row, with power and ground labelled. */
export default function CircuitDiagram({ spec, title = 'Circuit diagram' }: { spec: CircuitSpec; title?: string }) {
  type Row = { kind: 'led' | 'sw' | 'analog' | 'uart' | 'i2c'; pin: string; label: string; extra?: string; activeLow?: boolean; analogKind?: 'pot' | 'ldr'; pin2?: string };
  const rows: Row[] = [
    ...(spec.leds ?? []).map((l) => ({ kind: 'led' as const, pin: l.pin, label: l.label, activeLow: l.activeLow })),
    ...(spec.switches ?? []).map((s) => ({ kind: 'sw' as const, pin: s.pin, label: s.label, extra: s.pull ?? 'up' })),
    ...(spec.analog ?? []).map((a) => ({ kind: 'analog' as const, pin: a.pin, label: a.label, analogKind: a.kind })),
    ...(spec.uart ? [{ kind: 'uart' as const, pin: spec.uart.tx, pin2: spec.uart.rx, label: spec.uart.label }] : []),
    ...(spec.i2c ? [{ kind: 'i2c' as const, pin: spec.i2c.scl, pin2: spec.i2c.sda, label: spec.i2c.label }] : []),
  ];
  const rowH = 92;
  const H = Math.max(260, 70 + rows.length * rowH);
  const boardX = 30;
  const boardW = 190;
  const pinX = boardX + boardW;

  return (
    <Svg w={820} h={H} title={title}>
      {/* board */}
      <rect x={boardX} y={30} width={boardW} height={H - 60} rx={10} fill={alpha('gold', 0.06)} stroke={col.gold} strokeWidth={1.6} />
      <T x={boardX + boardW / 2} y={50} size={13} weight={700} t="gold">
        STM32F401CCU6
      </T>
      <T x={boardX + boardW / 2} y={68} size={11} t="dim">
        Black Pill (3.3 V logic)
      </T>
      <rect x={boardX + 45} y={H / 2 - 30} width={100} height={60} rx={4} fill={col.mask} stroke={col.line} />
      <T x={boardX + 95} y={H / 2} size={11} t="dim">
        Cortex-M4
      </T>
      <T x={boardX + boardW / 2} y={H - 46} size={11} t="ch1">
        3V3 rail
      </T>
      <T x={boardX + boardW / 2} y={H - 30 + 14} size={10} t="dim">
        USB 5 V → LDO → 3.3 V, common GND
      </T>

      {rows.map((r, i) => {
        const y = 80 + i * rowH + rowH / 2 - 10;
        const cx = 470;
        return (
          <g key={r.kind + r.pin + i}>
            <T x={pinX - 8} y={y} anchor="end" mono size={12} t="ink" weight={600}>
              {r.pin}
            </T>
            <circle cx={pinX} cy={y} r={4} fill={col.gold} />
            {r.kind === 'led' && (
              <g>
                {r.activeLow ? (
                  <>
                    {/* 3V3 -> R -> LED -> pin (sink) */}
                    <Wire d={`M${pinX} ${y} H${cx + 60}`} t="ink" />
                    <LedSym x={cx + 60} y={y} left />
                    <Wire d={`M${cx + 90} ${y} H${cx + 110}`} t="ink" />
                    <ResH x={cx + 110} y={y} />
                    <Wire d={`M${cx + 170} ${y} H${cx + 190}`} t="ink" />
                    <T x={cx + 212} y={y} size={11} t="ch1">
                      3.3 V
                    </T>
                    <T x={cx + 60} y={y + 30} size={11} t="dim">
                      {r.label} — active-low: ODR = 0 → ON
                    </T>
                  </>
                ) : (
                  <>
                    <Wire d={`M${pinX} ${y} H${cx}`} t="ink" />
                    <ResH x={cx} y={y} />
                    <Wire d={`M${cx + 60} ${y} H${cx + 80}`} t="ink" />
                    <LedSym x={cx + 80} y={y} />
                    <Wire d={`M${cx + 110} ${y} H${cx + 140}`} t="ink" />
                    <GndSym x={cx + 140} y={y} />
                    <T x={cx + 60} y={y + 30} size={11} t="dim">
                      {r.label} — active-high: ODR = 1 → ON
                    </T>
                  </>
                )}
              </g>
            )}
            {r.kind === 'sw' && (
              <g>
                <Wire d={`M${pinX} ${y} H${cx + 40}`} t="ink" />
                <circle cx={cx + 40} cy={y} r={3} fill={col.ink} />
                <line x1={cx + 40} y1={y} x2={cx + 72} y2={y - 12} stroke={col.ink} strokeWidth={1.6} />
                <circle cx={cx + 75} cy={y} r={3} fill={col.ink} />
                <Wire d={`M${cx + 75} ${y} H${cx + 110}`} t="ink" />
                <GndSym x={cx + 110} y={y} />
                <T x={pinX + 70} y={y - 14} size={10} t="ch2">
                  internal pull-{r.extra} (PUPDR)
                </T>
                <T x={cx + 60} y={y + 30} size={11} t="dim">
                  {r.label} — released 1, pressed 0
                </T>
              </g>
            )}
            {r.kind === 'analog' && (
              <g>
                <Wire d={`M${pinX} ${y} H${cx + 40}`} t="ch1" />
                {r.analogKind === 'pot' ? (
                  <>
                    <rect x={cx + 40} y={y - 40} width={18} height={80} rx={3} fill={col.raised} stroke={col.ink} />
                    <path d={`M${cx + 70} ${y} l-10 -5 v10 z`} fill={col.ch1} />
                    <Wire d={`M${cx + 49} ${y - 40} V${y - 52} H${cx + 120}`} t="ink" />
                    <T x={cx + 140} y={y - 52} size={11} t="ch1">
                      3.3 V
                    </T>
                    <Wire d={`M${cx + 49} ${y + 40} V${y + 46} H${cx + 120}`} t="ink" />
                    <GndSym x={cx + 120} y={y + 46} />
                    <T x={cx + 160} y={y} size={11} t="dim" anchor="start">
                      {r.label} (wiper → pin)
                    </T>
                  </>
                ) : (
                  <>
                    <Wire d={`M${cx + 40} ${y - 40} V${y + 40}`} t="ink" />
                    <ResV x={cx + 40} y={y - 40} label="LDR" />
                    <ResV x={cx + 40} y={y + 10} label="R fixed" />
                    <Wire d={`M${cx + 40} ${y - 40} V${y - 50} H${cx + 100}`} t="ink" />
                    <T x={cx + 120} y={y - 50} size={11} t="ch1">
                      3.3 V
                    </T>
                    <GndSym x={cx + 40} y={y + 50} />
                    <T x={cx + 160} y={y} size={11} t="dim" anchor="start">
                      {r.label} (divider mid-point)
                    </T>
                  </>
                )}
                <T x={pinX + 70} y={y - 14} size={10} t="ch1">
                  MODER = 11 (analog)
                </T>
              </g>
            )}
            {r.kind === 'uart' && (
              <g>
                <T x={pinX - 8} y={y + 22} anchor="end" mono size={12} weight={600}>
                  {r.pin2 ?? ''}
                </T>
                {r.pin2 && <circle cx={pinX} cy={y + 22} r={4} fill={col.gold} />}
                <rect x={cx + 60} y={y - 26} width={170} height={70} rx={6} fill={alpha('ch2', 0.1)} stroke={col.ch2} />
                <T x={cx + 145} y={y - 10} size={12} weight={600}>
                  {r.label}
                </T>
                <T x={cx + 75} y={y + 8} anchor="start" size={11} mono>
                  RX
                </T>
                <T x={cx + 75} y={y + 28} anchor="start" size={11} mono>
                  TX
                </T>
                <Wire d={`M${pinX} ${y} H${cx} L${cx + 60} ${y + 8}`} t="ch1" arrow />
                {r.pin2 && <Wire d={`M${cx + 60} ${y + 28} H${cx + 20} L${cx - 20} ${y + 22} H${pinX}`} t="ch2" arrow />}
                <T x={cx + 145} y={y + 56} size={10} t="dim">
                  + common GND; terminal: Docklight or PuTTY
                </T>
              </g>
            )}
            {r.kind === 'i2c' && (
              <g>
                <T x={pinX - 8} y={y + 22} anchor="end" mono size={12} weight={600}>
                  {r.pin2 ?? ''}
                </T>
                <circle cx={pinX} cy={y + 22} r={4} fill={col.gold} />
                <Wire d={`M${pinX} ${y} H${cx + 60}`} t="ch2" />
                <Wire d={`M${pinX} ${y + 22} H${cx + 60}`} t="ch1" />
                <T x={pinX + 70} y={y - 10} size={10} t="ch2">
                  SCL (AF4, open-drain)
                </T>
                <T x={pinX + 70} y={y + 36} size={10} t="ch1">
                  SDA (AF4, open-drain)
                </T>
                <rect x={cx + 60} y={y - 26} width={210} height={74} rx={6} fill={alpha('ch4', 0.12)} stroke={col.ch4} />
                <rect x={cx + 75} y={y - 12} width={180} height={34} rx={3} fill={alpha('ch4', 0.25)} />
                <T x={cx + 165} y={y + 5} size={12} mono>
                  16×2 LCD
                </T>
                <T x={cx + 165} y={y + 36} size={10} t="dim">
                  {r.label}
                </T>
              </g>
            )}
          </g>
        );
      })}
    </Svg>
  );
}

function ResH({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y} h8 l4 -6 8 12 8 -12 8 12 8 -12 4 6 h12`} fill="none" stroke={col.ink} strokeWidth={1.5} />
      <T x={x + 30} y={y - 14} size={10} t="dim">
        R
      </T>
    </g>
  );
}
function ResV({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 7} y={y + 4} width={14} height={22} fill={col.raised} stroke={col.ink} />
      <T x={x + 12} y={y + 15} anchor="start" size={10} t="dim">
        {label}
      </T>
    </g>
  );
}
function LedSym({ x, y, left }: { x: number; y: number; left?: boolean }) {
  // triangle points in conventional current direction
  const tri = left ? `M${x + 30} ${y - 9} v18 l-16 -9 z` : `M${x} ${y - 9} v18 l16 -9 z`;
  const bar = left ? `M${x + 14} ${y - 9} v18` : `M${x + 16} ${y - 9} v18`;
  return (
    <g>
      {left ? <Wire d={`M${x} ${y} H${x + 14} M${x + 30} ${y} H${x + 30}`} t="ink" /> : <Wire d={`M${x + 16} ${y} H${x + 30}`} t="ink" />}
      <path d={tri} fill={col.led} fillOpacity={0.35} stroke={col.led} strokeWidth={1.5} />
      <path d={bar} stroke={col.led} strokeWidth={1.8} />
    </g>
  );
}
function GndSym({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y} v10 M${x - 10} ${y + 10} h20 M${x - 6} ${y + 14} h12 M${x - 2} ${y + 18} h4`} stroke={col.ink} strokeWidth={1.5} />
      <T x={x + 16} y={y + 14} anchor="start" size={10} t="dim">
        GND
      </T>
    </g>
  );
}
