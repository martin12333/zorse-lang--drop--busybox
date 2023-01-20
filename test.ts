import buffer from "buffer";
import crypto from "crypto";
import events from "events";
import fs from "fs";
import memfs from "memfs";
import path from "path";
import stream from "stream";
import url from "url";
import util from "util";
import zlib from "zlib";

interface Test {
	readonly content: string;
}

const test: Test = { content: "hello world" };
console.log(test.content);

console.log("testing url:");
console.log("------------------");
console.log(Object.keys(url));

console.log("testing zlib:");
console.log("------------------");
console.log(Object.keys(zlib));

console.log("testing memfs:");
console.log("------------------");
console.log(Object.keys(memfs));

console.log("testing util:");
console.log("------------------");
console.log(Object.keys(util));

console.log("testing stream:");
console.log("------------------");
console.log(Object.keys(stream));

console.log("testing events:");
console.log("------------------");
console.log(Object.keys(events));

console.log("testing buffer:");
console.log("------------------");
console.log(Object.keys(buffer));

console.log("testing path:");
console.log("------------------");
console.log(Object.keys(path));

console.log("testing fs:");
console.log("------------------");
console.log(Object.keys(fs));

console.log("testing crypto:");
console.log("------------------");
const md5 = crypto.createHash("md5");
md5.update("hello world");
console.log(md5.digest("hex"));

console.log("testing commonjs:");
console.log("------------------");
console.log(JSON.stringify(require("./test.cjs")));
