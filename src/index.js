// search and remove current script from process.argv for busybox
process.argv = process.argv.filter((arg) => arg !== __filename);

const git = require("wasm-git/lg2");
const drop = require("../build/drop");
const busybox = require("../build/busybox_unstripped");

const _init = Promise.all([
  new Promise((resolve) => (git.onRuntimeInitialized = resolve)),
  new Promise((resolve) => (drop.onRuntimeInitialized = resolve)),
  new Promise((resolve) => (busybox.onRuntimeInitialized = resolve)),
]);

class Drop {
  static async init() {
    await _init;
  }

  static async exec(cmd, ...args) {
    await Drop.init();
    switch (cmd) {
      case "git":
        return await git.callMain(args);
      case "drop":
      case "node":
        return await drop.callMain(args);
      default:
        // "cmd" is read from process.argv[0]
        return await busybox.callMain(args);
    }
  }
}

process.argv.shift();
Drop.exec(process.argv[0], ...process.argv.slice(1));
