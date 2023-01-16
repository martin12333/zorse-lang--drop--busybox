#!/usr/bin/env -S node --experimental-wasi-unstable-preview1 --no-warnings --preserve-symlinks --preserve-symlinks-main

import type { ExecCommand } from "./index";

function hasWasiImport() {
	try {
		require.resolve("wasi");
		return true;
	} catch (_) {
		return false;
	}
}
function hasPreserveSymlinks() {
	return (
		process.execArgv.includes("--preserve-symlinks") &&
		process.execArgv.includes("--preserve-symlinks-main")
	);
}
function hasMinimumNode16Version() {
	return (
		process.versions.node
			.split(".")
			.map((n) => parseInt(n, 10))
			.reduce((a, b) => a * 100 + b, 0) >= 16000
	);
}
function canStart() {
	return hasWasiImport() && hasPreserveSymlinks() && hasMinimumNode16Version();
}
function shouldRestart() {
	return !canStart();
}
function restart() {
	const { spawnSync } = require("child_process");
	const { env, execPath, execArgv, argv } = process;
	const { status } = spawnSync(
		execPath,
		execArgv
			.concat([
				"--experimental-wasi-unstable-preview1",
				"--preserve-symlinks-main",
				"--preserve-symlinks",
				"--no-warnings",
			])
			.concat(argv.slice(1)),
		{
			stdio: "inherit",
			env,
		},
	);
	process.exit(status ?? 1);
}
function start() {
	// @ts-expect-error index is compiled separately
	const { exec } = __non_webpack_require__(
		"./index",
	) as typeof import("./index");
	const nonCommands = [__filename, process.execPath, process.argv0];
	const allArgs = process.argv.filter((arg) => !nonCommands.includes(arg));
	if (allArgs.length < 1) {
		exec("busybox", "--help");
	} else {
		const cmd = allArgs[0];
		const args = allArgs.slice(1);
		exec(cmd as ExecCommand, ...args);
	}
}
function main() {
	if (shouldRestart()) {
		restart();
	} else {
		start();
	}
}
try {
	main();
} catch (err) {
	console.error("Fatal error", err);
	process.exit(1);
}
