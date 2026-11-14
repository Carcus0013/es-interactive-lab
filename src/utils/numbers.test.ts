import { describe, expect, it } from 'vitest';
import { parseNumber, numericMatches } from './grading';
import { brr } from '../simulations/UartSim';
import { bitbandSolution, systickSolution } from '../content/pyq/shared';
import { gradeObjective } from '../data/bank';
import type { BankItem } from '../types';

const alias = (reg: number, bit: number) => 0x42000000 + (reg - 0x40000000) * 32 + bit * 4;

describe('parseNumber', () => {
  it('reads decimal, hex, binary and values with units', () => {
    expect(parseNumber('10499')).toBe(10499);
    expect(parseNumber('0x4240 0298')).toBe(0x42400298);
    expect(parseNumber('0b1011')).toBe(11);
    expect(parseNumber('2.8 V')).toBe(2.8);
    expect(parseNumber('1_000')).toBe(1000);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('bit-band alias answers used in the PYQ solutions', () => {
  it.each([
    [0x4002001c, 5, 0x42400394], // Aug 2025 Set A (address as printed)
    [0x40020014, 5, 0x42400294], // the ODR alternative given in the source note
    [0x40020014, 6, 0x42400298], // Aug 2025 Set B
    [0x40020014, 7, 0x4240029c], // Aug 2026 Set 1
    [0x40020414, 4, 0x42408290], // Aug 2026 Set 2
    [0x40020814, 13, 0x424102b4], // PC13, used by the bit-band programs
  ])('reg %s bit %i', (reg, bit, expected) => {
    expect(alias(reg, bit)).toBe(expected);
    const text = bitbandSolution({ reg, bit, regName: 'R' });
    expect(text).toContain('0x' + expected.toString(16).toUpperCase().padStart(8, '0'));
  });
});

describe('USART BRR', () => {
  it('9600 baud at 16 MHz is 0x0683', () => {
    expect(brr(16e6, 9600, false).reg).toBe(0x0683);
  });
  it('115200 baud at 16 MHz is 0x008B', () => {
    expect(brr(16e6, 115200, false).reg).toBe(0x008b);
  });
  it('9600 baud at 16 MHz with OVER8 is 0x0D03', () => {
    expect(brr(16e6, 9600, true).reg).toBe(0x0d03);
  });
});

describe('SysTick reload answers', () => {
  it('84 MHz / 8, 1 ms → 10499', () => {
    expect(systickSolution(84)).toContain('SYST_RVR = 10499**');
  });
  it('16 MHz / 8, 1 ms → 1999', () => {
    expect(systickSolution(16)).toContain('SYST_RVR = 1999**');
  });
});

describe('objective grading', () => {
  const base = { id: 'x', unit: 1, topic: 't', difficulty: 'easy', marks: 1, q: '', explain: '', generated: true } as const;
  it('accepts alternatives for fill-in answers, ignoring case and spaces', () => {
    const item: BankItem = { ...base, type: 'fill', answer: '0x42000000', accept: ['0x4200 0000'] };
    expect(gradeObjective(item, '0X42000000')).toBe(true);
    expect(gradeObjective(item, '0x4200 0000')).toBe(true);
    expect(gradeObjective(item, '0x40000000')).toBe(false);
  });
  it('grades numericals within tolerance and accepts hex input', () => {
    const item: BankItem = { ...base, type: 'numerical', answer: 1999 };
    expect(gradeObjective(item, '1999')).toBe(true);
    expect(gradeObjective(item, '0x7CF')).toBe(true);
    expect(gradeObjective(item, '2000')).toBe(false);
  });
  it('allows 0.5 % on decimal answers and an explicit tolerance when given', () => {
    expect(numericMatches('104.2', 104.17)).toBe(true);
    expect(numericMatches('105', 104.17)).toBe(false);
    expect(numericMatches('1.6504', 1.65, 0.005)).toBe(true);
    expect(numericMatches('0x200007F8', 0x200007f8)).toBe(true);
    expect(numericMatches('0x200007F0', 0x200007f8)).toBe(false);
  });
});
