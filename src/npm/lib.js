const drop = require("./drop");
const busybox = require("./busybox");

/**
 * @typedef {("base64"|"basename"|"cat"|"chmod"|"chown"|"clear"|"cp"|"date"|"diff"|"echo"|"egrep"|"env"|"false"|"fgrep"|"find"|"grep"|"head"|"link"|"ln"|"ls"|"md5sum"|"mkdir"|"mktemp"|"mv"|"nanozip"|"patch"|"printenv"|"printf"|"pwd"|"readlink"|"realpath"|"rm"|"rmdir"|"sed"|"sha256sum"|"sleep"|"sort"|"stat"|"tail"|"tar"|"test"|"touch"|"true"|"uniq"|"unlink"|"unzip"|"whoami"|"xargs")} BusyBoxCommands
 * @typedef {("drop"|"node"|"zip")} AddedCommands
 * @typedef {(AddedCommands|BusyBoxCommands)} Command
 */

class Drop {
  /**
   * Executes a command in the shell.
   * Consumes "fs", "path", "crypto", "console", "process".
   * @param {Command} cmd
   * @param  {string[]} args
   * @returns {Promise<void>}
   */
  static async exec(cmd, ...args) {
    switch (cmd) {
      case "drop":
      case "node": {
        return await drop(args);
      }
      default: {
        // TODO: this needs to be patched at BusyBox source level.
        const oldProcArgv = process.argv;
        process.argv = ["drop", cmd === "zip" ? "nanozip" : cmd];
        return await busybox(args).finally(() => {
          process.argv = oldProcArgv;
        });
      }
    }
  }
}

module.exports = Drop;
