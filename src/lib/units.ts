// Metric <-> pixel conversions and human formatting. Storage is always cm.

export const DEFAULT_PX_PER_METER = 100; // 100 px per metre => 1 cm == 1 px at zoom 1

export function cmToPx(cm: number, pxPerMeter: number = DEFAULT_PX_PER_METER): number {
  return (cm * pxPerMeter) / 100;
}

export function pxToCm(px: number, pxPerMeter: number = DEFAULT_PX_PER_METER): number {
  return (px * 100) / pxPerMeter;
}

/** e.g. 420 -> "4.20 m", 85 -> "85 cm". */
export function formatMetric(cm: number): string {
  const v = Math.abs(cm) >= 100 ? `${(cm / 100).toFixed(2)} m` : `${Math.round(cm)} cm`;
  return v;
}

/** area in cm^2 -> "12.60 m²" */
export function formatArea(cm2: number): string {
  return `${(cm2 / 10000).toFixed(2)} m²`;
}

/** Round a cm value to a sensible input precision (1 mm). */
export function roundCm(cm: number): number {
  return Math.round(cm * 10) / 10;
}
