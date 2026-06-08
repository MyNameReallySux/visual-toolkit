import { describe, expect, it } from "vitest";
import { estimateSvgTextSize } from "./svg-helpers.js";

describe("estimateSvgTextSize", () => {
  it("returns non-zero width and height", () => {
    const { width, height } = estimateSvgTextSize({
      text: "Hello",
      fontSize: 12,
    });
    expect(width).toBeGreaterThan(0);
    expect(height).toBe(12);
  });

  it("bold font has slightly wider estimate", () => {
    const normal = estimateSvgTextSize({ text: "Hello", fontSize: 12 });
    const bold = estimateSvgTextSize({
      text: "Hello",
      fontSize: 12,
      fontWeight: "bold",
    });
    expect(bold.width).toBeGreaterThan(normal.width);
  });
});
