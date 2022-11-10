# drop

"drop" is a small toolbox of common tools in WebAssembly to provide a POSIX-like
environment independent of the host system and platform capabilities.

"drop" is designed primarily as a toolbox for file IO and offline scripting.

in this document:

- [Usage](#usage)
  - [Command Line](#command-line)
  - [Programmatic](#programmatic)
- [Features](#features)
- [Architecture](#architecture)

## Usage

### Command Line

```sh
$ npm install --global @zorse/drop
$ drop --help
$ drop ls -la
$ drop cat README.md
$ drop cp FILE1 FILE2
$ drop node test.js
```

### Programmatic

```js
// npm install @zorse/drop
const drop = require('@zorse/drop');

await drop.exec('ls', '-la');
await drop.exec('cat', 'README.md');
await drop.exec('cp', 'FILE1' , 'FILE2');
await drop.exec('node', 'test.js');
```

"drop" is published as a UMD module. Runtime needs to provide the following:

- `console`: stderr/stdout IO interaction
- `process`: process argv handling
- `crypto`: random bytes generation
- `path`: path manipulation
- `fs`: file system interaction

## Features

"drop" currently offers the following tools in WebAssembly:

- `drop`: a domain specific JavaScript runtime that emulates a subset of NodeJS
- `node`: aliased to `drop` for compatibility with existing NodeJS scripts
- Tools offered through BusyBox:
  - `base64`: base64 encoding and decoding
  - `basename`: strip directory and suffix from filenames
  - `cat`: concatenate files and print on the standard output
  - `chmod`: change file mode bits
  - `chown`: change file owner and group
  - `clear`: clear the screen
  - `cp`: copy files and directories
  - `date`: print or set the system date and time
  - `diff`: compare files line by line
  - `echo`: display a line of text
  - `egrep`: search file(s) for lines matching a pattern (grep -E)
  - `env`: print the current environment
  - `false`: do nothing, unsuccessfully
  - `fgrep`: search file(s) for lines matching a pattern (grep -F)
  - `find`: search for files in a directory hierarchy
  - `grep`: search file(s) for lines matching a pattern
  - `head`: output the first part of files
  - `link`: create links between files
  - `ln`: create links between files
  - `ls`: list directory contents
  - `md5sum`: compute and check MD5 message digest
  - `mkdir`: make directories
  - `mktemp`: create a temporary file or directory
  - `mv`: move (rename) files
  - `nanozip`: create a zip archive, emulates the `zip` command
  - `patch`: apply a diff file to an original
  - `printenv`: print the current environment
  - `printf`: format and print data
  - `pwd`: print name of current working directory
  - `readlink`: print value of a symbolic link or canonical file name
  - `realpath`: print the resolved path of a file or directory
  - `rm`: remove files or directories
  - `rmdir`: remove empty directories
  - `sed`: stream editor for filtering and transforming text
  - `sha256sum`: compute and check SHA256 message digest
  - `sleep`: delay for a specified amount of time
  - `sort`: sort lines of text files
  - `stat`: display file or file system status
  - `tail`: output the last part of files
  - `tar`: create, extract, or list files from a tar archive
  - `test`: evaluate conditional expression
  - `touch`: change file timestamps
  - `true`: do nothing, successfully
  - `uniq`: report or omit repeated lines
  - `unlink`: remove a file's directory entry
  - `unzip`: list, test and extract compressed files in a ZIP archive
  - `whoami`: print effective user id
  - `xargs`: build and execute command lines from standard input

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
