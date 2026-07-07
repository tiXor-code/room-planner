import { describe, expect, it } from 'vitest';
import { aabbH, aabbOfPoints, aabbW, distance, pieceAABB, rectCorners } from '@/lib/geometry';
import type { FurniturePiece } from '@/lib/types';

describe('geometry', () => {
  it('rectCorners of an axis-aligned rect', () => {
    const c = rectCorners({ x: 0, y: 0, w: 100, h: 50, rotation: 0 });
    expect(c[0]).toEqual({ x: 0, y: 0 });
    expect(c[2]).toEqual({ x: 100, y: 50 });
  });
  it('distance + aabb', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    const bb = aabbOfPoints([{ x: -1, y: 2 }, { x: 3, y: -4 }]);
    expect(bb).toEqual({ minX: -1, minY: -4, maxX: 3, maxY: 2 });
  });
  it('rotated furniture piece AABB grows by sqrt(2) at 45deg', () => {
    const piece: FurniturePiece = { id: 'p', name: 'x', x: 0, y: 0, rotation: 45, boxes: [{ id: 'b', x: 0, y: 0, w: 100, h: 100, rotation: 0 }] };
    const bb = pieceAABB(piece);
    expect(aabbW(bb)).toBeCloseTo(141.42, 1);
    expect(aabbH(bb)).toBeCloseTo(141.42, 1);
  });
});
