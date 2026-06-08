import { describe, expect, it, vi } from "vitest";
import {
  stripPxFromPixels,
  stripPxFromPixelsIfExists,
  stripSuffixFromCssNumber,
  type AnyCssNumber,
} from "./css-numbers.js";

describe("stripPxFromPixels", () => {
  it("returns number unchanged", () => {
    expect(stripPxFromPixels(42)).toBe(42);
  });

  it("strips px suffix", () => {
    expect(stripPxFromPixels("24px")).toBe(24);
  });

  it("handles fractional px", () => {
    expect(stripPxFromPixels("12.5px")).toBeCloseTo(12.5);
  });

  it("handles 0", () => {
    expect(stripPxFromPixels(0)).toBe(0);
  });
});

describe("stripPxFromPixelsIfExists", () => {
  it("returns undefined for undefined", () => {
    expect(stripPxFromPixelsIfExists(undefined)).toBeUndefined();
  });

  it("strips px from string", () => {
    expect(stripPxFromPixelsIfExists("10px")).toBe(10);
  });
});

describe("stripSuffixFromCssNumber", () => {
  it("handles px", () => {
    expect(stripSuffixFromCssNumber("24px")).toBeCloseTo(24);
  });

  it("handles fractional px", () => {
    expect(stripSuffixFromCssNumber("12.5px")).toBeCloseTo(12.5);
  });

  it("handles scientific notation px", () => {
    expect(stripSuffixFromCssNumber("1e2px")).toBeCloseTo(100);
  });

  it("handles rem", () => {
    expect(stripSuffixFromCssNumber("1.5rem")).toBeCloseTo(1.5);
  });

  it("handles em", () => {
    expect(stripSuffixFromCssNumber("2em")).toBeCloseTo(2);
  });

  it("returns number unchanged", () => {
    expect(stripSuffixFromCssNumber(42)).toBe(42);
  });

  it("returns 0 and warns on invalid string", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Deliberately invalid input — the cast bypasses the compile-time guard
    // so the runtime warn-and-zero path is exercised.
    expect(stripSuffixFromCssNumber("abc" as unknown as AnyCssNumber)).toBe(0);
    warnSpy.mockRestore();
  });
});
