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
use swc_ecma_transforms_base::resolver;
use swc_ecma_transforms_module::common_js::{self, common_js};
use swc_ecma_transforms_react::react;
use swc_ecma_transforms_react::Options;
use swc_ecma_transforms_typescript::strip;
use swc_ecma_visit::swc_ecma_ast::EsVersion;
use swc_ecma_visit::swc_ecma_ast::Module;
use swc_ecma_visit::Fold;
use swc_ecma_visit::FoldWith;

lazy_static! {
    static ref PRAGMA_REGEX: Regex = Regex::new(r"@jsx\s+([^\s]+)").unwrap();
}

pub enum InputType {
    TypeScript,
    TSX,
}

#[allow(non_upper_case_globals)]
impl InputType {
    pub const JavaScript: InputType = InputType::TypeScript;
    pub const JSX: InputType = InputType::TSX;
}

pub enum OutputType {
    CommonJS,
    ESModule,
}

pub struct TranspilerConfig {
    pub input_type: InputType,
    pub output_type: OutputType,
}

fn typescript_to_commonjs_transform() -> impl Fold {
    let unresolved_mark = Mark::new();
    let top_level_mark = Mark::new();
    chain!(
        resolver(unresolved_mark, top_level_mark, true),
        common_js::<SingleThreadedComments>(
            unresolved_mark,
            Default::default(),
            FeatureFlag::default(),
            None
        ),
        strip(top_level_mark),
        hygiene(),
        fixer(None),
    )
}

fn typescript_to_esmodule_transform() -> impl Fold {
    let unresolved_mark = Mark::new();
    let top_level_mark = Mark::new();
    chain!(
        resolver(unresolved_mark, top_level_mark, true),
        strip(top_level_mark),
        hygiene(),
        fixer(None),
    )
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

pub struct TypeScript;

impl TypeScript {
    /// Compiles TypeScript code into JavaScript.
    pub fn compile(filename: Option<&str>, source: &str, output: &OutputType) -> Result<String> {
        let globals = Globals::default();
        let cm: Lrc<SourceMap> = Default::default();
        let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(cm.clone()));

        let filename = match filename {
            Some(filename) => FileName::Custom(filename.into()),
            None => FileName::Anon,
        };

        let fm = cm.new_source_file(filename, source.into());

        // Initialize the TypeScript lexer.
        let lexer = Lexer::new(
            Syntax::Typescript(TsConfig {
                tsx: true,
                decorators: true,
                no_early_errors: true,
                ..Default::default()
            }),
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);

        let module = match parser
            .parse_module()
            .map_err(|e| e.into_diagnostic(&handler).emit())
        {
            Ok(module) => module,
            Err(_) => bail!("TypeScript compilation failed."),
        };

        // This is where we're gonna store the JavaScript output.
        let mut buffer = vec![];

        GLOBALS.set(&globals, || {
            let helpers = Helpers::new(false);
            HELPERS.set(&helpers, || {
                let module = match output {
                    OutputType::CommonJS => {
                        module.fold_with(&mut typescript_to_commonjs_transform())
                    }
                    OutputType::ESModule => {
                        module.fold_with(&mut typescript_to_esmodule_transform())
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

        Ok(String::from_utf8_lossy(&buffer).to_string())
    }
}

pub struct TSX;

impl TSX {
    /// Compiles JSX code into JavaScript.
    pub fn compile(filename: Option<&str>, source: &str, output: &OutputType) -> Result<String> {
        let globals = Globals::default();
        let cm: Lrc<SourceMap> = Default::default();
        let handler = Handler::with_tty_emitter(ColorConfig::Auto, true, false, Some(cm.clone()));

        let filename = match filename {
            Some(filename) => FileName::Custom(filename.into()),
            None => FileName::Anon,
        };

        let fm = cm.new_source_file(filename, source.into());

        // NOTE: We're using a TypeScript lexer to parse JSX because it's a super-set
        // of JavaScript and we also want to support .tsx files.

        let lexer = Lexer::new(
            Syntax::Typescript(TsConfig {
                tsx: true,
                decorators: true,
                no_early_errors: true,
                ..Default::default()
            }),
            Default::default(),
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

        // This is where we're gonna store the JavaScript output.
        let mut buffer = vec![];

        // Look for the JSX pragma in the source code.
        // https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/

        let pragma = PRAGMA_REGEX
            .find_iter(source)
            .next()
            .map(|m| m.as_str().to_string().replace("@jsx ", ""));

        GLOBALS.set(&globals, || {
            let helpers = Helpers::new(false);
            HELPERS.set(&helpers, || {
                // Apply SWC transforms to given code.
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

        Ok(String::from_utf8_lossy(&buffer).to_string())
    }
}
