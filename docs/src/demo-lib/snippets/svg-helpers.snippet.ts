import {
  applyRectangleAsProps,
  makeTranslateTransformFromPoint,
  estimateSvgTextSize,
} from "@visual-toolkit/d3-helpers";

// Encode x/y as a CSS translate() and return width/height as numbers.
applyRectangleAsProps({ x: 20, y: 10, width: 80, height: 30 });
// → { transform: "translate(20, 10)", width: 80, height: 30 }

// Build just the translate string from a point.
makeTranslateTransformFromPoint({ x: 30, y: 15 }); // → "translate(30, 15)"

// Character-count heuristic for text layout decisions (no DOM required).
estimateSvgTextSize({ text: "Hello", fontSize: 12 }); // → { width: 33, height: 12 }
