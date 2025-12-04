import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import expoConfig from "eslint-config-expo/flat";

export default defineConfig([
  // Base config de Expo (incluye compatibilidad con React Native, JSX, TS, etc.)
  expoConfig,

  // Reglas recomendadas de JS
  js.configs.recommended,

  // Configuración para TypeScript / TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsPlugin.parsers["@typescript-eslint/parser"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: globals.browser,  // ajusta si necesitas node en algunos archivos
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: react,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn"],
      "react/prop-types": "off",
      // Otras reglas personalizadas que necesites...
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Integración con Prettier: formateo como parte del lint
  {
    plugins: {
      prettier: require("eslint-plugin-prettier"),
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // Ignorar carpetas/files innecesarios
  {
    ignores: ["node_modules", "dist", "build", ".expo"],
  },
]);
