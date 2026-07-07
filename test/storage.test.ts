import { describe, expect, it } from 'vitest';
import { exportPlan, importPlan, migrate, newPlan } from '@/lib/storage';

describe('storage / migrate', () => {
  it('newPlan is a valid current-schema plan', () => {
    const p = newPlan('Home');
    expect(p.schemaVersion).toBe(1);
    expect(p.name).toBe('Home');
    expect(p.rooms).toEqual([]);
  });

  it('migrate fills defaults on a partial/foreign shape', () => {
    const p = migrate({ name: 'legacy', rooms: [{ id: 'r', name: 'R', x: 0, y: 0, w: 100, h: 100, rotation: 0 }] });
    expect(p).not.toBeNull();
    expect(p!.schemaVersion).toBe(1);
    expect(p!.name).toBe('legacy');
    expect(p!.rooms).toHaveLength(1);
    expect(p!.pxPerMeter).toBe(100);
    expect(p!.viewport).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('migrate rejects junk', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate('nope')).toBeNull();
  });

  it('export -> import round-trips the model (with a fresh id)', () => {
    const p = newPlan('Flat');
    p.rooms.push({ id: 'r', name: 'Living', x: 0, y: 0, w: 400, h: 300, rotation: 0 });
    const back = importPlan(exportPlan(p));
    expect(back).not.toBeNull();
    expect(back!.name).toBe('Flat');
    expect(back!.rooms[0].name).toBe('Living');
    expect(back!.id).not.toBe(p.id); // avoids clobbering the source plan
  });
});
