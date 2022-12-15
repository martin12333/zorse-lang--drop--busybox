const DEFAULT_VARIANT =
  typeof window !== "undefined" || typeof postMessage !== "undefined"
    ? "web"
    : "node";

const mkDropBox = async (
  args,
  Module = undefined,
  variant = DEFAULT_VARIANT
) => {
  // rome-ignore lint/style/useTemplate: <explanation>
  const factory = require("../../out/" + variant + "/dropbox.js");
  const instance = await factory(Module);
  return { instance, exec: () => instance.callMain(args) };
};

const mkBusyBox = async (
  args,
  Module = undefined,
  variant = DEFAULT_VARIANT
) => {
  const cmd = args[0];
  const newArgs = args.slice(1);
  const oldProcArgv = process.argv;
  process.argv = ["drop", cmd === "zip" ? "nanozip" : cmd];
  // rome-ignore lint/style/useTemplate: <explanation>
  const factory = require("../../out/" + variant + "/busybox.js");
  const instance = await factory(Module);
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
};

/**
 * @typedef {("base64"|"basename"|"cat"|"chmod"|"chown"|"clear"|"cp"|"date"|"diff"|"echo"|"egrep"|"env"|"false"|"fgrep"|"find"|"grep"|"head"|"link"|"ln"|"ls"|"md5sum"|"mkdir"|"mktemp"|"mv"|"nanozip"|"patch"|"printenv"|"printf"|"pwd"|"readlink"|"realpath"|"rm"|"rmdir"|"sed"|"sha256sum"|"sleep"|"sort"|"stat"|"tail"|"tar"|"test"|"touch"|"true"|"uniq"|"unlink"|"unzip"|"whoami"|"xargs")} BusyBoxCommands
 * @typedef {("drop"|"node"|"zip")} AddedCommands
 * @typedef {(AddedCommands|BusyBoxCommands)} Command
 */

class Drop {
  /**
   * Executes a command in the shell.
   * Consumes "fs", "path", "crypto", "console", "process", and "buffer".
   * @param {Command} cmd
   * @param  {string[]} args
   * @returns {Promise<void>}
   */
  static async exec(cmd, ...args) {
    switch (cmd) {
      case "drop":
      case "node": {
        return await (await mkDropBox(args)).exec();
      }
      default: {
        return await (await mkBusyBox([cmd, ...args])).exec();
      }
    }
  }
}

module.exports = Drop;
Drop.mkDropBox = mkDropBox;
Drop.mkBusyBox = mkBusyBox;
