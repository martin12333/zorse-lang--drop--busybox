#!/usr/bin/env zx

import { assert, use } from "chai";

import chaiAsPromised from "chai-as-promised";

use(chaiAsPromised);

async function build(target) {
  const out = `out/${target}`;
  await assert.isFulfilled($`rm -rf dist build`);
  await assert.isFulfilled($`mkdir build`);
  await assert.isFulfilled($`cd build && emcmake cmake -DNODERAWFS_ENABLE:BOOL=${target === "node" ? "ON" : "OFF"} ..`);
  await assert.isFulfilled($`cmake --build build`);
  await assert.isFulfilled($`mkdir -p ${out}`);
  await assert.isFulfilled($`cp build/busybox_unstripped.js ${out}/busybox.js`);
}

async function bundle() {
  await assert.isFulfilled($`npx webpack --config webpack.std.mjs`);
  await assert.isFulfilled($`cargo build --release`);
  await assert.isFulfilled($`npx webpack --config webpack.all.mjs`);
}

async function docs() {
  await assert.isFulfilled($`rm -rf docs`);
  await assert.isFulfilled($`npx typedoc src/npm/index.ts`);
  await assert.isFulfilled($`rm docs/.nojekyll docs/README.md`);
  await assert.isFulfilled($`mv docs/modules.md docs/README.md`);
}

async function main() {
  await assert.isFulfilled(build("node"));
  await assert.isFulfilled(build("web"));
  await assert.isFulfilled(bundle());
  await assert.isFulfilled(docs());
}

assert.isFulfilled(main());
