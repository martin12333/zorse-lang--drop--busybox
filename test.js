const fs = require(`fs`);
const path = require(`path`);
const events = require(`events`);
const util = require(`util`);
const stream = require(`stream`);
const buffer = require(`buffer`);
const url = require(`url`);
console.log(fs.readFileSync(path.resolve(process.cwd(), "test.js"), "utf8"));
