// Room planner data model. World units are CENTIMETERS everywhere; screen px is
// derived (pxPerMeter x viewport.scale). Everything here is JSON-serializable.

export type ID = string;

export interface Vec2 {
  x: number;
  y: number;
}

/** A rectangle in cm, rotated (degrees) around its own (x,y) top-left origin. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface Room {
  id: ID;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

/** A box lives in its piece's LOCAL space. */
export interface Box {
  id: ID;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

/** Furniture = a group of one or more boxes that move/rotate as one piece. */
export interface FurniturePiece {
  id: ID;
  name: string;
  x: number;
  y: number;
  rotation: number;
  boxes: Box[];
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left';
export type DoorSwing = 'in' | 'out';

export interface Door {
  id: ID;
  roomId: ID;
  side: WallSide;
  offset: number; // cm from the wall's start corner
  width: number; // cm
  swing: DoorSwing;
  connectsRoomId?: ID;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export const SCHEMA_VERSION = 1 as const;

export interface Plan {
  schemaVersion: 1;
  id: ID;
  name: string;
  units: 'cm' | 'm';
  pxPerMeter: number;
  rooms: Room[];
  furniture: FurniturePiece[];
  doors: Door[];
  viewport: Viewport;
  updatedAt: number;
}

export type Selection =
  | { kind: 'none' }
  | { kind: 'room'; id: ID }
  | { kind: 'piece'; id: ID }
  | { kind: 'pieces'; ids: ID[] }
  | { kind: 'door'; id: ID };

export type Tool = 'select' | 'measure' | 'door';
