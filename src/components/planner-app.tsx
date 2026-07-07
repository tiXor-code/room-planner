'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import PlanMenu from '@/components/plan-menu';
import PropertiesPanel from '@/components/properties-panel';
import ScaleBar from '@/components/scale-bar';
import Toolbar from '@/components/toolbar';
import { useStore } from '@/lib/store';
import { loadIndex, loadPlan, savePlan } from '@/lib/storage';

const CanvasStage = dynamic(() => import('@/components/canvas/canvas-stage'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-soft">Loading canvas…</div>,
});

export default function PlannerApp() {
  const loadPlanIntoStore = useStore((s) => s.loadPlanIntoStore);

  // Load the active plan from localStorage once on mount; register a default if none.
  useEffect(() => {
    const idx = loadIndex();
    const active = idx.activePlanId ? loadPlan(idx.activePlanId) : null;
    if (active) loadPlanIntoStore(active);
    else savePlan(useStore.getState().plan);
    // Debounced autosave of the active plan.
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = useStore.subscribe((s, prev) => {
      if (s.plan === prev.plan) return;
      clearTimeout(t);
      t = setTimeout(() => savePlan(useStore.getState().plan), 500);
    });
    // Test hook: current model as JSON.
    (window as unknown as { __planner?: () => unknown }).__planner = () => useStore.getState().plan;
    return () => { clearTimeout(t); unsub(); };
  }, [loadPlanIntoStore]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const s = useStore.getState();
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if (meta && e.key.toLowerCase() === 'd') { e.preventDefault(); s.duplicateSelected(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.deleteSelection(); }
      else if (e.key === 'Escape') { s.setTool('select'); s.select({ kind: 'none' }); }
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]!;
        s.nudge(d[0], d[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-hairline bg-surface px-4 py-2">
        <span className="text-sm font-semibold">Room Planner</span>
        <PlanMenu />
      </header>
      <Toolbar />
      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1">
          <CanvasStage />
          <ScaleBar />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
