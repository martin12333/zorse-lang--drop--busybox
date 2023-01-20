#![allow(dead_code, unused_imports, unused_must_use)]

use drop::{quickjs_sys::resolver, quickjs_sys::transpiler, Runtime, *};

fn args_parse() -> (String, Vec<String>) {
    use argparse::ArgumentParser;
    let mut file_path = String::new();
    let mut rest_args: Vec<String> = vec![];
    {
        let mut arg_parser = ArgumentParser::new();
        arg_parser
            .refer(&mut file_path)
            .add_argument(
                "file",
                argparse::Store,
                "input script (*.[cm][ts|js][x] or *.zrc)",
            )
            .required();
        arg_parser.refer(&mut rest_args).add_argument(
            "args",
            argparse::List,
            "additional arguments for runtime",
        );
        arg_parser.parse_args_or_exit();
    }
    (file_path, rest_args)
}

fn main() {
    let mut rt = Runtime::new();
    rt.run_with_context(|ctx| {
        let (file_path, mut rest_arg) = args_parse();
        let entrypoint =
            resolver::import(&file_path).expect(format!("file not found: {}", &file_path).as_str());
        let code = String::from_utf8(entrypoint)
            .expect(format!("invalid format: {}", &file_path).as_str());
        rest_arg.insert(0, file_path.clone());
        ctx.put_args(rest_arg);
        ctx.js_loop().unwrap();
        let make_require_global = r#"
        ;(async () => {
            const { require } = await import("commonjs");
            globalThis.require = require;
        })();
        "#;
        ctx.eval_global_str(make_require_global.to_owned());
        ctx.promise_loop_poll();
        ctx.eval_module_str(code, &file_path);
        ctx.js_loop().unwrap();
    });
}
