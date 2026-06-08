import { makeDynamicBandScale } from "@visual-toolkit/d3-band-scales";

// 14-day calendar: weekends get a narrower column via selectBandwidth.
const days = Array.from({ length: 14 }, (_, i) => {
  const dow = (i + 1) % 7;
  return { id: `d${i}`, isWeekend: dow === 0 || dow === 6 };
});

const scale = makeDynamicBandScale(days, {
  selectId: (d) => d.id,
  selectBandwidth: (d) => (d.isWeekend ? 20 : 52),
  gap: 6,
});

scale.getX0("d0"); // → 0  (first weekday)
scale.getX1("d0"); // → 52
scale.getX0("d5"); // → 290  (first weekend, narrower)
scale.getX1("d5"); // → 310
scale.getRange();  // → 678
