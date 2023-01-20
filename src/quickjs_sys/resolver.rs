use crate::transpiler::{tsx_to_js_str, tsx_to_js_vec, OutputType};
use flate2::bufread::GzDecoder;
use lazy_static::lazy_static;
use std::fs;
use std::io::Read;
use std::io::{Error, ErrorKind};
use std::path::PathBuf;
use tar::Archive;

lazy_static! {
    static ref EMBEDDED_MODULES: &'static [u8] = include_bytes!("../../modules.tar.gz");
    static ref EMBEDDED_MODULES_LIST: Vec<String> = {
        let file_bytes = GzDecoder::new(&EMBEDDED_MODULES[..]);
        let mut archive = Archive::new(file_bytes);
        let mut file_list = Vec::new();
        for file in archive.entries().unwrap() {
            let file = file.unwrap();
            let path = file.path().unwrap();
            let path = path.strip_prefix("modules").unwrap().to_str().unwrap();
            file_list.push(path.to_string());
            if !path.contains("/") {
                file_list.push(path.replace(".js", ""));
            };
        }
        file_list
    };
}

pub fn resolve(module_name: &str) -> Result<String, Error> {
    let mut path = PathBuf::from(module_name);
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default();
    match ext {
        "" => {
            path.set_extension("js");
            Ok(path.to_str().unwrap().to_string())
        }
        "js" | "ts" | "tsx" | "jsx" | "cjs" | "mjs" | "cts" | "mts" | "zrc" => {
            Ok(path.to_str().unwrap().to_string())
        }
        _ => Err(Error::new(
            ErrorKind::InvalidInput,
            format!("invalid resolver extension: {}", ext),
        )),
    }
}

pub fn require(module_name: &str) -> Result<Vec<u8>, Error> {
    let path = resolve(module_name);
    if is_embedded_module(module_name) {
        let path = PathBuf::from("modules").join(path?);
        read_embedded_module(&path)
    } else {
        let buf = fs::read(path.unwrap());
        tsx_to_js_vec(
            Some(module_name),
            &String::from_utf8(buf.unwrap()).unwrap(),
            &OutputType::CommonJS,
        )
        .map_err(|e| Error::new(ErrorKind::Other, e))
    }
}

pub fn import(module_name: &str) -> Result<Vec<u8>, Error> {
    let path = resolve(module_name);
    if is_embedded_module(module_name) {
        let path = PathBuf::from("modules").join(path?);
        read_embedded_module(&path)
    } else {
        let buf = fs::read(path.unwrap());
        tsx_to_js_vec(
            Some(module_name),
            &String::from_utf8(buf.unwrap()).unwrap(),
            &OutputType::ESModule,
        )
        .map_err(|e| Error::new(ErrorKind::Other, e))
    }
}

fn is_embedded_module(module_name_or_path: &str) -> bool {
    let resolved = resolve(module_name_or_path).unwrap_or("".to_string());
    EMBEDDED_MODULES_LIST
        .iter()
        .any(|name| module_name_or_path == *name || resolved == *name)
}

fn read_embedded_module(path: &PathBuf) -> Result<Vec<u8>, Error> {
    let file_name = path.to_str().unwrap();
    let file_bytes = GzDecoder::new(&EMBEDDED_MODULES[..]);
    let mut archive = Archive::new(file_bytes);
    for file in archive.entries().unwrap() {
        let mut file = file.unwrap();
        let file_path = file.path().unwrap();
        if file_path.to_str().unwrap() == file_name {
            let mut content = Vec::new();
            file.read_to_end(&mut content)?;
            return Ok(content);
        }
    }
    Err(Error::new(
        ErrorKind::NotFound,
        format!("could not load embedded module: {}", path.to_str().unwrap()),
    ))
}
