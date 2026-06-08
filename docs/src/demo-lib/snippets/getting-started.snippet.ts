import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((id) => ({ id }));

const scale = makeFixedBandScale(months, {
  selectId: (d) => d.id,
  bandwidth: 60,
  gap: 8,
});

scale.getX0("Mar"); // → 136  (2 × (60 + 8))
scale.getX1("Mar"); // → 196
scale.getRange(); // → 400  (6 × 60 + 5 × 8)
scale.getBandwidth(); // → 60
scale.getGap(); // → 8
