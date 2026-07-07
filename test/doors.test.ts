import { describe, expect, it } from 'vitest';
import { doorSegment, findSharedRoom, wallSegment } from '@/lib/doors';
import type { Door, Room } from '@/lib/types';

const roomA: Room = { id: 'A', name: 'A', x: 0, y: 0, w: 400, h: 300, rotation: 0 };
const roomB: Room = { id: 'B', name: 'B', x: 0, y: 300, w: 400, h: 300, rotation: 0 }; // directly below A

describe('doors', () => {
  it('wall + door segments along a wall', () => {
    expect(wallSegment(roomA, 'top')).toEqual({ a: { x: 0, y: 0 }, b: { x: 400, y: 0 } });
    const door: Door = { id: 'd', roomId: 'A', side: 'bottom', offset: 160, width: 80, swing: 'in' };
    const seg = doorSegment(door, roomA);
    // bottom wall runs right->left from (400,300) to (0,300); door y stays 300
    expect(seg.a.y).toBeCloseTo(300);
    expect(seg.b.y).toBeCloseTo(300);
  });

  it('detects a shared wall between two stacked rooms', () => {
    const door: Door = { id: 'd', roomId: 'A', side: 'bottom', offset: 160, width: 80, swing: 'in' };
    const seg = doorSegment(door, roomA);
    expect(findSharedRoom(seg, [roomA, roomB], 'A')).toBe('B');
  });

  it('no shared wall on an outer wall', () => {
    const door: Door = { id: 'd', roomId: 'A', side: 'top', offset: 160, width: 80, swing: 'in' };
    const seg = doorSegment(door, roomA);
    expect(findSharedRoom(seg, [roomA, roomB], 'A')).toBeUndefined();
  });
});
