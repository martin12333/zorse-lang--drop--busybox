// @ts-ignore
import DROP_WASM_BASE64 from "../../target/wasm32-wasi/release/drop.wasm";
import { WASI } from "wasi";
import atob from "atob-lite";

export interface Executioner {
	readonly instance: object;
	exec(): void | Promise<void>;
}

export interface RunOptions {
	readonly args?: string[];
}

export interface DropRunOptions extends RunOptions {
	readonly file: string;
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

export async function runDrop(opts: DropRunOptions): Promise<Executioner> {
	const wasi = new WASI({
		returnOnExit: true,
		preopens: { [process.cwd()]: ".", ".": "." },
		args: ["drop", opts.file, ...(opts.args || [])],
		env: process.env,
	});
	const importObject = { wasi_snapshot_preview1: wasi.wasiImport };
	const buffer = decode(DROP_WASM_BASE64);
	const wasm = await WebAssembly.compile(buffer);
	const instance = await WebAssembly.instantiate(wasm, importObject);
	return {
		instance,
		exec: () => {
			wasi.start(instance) as unknown as Promise<number>;
		},
	};
}

export type BusyBoxBuildVariant = "node" | "web";

export interface BusyBoxRunOptions extends RunOptions {
	readonly variant?: BusyBoxBuildVariant;
	readonly Module?: {};
}

export async function runBusy(opts: BusyBoxRunOptions): Promise<Executioner> {
	const cmd = opts.args?.[0] ?? "--help";
	const newArgs = opts.args?.slice(1);
	const oldProcArgv = process.argv;
	process.argv = ["drop", cmd === "zip" ? "nanozip" : cmd];
	const defaultVariant =
		typeof window !== "undefined" || typeof postMessage !== "undefined"
			? "web"
			: "node";
	const variant = opts.variant === undefined ? defaultVariant : opts.variant;
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

export async function run(
	opts: DropRunOptions | BusyBoxRunOptions,
): Promise<Executioner> {
	if ("file" in opts) {
		return await runDrop(opts);
	} else {
		return await runBusy(opts);
	}
}

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
	| "zip";

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
