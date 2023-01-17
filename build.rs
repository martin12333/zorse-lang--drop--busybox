use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs::File;

fn main() {
    // rerun if any of the files in the "src/quickjs" directory change
    println!("cargo:rerun-if-changed=src/quickjs");
    println!("cargo:rerun-if-changed=build/libquickjs.a");
    println!("cargo:rustc-link-search=native=build");
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
