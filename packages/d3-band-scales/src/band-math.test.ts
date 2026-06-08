import { describe, expect, it } from "vitest";
import {
  calculateFitScaleFactor,
  calculateX0,
  calculateX1,
} from "./band-math.js";

describe("calculateX0 / calculateX1", () => {
  it("calculateX0 with no args returns 0", () => {
    expect(calculateX0()).toBe(0);
  });

  it("calculateX0 adds previous + gap", () => {
    expect(calculateX0(10, 5)).toBe(15);
  });

  it("calculateX1 = x0 + bandwidth", () => {
    expect(calculateX1(5, 20)).toBe(25);
  });
});

describe("calculateFitScaleFactor", () => {
  it("returns 1 when content equals container", () => {
    expect(calculateFitScaleFactor(400, 400)).toBe(1);
  });

  it("returns 2 when container is double content", () => {
    expect(calculateFitScaleFactor(200, 400)).toBe(2);
  });

  it("returns 0.5 when container is half content", () => {
    expect(calculateFitScaleFactor(400, 200)).toBe(0.5);
  });

  it("returns 1 when contentLength is 0 (no crash)", () => {
    expect(calculateFitScaleFactor(0, 500)).toBe(1);
  });

  it("scales fractional lengths correctly", () => {
    expect(calculateFitScaleFactor(300, 450)).toBeCloseTo(1.5);
  });
});
