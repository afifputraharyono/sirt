import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "graphify-out/**",
      "node_modules/**",
      "reference/**",
      "templates/**",
      "supabase/**",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Bukan modul komponen: berisi konfigurasi router + komponen lazy.
    files: ["src/app/router.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Primitif shadcn/ui sengaja mengekspor variants dan hook bersama komponen.
    files: ["src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  }
);
