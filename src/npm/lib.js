async function execAssembly(lib, args) {
  // rome-ignore lint/style/useTemplate: <explanation>
  const factory = require("../../out/node/" + lib + ".js");
  const instance = await factory();
  return instance.callMain(args);
}

const execDropBox = async (args) => await execAssembly("dropbox", args);
const execBusyBox = async (args) => await execAssembly("busybox", args);

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
        return await execDropBox(args);
      }
      default: {
        // TODO: this needs to be patched at BusyBox source level.
        const oldProcArgv = process.argv;
        process.argv = ["drop", cmd === "zip" ? "nanozip" : cmd];
        return await execBusyBox(args).finally(() => {
          process.argv = oldProcArgv;
        });
      }
    }
  }
}

module.exports = Drop;

Drop.DropBox = require("../../out/web/dropbox");
Drop.BusyBox = require("../../out/web/busybox");
