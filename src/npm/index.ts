// @ts-ignore
import DROP_WASM_BASE64 from "../../target/wasm32-wasi/release/drop.wasm";
import { WASI as NodeWASI } from "wasi";
import WASI from "wasi-js";
import atob from "atob-lite";
// this says "bindings/node", but we externalize all its dependencies
import bindings from "wasi-js/dist/bindings/node";

/** Drop ABI variation */
export type ABIVariant = "node" | "web";

function getDefaultABIVariant(): ABIVariant {
	if (typeof window !== "undefined" || typeof postMessage !== "undefined") {
		return "web";
	} else {
		return "node";
	}
}

/** Runner lets you decide late execution of of commands */
export interface Runner {
	/** Underlying native instance */
	readonly instance: object;
	/** Execute the command */
	exec(): void | Promise<void>;
}

/** Base options to run a command in Drop */
export interface RunOptions {
	/** Command line arguments */
	readonly args?: string[];
	/** ABI variant to use */
	readonly variant?: ABIVariant;
}

/** Options to run a Drop command (NodeJS subset emulation) */
export interface DropRunOptions extends RunOptions {
	/** File to run, can be .[cm]js, .[cm]ts, or .[cm]tsx */
	readonly file: string;
	/** Buffer as input to  */
	readonly buffer?: BufferSource;
}

function decode(encoded: string) {
	const binaryString = atob(encoded);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}

/**
 * Run a Drop command (NodeJS subset emulation)
 * @param opts Options to run the command
 * @returns Runner to execute the command
 * @example
 * ```ts
 * const { exec } = await runDrop({ file: "index.ts" });
 * exec();
 * ```
 */
export async function runDrop(opts: DropRunOptions): Promise<Runner> {
	const variant = opts.variant || getDefaultABIVariant();
	const sharedOpts = {
		preopens: { [process.cwd()]: ".", ".": "." },
		args: ["drop", opts.file, ...(opts.args || [])],
		env: process.env,
	};
	const wasi =
		variant === "node" ? new NodeWASI({ returnOnExit: true, ...sharedOpts }) : new WASI({ bindings, ...sharedOpts });
	const importObject = { wasi_snapshot_preview1: wasi.wasiImport };
	const buffer = opts.buffer || decode(DROP_WASM_BASE64);
	const wasm = await WebAssembly.compile(buffer);
	const instance = await WebAssembly.instantiate(wasm, importObject);
	return {
		instance,
		exec: () => {
			wasi.start(instance);
		},
	};
}

/** Options to run a BusyBox command (POSIX subset emulation) */
export interface BusyBoxRunOptions extends RunOptions {
	readonly Module?: {};
}

/**
 * Run a BusyBox command (POSIX subset emulation)
 * @param opts Options to run the command
 * @returns Runner to execute the command
 * @example
 * ```ts
 * const { exec } = await runBusy({ args: ["ls", "-la"] });
 * exec();
 * ```
 * @example
 * ```ts
 * const { exec } = await runBusy({ args: ["zip", "archive.zip", "file.txt"] });
 * exec();
 * ```
 */
export async function runBusy(opts: BusyBoxRunOptions): Promise<Runner> {
	const cmd = opts.args?.[0] ?? "--help";
	const newArgs = opts.args?.slice(1);
	const oldProcArgv = process.argv;
	process.argv = ["drop", cmd === "zip" ? "nanozip" : cmd];
	const variant = opts.variant || getDefaultABIVariant();
	// rome-ignore lint/style/useTemplate: <explanation>
	const factory = require("../../out/" + variant + "/busybox.js");
	const instance = await factory(opts.Module);
	return {
		instance,
		exec: () => {
			const result = instance.callMain(newArgs);
			if (result instanceof Promise) {
				result.finally(() => {
					process.argv = oldProcArgv;
				});
			} else {
				process.argv = oldProcArgv;
			}
			return result;
		},
	};
}

async function run(opts: DropRunOptions | BusyBoxRunOptions): Promise<Runner> {
	if ("file" in opts) {
		return await runDrop(opts);
	} else {
		return await runBusy(opts);
	}
}

/** All available commands */
export type ExecCommand =
	| "base64"
	| "basename"
	| "cat"
	| "chmod"
	| "chown"
	| "clear"
	| "cp"
	| "date"
	| "diff"
	| "echo"
	| "egrep"
	| "env"
	| "false"
	| "fgrep"
	| "find"
	| "grep"
	| "head"
	| "link"
	| "ln"
	| "ls"
	| "md5sum"
	| "mkdir"
	| "mktemp"
	| "mv"
	| "nanozip"
	| "patch"
	| "printenv"
	| "printf"
	| "pwd"
	| "readlink"
	| "realpath"
	| "rm"
	| "rmdir"
	| "sed"
	| "sha256sum"
	| "sleep"
	| "sort"
	| "stat"
	| "tail"
	| "tar"
	| "test"
	| "touch"
	| "true"
	| "uniq"
	| "unlink"
	| "unzip"
	| "whoami"
	| "xargs"
	| "drop"
	| "node"
	| "zip"
	| "busybox";

/**
 * Convenience function to run an either a Drop or BusyBox command
 * @param cmd Command to run
 * @param args Arguments to pass to the command
 * @returns Runner to execute the command
 * @example
 * ```ts
 * await exec("node", "index.ts");
 * ```
 * @example
 * ```ts
 * await exec("ls", "-la");
 * ```
 */
export async function exec(cmd: ExecCommand, ...args: string[]): Promise<void> {
	switch (cmd) {
		case "drop":
		case "node": {
			return await (await run({ file: args[0], args: args.slice(1) })).exec();
		}
		default: {
			return await (await run({ args: [cmd, ...args] })).exec();
		}
	}
}
