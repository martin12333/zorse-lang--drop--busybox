#![allow(dead_code, unused_imports, unused_must_use)]
#[macro_use]
extern crate lazy_static;

mod event_loop;
mod modules_rs;
pub mod quickjs_sys;

pub use event_loop::EventLoop;

pub use quickjs_sys::*;
