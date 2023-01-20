# drop

<em> :pushpin: NodeJS and POSIX Emulation in WASI :pushpin: </em>

Drop is a small toolbox of common tools in WebAssembly to provide a POSIX-like
environment independent of the host system and platform capabilities.

Drop is designed primarily as a toolbox for file IO and offline scripting.  
Zorse, TypeScript, TypeScriptX (React), and JavaScript syntax are supported.

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

## Goals

- Not introducing any new concepts or APIs.
- Runtime staying entirely in WebAssembly and WASI and be portable.
- Being as transparent for end user code as possible by emulating NodeJS APIs.

## Features

Drop's JS runtime uses QuickJS and supports both CommonJS and ES Modules with a
proper global `require` function and a `module` object, just like NodeJS.

Drop's JS runtime uses SWC to transpile TypeScript(X) to JavaScript on the fly.

Drop currently offers the following feature sets in WebAssembly:

- Following NodeJS modules:
  - `assert` • `buffer`: • `crypto`: • `events`: • `fs` • `memfs` • `os`
  • `path` • `process` • `punycode` • `querystring` • `readline` • `stream`
  • `string_decoder` • `timers` • `tty` • `url`: • `util` • `zlib`
- Following tools through `busybox`:
  - `base64` • `basename` • `cat` • `chmod` • `chown` • `clear` • `cp` • `date`
  • `diff` • `echo` • `egrep` • `env` • `false` • `fgrep` • `find` • `grep`
  • `head` • `link` • `ln` • `ls` • `md5sum` • `mkdir` • `mktemp` • `mv`
  • `nanozip` • `patch` • `printenv` • `printf` • `pwd` • `readlink`
  • `realpath` • `rm` • `rmdir` • `sed` • `sha256sum` • `sleep` • `sort`
  • `stat` • `tail` • `tar` • `test` • `touch` • `true` • `uniq` • `unlink`
  • `unzip` • `whoami` • `xargs` • `zip`
