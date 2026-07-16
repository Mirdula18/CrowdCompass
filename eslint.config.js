import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "client/dist/**",
      "venv/**",
      "docs/**",
    ],
  },

  js.configs.recommended,

  // Server + repo-level test scripts run under Node.
  {
    files: ["server/**/*.js", "tests/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Client React code runs in the browser (Vite, automatic JSX runtime).
  {
    files: ["client/src/**/*.{js,jsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Automatic JSX runtime — no React import needed for JSX.
      "react/react-in-jsx-scope": "off",
      // Plain-JS project; prop shapes are documented at the call sites.
      "react/prop-types": "off",
    },
  },

  // Vite config runs under Node.
  {
    files: ["client/vite.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
