import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const generatedAndLocalIgnores = [
  "**/dist/**",
  "**/node_modules/**",
  "**/.turbo/**",
  "**/.next/**",
  "**/coverage/**",
  "release/binaries/**",
  "release/downloaded-cli-binaries/**",
  "deploy/**",
  "data/**",
  "apps/registry-api/data/**",
  ".aipm/**",
  "**/*.tsbuildinfo",
];

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: generatedAndLocalIgnores,
  },
  {
    files: ["apps/web/**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      "scripts/**/*.{js,cjs,mjs}",
      "eslint.config.js",
      "prettier.config.js",
      "apps/*/scripts/**/*.{js,cjs,mjs}",
      "apps/web/next.config.ts",
      "apps/cli/src/**/*.{ts,tsx}",
      "apps/registry-api/src/**/*.{ts,tsx}",
      "packages/*/src/**/*.{ts,tsx}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
