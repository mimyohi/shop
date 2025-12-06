const entryFiles = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "models/**/*.{ts,tsx}",
  "providers/**/*.{ts,tsx}",
  "queries/**/*.{ts,tsx}",
  "repositories/**/*.{ts,tsx}",
  "scripts/**/*.{ts,tsx,js}",
  "store/**/*.{ts,tsx}",
  "next.config.js",
  "postcss.config.mjs",
];

export default {
  entry: entryFiles,
  project: ["tsconfig.json"],
  ignore: [
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    "package.json",
    "postcss.config.mjs",
  ],
};
