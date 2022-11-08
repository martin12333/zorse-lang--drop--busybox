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
  CONFIGURE_COMMAND "" BUILD_COMMAND "" INSTALL_COMMAND "" PATCH_COMMAND ""
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

ExternalProject_Get_property(miniz SOURCE_DIR)
set(MINIZ_SOURCE_DIR ${SOURCE_DIR})
unset(SOURCE_DIR)

ExternalProject_Add(busybox
  DEPENDS miniz
  URL "https://busybox.net/downloads/busybox-1.32.0.tar.bz2"
  CONFIGURE_COMMAND
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_SOURCE_DIR}/src/misc/nanozip.c <SOURCE_DIR>/archival/nanozip.c &&
  ${CMAKE_COMMAND} -E copy
  ${MINIZ_SOURCE_DIR}/miniz.c <SOURCE_DIR>/archival/miniz.c &&
  ${CMAKE_COMMAND} -E copy
  ${MINIZ_SOURCE_DIR}/miniz.h <SOURCE_DIR>/archival/miniz.h &&
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_SOURCE_DIR}/src/misc/.config <SOURCE_DIR>/.config &&
  ${CMAKE_COMMAND} -E make_directory <SOURCE_DIR>/arch/em &&
  ${CMAKE_COMMAND} -E copy
  ${CMAKE_CURRENT_SOURCE_DIR}/src/misc/Makefile <SOURCE_DIR>/arch/em/Makefile &&
  ${CMAKE_COMMAND} -E create_symlink ${EMCC_ROOT}/emcc.py ${CMAKE_CURRENT_BINARY_DIR}/emgcc
  BUILD_COMMAND ${CMAKE_COMMAND} -E env
  PATH=${CMAKE_CURRENT_BINARY_DIR}:$ENV{PATH}
  SRCDIR=${CMAKE_CURRENT_SOURCE_DIR}/src/misc
  ${EMCC_ROOT}/emmake make ARCH=em CROSS_COMPILE=em SKIP_STRIP=y &&
  ${CMAKE_COMMAND} -E copy
  <SOURCE_DIR>/busybox_unstripped.js ${CMAKE_CURRENT_BINARY_DIR}/busybox_unstripped.js &&
  ${CMAKE_COMMAND} -E copy
  <SOURCE_DIR>/busybox_unstripped.wasm ${CMAKE_CURRENT_BINARY_DIR}/busybox_unstripped.wasm
  INSTALL_COMMAND ""
  EXCLUDE_FROM_ALL FALSE
  BUILD_IN_SOURCE TRUE
)

add_link_options(
  -sNODERAWFS=1
  -sEXIT_RUNTIME=1
  -sUSE_PTHREADS=1
  -sFORCE_FILESYSTEM=1
  -sPROXY_TO_PTHREAD=1
  -sPTHREAD_POOL_SIZE=4
  -sALLOW_MEMORY_GROWTH=1
)

add_compile_options(-pthread)

add_library(quickjs STATIC
  src/quickjs/quickjs.c
  src/quickjs/libbf.c
  src/quickjs/libregexp.c
  src/quickjs/libunicode.c
  src/quickjs/cutils.c
)
target_compile_options(quickjs PRIVATE -Wno-implicit-const-int-float-conversion)

add_executable(drop
  src/main.c
  src/builtins.c
  src/builtins_io.c
  src/builtins_crypto.c
  src/misc/tlse.c
)

target_link_libraries(drop PRIVATE quickjs)
target_compile_definitions(drop PRIVATE -DPATH_MAX=4096 -DTLS_AMALGAMATION)
target_link_options(drop PRIVATE -Wno-pthreads-mem-growth)
