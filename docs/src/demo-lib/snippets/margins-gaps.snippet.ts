import { makeFixedBandScale, makeEnumBandScale } from "@visual-toolkit/d3-band-scales";

// padStart and padEnd add leading/trailing margins inside the scale.
// getRange() includes them — SVG width == scale.getRange(), no arithmetic needed.
const scale = makeFixedBandScale(["A", "B", "C"].map((id) => ({ id })), {
  selectId: (d) => d.id,
  bandwidth: 60,
  gap: 8,
  padStart: 20,
  padEnd: 20,
});

scale.getX0("A"); // → 20  (first band starts after padStart)
scale.getX0("B"); // → 88  (20 + 60 + 8)
scale.getRange(); // → 236 (3×60 + 2×8 + 20 + 20)

// contentOffsetStart/End carve an inset region inside each band.
const enumScale = makeEnumBandScale(
  [{ key: "X", bandwidth: 80 }, { key: "Y", bandwidth: 60 }],
  { gap: 8, contentOffsetStart: 12, contentOffsetEnd: 8 }
);

enumScale.getContentX0("X"); // → 12
enumScale.getContentX1("X"); // → 72
enumScale.getContentBandwidth("X"); // → 60
