import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

// Explicit pixel widths: you decide the bandwidth and gap.
const items = [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }];

const scale = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 40,
  gap: 8,
});

scale.getX0("B"); // → 48  (offset of band "B")
scale.getX1("B"); // → 88  (trailing edge)
scale.getBandwidth(); // → 40
scale.getRange(); // → 232 (total pixel span)
