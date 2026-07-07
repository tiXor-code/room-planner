import { describe, expect, it } from 'vitest';
import { pieceAABB } from '@/lib/geometry';
import { groupPieces, makeBoxPiece, ungroupPiece } from '@/lib/group';
import type { FurniturePiece } from '@/lib/types';

// Deterministic ids for stable assertions.
function counter() {
  let n = 0;
  return () => `id${n++}`;
}

describe('group / ungroup', () => {
  it('combines two boxes into one piece with a correct union AABB', () => {
    const a = makeBoxPiece(0, 0, 100, 100, counter());
    const b = makeBoxPiece(200, 0, 100, 100, counter());
    const g = groupPieces([a, b], counter());
    expect(g.boxes).toHaveLength(2);
    expect(g.rotation).toBe(0);
    const bb = pieceAABB(g);
    expect(bb.minX).toBeCloseTo(0);
    expect(bb.maxX).toBeCloseTo(300);
    expect(bb.maxY).toBeCloseTo(100);
  });

  it('group -> ungroup round-trips box world positions (incl. rotation)', () => {
    const a = makeBoxPiece(0, 0, 100, 60, counter());
    const b: FurniturePiece = { id: 'B', name: 'x', x: 250, y: 40, rotation: 30, boxes: [{ id: 'bb', x: 0, y: 0, w: 80, h: 80, rotation: 0 }] };
    const g = groupPieces([a, b], counter());
    const parts = ungroupPiece(g, counter());
    expect(parts).toHaveLength(2);
    const byArea = parts.sort((x, y) => x.boxes[0].w - y.boxes[0].w);
    // the 80x80 rotated box returns to (250,40) rot 30
    const rotated = byArea.find((p) => p.boxes[0].w === 80)!;
    expect(rotated.x).toBeCloseTo(250);
    expect(rotated.y).toBeCloseTo(40);
    expect(rotated.rotation).toBeCloseTo(30);
    // the axis box returns to (0,0) rot 0
    const flat = byArea.find((p) => p.boxes[0].w === 100)!;
    expect(flat.x).toBeCloseTo(0);
    expect(flat.y).toBeCloseTo(0);
    expect(flat.rotation).toBeCloseTo(0);
  });
});
