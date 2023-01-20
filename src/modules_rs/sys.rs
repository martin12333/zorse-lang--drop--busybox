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
        let f = ctx.wrap_function("resolve", resolve);
        m.add_export("resolve\0", f.into());
        let f = ctx.wrap_function("require", require);
        m.add_export("require\0", f.into());
        let f = ctx.wrap_function("import", import);
        m.add_export("import\0", f.into());
    }
}

pub fn init_module(ctx: &mut Context) {
    ctx.register_module("_drop:sys\0", SYS, &["resolve\0", "require\0", "import\0"])
}
