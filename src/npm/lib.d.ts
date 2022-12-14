export = Drop;
/**
 * @typedef {("base64"|"basename"|"cat"|"chmod"|"chown"|"clear"|"cp"|"date"|"diff"|"echo"|"egrep"|"env"|"false"|"fgrep"|"find"|"grep"|"head"|"link"|"ln"|"ls"|"md5sum"|"mkdir"|"mktemp"|"mv"|"nanozip"|"patch"|"printenv"|"printf"|"pwd"|"readlink"|"realpath"|"rm"|"rmdir"|"sed"|"sha256sum"|"sleep"|"sort"|"stat"|"tail"|"tar"|"test"|"touch"|"true"|"uniq"|"unlink"|"unzip"|"whoami"|"xargs")} BusyBoxCommands
 * @typedef {("drop"|"node"|"zip")} AddedCommands
 * @typedef {(AddedCommands|BusyBoxCommands)} Command
 */
declare class Drop {
    /**
     * Executes a command in the shell.
     * Consumes "fs", "path", "crypto", "console", "process".
     * @param {Command} cmd
     * @param  {string[]} args
     * @returns {Promise<void>}
     */
    static exec(cmd: Command, ...args: string[]): Promise<void>;

    static DropBox: new (Module?: { /* EMCC input Module object */ }) => { /* EMCC Module */ };
    static BusyBox: new (Module?: { /* EMCC input Module object */ }) => { /* EMCC Module */ };
}
declare namespace Drop {
    export { BusyBoxCommands, AddedCommands, Command };
}
type Command = (AddedCommands | BusyBoxCommands);
type BusyBoxCommands = ("base64" | "basename" | "cat" | "chmod" | "chown" | "clear" | "cp" | "date" | "diff" | "echo" | "egrep" | "env" | "false" | "fgrep" | "find" | "grep" | "head" | "link" | "ln" | "ls" | "md5sum" | "mkdir" | "mktemp" | "mv" | "nanozip" | "patch" | "printenv" | "printf" | "pwd" | "readlink" | "realpath" | "rm" | "rmdir" | "sed" | "sha256sum" | "sleep" | "sort" | "stat" | "tail" | "tar" | "test" | "touch" | "true" | "uniq" | "unlink" | "unzip" | "whoami" | "xargs");
type AddedCommands = ("drop" | "node" | "zip");
