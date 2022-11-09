#! /usr/bin/env node
const Drop = require("./lib");
if (process.argv.length < 3 || process.argv[2] === "--help") {
  Drop.exec("busybox", "--help");
} else {
  Drop.exec(process.argv[2], ...process.argv.slice(3));
}
