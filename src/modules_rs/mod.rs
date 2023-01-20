pub mod core;
pub mod encoding;
pub mod fs;
pub mod os;
pub mod sys;
pub mod tty;

#[doc(hidden)]
pub fn __macro_private_name_of_function<T>(_: T) -> &'static str {
    let name = std::any::type_name::<T>();
    match &name[..name.len() - 3].rfind(':') {
        Some(pos) => &name[pos + 1..name.len() - 3],
        None => &name[..name.len() - 3],
    }
}

#[macro_export]
macro_rules! add_function_export {
    ($ctx:ident, $m:ident, $func:ident) => {{
        let f = $ctx.wrap_function(
            crate::modules_rs::__macro_private_name_of_function($func),
            $func,
        );
        $m.add_export(
            format!(
                "{}\0",
                crate::modules_rs::__macro_private_name_of_function($func)
            ),
            f.into(),
        );
    }};
}

#[macro_export]
macro_rules! register_rs_module {
    ($name:literal, $ctx:ident, $provider:ident, $exports:expr) => {{
        $ctx.register_module(
            format!("{}\0", $name),
            $provider,
            &$exports
                .iter()
                .map(|s| {
                    format!(
                        "{}\0",
                        crate::modules_rs::__macro_private_name_of_function(s)
                    )
                })
                .collect::<Vec<String>>()
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<&str>>()
                .as_slice(),
        );
    }};
}
