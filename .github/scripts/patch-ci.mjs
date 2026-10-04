#!/usr/bin/env node
import fs from "node:fs";

const file = "tools/pack/src/linux.ts";
let src = fs.readFileSync(file, "utf8");
const bt = String.fromCharCode(96);

// Patch 1: forward CI=true and npm_execpath into the container.
const anchor1 = bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",\n  ];";
const repl1 = [
  bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",",
  "    \"-e\",",
  "    \"CI=true\",",
  "    \"-e\",",
  bt + "npm_execpath=${CONTAINER_PNPM_PATH}" + bt + ",",
  "  ];",
].join("\n");
if (!src.includes(anchor1)) {
  console.error("anchor1 not found in tools/pack/src/linux.ts");
  process.exit(1);
}
src = src.replace(anchor1, repl1);

// Patch 2: add pnpm.overrides so transitive @open-design/* deps resolve to
// the locally packed tarballs instead of the npm registry.
const anchor2 = "    private: true,\n    main: \"main.cjs\",\n    dependencies,\n";
const repl2 = "    private: true,\n    main: \"main.cjs\",\n    dependencies,\n    pnpm: { overrides: dependencies },\n";
if (!src.includes(anchor2)) {
  console.error("anchor2 not found in tools/pack/src/linux.ts");
  process.exit(1);
}
src = src.replace(anchor2, repl2);

fs.writeFileSync(file, src);
console.log("patched tools/pack/src/linux.ts (CI/npm_execpath + pnpm.overrides)");
