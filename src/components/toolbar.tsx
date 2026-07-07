'use client';

import { useStore } from '@/lib/store';

function Btn({ onClick, disabled, active, children, testid }: { onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode; testid?: string }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 rounded-md border px-2.5 text-sm transition-colors disabled:opacity-40 ${
        active ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-surface hover:bg-paper'
      }`}
    >
      {children}
    </button>
  );
}

export default function Toolbar() {
  const s = useStore();
  const sel = s.selection;
  const canGroup = sel.kind === 'pieces' && sel.ids.length >= 2;
  const selPiece = sel.kind === 'piece' ? s.plan.furniture.find((f) => f.id === sel.id) : undefined;
  const canUngroup = !!selPiece && selPiece.boxes.length > 1;
  const hasSel = sel.kind !== 'none';

  const zoomBy = (factor: number) => {
    const vp = s.plan.viewport;
    const scale = Math.max(0.1, Math.min(8, vp.scale * factor));
    const cx = s.stage.w / 2;
    const cy = s.stage.h / 2;
    // keep the stage centre fixed while zooming
    s.setViewport({ scale, x: cx - ((cx - vp.x) / vp.scale) * scale, y: cy - ((cy - vp.y) / vp.scale) * scale });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline bg-surface px-3 py-2">
      <Btn testid="add-room" onClick={s.addRoom}>+ Room</Btn>
      <Btn testid="add-furniture" onClick={s.addBox}>+ Furniture</Btn>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <Btn testid="tool-measure" onClick={() => s.setTool(s.tool === 'measure' ? 'select' : 'measure')} active={s.tool === 'measure'}>Measure</Btn>
      <Btn testid="tool-door" onClick={() => s.setTool(s.tool === 'door' ? 'select' : 'door')} active={s.tool === 'door'}>Door</Btn>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <Btn testid="group" onClick={s.groupSelected} disabled={!canGroup}>Group</Btn>
      <Btn testid="ungroup" onClick={s.ungroupSelected} disabled={!canUngroup}>Ungroup</Btn>
      <Btn testid="duplicate" onClick={s.duplicateSelected} disabled={!(sel.kind === 'room' || sel.kind === 'piece')}>Duplicate</Btn>
      <Btn testid="delete" onClick={s.deleteSelection} disabled={!hasSel}>Delete</Btn>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <Btn onClick={s.undo} disabled={!s.past.length}>Undo</Btn>
      <Btn onClick={s.redo} disabled={!s.future.length}>Redo</Btn>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <Btn onClick={() => s.setSnap(!s.snap)} active={s.snap}>Snap</Btn>
      <span className="mx-1 h-5 w-px bg-hairline" />
      <Btn onClick={() => zoomBy(1 / 1.2)}>−</Btn>
      <Btn onClick={() => zoomBy(1.2)}>+</Btn>
      <Btn onClick={() => s.setViewport({ x: 0, y: 0, scale: 1 })}>Reset view</Btn>
    </div>
  );
}
