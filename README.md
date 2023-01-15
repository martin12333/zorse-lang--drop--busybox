# drop

"drop" is a small toolbox of common tools in WebAssembly to provide a POSIX-like
environment independent of the host system and platform capabilities.

"drop" is designed primarily as a toolbox for file IO and offline scripting.

## Features

"drop" currently offers the following tools in WebAssembly:

- `drop`: a domain specific JavaScript runtime that emulates a subset of NodeJS:
  - **`assert`** • **`buffer`**: • **`crypto`**: • **`events`**: • **`fs`**
  • **`memfs`** • **`os`** • **`path`** • **`process`** • **`punycode`** 
  • **`querystring`** • **`readline`** • **`stream`** • **`string_decoder`**
  • **`timers`** • **`tty`** • **`url`**: • **`util`** • **`zlib`**
- `node`: aliased to `drop` for compatibility with existing NodeJS scripts
- `busybox` and following tools offered through it:
  - `base64` • `basename` • `cat` • `chmod` • `chown` • `clear` • `cp` • `date`
  • `diff` • `echo` • `egrep` • `env` • `false` • `fgrep` • `find` • `grep`
  • `head` • `link` • `ln` • `ls` • `md5sum` • `mkdir` • `mktemp` • `mv`
  • `nanozip` • `patch` • `printenv` • `printf` • `pwd` • `readlink`
  • `realpath` • `rm` • `rmdir` • `sed` • `sha256sum` • `sleep` • `sort`
  • `stat` • `tail` • `tar` • `test` • `touch` • `true` • `uniq` • `unlink`
  • `unzip` • `whoami` • `xargs` • `zip`

"drop" aims to support enough of Node core APIs to run the ADK. Currently it has
`fs`, `path`, `events`, `util`, `stream`, `buffer`, and `url`.

"drop" can be used as a drop-in replacement for Node in the Zorse toolchain, and
can be used to run JavaScript code offline, portable and independent of the host
operating system and environment.

## Architecture

"drop" is a collection of tools that are compiled to WebAssembly and run in node
or in the browser. The tools are dependent on a subset of Emscripten + WASI ABIs
to provide a POSIX-like environment anywhere.

The subset of Emscripten + WASI ABIs that "drop" uses is referred to as the Drop
ABI. This ABI is currently implemented in JavaScript for browsers and NodeJS.
