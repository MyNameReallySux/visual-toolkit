/** Shared utilities for interactive demo islands. */

/** Eight-color demo palette shared across demos. */
export const DEMO_COLORS = [
  "#4361ee", "#3a0ca3", "#7209b7", "#f72585",
  "#4cc9f0", "#06d6a0", "#ffd166", "#ef233c",
];

/** Options for `makeSvg`. */
export type MakeSvgOptions = {
  className?: string;
  viewBox?: string;
};

/**
 * Get-or-create the SVG element inside a mount div.
 * Re-renders clear existing children so controls can call render() again.
 * Pass `className` to override the default `"demo-svg"` selector/class.
 * Pass `viewBox` to override the default `"0 0 width height"` viewBox.
 */
export function makeSvg(
  mount: HTMLElement,
  width: number,
  height: number,
  options?: MakeSvgOptions,
): SVGSVGElement {
  const cls = options?.className ?? "demo-svg";
  let svg = mount.querySelector<SVGSVGElement>(`svg.${cls}`);
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add(cls);
    mount.appendChild(svg);
  }
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", options?.viewBox ?? `0 0 ${width} ${height}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  return svg;
}

/** Options for `makeSlider`. */
export type MakeSliderOptions = {
  /** Label text shown beside the slider. */
  labelText: string;
  min: number;
  max: number;
  initial: number;
  /** Called with the new numeric value on every `input` event. */
  onChange: (v: number) => void;
};

/**
 * Build a labeled range slider row and append it to `container`.
 * Returns the `<input>` element so callers can read `.value` later if needed.
 */
export function makeSlider(
  container: HTMLElement,
  options: MakeSliderOptions,
): HTMLInputElement {
  const { labelText, min, max, initial, onChange } = options;

  const row = document.createElement("div");
  row.className = "control-row";

  const lbl = document.createElement("label");
  lbl.textContent = labelText;

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.value = String(initial);

  const display = document.createElement("span");
  display.className = "value-display";
  display.textContent = String(initial);

  input.addEventListener("input", () => {
    const v = Number(input.value);
    display.textContent = String(v);
    onChange(v);
  });

  row.appendChild(lbl);
  row.appendChild(input);
  row.appendChild(display);
  container.appendChild(row);

  return input;
}
