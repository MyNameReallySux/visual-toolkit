import { select, type Selection, type BaseType } from "d3-selection";
import { selectOrCreate } from "@visual-toolkit/d3-helpers";

// Narrow the type so it matches selectOrCreate's parent parameter.
function asParent<E extends Element>(
  sel: Selection<E, unknown, null, undefined>
): Selection<BaseType, unknown, BaseType, unknown> {
  return sel as unknown as Selection<BaseType, unknown, BaseType, unknown>;
}

const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
const $svg = asParent(select<SVGSVGElement, unknown>(svgEl));

// First call: creates <g class="chart-layer"> and appends it.
selectOrCreate("chart-layer", $svg, "g");

// Second call: finds and returns the same existing element — never duplicated.
selectOrCreate("chart-layer", $svg, "g");

// Works with any tag — create a persistent status text node.
selectOrCreate<SVGTextElement, unknown>("status-label", $svg, "text")
  .attr("x", 8)
  .attr("y", 16)
  .text("ready");
