use crate::quickjs_sys::*;
use crate::resolver;

fn resolve(ctx: &mut Context, _this_val: JsValue, argv: &[JsValue]) -> JsValue {
    let path = argv.get(0);
    if let Some(JsValue::String(path)) = path {
        let path = path.to_string();
        let path = resolver::resolve(&path).expect("sys: invalid resolve path");
        ctx.new_string(path.as_str()).into()
    } else {
        JsValue::UnDefined
    }
}
fn require(ctx: &mut Context, _this_val: JsValue, argv: &[JsValue]) -> JsValue {
    let path = argv.get(0);
    if let Some(JsValue::String(path)) = path {
        let path = path.to_string();
        let code = resolver::require(&path).expect("sys: invalid require path");
        let code = String::from_utf8(code).expect("invalid require content encoding");
        ctx.new_string(code.as_str()).into()
    } else {
        JsValue::UnDefined
    }
}
fn import(ctx: &mut Context, _this_val: JsValue, argv: &[JsValue]) -> JsValue {
    let path = argv.get(0);
    if let Some(JsValue::String(path)) = path {
        let path = path.to_string();
        let code = resolver::import(&path).expect("sys: invalid import path");
        let code = String::from_utf8(code).expect("invalid import content encoding");
        ctx.new_string(code.as_str()).into()
    } else {
        JsValue::UnDefined
    }
}

struct SYS;

impl ModuleInit for SYS {
    fn init_module(ctx: &mut Context, m: &mut JsModuleDef) {
        crate::add_function_export!(ctx, m, resolve);
        crate::add_function_export!(ctx, m, require);
        crate::add_function_export!(ctx, m, import);
    }
}

pub fn init_module(ctx: &mut Context) {
    crate::register_rs_module!("_drop:sys", ctx, SYS, [resolve, require, import]);
}
