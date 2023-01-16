# drop

<em> :pushpin: NodeJS and TypeScript(X) Emulation in WASI :pushpin: </em>

"drop" is a small toolbox of common tools in WebAssembly to provide a POSIX-like
environment independent of the host system and platform capabilities.

"drop" is designed primarily as a toolbox for file IO and offline scripting.

```sh
$ npm install --global @zorse/drop

$ drop node test.ts
Hello From WASI!

$ drop ls
webpack.std.mjs    src                lib                LICENSE
webpack.all.mjs    package.json       docs               Cargo.toml
tsconfig.json      package-lock.json  dist               Cargo.lock
test.zx.mjs        out                build.zx.mjs       CREDITS.md
test.ts            node_modules       build.rs           CMakeLists.txt
target             modules.tar.gz     build
std                modules            README.md

$ drop zip archive.zip file.txt
```

API Documentation: [`docs`](docs/README.md#table-of-contents)

## Features

"drop" currently offers the following tools in WebAssembly:

- `dropbox`: a domain specific JavaScript runtime that emulates a NodeJS subset:
  - `assert` • `buffer`: • `crypto`: • `events`: • `fs` • `memfs` • `os`
  • `path` • `process` • `punycode` • `querystring` • `readline` • `stream`
  • `string_decoder` • `timers` • `tty` • `url`: • `util` • `zlib`
- `busybox` and following tools offered through it:
  - `base64` • `basename` • `cat` • `chmod` • `chown` • `clear` • `cp` • `date`
  • `diff` • `echo` • `egrep` • `env` • `false` • `fgrep` • `find` • `grep`
  • `head` • `link` • `ln` • `ls` • `md5sum` • `mkdir` • `mktemp` • `mv`
  • `nanozip` • `patch` • `printenv` • `printf` • `pwd` • `readlink`
  • `realpath` • `rm` • `rmdir` • `sed` • `sha256sum` • `sleep` • `sort`
  • `stat` • `tail` • `tar` • `test` • `touch` • `true` • `uniq` • `unlink`
  • `unzip` • `whoami` • `xargs` • `zip`

"drop" can be used as a drop-in replacement for Node in the Zorse toolchain, and
can be used to run JavaScript code offline, portable and independent of the host
operating system and environment.

## Architecture

"drop" is a collection of tools that are compiled to WebAssembly and run in node
or in the browser. The tools are dependent on a subset of Emscripten + WASI ABIs
to provide a POSIX-like environment anywhere.

The subset of Emscripten + WASI ABIs that "drop" uses is referred to as the Drop
ABI. This ABI is currently available in JavaScript for browsers and NodeJS.

"dropbox" (the NodeJS runtime) is pure WASI and can be ran in any WASI runtime:

```sh
wasmtime run --dir=. --wasm-features=all drop.wasm test.ts
```
