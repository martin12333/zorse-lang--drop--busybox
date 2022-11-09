#!bash -eu

cd "$(dirname "$0")"
CLEAN=${1:-false}

if [ "$CLEAN" = "--clean" ]; then
  rm -rf dist build
  mkdir build
  cd build
  emcmake cmake ..
  cd ..
fi

cmake --build build
