import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

const items = [
  { id: "A" }, { id: "B" }, { id: "C" },
  { id: "D" }, { id: "E" }, { id: "F" },
];

// naturalRange = 6 × 60 + 5 × 16 = 440px
const natural = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 60,
  gap: 16,
});

natural.getRange(); // → 440
natural.getScaleFactor(); // → 1  (no scaling)

// scaleTo fits the same layout into exactly 400px
const scaled = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 60,
  gap: 16,
  scaleTo: 400,
});

scaled.getRange(); // → 400
scaled.getScaleFactor(); // → 0.9090909090909091 (k = 400 / 440)
scaled.getX0("B"); // → 69.0909090909091
scaled.getX1("A"); // → 54.54545454545455
