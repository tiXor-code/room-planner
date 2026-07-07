// Door <-> wall geometry (pure). A door is anchored to one room's wall by side +
// offset + width, so it rides along when the room moves. If its segment lies on
// another room's wall too, that room is the "connected" room (a passage).
import { distance, projectPointToSegment, rectCorners, type Segment } from '@/lib/geometry';
import type { Door, Room, WallSide } from '@/lib/types';

/** World segment (start->end) of a room's wall side. */
export function wallSegment(room: Room, side: WallSide): Segment {
  const [tl, tr, br, bl] = rectCorners(room);
  switch (side) {
    case 'top':
      return { a: tl, b: tr };
    case 'right':
      return { a: tr, b: br };
    case 'bottom':
      return { a: br, b: bl };
    case 'left':
      return { a: bl, b: tl };
  }
}

export function wallLength(room: Room, side: WallSide): number {
  return side === 'top' || side === 'bottom' ? room.w : room.h;
}

/** World segment of the door opening itself, along its wall. */
export function doorSegment(door: Door, room: Room): Segment {
  const wall = wallSegment(room, door.side);
  const len = distance(wall.a, wall.b) || 1;
  const dir = { x: (wall.b.x - wall.a.x) / len, y: (wall.b.y - wall.a.y) / len };
  const start = Math.max(0, Math.min(len - door.width, door.offset));
  return {
    a: { x: wall.a.x + dir.x * start, y: wall.a.y + dir.y * start },
    b: { x: wall.a.x + dir.x * (start + door.width), y: wall.a.y + dir.y * (start + door.width) },
  };
}

/** Find a room whose wall the door segment lies on (colinear overlap). */
export function findSharedRoom(seg: Segment, rooms: Room[], excludeRoomId: string, tol = 6): string | undefined {
  const sides: WallSide[] = ['top', 'right', 'bottom', 'left'];
  for (const room of rooms) {
    if (room.id === excludeRoomId) continue;
    for (const side of sides) {
      const wall = wallSegment(room, side);
      const da = projectPointToSegment(seg.a, wall).dist;
      const db = projectPointToSegment(seg.b, wall).dist;
      if (da <= tol && db <= tol) return room.id;
    }
  }
  return undefined;
}
