#![allow(dead_code, unused_imports, unused_must_use)]

use drop::*;
use std::borrow::{Borrow, BorrowMut};
use transpiler::*;

mod transpiler;

fn args_parse() -> (String, Vec<String>) {
    use argparse::ArgumentParser;
    let mut file_path = String::new();
    let mut res_args: Vec<String> = vec![];
    {
        let mut ap = ArgumentParser::new();
        ap.refer(&mut file_path)
            .add_argument("file", argparse::Store, "js file")
            .required();
        ap.refer(&mut res_args)
            .add_argument("arg", argparse::List, "arg");
        ap.parse_args_or_exit();
    }
    (file_path, res_args)
}

fn maybe_transpile(file_path: &String) -> Result<String, Box<dyn std::error::Error>> {
    let ext = file_path.split('.').last().unwrap();
    match ext {
        "jsx" | "tsx" => {
            let code = std::fs::read_to_string(file_path)?;
            let code = TSX::compile(Some(file_path), &code, &transpiler::OutputType::ESModule)?;
            Ok(code)
        }
        "ts" => {
            let code = std::fs::read_to_string(file_path)?;
            let code =
                TypeScript::compile(Some(file_path), &code, &transpiler::OutputType::ESModule)?;
            Ok(code)
        }
        _ => {
            let code = std::fs::read_to_string(file_path)?;
            Ok(code)
        }
    }
}

fn main() {
    use drop as q;
    let mut rt = q::Runtime::new();
    rt.run_with_context(|ctx| {
        let (file_path, mut rest_arg) = args_parse();
        let code = maybe_transpile(&file_path);
        match code {
            Ok(code) => {
                rest_arg.insert(0, file_path.clone());
                ctx.put_args(rest_arg);
                ctx.eval_module_str(code, &file_path);
            }
            Err(e) => {
                eprintln!("{}", e.to_string());
            }
        }
        ctx.js_loop().unwrap();
    });
}
