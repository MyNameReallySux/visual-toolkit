// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "visual-toolkit",
      description:
        "Typed scale factories and SVG/D3 utilities built on d3-scale.",
      customCss: ["./src/styles/custom.css"],
      social: [
        // placeholder until the repo is published
        { icon: "github", label: "GitHub", href: "https://github.com" },
      ],
      sidebar: [
        { label: "Getting Started", link: "/" },
        {
          label: "Band Scales",
          items: [
            "band-scales/introduction",
            "band-scales/margins-gaps",
            "band-scales/fixed",
            "band-scales/dynamic",
            "band-scales/enum",
            "band-scales/grid-layout",
            "band-scales/composing",
            "band-scales/transform-fit",
          ],
        },
        {
          label: "Discontinuous Scales",
          items: ["discontinuous/timeline"],
        },
        {
          label: "Helpers",
          items: [
            "helpers/band-math",
            "helpers/svg-helpers",
            "helpers/select-or-create",
            "helpers/css-numbers",
          ],
        },
        typeDocSidebarGroup,
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../packages/d3-band-scales",
            "../packages/d3-discontinuous-scale",
            "../packages/d3-helpers",
          ],
          tsconfig: "../tsconfig.json",
          output: "api",
          typeDoc: {
            entryPointStrategy: "packages",
            // Package entry pages must not be named README.md — starlight-typedoc
            // deletes those. "index" gives each package a landing page at
            // /api/visual-toolkit/<pkg>/ (merged with its README via mergeReadme).
            entryFileName: "index",
          },
          sidebar: {
            label: "API Reference",
            collapsed: true,
          },
        }),
      ],
    }),
  ],
});
