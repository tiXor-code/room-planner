'use client';

import { useEffect, useState } from 'react';
import { pieceAABB, aabbW, aabbH } from '@/lib/geometry';
import { formatArea, roundCm } from '@/lib/units';
import { useStore } from '@/lib/store';

function NumField({ label, value, onCommit, suffix = 'cm' }: { label: string; value: number; onCommit: (v: number) => void; suffix?: string }) {
  const [text, setText] = useState(String(roundCm(value)));
  useEffect(() => setText(String(roundCm(value))), [value]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n)) onCommit(n);
    else setText(String(roundCm(value)));
  };
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="flex items-center gap-1">
        <input
          data-testid={`field-${label.toLowerCase()}`}
          className="w-20 rounded border border-hairline bg-paper px-2 py-1 text-right"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          inputMode="decimal"
        />
        <span className="w-6 text-xs text-ink-soft">{suffix}</span>
      </span>
    </label>
  );
}

export default function PropertiesPanel() {
  const s = useStore();
  const sel = s.selection;

  let body: React.ReactNode = <p className="text-sm text-ink-soft">Select a room or furniture piece to edit its exact size and position, or use the toolbar to add one.</p>;

  if (sel.kind === 'room') {
    const r = s.plan.rooms.find((x) => x.id === sel.id);
    if (r) body = (
      <div className="flex flex-col gap-2" data-testid="props-room">
        <input className="rounded border border-hairline bg-paper px-2 py-1 text-sm" value={r.name} onChange={(e) => s.updateRoom(r.id, { name: e.target.value })} />
        <NumField label="Width" value={r.w} onCommit={(v) => s.updateRoom(r.id, { w: Math.max(1, v) })} />
        <NumField label="Height" value={r.h} onCommit={(v) => s.updateRoom(r.id, { h: Math.max(1, v) })} />
        <NumField label="X" value={r.x} onCommit={(v) => s.updateRoom(r.id, { x: v })} />
        <NumField label="Y" value={r.y} onCommit={(v) => s.updateRoom(r.id, { y: v })} />
        <NumField label="Rotation" value={r.rotation} onCommit={(v) => s.updateRoom(r.id, { rotation: v })} suffix="°" />
        <p className="mt-1 text-sm text-ink-soft" data-testid="room-area">Area: {formatArea(r.w * r.h)}</p>
      </div>
    );
  } else if (sel.kind === 'piece') {
    const f = s.plan.furniture.find((x) => x.id === sel.id);
    if (f) {
      const bb = pieceAABB(f);
      body = (
        <div className="flex flex-col gap-2" data-testid="props-piece">
          <input className="rounded border border-hairline bg-paper px-2 py-1 text-sm" value={f.name} onChange={(e) => s.updatePiece(f.id, { name: e.target.value })} />
          {f.boxes.length === 1 ? (
            <>
              <NumField label="Width" value={f.boxes[0].w} onCommit={(v) => s.updateBoxSize(f.id, f.boxes[0].id, Math.max(1, v), f.boxes[0].h)} />
              <NumField label="Height" value={f.boxes[0].h} onCommit={(v) => s.updateBoxSize(f.id, f.boxes[0].id, f.boxes[0].w, Math.max(1, v))} />
            </>
          ) : (
            <p className="text-sm text-ink-soft">{f.boxes.length} boxes · {Math.round(aabbW(bb))}×{Math.round(aabbH(bb))} cm overall</p>
          )}
          <NumField label="X" value={f.x} onCommit={(v) => s.updatePiece(f.id, { x: v })} />
          <NumField label="Y" value={f.y} onCommit={(v) => s.updatePiece(f.id, { y: v })} />
          <NumField label="Rotation" value={f.rotation} onCommit={(v) => s.updatePiece(f.id, { rotation: v })} suffix="°" />
        </div>
      );
    }
  } else if (sel.kind === 'pieces') {
    body = <p className="text-sm text-ink-soft" data-testid="props-multi">{sel.ids.length} pieces selected. Press <strong>Group</strong> to combine them into one furniture piece.</p>;
  } else if (sel.kind === 'door') {
    const d = s.plan.doors.find((x) => x.id === sel.id);
    if (d) body = (
      <div className="flex flex-col gap-2" data-testid="props-door">
        <NumField label="Width" value={d.width} onCommit={(v) => s.updateDoor(d.id, { width: Math.max(10, v) })} />
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-soft">Swing</span>
          <select className="rounded border border-hairline bg-paper px-2 py-1" value={d.swing} onChange={(e) => s.updateDoor(d.id, { swing: e.target.value as 'in' | 'out' })}>
            <option value="in">in</option>
            <option value="out">out</option>
          </select>
        </label>
        <p className="text-sm text-ink-soft">{d.connectsRoomId ? 'Connects two rooms' : 'On an outer wall'}</p>
      </div>
    );
  }

  return (
    <aside className="max-h-52 w-full shrink-0 overflow-y-auto border-t border-hairline bg-surface p-3 md:max-h-none md:w-64 md:border-l md:border-t-0">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Properties</h2>
      {body}
    </aside>
  );
}
