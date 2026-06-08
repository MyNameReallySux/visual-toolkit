import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

const scale = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 50, // every band is exactly 50px wide
  gap: 8,
});

scale.getX0("b"); // → 58
scale.getX1("b"); // → 108
scale.getBandwidth(); // → 50
scale.getRange(); // → 166
