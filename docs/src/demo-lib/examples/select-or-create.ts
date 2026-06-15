import { select, type Selection, type BaseType } from "d3-selection";
import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";
import { selectOrCreate } from "@visual-toolkit/d3-helpers";

type CategoryItem = { id: string; color: string };

export const ALL_CATEGORIES: CategoryItem[] = [
  { id: "Alpha", color: "#4361ee" },
  { id: "Beta", color: "#7209b7" },
  { id: "Gamma", color: "#f72585" },
  { id: "Delta", color: "#4cc9f0" },
  { id: "Epsilon", color: "#06d6a0" },
];

const BANDWIDTH = 80;
const GAP = 10;
const SVG_HEIGHT = 100;

function asParent<E extends Element, D>(
  sel: Selection<E, D, null, undefined>,
): Selection<BaseType, D, BaseType, unknown> {
  return sel as unknown as Selection<BaseType, D, BaseType, unknown>;
}

/** Idempotent render — safe to call any number of times. */
export function renderSelectOrCreate(
  svgEl: SVGSVGElement,
  categories: CategoryItem[],
  callCount: number,
): void {
  const $svg = select<SVGSVGElement, unknown>(svgEl);

  const scale = makeFixedBandScale(categories, {
    selectId: (d) => d.id,
    bandwidth: BANDWIDTH,
    gap: GAP,
    padStart: 16,
  });

  const svgW = scale.getRange() + 32;
  svgEl.setAttribute("width", String(svgW));
  svgEl.setAttribute("viewBox", `0 0 ${svgW} ${SVG_HEIGHT}`);

  // selectOrCreate gets-or-creates a single <g class="categories-group">
  const $g = selectOrCreate<SVGGElement, unknown>("categories-group", asParent($svg), "g");

  $g.selectAll<SVGRectElement, CategoryItem>("rect.cat-rect")
    .data(categories, (d) => d.id)
    .join("rect")
    .classed("cat-rect", true)
    .attr("x", (d) => scale.getX0(d.id) ?? 0)
    .attr("y", 24)
    .attr("width", scale.getBandwidth())
    .attr("height", 36)
    .attr("fill", (d) => d.color)
    .attr("rx", 4);

  $g.selectAll<SVGTextElement, CategoryItem>("text.cat-label")
    .data(categories, (d) => d.id)
    .join("text")
    .classed("cat-label", true)
    .attr("x", (d) => (scale.getX0(d.id) ?? 0) + scale.getBandwidth() / 2)
    .attr("y", 48)
    .attr("text-anchor", "middle")
    .attr("font-size", "10")
    .attr("font-weight", "600")
    .attr("fill", "#fff")
    .text((d) => d.id);

  const rectCount = $g.selectAll("rect.cat-rect").size();
  selectOrCreate<SVGTextElement, unknown>("render-count", asParent($svg), "text")
    .attr("x", 16)
    .attr("y", 88)
    .attr("font-size", "10")
    .attr("fill", "#6c757d")
    .text(
      `render() called ${callCount} time${callCount === 1 ? "" : "s"} — ${rectCount} rect${rectCount === 1 ? "" : "s"} in DOM`,
    );
}
