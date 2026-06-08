import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";
import { stripPxFromPixels, stripSuffixFromCssNumber } from "@visual-toolkit/d3-helpers";

// Scale options accept CSS strings or raw numbers interchangeably.
makeFixedBandScale([{ id: "a" }, { id: "b" }], {
  selectId: (d) => d.id,
  bandwidth: "80px",
  gap: "12px",
});

// Strip the "px" suffix from a CSS pixel string or pass through a number.
stripPxFromPixels("24px"); // → 24
stripPxFromPixels(24);     // → 24

// Strip any CSS unit suffix (px, rem, em) — numeric part returned as-is.
stripSuffixFromCssNumber("1.5rem"); // → 1.5
stripSuffixFromCssNumber("2em");    // → 2
stripSuffixFromCssNumber("100px");  // → 100
