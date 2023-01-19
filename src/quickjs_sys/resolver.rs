use flate2::bufread::GzDecoder;
use lazy_static::lazy_static;
use std::io::Read;
use tar::Archive;

mod embedded_modules;

lazy_static! {
    static ref EMBEDDED_MODULES: &'static [u8] = include_bytes!("../../modules.tar.gz");
}

pub fn resolve(module_name: &str) -> Option<String> {
    let mut path = std::path::PathBuf::from(module_name);
    let ext = path
        .extension()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default();
    match ext {
        "" => {
            path.set_extension("js");
            return Some(path.to_str().unwrap().to_string());
        }
        "js" => Some(path.to_str().unwrap().to_string()),
        _ => {
            return None;
        }
    }
}

pub fn require(module_name: &str) -> Option<Vec<u8>> {
    let path = resolve(module_name);
    if path.is_none() {
        return None;
    }
    let code = if is_embedded_module(module_name) {
        let path = std::path::PathBuf::from("modules").join(path.unwrap());
        read_embedded_module(&path)
    } else {
        std::fs::read(path.unwrap())
    };
    if code.is_err() {
        return None;
    }
    Some(code.unwrap())
}

fn is_embedded_module(module_name_or_path: &str) -> bool {
    let resolved = resolve(module_name_or_path).unwrap_or("".to_string());
    embedded_modules::EMBEDDED_MODULES
        .iter()
        .any(|name| module_name_or_path == *name || resolved == *name)
}

fn read_embedded_module(path: &std::path::PathBuf) -> Result<Vec<u8>, std::io::Error> {
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
    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        format!("could not load embedded module: {}", path.to_str().unwrap()),
    ))
}
