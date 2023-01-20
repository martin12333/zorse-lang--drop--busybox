use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs::File;

fn main() {
    println!("cargo:rerun-if-changed=src/quickjs");
    println!("cargo:rerun-if-changed=src/modules_js");
    println!("cargo:rerun-if-changed=build/libquickjs.a");

    println!("cargo:rustc-link-search=native=build");
    println!("cargo:rustc-link-lib=quickjs");

    let tar_gz = File::create("modules.tar.gz").unwrap();
    let enc = GzEncoder::new(tar_gz, Compression::default());
    let mut tar = tar::Builder::new(enc);
    tar.append_dir_all("modules", "./src/modules_js").unwrap();
}
