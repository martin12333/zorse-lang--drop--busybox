#!bash -eu

cd "$(dirname "$0")"
CLEAN=${1:-false}

if [ "$CLEAN" = "--clean" ]; then
  rm -rf build
  mkdir build
  cd build
  emcmake cmake ..
  cd ..
fi

cmake --build build
