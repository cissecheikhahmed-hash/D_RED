import baseConfig from "@d-red/eslint-config/base";

/** globals Node minimales pour le script de test autonome (pas de tsconfig/typechecking dessus). */
const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
};

export default [
  ...baseConfig,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
];
