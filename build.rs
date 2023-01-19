use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs::File;

fn main() {
    // get a list of embedded modules with "find modules -name '*.js'"
    let embedded_modules = std::process::Command::new("find")
        .arg("modules")
        .arg("-name")
        .arg("*.js")
        .output()
        .expect("failed to execute process");
    // remove "modules/" from the beginning of each line
    let embedded_modules = String::from_utf8(embedded_modules.stdout).unwrap();
    let embedded_modules = embedded_modules
        .lines()
        .map(|s| s.trim_start_matches("modules/"))
        .collect::<Vec<&str>>();
    // modules that don't have "/" are top level. remove their ".js" extension and add them
    let embedded_modules = embedded_modules
        .iter()
        .map(|s| {
            if s.contains("/") {
                s
            } else {
                s.trim_end_matches(".js")
            }
        })
        .collect::<Vec<&str>>();
    // save this as a Rust array
    let embedded_modules = format!(
        "pub static EMBEDDED_MODULES: [&str; {}] = {:?};",
        embedded_modules.len(),
        embedded_modules
    );
    std::fs::create_dir_all("src/quickjs_sys/resolver").unwrap();
    std::fs::write(
        "src/quickjs_sys/resolver/embedded_modules.rs",
        embedded_modules,
    )
    .unwrap();
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
