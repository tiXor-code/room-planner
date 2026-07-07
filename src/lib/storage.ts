// localStorage persistence + JSON export/import + versioned migration.
import { DEFAULT_PX_PER_METER } from '@/lib/units';
import { SCHEMA_VERSION, type Plan } from '@/lib/types';

const INDEX_KEY = 'roomplanner:index';
const planKey = (id: string) => `roomplanner:plan:${id}`;

export interface PlanIndexEntry {
  id: string;
  name: string;
  updatedAt: number;
}
export interface PlanIndex {
  plans: PlanIndexEntry[];
  activePlanId: string | null;
}

const hasWindow = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

export function newPlan(name = 'Untitled plan'): Plan {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: crypto.randomUUID(),
    name,
    units: 'm',
    pxPerMeter: DEFAULT_PX_PER_METER,
    rooms: [],
    furniture: [],
    doors: [],
    viewport: { x: 0, y: 0, scale: 1 },
    updatedAt: Date.now(),
  };
}

/** Coerce any prior/foreign shape into the current Plan, filling defaults. */
export function migrate(raw: unknown): Plan | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const base = newPlan();
  const plan: Plan = {
    ...base,
    ...(typeof r.id === 'string' ? { id: r.id } : {}),
    ...(typeof r.name === 'string' ? { name: r.name } : {}),
    units: r.units === 'cm' ? 'cm' : 'm',
    pxPerMeter: typeof r.pxPerMeter === 'number' && r.pxPerMeter > 0 ? r.pxPerMeter : DEFAULT_PX_PER_METER,
    rooms: Array.isArray(r.rooms) ? (r.rooms as Plan['rooms']) : [],
    furniture: Array.isArray(r.furniture) ? (r.furniture as Plan['furniture']) : [],
    doors: Array.isArray(r.doors) ? (r.doors as Plan['doors']) : [],
    viewport:
      r.viewport && typeof r.viewport === 'object'
        ? { x: 0, y: 0, scale: 1, ...(r.viewport as object) }
        : { x: 0, y: 0, scale: 1 },
    schemaVersion: SCHEMA_VERSION,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : Date.now(),
  };
  return plan;
}

export function loadIndex(): PlanIndex {
  if (!hasWindow()) return { plans: [], activePlanId: null };
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return { plans: [], activePlanId: null };
    const idx = JSON.parse(raw) as PlanIndex;
    if (!Array.isArray(idx.plans)) return { plans: [], activePlanId: null };
    return idx;
  } catch {
    return { plans: [], activePlanId: null };
  }
}

export function saveIndex(idx: PlanIndex): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
}

export function loadPlan(id: string): Plan | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(planKey(id));
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: Plan): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(planKey(plan.id), JSON.stringify(plan));
  const idx = loadIndex();
  const entry: PlanIndexEntry = { id: plan.id, name: plan.name, updatedAt: plan.updatedAt };
  const rest = idx.plans.filter((p) => p.id !== plan.id);
  saveIndex({ plans: [...rest, entry].sort((a, b) => b.updatedAt - a.updatedAt), activePlanId: plan.id });
}

export function deletePlan(id: string): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(planKey(id));
  const idx = loadIndex();
  const plans = idx.plans.filter((p) => p.id !== id);
  saveIndex({ plans, activePlanId: idx.activePlanId === id ? (plans[0]?.id ?? null) : idx.activePlanId });
}

export function exportPlan(plan: Plan): string {
  return JSON.stringify(plan, null, 2);
}

export function importPlan(text: string): Plan | null {
  try {
    const plan = migrate(JSON.parse(text));
    if (plan) plan.id = crypto.randomUUID(); // avoid clobbering an existing plan
    return plan;
  } catch {
    return null;
  }
}
