// Base transpiler implementations are from:
// https://github.com/aalykiot/dune/blob/fc6a5b39c8606b12bcf196bd6f0f2c161e905e27/src/transpilers.rs

use anyhow::bail;
use anyhow::Result;
use lazy_static::lazy_static;
use regex::Regex;
use std::rc::Rc;
use swc_common::chain;
use swc_common::comments::SingleThreadedComments;
use swc_common::errors::ColorConfig;
use swc_common::errors::Handler;
use swc_common::sync::Lrc;
use swc_common::FileName;
use swc_common::Globals;
use swc_common::Mark;
use swc_common::SourceMap;
use swc_common::GLOBALS;
use swc_ecma_codegen::text_writer::JsWriter;
use swc_ecma_codegen::Emitter;
use swc_ecma_parser::lexer::Lexer;
use swc_ecma_parser::Parser;
use swc_ecma_parser::StringInput;
use swc_ecma_parser::Syntax;
use swc_ecma_parser::TsConfig;
use swc_ecma_transforms_base::feature::FeatureFlag;
use swc_ecma_transforms_base::fixer::fixer;
use swc_ecma_transforms_base::helpers::Helpers;
use swc_ecma_transforms_base::helpers::HELPERS;
use swc_ecma_transforms_base::hygiene::hygiene;
use swc_ecma_transforms_module::common_js::{self, common_js};
use swc_ecma_transforms_react::react;
use swc_ecma_transforms_react::Options;
use swc_ecma_transforms_typescript::strip;
use swc_ecma_visit::Fold;
use swc_ecma_visit::FoldWith;

lazy_static! {
    static ref PRAGMA_REGEX: Regex = Regex::new(r"@jsx\s+([^\s]+)").unwrap();
}

pub enum OutputType {
    CommonJS,
    ESModule,
}

fn tsx_to_commonjs_transform(cm: &Rc<SourceMap>, pragma: Option<String>) -> impl Fold {
    let unresolved_mark = Mark::new();
    let top_level_mark = Mark::new();
    chain!(
        common_js::<SingleThreadedComments>(
            unresolved_mark,
            Default::default(),
            FeatureFlag::default(),
            None
        ),
        react::<SingleThreadedComments>(
            cm.clone(),
            None,
            Options {
                pragma,
                ..Default::default()
            },
            top_level_mark,
        ),
        strip(top_level_mark),
        hygiene(),
        fixer(None),
    )
}

fn tsx_to_esmodule_transform(cm: &Rc<SourceMap>, pragma: Option<String>) -> impl Fold {
    let top_level_mark = Mark::new();
    chain!(
        react::<SingleThreadedComments>(
            cm.clone(),
            None,
            Options {
                pragma,
                ..Default::default()
            },
            top_level_mark,
        ),
        strip(top_level_mark),
        hygiene(),
        fixer(None),
    )
}

pub fn tsx_to_js_vec(filename: Option<&str>, source: &str, output: &OutputType) -> Result<Vec<u8>> {
    let globals = Globals::default();
    let cm: Lrc<SourceMap> = Default::default();
    let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(cm.clone()));

    let filename = match filename {
        Some(filename) => FileName::Custom(filename.into()),
        None => FileName::Anon,
    };

    let fm = cm.new_source_file(filename, source.into());

    let lexer = Lexer::new(
        Syntax::Typescript(TsConfig {
            tsx: true,
            decorators: true,
            no_early_errors: true,
            ..Default::default()
        }),
        swc_ecma_ast::EsVersion::latest(),
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);

    let module = match parser
        .parse_module()
        .map_err(|e| e.into_diagnostic(&handler).emit())
    {
        Ok(module) => module,
        Err(_) => bail!("JSX compilation failed."),
    };

    let mut buffer = vec![];

    let pragma = PRAGMA_REGEX
        .find_iter(source)
        .next()
        .map(|m| m.as_str().to_string().replace("@jsx ", ""));

    GLOBALS.set(&globals, || {
        let helpers = Helpers::new(false);
        HELPERS.set(&helpers, || {
            let module = match output {
                OutputType::CommonJS => {
                    module.fold_with(&mut tsx_to_commonjs_transform(&cm, pragma.clone()))
                }
                OutputType::ESModule => {
                    module.fold_with(&mut tsx_to_esmodule_transform(&cm, pragma.clone()))
                }
            };
            let mut emitter = Emitter {
                cfg: swc_ecma_codegen::Config {
                    minify: true,
                    ..swc_ecma_codegen::Config::default()
                },
                cm: cm.clone(),
                comments: None,
                wr: JsWriter::new(cm, "\n", &mut buffer, None),
            };
            emitter.emit_module(&module).unwrap();
        });
    });
    Ok(buffer)
}

pub fn tsx_to_js_str(filename: Option<&str>, source: &str, output: &OutputType) -> Result<String> {
    let r = tsx_to_js_vec(filename, source, output);
    match r {
        Ok(v) => Ok(String::from_utf8(v).unwrap()),
        Err(e) => Err(e),
    }
}
