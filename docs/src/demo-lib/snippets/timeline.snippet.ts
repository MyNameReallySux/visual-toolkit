import { makeDiscontinuousLinearScale } from "@visual-toolkit/d3-discontinuous-scale";

// Three working days, 8:00–17:00 each (10 hours × 3 days = 30 domain values).
const values: number[] = [];
for (let d = 0; d < 3; d++) {
  for (let h = 8; h <= 17; h++) values.push(d * 24 + h);
}

const scale = makeDiscontinuousLinearScale(values, {
  range: { start: 20, span: 680 },
  selectValue: (v) => v,
  convertValueToKey: (v) => String(v),
  calculateDistance: (a, b) => a - b,
  getRelativeValueFromDistance: (v, dist) => v - dist,
  minToSkip: 12, // gaps ≥ 12 units are compressed into break markers
});

scale.getX(8); // → 20    (domain start maps to range start)
scale.getX(17); // → 211.25 (end of day-1 continuous bin)
scale.getX(32); // → 275   (start of day-2 bin, after overnight skip)
scale.getSkipWidth(0); // → 42.5  (pixel width of the first break marker)
