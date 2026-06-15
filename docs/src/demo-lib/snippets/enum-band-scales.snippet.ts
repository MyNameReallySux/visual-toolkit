import { makeFixedEnumBandScale } from "@visual-toolkit/d3-band-scales";

// Disabled entries are filtered out; enabled items pack together.
const items = [
  { key: "alpha", isEnabled: true },
  { key: "beta", isEnabled: false },
  { key: "gamma", isEnabled: true },
  { key: "delta", isEnabled: true },
  { key: "zeta", isEnabled: false },
];

const scale = makeFixedEnumBandScale(items, { bandwidth: 60, gap: 8 });

scale.doesKeyExist("beta"); // → false (filtered out)
scale.doesKeyExist("alpha"); // → true
scale.getX0("alpha"); // → 0
scale.getX0("gamma"); // → 68  (alpha 60 + gap 8; beta skipped)
scale.getRange(); // → 196  (3 enabled × 60 + 2 gaps × 8)
