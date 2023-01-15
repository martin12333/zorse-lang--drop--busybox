#!/usr/bin/env -S node --experimental-wasi-unstable-preview1 --no-warnings
try {
  // assert if node is great than 16
  if (process.versions.node.split(".")[0] < 16) {
    throw new Error("NodeJS version 16+ is required.");
  }
  require.resolve("wasi");
} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    try {
      const { spawnSync } = require("child_process");
      const { env, execPath, execArgv, argv } = process;
      env.NODE_OPTIONS = `${env.NODE_OPTIONS || ""} --experimental-wasi-unstable-preview1 --no-warnings`;
      const { status } = spawnSync(execPath, execArgv.concat(argv.slice(1)), {
        env,
        stdio: "inherit",
      });
      process.exit(status ?? 1);
    } catch (err) {
      console.error("Fatal error", err);
      process.exit(1);
    }
  } else {
    console.error('Unable to load "wasi" module', err);
    process.exit(1);
  }
}
const { exec } = require("./drop");
const scriptIndex = process.argv.findIndex((arg) => arg === __filename);
const cmd = process.argv[scriptIndex + 1];
const args = process.argv.slice(scriptIndex + 2);
if (process.argv.length < 3 || cmd === "--help") {
  exec("busybox", "--help");
} else {
  exec(cmd, ...args);
}
