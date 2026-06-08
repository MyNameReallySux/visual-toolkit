import {
  makeFixedBandScale,
  calculateFitScaleFactor,
  calculateLengthFromFixedBandsWithGaps,
  calculateLengthFromDynamicBands,
} from "@visual-toolkit/d3-band-scales";

// Total pixel span for 6 equal bands (60px each, 10px gap).
calculateLengthFromFixedBandsWithGaps(6, { bandwidth: 60, gap: 10 }); // → 410

// Total pixel span for variable-width bands with uniform gap.
calculateLengthFromDynamicBands([80, 120, 60], 8); // → 276

// Build a natural scale, then fit it to a container.
const items = [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }];
const natural = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10 });
calculateFitScaleFactor(natural.getRange(), 500); // → 1.85  (500 / 270)

// scaleTo builds a pre-multiplied scale — no manual multiplication needed.
const fitted = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 60,
  gap: 10,
  scaleTo: 500,
});
fitted.getScaleFactor(); // → 1.85
fitted.getRange();       // → 500
