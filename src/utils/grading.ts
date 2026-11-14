/** Parses "0x4240 0298", "10499", "0b1011", "2.8 V", "104.17" into a number. */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(/[\s_,]/g, '');
  if (!t) return null;
  if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16);
  if (/^0b[01]+$/i.test(t)) return parseInt(t.slice(2), 2);
  const m = t.match(/^-?\d*\.?\d+(e-?\d+)?/i);
  return m ? Number(m[0]) : null;
}

/**
 * Integer answers (register values, addresses, reload values, counts) must match exactly —
 * 1999 vs 2000 is the classic off-by-one mistake. Decimal answers allow 0.5 % for rounding.
 */
export const defaultTolerance = (answer: number) => (Number.isInteger(answer) ? 0 : Math.abs(answer) * 0.005);

export function numericMatches(response: string, answer: number, tolerance?: number): boolean | null {
  const v = parseNumber(response);
  if (v === null) return null;
  return Math.abs(v - answer) <= (tolerance ?? defaultTolerance(answer)) + 1e-9;
}
