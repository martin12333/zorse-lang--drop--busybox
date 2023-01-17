cmake_minimum_required(VERSION 3.12 FATAL_ERROR)
project(drop)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(ExternalProject)
include(CheckCXXSourceCompiles)

check_cxx_source_compiles("
#ifndef __EMSCRIPTEN__
#error not emscripten
#endif
int main() {
  return 0;
}" IS_EMSCRIPTEN)

if(NOT IS_EMSCRIPTEN)
  message(FATAL_ERROR "This project is only supported on Emscripten")
endif()

get_filename_component(EMCC_ROOT ${CMAKE_C_COMPILER} DIRECTORY)

ExternalProject_Add(miniz
  URL "https://github.com/richgel999/miniz/releases/download/2.1.0/miniz-2.1.0.zip"
  CONFIGURE_COMMAND "" BUILD_COMMAND "" INSTALL_COMMAND ""
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

ExternalProject_Get_property(miniz SOURCE_DIR)
set(MINIZ_SOURCE_DIR ${SOURCE_DIR})
unset(SOURCE_DIR)

option(NODERAWFS_ENABLE "Enable Foo" ON)
set(LDFLAGS_LIST
  "-lproxyfs.js"
  "-sSINGLE_FILE=1"
  "-sMODULARIZE=1"
  "-sFORCE_FILESYSTEM=1"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sEXIT_RUNTIME=1"
  "-sINVOKE_RUN=0"
  "-sEXPORTED_RUNTIME_METHODS=FS,MEMFS,PROXYFS,NODERAWFS,callMain"
  "-sENVIRONMENT=node")

if(NODERAWFS_ENABLE)
  list(APPEND LDFLAGS_LIST "-sNODERAWFS=1")
endif()

list(JOIN LDFLAGS_LIST " " BUSYBOX_CONFIG_EXTRA_LDFLAGS)
configure_file(src/misc/.config ${CMAKE_CURRENT_BINARY_DIR}/.config)

ExternalProject_Add(busybox
  DEPENDS miniz
  URL "https://github.com/mirror/busybox/archive/refs/tags/1_32_0.zip"
  CONFIGURE_COMMAND
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_SOURCE_DIR}/src/misc/nanozip.c <SOURCE_DIR>/archival/nanozip.c &&
  ${CMAKE_COMMAND} -E copy
  ${MINIZ_SOURCE_DIR}/miniz.c <SOURCE_DIR>/archival/miniz.c &&
  ${CMAKE_COMMAND} -E copy
  ${MINIZ_SOURCE_DIR}/miniz.h <SOURCE_DIR>/archival/miniz.h &&
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_BINARY_DIR}/.config <SOURCE_DIR>/.config &&
  ${CMAKE_COMMAND} -E make_directory <SOURCE_DIR>/arch/em &&
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_SOURCE_DIR}/src/misc/Makefile <SOURCE_DIR>/arch/em/Makefile &&
  ${CMAKE_COMMAND} -E create_symlink ${EMCC_ROOT}/emcc ${CMAKE_CURRENT_BINARY_DIR}/emgcc &&
  ${CMAKE_COMMAND} -E create_symlink ${EMCC_ROOT}/emcc.py ${CMAKE_CURRENT_BINARY_DIR}/emgcc.py
  BUILD_COMMAND ${CMAKE_COMMAND} -E env
  PATH=${CMAKE_CURRENT_BINARY_DIR}:$ENV{PATH}
  BUILD_COMMAND ${CMAKE_COMMAND} -E env _EMCC_CCACHE=1
  SRCDIR=${CMAKE_CURRENT_SOURCE_DIR}/src/misc
  ${EMCC_ROOT}/emmake make ARCH=em CROSS_COMPILE=em SKIP_STRIP=y &&
  ${CMAKE_COMMAND} -E copy
  <SOURCE_DIR>/busybox_unstripped.js ${CMAKE_CURRENT_BINARY_DIR}/busybox_unstripped.js
  INSTALL_COMMAND ""
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

ExternalProject_Add(wasisdk
  URL "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-19/wasi-sdk-19.0-linux.tar.gz"
  CONFIGURE_COMMAND "" BUILD_COMMAND "" INSTALL_COMMAND ""
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

find_program(PATCH NAMES patch PATH_SUFFIXES usr/bin)
ExternalProject_Add(quickjs
  URL "https://github.com/bellard/quickjs/archive/2788d71e823b522b178db3b3660ce93689534e6d.zip"
  CONFIGURE_COMMAND "" BUILD_COMMAND "" INSTALL_COMMAND ""
  PATCH_COMMAND ${PATCH} -p1 -i ${CMAKE_CURRENT_SOURCE_DIR}/src/quickjs/quickjs.patch
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

ExternalProject_Get_property(wasisdk SOURCE_DIR)
set(WASICC ${SOURCE_DIR}/bin/clang)
set(WASIAR ${SOURCE_DIR}/bin/llvm-ar)
unset(SOURCE_DIR)

ExternalProject_Get_property(quickjs SOURCE_DIR)
set(QJS_ROOT ${SOURCE_DIR})
unset(SOURCE_DIR)

add_custom_target(quickjs-wasi ALL DEPENDS wasisdk quickjs
  COMMAND ccache ${WASICC} -msimd128 -mbulk-memory -ftls-model=local-exec -c
  ${QJS_ROOT}/libbf.c ${QJS_ROOT}/cutils.c ${QJS_ROOT}/libunicode.c
  ${CMAKE_CURRENT_SOURCE_DIR}/src/quickjs/wapper.c ${QJS_ROOT}/libregexp.c ${QJS_ROOT}/quickjs-libc.c
  -DNO_OS_POLL=1 -DCONFIG_BIGNUM=1 -DCONFIG_VERSION='"wasi"' -O3 -D__wasi__
  -lwasi-emulated-signal -D_WASI_EMULATED_SIGNAL=1 -Wno-unused-command-line-argument
  -Wno-implicit-function-declaration -Wno-implicit-const-int-float-conversion
  COMMAND ${WASIAR} -r libquickjs.a cutils.o libbf.o libunicode.o wapper.o libregexp.o quickjs-libc.o
  BYPRODUCTS libquickjs.a
)

add_custom_target(quickjs-wasi-bindgen ALL DEPENDS quickjs-wasi
  COMMAND bindgen ${CMAKE_CURRENT_SOURCE_DIR}/src/quickjs/wapper.h
  --no-layout-tests --size_t-is-usize -o binding.rs -- -D__wasi__
)
