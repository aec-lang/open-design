#!/usr/bin/env node
import fs from "node:fs";

const file = "tools/pack/src/linux.ts";
const src = fs.readFileSync(file, "utf8");
const bt = String.fromCharCode(96);
const needle = bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",\n  ];";
const inject = bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",\n    \"-e\",\n    \"CI=true\",\n  ];";
if (!src.includes(needle)) {
  console.error("anchor not found in tools/pack/src/linux.ts");
  process.exit(1);
}
fs.writeFileSync(file, src.replace(needle, inject));
console.log("patched tools/pack/src/linux.ts to forward CI=true into container");
