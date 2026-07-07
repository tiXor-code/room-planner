// Snapping helpers (pure, cm). Callers pass a tolerance already expressed in
// world cm (divide the desired screen-px tolerance by viewport.scale first, so
// the snap "feel" stays constant on screen at any zoom).

export function snapToGrid(v: number, step: number): number {
  return Math.round(v / step) * step;
}

/** Snap v to the nearest line within tol; otherwise return v unchanged. */
export function snapValue(v: number, lines: number[], tol: number): number {
  let best = v;
  let bestDist = tol;
  for (const l of lines) {
    const d = Math.abs(v - l);
    if (d <= bestDist) {
      bestDist = d;
      best = l;
    }
  }
  return best;
}

export interface SnapOptions {
  gridStep: number; // cm
  useGrid: boolean;
  xLines: number[]; // extra vertical snap lines (world cm)
  yLines: number[]; // extra horizontal snap lines (world cm)
  tol: number; // cm
}

/** Snap a dragged top-left origin to the grid and/or nearby edge lines. */
export function snapPosition(x: number, y: number, opts: SnapOptions): { x: number; y: number } {
  const xs = [...opts.xLines];
  const ys = [...opts.yLines];
  if (opts.useGrid) {
    xs.push(snapToGrid(x, opts.gridStep));
    ys.push(snapToGrid(y, opts.gridStep));
  }
  return { x: snapValue(x, xs, opts.tol), y: snapValue(y, ys, opts.tol) };
}
