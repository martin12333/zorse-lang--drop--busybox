cmake_minimum_required(VERSION 3.12 FATAL_ERROR)
project(drop)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

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
