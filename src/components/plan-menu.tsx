'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { deletePlan, exportPlan, importPlan, loadIndex, loadPlan, newPlan, savePlan } from '@/lib/storage';

export default function PlanMenu() {
  const plan = useStore((s) => s.plan);
  const loadPlanIntoStore = useStore((s) => s.loadPlanIntoStore);
  const renamePlan = useStore((s) => s.renamePlan);
  const [tick, setTick] = useState(0); // force re-read of the index after changes
  const fileRef = useRef<HTMLInputElement>(null);
  const index = loadIndex();
  void tick;

  const switchTo = (id: string) => {
    savePlan(useStore.getState().plan);
    const p = loadPlan(id);
    if (p) loadPlanIntoStore(p);
  };
  const create = () => {
    savePlan(useStore.getState().plan);
    const p = newPlan(`Plan ${index.plans.length + 1}`);
    savePlan(p);
    loadPlanIntoStore(p);
    setTick((t) => t + 1);
  };
  const remove = () => {
    if (!confirm(`Delete "${plan.name}"?`)) return;
    deletePlan(plan.id);
    const next = loadIndex().plans[0];
    loadPlanIntoStore(next ? loadPlan(next.id) ?? newPlan() : newPlan());
    setTick((t) => t + 1);
  };
  const doExport = () => {
    const blob = new Blob([exportPlan(plan)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${plan.name.replace(/\s+/g, '-').toLowerCase()}.roomplan.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = async (file: File) => {
    const p = importPlan(await file.text());
    if (!p) { alert('Could not read that file.'); return; }
    savePlan(p);
    loadPlanIntoStore(p);
    setTick((t) => t + 1);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        aria-label="Plan name"
        data-testid="plan-name"
        className="w-40 rounded border border-hairline bg-paper px-2 py-1"
        value={plan.name}
        onChange={(e) => renamePlan(e.target.value)}
      />
      {index.plans.length > 1 && (
        <select className="rounded border border-hairline bg-paper px-1 py-1" value={plan.id} onChange={(e) => switchTo(e.target.value)}>
          {index.plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      <button type="button" className="rounded px-1.5 py-1 hover:bg-paper" onClick={create}>New</button>
      <button type="button" className="rounded px-1.5 py-1 hover:bg-paper" onClick={doExport}>Export</button>
      <button type="button" className="rounded px-1.5 py-1 hover:bg-paper" onClick={() => fileRef.current?.click()}>Import</button>
      <button type="button" className="rounded px-1.5 py-1 text-red-600 hover:bg-paper" onClick={remove}>Delete</button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} />
    </div>
  );
}
