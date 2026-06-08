/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { select } from "d3-selection";
import { selectOrCreate } from "./select-or-create.js";

describe("selectOrCreate", () => {
  it("creates a child element when none exists", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    const $svg = select(svg);

    const $g = selectOrCreate<SVGGElement, unknown>("my-group", $svg as any, "g");
    expect($g.empty()).toBe(false);
    expect(svg.querySelector(".my-group")).not.toBeNull();
    document.body.removeChild(svg);
  });

  it("returns the existing element on a second call, does not duplicate", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    const $svg = select(svg);

    selectOrCreate<SVGGElement, unknown>("grp", $svg as any, "g");
    selectOrCreate<SVGGElement, unknown>("grp", $svg as any, "g");

    expect(svg.querySelectorAll(".grp").length).toBe(1);
    document.body.removeChild(svg);
  });
});
