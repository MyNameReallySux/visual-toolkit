import {
  makeGrid,
  makeFixedEnumBandScale,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg } from "../section-helpers.js";
import { renderCell, renderLabel, ANNOTATION_COLOR, ANNOTATION_LINE_COLOR } from "../demo-render.js";

type TrackKey = "intro" | "verse" | "chorus" | "bridge" | "outro";
type FixedKey = "alpha" | "beta" | "gamma" | "delta" | "zeta";

type TrackItem = { key: TrackKey; bandwidth: number; color: string; label: string };
type FixedItem = { key: FixedKey; isEnabled: boolean; label: string; color: string };

const TRACK_ITEMS: TrackItem[] = [
  { key: "intro", bandwidth: 80, color: "#4361ee", label: "Intro" },
  { key: "verse", bandwidth: 120, color: "#7209b7", label: "Verse" },
  { key: "chorus", bandwidth: 100, color: "#f72585", label: "Chorus" },
  { key: "bridge", bandwidth: 60, color: "#4cc9f0", label: "Bridge" },
  { key: "outro", bandwidth: 80, color: "#06d6a0", label: "Outro" },
];

const FIXED_ITEMS: FixedItem[] = [
  { key: "alpha", isEnabled: true, label: "Alpha", color: "#4361ee" },
  { key: "beta", isEnabled: false, label: "Beta", color: "#7209b7" },
  { key: "gamma", isEnabled: true, label: "Gamma", color: "#f72585" },
  { key: "delta", isEnabled: true, label: "Delta", color: "#4cc9f0" },
  { key: "zeta", isEnabled: false, label: "Zeta", color: "#06d6a0" },
];

const PAD_LEFT = 16;
const ROW_H = 28;
const SVG_W = 640;
const SVG_H = 260;

const FIXED_BW = 60;
const FIXED_GAP = 8;

export type EnumBandScaleState = {
  gap: number;
  enabledKeys: Set<string>;
};

export function renderEnumBandScales(mount: HTMLElement, state?: EnumBandScaleState): void {
  const gap = state?.gap ?? 6;
  const enabledKeys = state?.enabledKeys;

  const svg = makeSvg(mount, SVG_W, SVG_H);

  // ── Row 0: makeEnumBandScale — variable widths ──────────────────────────────
  const enumGrid = makeGrid({
    rows: { keys: ["row-0"] as const, bandwidth: ROW_H, padStart: 20 },
    columns: {
      entries: TRACK_ITEMS.map(({ key, bandwidth }) => ({ key, bandwidth })),
      gap,
      padStart: PAD_LEFT,
    },
  });

  renderLabel(svg, "makeEnumBandScale — variable widths", PAD_LEFT, 12, {
    anchor: "start",
    size: 10,
    weight: 700,
    color: ANNOTATION_COLOR,
  });

  TRACK_ITEMS.forEach((item) => {
    const { x, y, width, height } = enumGrid.getCellRect("row-0", item.key);

    renderCell(svg, { x, y, width, height }, {
      fill: item.color,
      rx: 4,
    });
    renderLabel(svg, item.label, x + width / 2, y + height / 2 + 4, {
      size: 10,
      weight: 600,
      color: "#fff",
    });
    renderLabel(svg, `${item.bandwidth}px`, x + width / 2, y + height + 10, {
      size: 8,
      color: ANNOTATION_COLOR,
    });
  });

  // ── Rows 1 & 2: makeFixedEnumBandScale — isEnabled filtering ───────────────
  const fixedSectionLabelY = 80;
  const refRowY = 92;
  const actRowY = 152;

  const isOn = (item: FixedItem) =>
    enabledKeys ? enabledKeys.has(item.key) : item.isEnabled;

  renderLabel(svg, "makeFixedEnumBandScale — isEnabled filtering (collapse)", PAD_LEFT, fixedSectionLabelY, {
    anchor: "start",
    size: 10,
    weight: 700,
    color: ANNOTATION_COLOR,
  });

  // Reference row: one slot per declared key, regardless of isEnabled
  const refGrid = makeGrid({
    rows: { keys: ["row-0"] as const, bandwidth: ROW_H, padStart: refRowY },
    columns: {
      keys: ["alpha", "beta", "gamma", "delta", "zeta"] as const,
      bandwidth: FIXED_BW,
      gap: FIXED_GAP,
      padStart: PAD_LEFT,
    },
  });

  renderLabel(svg, "declared keys (reference)", PAD_LEFT, refRowY - 4, {
    anchor: "start",
    size: 8,
    color: ANNOTATION_LINE_COLOR,
  });

  FIXED_ITEMS.forEach((item) => {
    const { x, y, width, height } = refGrid.getCellRect("row-0", item.key);
    const on = isOn(item);

    if (on) {
      renderCell(svg, { x, y, width, height }, { fill: item.color, rx: 4 });
    } else {
      const el = renderCell(svg, { x, y, width, height }, {
        fill: "none",
        stroke: "#dee2e6",
        rx: 4,
      });
      el.setAttribute("stroke-dasharray", "4,3");
    }
    renderLabel(svg, on ? item.label : `${item.label} (off)`, x + width / 2, y + height / 2 + 4, {
      size: on ? 9 : 8,
      weight: on ? 600 : 400,
      color: on ? "#fff" : ANNOTATION_LINE_COLOR,
    });
  });

  // Actual layout row: makeFixedEnumBandScale — disabled entries filtered out, enabled packs together
  const fixedScale = makeFixedEnumBandScale(
    FIXED_ITEMS.map((item) => ({ key: item.key, isEnabled: isOn(item) })),
    { bandwidth: FIXED_BW, gap: FIXED_GAP, padStart: PAD_LEFT },
  );

  renderLabel(svg, "actual layout (collapsed)", PAD_LEFT, actRowY - 4, {
    anchor: "start",
    size: 8,
    color: ANNOTATION_LINE_COLOR,
  });

  FIXED_ITEMS.forEach((item) => {
    if (!fixedScale.doesKeyExist(item.key)) return;
    const x0 = fixedScale.getX0(item.key) ?? 0;
    const x1 = fixedScale.getX1(item.key) ?? x0;

    renderCell(svg, { x: x0, y: actRowY, width: x1 - x0, height: ROW_H }, {
      fill: item.color,
      rx: 4,
    });
    renderLabel(svg, item.label, x0 + (x1 - x0) / 2, actRowY + ROW_H / 2 + 4, {
      size: 9,
      weight: 600,
      color: "#fff",
    });
  });

  // doesKeyExist readout
  const dkeY = actRowY + ROW_H + 14;
  const betaExists = fixedScale.doesKeyExist("beta");
  const alphaExists = fixedScale.doesKeyExist("alpha");
  renderLabel(
    svg,
    `doesKeyExist("beta") → ${betaExists}   doesKeyExist("alpha") → ${alphaExists}`,
    PAD_LEFT,
    dkeY,
    { anchor: "start", size: 8, color: ANNOTATION_COLOR },
  );
}
