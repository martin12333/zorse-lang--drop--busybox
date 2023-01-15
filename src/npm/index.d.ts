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
export declare function runDrop(opts: DropRunOptions): Promise<Executioner>;
export type BusyBoxBuildVariant = "node" | "web";
export interface BusyBoxRunOptions extends RunOptions {
    readonly variant?: BusyBoxBuildVariant;
    readonly Module?: {};
}
export declare function runBusy(opts: BusyBoxRunOptions): Promise<Executioner>;
export declare function run(opts: DropRunOptions | BusyBoxRunOptions): Promise<Executioner>;
export type ExecCommand = "base64" | "basename" | "cat" | "chmod" | "chown" | "clear" | "cp" | "date" | "diff" | "echo" | "egrep" | "env" | "false" | "fgrep" | "find" | "grep" | "head" | "link" | "ln" | "ls" | "md5sum" | "mkdir" | "mktemp" | "mv" | "nanozip" | "patch" | "printenv" | "printf" | "pwd" | "readlink" | "realpath" | "rm" | "rmdir" | "sed" | "sha256sum" | "sleep" | "sort" | "stat" | "tail" | "tar" | "test" | "touch" | "true" | "uniq" | "unlink" | "unzip" | "whoami" | "xargs" | "drop" | "node" | "zip";
export declare function exec(cmd: ExecCommand, ...args: string[]): Promise<void>;
