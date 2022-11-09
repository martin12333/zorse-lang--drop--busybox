const drop = require("./drop");
const busybox = require("./busybox");

class Drop {
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
