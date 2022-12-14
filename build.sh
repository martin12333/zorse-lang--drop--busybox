#!bash -eu

function build() {
  cd "$(dirname "$0")"
  local target=$1
  local noderawfs=$2
  local out=out/$target
  rm -rf dist build
  mkdir build
  cd build
  emcmake cmake -DNODERAWFS_ENABLE:BOOL=$noderawfs ..
  cd ..
  cmake --build build
  mkdir -p $out
  cp build/busybox_unstripped.js $out/busybox.js
  cp build/drop.js $out/dropbox.js
}

build node ON
build web OFF
