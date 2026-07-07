'use client';

import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Arc, Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { distance, projectPointToSegment, rectCorners } from '@/lib/geometry';
import { doorSegment, wallLength, wallSegment } from '@/lib/doors';
import { snapToGrid } from '@/lib/snap';
import { cmToPx, formatMetric, pxToCm } from '@/lib/units';
import { useStore } from '@/lib/store';
import type { Door, FurniturePiece, Room, Vec2, WallSide } from '@/lib/types';

const GRID_EXTENT = 4000; // cm, +/- around origin
const GRID_STEP = 100; // cm

export default function CanvasStage() {
  const s = useStore();
  const { plan, selection, tool, snap } = s;
  const px = (cm: number) => cmToPx(cm, plan.pxPerMeter);
  const inv = 1 / plan.viewport.scale;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [measureA, setMeasureA] = useState<Vec2 | null>(null);
  const [cursor, setCursor] = useState<Vec2 | null>(null);
  const [measure, setMeasure] = useState<{ a: Vec2; b: Vec2 } | null>(null);

  // size the stage to its container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize({ w, h });
      s.setStage(w, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // attach the transformer to the single selected room / piece
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    let node: Konva.Node | undefined;
    if (selection.kind === 'room') node = stage.findOne(`#${selection.id}`) ?? undefined;
    else if (selection.kind === 'piece') node = stage.findOne(`#${selection.id}`) ?? undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selection, plan]);

  const worldPointer = (): Vec2 | null => {
    const stage = stageRef.current;
    const p = stage?.getRelativePointerPosition();
    if (!p) return null;
    return { x: pxToCm(p.x, plan.pxPerMeter), y: pxToCm(p.y, plan.pxPerMeter) };
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current!;
    const old = plan.viewport.scale;
    const pointer = stage.getPointerPosition()!;
    const to = { x: (pointer.x - plan.viewport.x) / old, y: (pointer.y - plan.viewport.y) / old };
    const next = Math.max(0.1, Math.min(8, old * (e.evt.deltaY > 0 ? 1 / 1.06 : 1.06)));
    s.setViewport({ scale: next, x: pointer.x - to.x * next, y: pointer.y - to.y * next });
  };

  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const isEmpty = e.target === e.target.getStage();
    const w = worldPointer();
    if (tool === 'measure' && w) {
      if (!measureA) { setMeasureA(w); setMeasure(null); }
      else {
        setMeasure({ a: measureA, b: w });
        setMeasureA(null);
        (window as unknown as { __measure?: number }).__measure = distance(measureA, w);
      }
      return;
    }
    if (tool === 'door' && w) {
      placeDoor(w);
      return;
    }
    if (isEmpty && tool === 'select') s.select({ kind: 'none' });
  };

  const placeDoor = (w: Vec2) => {
    let best: { roomId: string; side: WallSide; offset: number; dist: number } | null = null;
    for (const room of plan.rooms) {
      const sides: WallSide[] = ['top', 'right', 'bottom', 'left'];
      for (const side of sides) {
        const seg = wallSegment(room, side);
        const pr = projectPointToSegment(w, seg);
        if (!best || pr.dist < best.dist) best = { roomId: room.id, side, offset: pr.t * wallLength(room, side), dist: pr.dist };
      }
    }
    if (best && best.dist < 60) {
      s.addDoor(best.roomId, best.side, best.offset - 40, 80, 'in');
      s.setTool('select');
    }
  };

  const gridLines = useMemo(() => {
    const lines: React.ReactElement[] = [];
    for (let c = -GRID_EXTENT; c <= GRID_EXTENT; c += GRID_STEP) {
      const p = px(c);
      const major = c % 500 === 0;
      lines.push(<Line key={`v${c}`} points={[p, px(-GRID_EXTENT), p, px(GRID_EXTENT)]} stroke={major ? '#D7D3CB' : '#ECE9E2'} strokeWidth={(major ? 1 : 0.5) * inv} listening={false} />);
      lines.push(<Line key={`h${c}`} points={[px(-GRID_EXTENT), p, px(GRID_EXTENT), p]} stroke={major ? '#D7D3CB' : '#ECE9E2'} strokeWidth={(major ? 1 : 0.5) * inv} listening={false} />);
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.pxPerMeter, inv]);

  const commitDrag = (node: Konva.Node) => {
    let x = pxToCm(node.x(), plan.pxPerMeter);
    let y = pxToCm(node.y(), plan.pxPerMeter);
    if (snap) { x = snapToGrid(x, 10); y = snapToGrid(y, 10); node.position({ x: px(x), y: px(y) }); }
    return { x, y };
  };

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={plan.viewport.scale}
        scaleY={plan.viewport.scale}
        x={plan.viewport.x}
        y={plan.viewport.y}
        draggable={tool === 'select'}
        onWheel={onWheel}
        onMouseDown={onStageMouseDown}
        onMouseMove={() => { if (tool === 'measure') setCursor(worldPointer()); }}
        onDragEnd={(e) => { if (e.target === e.target.getStage()) s.setViewport({ ...plan.viewport, x: e.target.x(), y: e.target.y() }); }}
        style={{ background: 'var(--color-paper)', cursor: tool === 'select' ? 'default' : 'crosshair' }}
      >
        <Layer listening={false}>{gridLines}</Layer>

        {/* rooms + doors */}
        <Layer>
          {plan.rooms.map((room) => (
            <RoomShape key={room.id} room={room} px={px} inv={inv} selected={selection.kind === 'room' && selection.id === room.id}
              onSelect={() => s.select({ kind: 'room', id: room.id })}
              onDragEnd={(e) => { const { x, y } = commitDrag(e.target); s.updateRoom(room.id, { x, y }); }}
              onTransformEnd={(e) => {
                const n = e.target as Konva.Rect;
                const w = Math.max(20, pxToCm(n.width() * n.scaleX(), plan.pxPerMeter));
                const h = Math.max(20, pxToCm(n.height() * n.scaleY(), plan.pxPerMeter));
                n.scaleX(1); n.scaleY(1);
                s.updateRoom(room.id, { x: pxToCm(n.x(), plan.pxPerMeter), y: pxToCm(n.y(), plan.pxPerMeter), w, h, rotation: n.rotation() });
              }}
            />
          ))}
          {plan.rooms.map((room) => plan.doors.filter((d) => d.roomId === room.id).map((d) => (
            <DoorShape key={d.id} door={d} room={room} px={px} inv={inv} selected={selection.kind === 'door' && selection.id === d.id} onSelect={() => s.select({ kind: 'door', id: d.id })} />
          )))}
        </Layer>

        {/* furniture */}
        <Layer>
          {plan.furniture.map((piece) => (
            <PieceShape key={piece.id} piece={piece} px={px} inv={inv}
              selected={(selection.kind === 'piece' && selection.id === piece.id) || (selection.kind === 'pieces' && selection.ids.includes(piece.id))}
              onSelect={(shift) => {
                if (!shift) { s.select({ kind: 'piece', id: piece.id }); return; }
                const cur = selection;
                let ids = cur.kind === 'pieces' ? [...cur.ids] : cur.kind === 'piece' ? [cur.id] : [];
                ids = ids.includes(piece.id) ? ids.filter((x) => x !== piece.id) : [...ids, piece.id];
                s.select(ids.length <= 1 ? (ids.length ? { kind: 'piece', id: ids[0] } : { kind: 'none' }) : { kind: 'pieces', ids });
              }}
              onDragEnd={(e) => { const { x, y } = commitDrag(e.target); s.updatePiece(piece.id, { x, y }); }}
              onTransformEnd={(e) => {
                const n = e.target as Konva.Group;
                const sx = n.scaleX(); const sy = n.scaleY();
                n.scaleX(1); n.scaleY(1);
                if (piece.boxes.length === 1 && (sx !== 1 || sy !== 1)) {
                  s.updateBoxSize(piece.id, piece.boxes[0].id, Math.max(5, piece.boxes[0].w * sx), Math.max(5, piece.boxes[0].h * sy));
                }
                s.updatePiece(piece.id, { x: pxToCm(n.x(), plan.pxPerMeter), y: pxToCm(n.y(), plan.pxPerMeter), rotation: n.rotation() });
              }}
            />
          ))}
        </Layer>

        {/* overlay: transformer + measure */}
        <Layer>
          <Transformer ref={trRef} rotateEnabled anchorSize={9} borderStroke="#2563EB" anchorStroke="#2563EB"
            resizeEnabled={selection.kind === 'room' || (selection.kind === 'piece' && (plan.furniture.find((f) => f.id === selection.id)?.boxes.length === 1))}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            boundBoxFunc={(oldB, newB) => (newB.width < 8 || newB.height < 8 ? oldB : newB)} />
          {measureA && cursor && <MeasureLine a={measureA} b={cursor} px={px} inv={inv} />}
          {measure && <MeasureLine a={measure.a} b={measure.b} px={px} inv={inv} />}
        </Layer>
      </Stage>
    </div>
  );
}

function RoomShape({ room, px, inv, selected, onSelect, onDragEnd, onTransformEnd }: {
  room: Room; px: (cm: number) => number; inv: number; selected: boolean;
  onSelect: () => void; onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void; onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const [tl, tr, , bl] = rectCorners(room);
  const topMid = { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 };
  const leftMid = { x: (tl.x + bl.x) / 2, y: (tl.y + bl.y) / 2 };
  return (
    <>
      <Rect id={room.id} name={room.id} x={px(room.x)} y={px(room.y)} width={px(room.w)} height={px(room.h)} rotation={room.rotation}
        fill="#EEF2F7" stroke={selected ? '#2563EB' : '#94A3B8'} strokeWidth={(selected ? 2.5 : 1.5) * inv}
        draggable onClick={onSelect} onTap={onSelect} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd} />
      <Text x={px(room.x) + px(room.w) / 2} y={px(room.y) + px(room.h) / 2} text={room.name} fontSize={13 * inv} fill="#64748B" offsetX={room.name.length * 3.2 * inv} listening={false} />
      <Text x={px(topMid.x)} y={px(topMid.y) - 16 * inv} text={formatMetric(room.w)} fontSize={12 * inv} fill="#334155" offsetX={14 * inv} listening={false} />
      <Text x={px(leftMid.x) - 30 * inv} y={px(leftMid.y)} text={formatMetric(room.h)} fontSize={12 * inv} fill="#334155" listening={false} />
    </>
  );
}

function PieceShape({ piece, px, inv, selected, onSelect, onDragEnd, onTransformEnd }: {
  piece: FurniturePiece; px: (cm: number) => number; inv: number; selected: boolean;
  onSelect: (shift: boolean) => void; onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void; onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const single = piece.boxes[0];
  return (
    <Group id={piece.id} name={piece.id} x={px(piece.x)} y={px(piece.y)} rotation={piece.rotation} draggable
      onClick={(e) => onSelect(e.evt.shiftKey)} onTap={() => onSelect(false)} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd}>
      {piece.boxes.map((b) => (
        <Rect key={b.id} x={px(b.x)} y={px(b.y)} width={px(b.w)} height={px(b.h)} rotation={b.rotation}
          fill="#F5E9D8" stroke={selected ? '#2563EB' : '#B08968'} strokeWidth={(selected ? 2.5 : 1.5) * inv} cornerRadius={2 * inv} />
      ))}
      {piece.boxes.length === 1 && (
        <Text x={px(single.x) + px(single.w) / 2} y={px(single.y) - 15 * inv} text={`${formatMetric(single.w)} × ${formatMetric(single.h)}`} fontSize={11 * inv} fill="#7c5b3a" offsetX={26 * inv} listening={false} />
      )}
    </Group>
  );
}

function DoorShape({ door, room, px, inv, selected, onSelect }: { door: Door; room: Room; px: (cm: number) => number; inv: number; selected: boolean; onSelect: () => void }) {
  const seg = doorSegment(door, room);
  const ang = (Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x) * 180) / Math.PI;
  const r = distance(seg.a, seg.b);
  return (
    <Group onClick={onSelect} onTap={onSelect}>
      {/* opening cut */}
      <Line points={[px(seg.a.x), px(seg.a.y), px(seg.b.x), px(seg.b.y)]} stroke="#F7F6F3" strokeWidth={4 * inv} />
      {/* swing arc + leaf */}
      <Arc x={px(seg.a.x)} y={px(seg.a.y)} innerRadius={px(r)} outerRadius={px(r)} angle={90} rotation={ang} stroke={selected ? '#2563EB' : '#9AA3AF'} strokeWidth={1.2 * inv} />
      <Circle x={px(seg.a.x)} y={px(seg.a.y)} radius={3 * inv} fill={selected ? '#2563EB' : '#9AA3AF'} />
    </Group>
  );
}

function MeasureLine({ a, b, px, inv }: { a: Vec2; b: Vec2; px: (cm: number) => number; inv: number }) {
  const d = distance(a, b);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return (
    <>
      <Line points={[px(a.x), px(a.y), px(b.x), px(b.y)]} stroke="#2563EB" strokeWidth={1.5 * inv} dash={[6 * inv, 4 * inv]} />
      <Circle x={px(a.x)} y={px(a.y)} radius={3 * inv} fill="#2563EB" />
      <Circle x={px(b.x)} y={px(b.y)} radius={3 * inv} fill="#2563EB" />
      <Text data-testid="measure-label" x={px(mid.x)} y={px(mid.y) - 16 * inv} text={formatMetric(d)} fontSize={13 * inv} fill="#2563EB" fontStyle="bold" offsetX={18 * inv} listening={false} />
    </>
  );
}
