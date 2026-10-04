#!/usr/bin/env node
import fs from "node:fs";

const file = "tools/pack/src/linux.ts";
const src = fs.readFileSync(file, "utf8");
const bt = String.fromCharCode(96);
const anchor = bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",\n  ];";
const replacement = [
  bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",",
  "    \"-e\",",
  "    \"CI=true\",",
  "    \"-e\",",
  bt + "npm_execpath=${CONTAINER_PNPM_PATH}" + bt + ",",
  "  ];",
].join("\n");
if (!src.includes(anchor)) {
  console.error("anchor not found in tools/pack/src/linux.ts");
  process.exit(1);
}
fs.writeFileSync(file, src.replace(anchor, replacement));
console.log("patched tools/pack/src/linux.ts to forward CI=true and npm_execpath into container");
