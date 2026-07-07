import { describe, expect, it } from 'vitest';
import { snapPosition, snapToGrid, snapValue } from '@/lib/snap';

describe('snap', () => {
  it('snapToGrid rounds to nearest step', () => {
    expect(snapToGrid(23, 10)).toBe(20);
    expect(snapToGrid(27, 10)).toBe(30);
    expect(snapToGrid(-4, 10)).toBe(-0);
  });
  it('snapValue only snaps within tolerance', () => {
    expect(snapValue(102, [100, 200], 5)).toBe(100);
    expect(snapValue(108, [100, 200], 5)).toBe(108);
  });
  it('snapPosition snaps to edge lines over grid', () => {
    const r = snapPosition(102, 47, { gridStep: 10, useGrid: true, xLines: [100], yLines: [], tol: 5 });
    expect(r.x).toBe(100);
    expect(r.y).toBe(50);
  });
});
