import type { Selection, BaseType } from "d3-selection";

/**
 * Select a child element by CSS class name, or create and append it if absent.
 *
 * @param className - Class name to select/assign (without the leading `.`).
 * @param parent    - D3 selection of the parent element.
 * @param tagName   - HTML/SVG tag to append when the element does not exist.
 */
export function selectOrCreate<
  Elem extends Element,
  PDatum,
>(
  className: string,
  parent: Selection<BaseType, PDatum, BaseType, unknown>,
  tagName: string
): Selection<Elem, PDatum, BaseType, unknown> {
  let $el = parent.select<Elem>(`.${className}`);
  if ($el.empty()) {
    $el = parent.append<Elem>(tagName).classed(className, true) as Selection<
      Elem,
      PDatum,
      BaseType,
      unknown
    >;
  }
  return $el;
}
