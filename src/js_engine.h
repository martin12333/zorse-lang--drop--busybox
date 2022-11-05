#ifndef JS_ENGINE_H
#define JS_ENGINE_H

#include "quickjs/quickjs.h"

#define JS_CONTEXT JSContext *

extern void *js_error_callback;
static inline JS_CONTEXT JS_CreateContext(void *on_error)
{
  JSRuntime *rt = JS_NewRuntime();
  js_error_callback = on_error;
  return JS_NewContext(rt);
}

#define JS_DestroyContext(ctx)                             \
  {                                                        \
    JSValue *opaque = (JSValue *)JS_GetContextOpaque(ctx); \
    if (opaque)                                            \
    {                                                      \
      JS_FreeValue(ctx, *opaque);                          \
      js_free(ctx, opaque);                                \
      JS_SetContextOpaque(ctx, NULL);                      \
    }                                                      \
    JSRuntime *rt = JS_GetRuntime(ctx);                    \
    JS_FreeContext(ctx);                                   \
    JS_FreeRuntime(rt);                                    \
  }
#define JS_EvalSimple(ctx, str) JS_EvalSimplePath(ctx, str, "none")
#define JS_EvalSimplePath(ctx, str, path)                                             \
  {                                                                                   \
    js_object_type val = (JS_Eval)(ctx, str, strlen(str), path, JS_EVAL_TYPE_GLOBAL); \
    if (JS_IsException(val))                                                          \
    {                                                                                 \
      js_std_dump_error(ctx);                                                         \
    }                                                                                 \
    JS_FreeValueCheckException(ctx, val);                                             \
  }
#define JS_Eval(ctx, str, path)                                                       \
  {                                                                                   \
    js_object_type val = (JS_Eval)(ctx, str, strlen(str), path, JS_EVAL_TYPE_MODULE); \
    if (JS_IsException(val))                                                          \
    {                                                                                 \
      js_std_dump_error(ctx);                                                         \
    }                                                                                 \
    JS_FreeValueCheckException(ctx, val);                                             \
  }

#define JS_Eval_File(ctx, filename) duk_run_file((ctx), filename)

#define JS_ParameterNumber(ctx, index)                                     \
  if ((index >= argc) || (!JS_IsNumber(argv[(index)])))                    \
  {                                                                        \
    JS_ThrowTypeError(ctx, "Number expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                   \
  }
#define JS_ParameterBoolean(ctx, index)                                           \
  if ((index >= argc) || (!JS_IsBool(argv[(index)])))                             \
  {                                                                               \
    JS_ThrowTypeError(ctx, "Boolean value expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                          \
  }
#define JS_ParameterString(ctx, index)                                     \
  if ((index >= argc) || (!JS_IsString(argv[(index)])))                    \
  {                                                                        \
    JS_ThrowTypeError(ctx, "String expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                   \
  }
#define JS_ParameterFunction(ctx, index)                                     \
  if ((index >= argc) || (!JS_IsFunction((ctx), argv[(index)])))             \
  {                                                                          \
    JS_ThrowTypeError(ctx, "Function expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                     \
  }
#define JS_ParameterObject(ctx, index)                                     \
  if ((index >= argc) || (!JS_IsObject(argv[(index)])))                    \
  {                                                                        \
    JS_ThrowTypeError(ctx, "Object expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                   \
  }
#define JS_ParameterPointer(ctx, index)                                    \
  if ((index >= argc) || (!JS_IsNumber(argv[(index)])))                    \
  {                                                                        \
    JS_ThrowTypeError(ctx, "Handle expected in parameter %i", (int)index); \
    return JS_EXCEPTION;                                                   \
  }
#define JS_ParameterCount(ctx) argc

#define JS_FreeString(ctx, str) JS_FreeCString(ctx, str)

#define JS_GetNumberParameter(ctx, index) _JS_GetNumberParameter((ctx), argv[(index)])
#define JS_GetIntParameter(ctx, index) _JS_GetIntParameter((ctx), argv[(index)])
#define JS_GetBooleanParameter(ctx, index) _JS_GetBooleanParameter((ctx), argv[(index)])
#define JS_GetStringParameter(ctx, index) JS_ToCString((ctx), argv[(index)])
#define JS_GetStringParameterLen(ctx, index, len) JS_ToCStringLen((ctx), (len), argv[(index)])
#define JS_GetAsStringParameter(ctx, index) JS_GetStringParameter(ctx, index)
#define JS_GetAsStringParameterLen(ctx, index, len) JS_GetStringParameterLen(ctx, index, len)
#define JS_GetPointerParameter(ctx, index) _JS_GetPointerParameter((ctx), argv[(index)])
#define JS_GetBufferParameter(ctx, index, sz) _JS_GetArrayBuffer((ctx), (sz), argv[(index)])
#define JS_GetObjectParameter(ctx, index) argv[(index)]

#define JS_ObjectSetNumber(ctx, obj, mem, val) JS_SetPropertyStr((ctx), (obj), (mem), JS_NewFloat64((ctx), (val)))
#define JS_ObjectSetString(ctx, obj, mem, val) JS_SetPropertyStr((ctx), (obj), (mem), JS_NewString((ctx), (val)))
#define JS_ObjectSetStringLen(ctx, obj, mem, val, len) JS_SetPropertyStr((ctx), (obj), (mem), JS_NewStringLen((ctx), (val), (len)))
#define JS_ObjectSetStringLenLen(ctx, obj, mem, lm, val, lv) _JS_ObjectSetStringLenLen((ctx), (obj), (mem), (lm), (val), (lv))
#define JS_ObjectSetPointer(ctx, obj, mem, val) JS_SetPropertyStr((ctx), (obj), (mem), JS_NewBigUint64((ctx), (uint64_t)(val)))
#define JS_ObjectSetObject(ctx, obj, mem, obj_id) JS_SetPropertyStr((ctx), (obj), (mem), (obj_id))
#define JS_ObjectSetFunction(ctx, obj, mem, f, len) JS_SetPropertyStr((ctx), (obj), (mem), JS_NewCFunction((ctx), (f), (mem), (len)))
#define JS_ObjectSetBoolean(ctx, obj, mem, val) JS_SetPropertyStr((ctx), (obj), (mem), (val) ? JS_TRUE : JS_FALSE)
#define JS_ObjectSetNull(ctx, obj, mem) JS_SetPropertyStr((ctx), (obj), (mem), JS_NULL)
#define JS_ObjectSetUndefined(ctx, obj, mem) JS_SetPropertyStr((ctx), (obj), (mem), JS_UNDEFINED)

#define JS_HIDDEN_SYMBOL(str) ("\xFF" str)
#define JS_VARARGS 0

#define js_object_type JSValue
#define js_size_t size_t
#define js_uint_t unsigned int

#define JS_Error(ctx, text)                                  \
  {                                                          \
    js_object_type exc = JS_ThrowTypeError(ctx, "%s", text); \
    js_std_dump_error(ctx);                                  \
    JS_FreeValue(ctx, exc);                                  \
  }

#define js_c_function JSCFunction *
#define JS_C_FUNCTION(name) static JSValue name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
#define JS_C_FUNCTION_FORWARD(name, ...) static JSValue name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, __VA_ARGS__)
#define JS_C_FORWARD_PARAMETERS ctx, this_val, argc, argv

#define JS_RETURN_NUMBER(ctx, val) return JS_NewFloat64((ctx), (val))
#define JS_RETURN_BOOLEAN(ctx, val) return ((val) ? JS_TRUE : JS_FALSE)
#define JS_RETURN_STRING(ctx, val) return JS_NewString((ctx), (val))
#define JS_RETURN_STRING_FREE(ctx, val)       \
  {                                           \
    JSValue ret = JS_NewString((ctx), (val)); \
    free((val));                              \
    return (ret);                             \
  }
#define JS_RETURN_POINTER(ctx, val) return JS_NewBigUint64((ctx), (uintptr_t)(val))
#define JS_RETURN_NULL(ctx) return JS_NULL
#define JS_RETURN_UNDEFINED(ctx) return JS_UNDEFINED
#define JS_RETURN_BUFFER(ctx, val, len) return JS_NewArrayBufferCopy((ctx), (const uint8_t *)(val), (size_t)(len))
#define JS_RETURN_BUFFER_FREE_VAL(ctx, val, len)                                       \
  {                                                                                    \
    JSValue ret = JS_NewArrayBufferCopy((ctx), (const uint8_t *)(val), (size_t)(len)); \
    free((val));                                                                       \
    return (ret);                                                                      \
  }
#define JS_RETURN_NOTHING(ctx) return JS_UNDEFINED
#define JS_RETURN_OBJECT(ctx, obj) return (obj)

#define JS_NewClassObject(ctx, class_name) _JS_NewClassObject((ctx), (class_name))
#define JS_NewPlainObject(ctx) JS_NewObject((ctx))

static inline int _JS_GetIntParameter(JS_CONTEXT ctx, JSValueConst v)
{
  int32_t val = 0;
  if (JS_ToInt32(ctx, &val, v))
    JS_ThrowTypeError(ctx, "Number expected");
  return val;
}

static inline double _JS_GetNumberParameter(JS_CONTEXT ctx, JSValueConst v)
{
  double val = 0;
  if (JS_ToFloat64(ctx, &val, v))
    JS_ThrowTypeError(ctx, "Number expected");
  return val;
}

static inline int _JS_GetBooleanParameter(JS_CONTEXT ctx, JSValueConst v)
{
  int val = JS_ToBool(ctx, v);
  if (val == -1)
    JS_ThrowTypeError(ctx, "Boolean expected");
  return val;
}

static inline void *_JS_GetPointerParameter(JS_CONTEXT ctx, JSValueConst v)
{
  int64_t val = 0;
  if (JS_ToBigInt64(ctx, &val, v))
    JS_ThrowTypeError(ctx, "Handle expected");
  return (void *)(uintptr_t)val;
}

static inline void *_JS_GetArrayBuffer(JS_CONTEXT ctx, size_t *sz, JSValueConst v)
{
  void *buf = JS_GetArrayBuffer(ctx, sz, v);
  if (!buf)
  {
    size_t byte_offset = 0;
    size_t buf_size = 0;
    js_object_type obj = JS_GetTypedArrayBuffer(ctx, v, &byte_offset, sz, NULL);
    buf = (char *)JS_GetArrayBuffer(ctx, &buf_size, obj) + byte_offset;
    JS_FreeValue(ctx, obj);
  }
  return buf;
}

static inline void _JS_ObjectSetStringLenLen(JS_CONTEXT ctx, JSValue obj, const char *mem, int len_mem, const char *val, int len_val)
{
  char mem_buf[0x100];
  if (len_mem >= sizeof(mem_buf))
    len_mem = sizeof(mem_buf) - 1;

  if (len_mem < 0)
    return;

  memcpy(mem_buf, mem, len_mem);
  mem_buf[len_mem] = 0;
  JS_SetPropertyStr(ctx, obj, mem_buf, JS_NewStringLen(ctx, val, len_val));
}

void js_std_dump_error(JSContext *ctx);
static inline void JS_FreeValueCheckException(JS_CONTEXT ctx, JSValue val)
{
  if (JS_IsException(val))
    js_std_dump_error(ctx);
  JS_FreeValue(ctx, val);
}

static inline JSValue _JS_NewClassObject(JS_CONTEXT ctx, const char *class_name)
{
  JSValue obj = JS_NewObject(ctx);
  JSValue global_object = JS_GetGlobalObject(ctx);
  JSValue proto = JS_GetPropertyStr(ctx, global_object, class_name);
  JSValue prototype = JS_GetPropertyStr(ctx, proto, "prototype");
  JS_SetPrototype(ctx, obj, prototype);
  if (JS_IsFunction(ctx, proto))
    JS_FreeValueCheckException(ctx, JS_Call(ctx, proto, obj, 0, NULL));
  JS_FreeValue(ctx, prototype);
  JS_FreeValue(ctx, proto);
  JS_FreeValue(ctx, global_object);
  return obj;
}
#endif
