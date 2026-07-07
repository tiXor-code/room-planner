'use client';

import { cmToPx } from '@/lib/units';
import { useStore } from '@/lib/store';

export default function ScaleBar() {
  const plan = useStore((s) => s.plan);
  const scale = plan.viewport.scale;
  const oneMeterPx = cmToPx(100, plan.pxPerMeter) * scale;

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-hairline bg-surface/90 px-3 py-1.5 text-xs text-ink-soft backdrop-blur">
      <span>{Math.round(scale * 100)}%</span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 border-l border-r border-ink-soft" style={{ width: `${oneMeterPx}px` }} />
        1 m
      </span>
    </div>
  );
}
