#!/usr/bin/env node
import fs from "node:fs";

const file = "tools/pack/src/linux.ts";
let src = fs.readFileSync(file, "utf8");
const bt = String.fromCharCode(96);

// Patch 1: forward CI=true and npm_execpath into the container.
const anchor1 = bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",\n  ];";
const repl1 = [
  bt + "${PRODUCTION_INSTALL_PNPM_BIN_ENV}=${CONTAINER_PNPM_PATH}" + bt + ",",
  '    "-e",',
  '    "CI=true",',
  '    "-e",',
  bt + "npm_execpath=${CONTAINER_PNPM_PATH}" + bt + ",",
  "  ];",
].join("\n");
if (!src.includes(anchor1)) { console.error("anchor1 not found"); process.exit(1); }
src = src.replace(anchor1, repl1);

// Patch 2: pnpm.overrides for transitive @open-design/* deps.
const anchor2 = '    private: true,\n    main: "main.cjs",\n    dependencies,\n';
const repl2 = '    private: true,\n    main: "main.cjs",\n    dependencies,\n    pnpm: { overrides: dependencies },\n';
if (!src.includes(anchor2)) { console.error("anchor2 not found"); process.exit(1); }
src = src.replace(anchor2, repl2);

// Patch 3: expose the pnpm binary on PATH under its real name so
// electron-builder (which shells out to pnpm) can find it.
const anchor3 = bt + "chmod +x ${CONTAINER_PNPM_PATH}" + bt + " && ";
const repl3 = anchor3 + bt + "mkdir -p ${CONTAINER_PNPM_HOME}/bin && ln -sf ${CONTAINER_PNPM_PATH} ${CONTAINER_PNPM_HOME}/bin/pnpm && " + bt + " && ";
if (!src.includes(anchor3)) { console.error("anchor3 not found"); process.exit(1); }
src = src.replace(anchor3, repl3);

// Patch 4: put ${CONTAINER_PNPM_HOME}/bin at the front of PATH.
const anchor4 = bt + "PNPM_HOME=${CONTAINER_PNPM_HOME} PATH=${CONTAINER_PNPM_HOME}:$PATH ${CONTAINER_PNPM_PATH} env use --global ${CONTAINER_NODE_VERSION} && " + bt + " + " + bt + "export PNPM_HOME=${CONTAINER_PNPM_HOME} PATH=${CONTAINER_PNPM_HOME}:$PATH && " + bt;
const repl4 = bt + "PNPM_HOME=${CONTAINER_PNPM_HOME} PATH=${CONTAINER_PNPM_HOME}/bin:${CONTAINER_PNPM_HOME}:$PATH ${CONTAINER_PNPM_PATH} env use --global ${CONTAINER_NODE_VERSION} && " + bt + " + " + bt + "export PNPM_HOME=${CONTAINER_PNPM_HOME} PATH=${CONTAINER_PNPM_HOME}/bin:${CONTAINER_PNPM_HOME}:$PATH && " + bt;
if (!src.includes(anchor4)) { console.error("anchor4 not found"); process.exit(1); }
src = src.replace(anchor4, repl4);

fs.writeFileSync(file, src);
console.log("patched tools/pack/src/linux.ts");
