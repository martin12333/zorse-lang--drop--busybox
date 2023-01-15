use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs::File;
use std::path::Path;

fn main() {
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let out_dir_path = Path::new(&out_dir);
    std::fs::copy("lib/libquickjs.a", out_dir_path.join("libquickjs.a"))
        .expect("Could not copy libquickjs.a to output directory");
    println!("cargo:rustc-link-search={}", &out_dir);
    println!("cargo:rustc-link-lib=quickjs");

    // rerun if any of the files in the "std" directory change
    println!("cargo:rerun-if-changed=std");

    // rerun if any of the files in the "modules" directory change
    println!("cargo:rerun-if-changed=modules");

    let tar_gz = File::create("modules.tar.gz").unwrap();
    let enc = GzEncoder::new(tar_gz, Compression::default());
    let mut tar = tar::Builder::new(enc);
    tar.append_dir_all("modules", "./modules").unwrap();
}
