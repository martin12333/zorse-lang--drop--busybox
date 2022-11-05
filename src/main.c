#include "builtins.h"

void on_error(const char *filename, const char *msg)
{
  log_log(5, filename, 0, msg);
  exit(-1);
}

int main(int argc, char *argv[], char *envp[])
{
  struct doops_loop *main_loop = loop_new();
  loop_io_wait(main_loop, 0);

  JS_CONTEXT ctx = JS_CreateContext(on_error);
  register_builtins(main_loop, ctx, argc, argv, envp);

  JS_Eval_File(ctx, "::code");

  loop_run(main_loop);

  JS_DestroyContext(ctx);

  loop_free(main_loop);

  js_deinit();

  return 0;
}
