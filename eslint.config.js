import js from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "docs/.astro/**",
      "docs/src/content/docs/api/**",
      "**/*.astro",
      "**/*.mdx",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: true,
    jsx: false,
    arrowParens: true,
    braceStyle: "1tbs",
  }),
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.config.{js,mjs,ts}", "**/*.test.ts", "scripts/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Type-level test fixtures are referenced only via `typeof`, which the
      // rule counts as unused.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
