'use client';

import { create } from 'zustand';
import { doorSegment, findSharedRoom, wallLength } from '@/lib/doors';
import { groupPieces, makeBoxPiece, newId, ungroupPiece } from '@/lib/group';
import { newPlan } from '@/lib/storage';
import { pxToCm } from '@/lib/units';
import type { Door, DoorSwing, FurniturePiece, Plan, Room, Selection, Tool, WallSide } from '@/lib/types';

const clone = <T,>(v: T): T => structuredClone(v);
const HISTORY = 100;

interface Stage {
  w: number;
  h: number;
}

interface State {
  plan: Plan;
  selection: Selection;
  tool: Tool;
  snap: boolean;
  stage: Stage;
  past: Plan[];
  future: Plan[];

  setStage: (w: number, h: number) => void;
  loadPlanIntoStore: (plan: Plan) => void;
  resetToNew: (name?: string) => void;
  renamePlan: (name: string) => void;
  setTool: (t: Tool) => void;
  setSnap: (v: boolean) => void;
  setViewport: (vp: Plan['viewport']) => void;
  select: (s: Selection) => void;

  addRoom: () => void;
  addBox: () => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  updatePiece: (id: string, patch: Partial<Pick<FurniturePiece, 'x' | 'y' | 'rotation' | 'name'>>) => void;
  updateBoxSize: (pieceId: string, boxId: string, w: number, h: number) => void;
  deleteSelection: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  duplicateSelected: () => void;
  addDoor: (roomId: string, side: WallSide, offset: number, width: number, swing: DoorSwing) => void;
  updateDoor: (id: string, patch: Partial<Door>) => void;
  nudge: (dx: number, dy: number) => void;

  undo: () => void;
  redo: () => void;
}

function worldCenter(get: () => State): { x: number; y: number } {
  const { plan, stage } = get();
  const s = plan.viewport.scale || 1;
  const px = { x: (stage.w / 2 - plan.viewport.x) / s, y: (stage.h / 2 - plan.viewport.y) / s };
  return { x: Math.round(pxToCm(px.x, plan.pxPerMeter)), y: Math.round(pxToCm(px.y, plan.pxPerMeter)) };
}

export const useStore = create<State>((set, get) => {
  // Commit a mutation with an undo snapshot.
  const mutate = (fn: (p: Plan) => void, selection?: Selection) => {
    const { plan, past } = get();
    const next = clone(plan);
    fn(next);
    next.updatedAt = Date.now();
    set({
      plan: next,
      past: [...past, plan].slice(-HISTORY),
      future: [],
      ...(selection ? { selection } : {}),
    });
  };

  return {
    plan: newPlan(),
    selection: { kind: 'none' },
    tool: 'select',
    snap: true,
    stage: { w: 1200, h: 800 },
    past: [],
    future: [],

    setStage: (w, h) => set({ stage: { w, h } }),
    loadPlanIntoStore: (plan) => set({ plan, selection: { kind: 'none' }, past: [], future: [], tool: 'select' }),
    resetToNew: (name) => set({ plan: newPlan(name), selection: { kind: 'none' }, past: [], future: [], tool: 'select' }),
    renamePlan: (name) => mutate((p) => { p.name = name; }),
    setTool: (t) => set({ tool: t }),
    setSnap: (v) => set({ snap: v }),
    setViewport: (vp) => set((s) => ({ plan: { ...s.plan, viewport: vp } })),
    select: (s) => set({ selection: s }),

    addRoom: () => {
      const c = worldCenter(get);
      const room: Room = { id: newId(), name: `Room ${get().plan.rooms.length + 1}`, x: c.x - 200, y: c.y - 150, w: 400, h: 300, rotation: 0 };
      mutate((p) => { p.rooms.push(room); }, { kind: 'room', id: room.id });
    },
    addBox: () => {
      const c = worldCenter(get);
      const off = (get().plan.furniture.length % 6) * 25; // stagger so new boxes don't stack
      const piece = makeBoxPiece(c.x - 30 + off, c.y - 30 + off, 60, 60);
      mutate((p) => { p.furniture.push(piece); }, { kind: 'piece', id: piece.id });
    },
    updateRoom: (id, patch) => mutate((p) => { const r = p.rooms.find((x) => x.id === id); if (r) Object.assign(r, patch); }),
    updatePiece: (id, patch) => mutate((p) => { const f = p.furniture.find((x) => x.id === id); if (f) Object.assign(f, patch); }),
    updateBoxSize: (pieceId, boxId, w, h) =>
      mutate((p) => {
        const b = p.furniture.find((x) => x.id === pieceId)?.boxes.find((x) => x.id === boxId);
        if (b) { b.w = w; b.h = h; }
      }),

    deleteSelection: () => {
      const sel = get().selection;
      mutate((p) => {
        if (sel.kind === 'room') { p.rooms = p.rooms.filter((r) => r.id !== sel.id); p.doors = p.doors.filter((d) => d.roomId !== sel.id); }
        else if (sel.kind === 'piece') p.furniture = p.furniture.filter((f) => f.id !== sel.id);
        else if (sel.kind === 'pieces') p.furniture = p.furniture.filter((f) => !sel.ids.includes(f.id));
        else if (sel.kind === 'door') p.doors = p.doors.filter((d) => d.id !== sel.id);
      }, { kind: 'none' });
    },

    groupSelected: () => {
      const sel = get().selection;
      if (sel.kind !== 'pieces' || sel.ids.length < 2) return;
      const pieces = get().plan.furniture.filter((f) => sel.ids.includes(f.id));
      const merged = groupPieces(pieces);
      mutate((p) => { p.furniture = [...p.furniture.filter((f) => !sel.ids.includes(f.id)), merged]; }, { kind: 'piece', id: merged.id });
    },
    ungroupSelected: () => {
      const sel = get().selection;
      if (sel.kind !== 'piece') return;
      const piece = get().plan.furniture.find((f) => f.id === sel.id);
      if (!piece || piece.boxes.length < 2) return;
      const parts = ungroupPiece(piece);
      mutate((p) => { p.furniture = [...p.furniture.filter((f) => f.id !== sel.id), ...parts]; }, { kind: 'pieces', ids: parts.map((x) => x.id) });
    },
    duplicateSelected: () => {
      const sel = get().selection;
      mutate((p) => {
        if (sel.kind === 'room') { const r = p.rooms.find((x) => x.id === sel.id); if (r) p.rooms.push({ ...clone(r), id: newId(), x: r.x + 20, y: r.y + 20, name: `${r.name} copy` }); }
        else if (sel.kind === 'piece') { const f = p.furniture.find((x) => x.id === sel.id); if (f) p.furniture.push({ ...clone(f), id: newId(), x: f.x + 20, y: f.y + 20, boxes: f.boxes.map((b) => ({ ...b, id: newId() })) }); }
      });
    },

    addDoor: (roomId, side, offset, width, swing) => {
      const room = get().plan.rooms.find((r) => r.id === roomId);
      if (!room) return;
      const len = wallLength(room, side);
      const door: Door = { id: newId(), roomId, side, offset: Math.max(0, Math.min(len - width, offset)), width, swing };
      const seg = doorSegment(door, room);
      door.connectsRoomId = findSharedRoom(seg, get().plan.rooms, roomId);
      mutate((p) => { p.doors.push(door); }, { kind: 'door', id: door.id });
    },
    updateDoor: (id, patch) => mutate((p) => { const d = p.doors.find((x) => x.id === id); if (d) Object.assign(d, patch); }),

    nudge: (dx, dy) => {
      const sel = get().selection;
      if (sel.kind === 'none' || sel.kind === 'door') return;
      mutate((p) => {
        if (sel.kind === 'room') { const r = p.rooms.find((x) => x.id === sel.id); if (r) { r.x += dx; r.y += dy; } }
        else if (sel.kind === 'piece') { const f = p.furniture.find((x) => x.id === sel.id); if (f) { f.x += dx; f.y += dy; } }
        else if (sel.kind === 'pieces') for (const id of sel.ids) { const f = p.furniture.find((x) => x.id === id); if (f) { f.x += dx; f.y += dy; } }
      });
    },

    undo: () => {
      const { past, plan, future } = get();
      if (!past.length) return;
      set({ plan: past[past.length - 1], past: past.slice(0, -1), future: [plan, ...future].slice(0, HISTORY), selection: { kind: 'none' } });
    },
    redo: () => {
      const { future, plan, past } = get();
      if (!future.length) return;
      set({ plan: future[0], future: future.slice(1), past: [...past, plan].slice(-HISTORY), selection: { kind: 'none' } });
    },
  };
});
