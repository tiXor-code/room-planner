// The core "combine boxes into one furniture piece" mechanic — pure and tested.
// Grouping preserves every box's on-screen position and rotation; it only
// re-expresses them under one axis-aligned parent frame. Ungrouping bakes the
// parent transform back into each box, so group -> ungroup round-trips exactly.
import { aabbOfPoints, pieceToWorld, pieceWorldCorners } from '@/lib/geometry';
import type { Box, FurniturePiece } from '@/lib/types';

export function newId(): string {
  return crypto.randomUUID();
}

/** Combine several furniture pieces into one piece (rotation-aware). */
export function groupPieces(pieces: FurniturePiece[], id: () => string = newId): FurniturePiece {
  const bb = aabbOfPoints(pieces.flatMap(pieceWorldCorners));
  const origin = { x: bb.minX, y: bb.minY };
  const boxes: Box[] = [];
  for (const p of pieces) {
    for (const b of p.boxes) {
      const world = pieceToWorld({ x: b.x, y: b.y }, p);
      boxes.push({
        id: id(),
        x: world.x - origin.x,
        y: world.y - origin.y,
        w: b.w,
        h: b.h,
        rotation: p.rotation + b.rotation,
      });
    }
  }
  return { id: id(), name: 'Furniture', x: origin.x, y: origin.y, rotation: 0, boxes };
}

/** Split a piece back into one single-box piece per box (inverse of group). */
export function ungroupPiece(piece: FurniturePiece, id: () => string = newId): FurniturePiece[] {
  return piece.boxes.map((b) => {
    const world = pieceToWorld({ x: b.x, y: b.y }, piece);
    return {
      id: id(),
      name: piece.name,
      x: world.x,
      y: world.y,
      rotation: piece.rotation + b.rotation,
      boxes: [{ id: id(), x: 0, y: 0, w: b.w, h: b.h, rotation: 0 }],
    };
  });
}

export function makeBoxPiece(x: number, y: number, w: number, h: number, id: () => string = newId): FurniturePiece {
  return { id: id(), name: 'Furniture', x, y, rotation: 0, boxes: [{ id: id(), x: 0, y: 0, w, h, rotation: 0 }] };
}
