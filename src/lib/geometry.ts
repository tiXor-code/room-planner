// Pure 2D geometry in world cm. Rotation is in DEGREES around a rect's (x,y)
// top-left origin — matching how Konva rotates a node about its origin.
import type { Box, FurniturePiece, Rect, Vec2 } from '@/lib/types';

export const deg2rad = (d: number): number => (d * Math.PI) / 180;

export function rotate(p: Vec2, deg: number): Vec2 {
  const r = deg2rad(deg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The 4 corners of a rect, in the rect's parent space (rotated about x,y). */
export function rectCorners(rect: Rect): Vec2[] {
  const local: Vec2[] = [
    { x: 0, y: 0 },
    { x: rect.w, y: 0 },
    { x: rect.w, y: rect.h },
    { x: 0, y: rect.h },
  ];
  return local.map((c) => add({ x: rect.x, y: rect.y }, rotate(c, rect.rotation)));
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function aabbOfPoints(points: Vec2[]): AABB {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export const aabbW = (b: AABB): number => b.maxX - b.minX;
export const aabbH = (b: AABB): number => b.maxY - b.minY;

/** Transform a point from a piece's local space into world space. */
export function pieceToWorld(local: Vec2, piece: Pick<FurniturePiece, 'x' | 'y' | 'rotation'>): Vec2 {
  return add({ x: piece.x, y: piece.y }, rotate(local, piece.rotation));
}

/** World-space corners of a single box inside a piece. */
export function boxWorldCorners(box: Box, piece: Pick<FurniturePiece, 'x' | 'y' | 'rotation'>): Vec2[] {
  return rectCorners(box).map((c) => pieceToWorld(c, piece));
}

/** World-space corners of an entire furniture piece (all its boxes). */
export function pieceWorldCorners(piece: FurniturePiece): Vec2[] {
  return piece.boxes.flatMap((b) => boxWorldCorners(b, piece));
}

export function pieceAABB(piece: FurniturePiece): AABB {
  return aabbOfPoints(pieceWorldCorners(piece));
}

export function roomAABB(room: Rect): AABB {
  return aabbOfPoints(rectCorners(room));
}

export interface Segment {
  a: Vec2;
  b: Vec2;
}

/** Closest point on segment [a,b] to p, and the distance. */
export function projectPointToSegment(p: Vec2, seg: Segment): { point: Vec2; t: number; dist: number } {
  const abx = seg.b.x - seg.a.x;
  const aby = seg.b.y - seg.a.y;
  const len2 = abx * abx + aby * aby;
  let t = len2 === 0 ? 0 : ((p.x - seg.a.x) * abx + (p.y - seg.a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: seg.a.x + t * abx, y: seg.a.y + t * aby };
  return { point, t, dist: distance(p, point) };
}
