import { describe, expect, it } from 'vitest';
import { cmToPx, formatArea, formatMetric, pxToCm } from '@/lib/units';

describe('units', () => {
  it('round-trips cm <-> px at default scale (1cm = 1px)', () => {
    expect(cmToPx(100)).toBe(100);
    expect(pxToCm(100)).toBe(100);
    expect(pxToCm(cmToPx(357))).toBeCloseTo(357);
  });
  it('scales with pxPerMeter', () => {
    expect(cmToPx(100, 50)).toBe(50);
    expect(pxToCm(50, 50)).toBe(100);
  });
  it('formats metric with the 1m boundary', () => {
    expect(formatMetric(85)).toBe('85 cm');
    expect(formatMetric(99)).toBe('99 cm');
    expect(formatMetric(100)).toBe('1.00 m');
    expect(formatMetric(420)).toBe('4.20 m');
  });
  it('formats area in m^2', () => {
    expect(formatArea(400 * 300)).toBe('12.00 m²');
  });
});
