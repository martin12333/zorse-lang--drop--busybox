use flate2::bufread::GzDecoder;
use lazy_static::lazy_static;
use std::io::Read;
use tar::Archive;

lazy_static! {
    static ref EMBEDDED_MODULES: &'static [u8] = include_bytes!("../../modules.tar.gz");
}

pub fn get_embedded_module(path: &std::path::PathBuf) -> Result<Vec<u8>, std::io::Error> {
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
        format!("Module Not Found: {}", path.to_str().unwrap()),
    ))
}
