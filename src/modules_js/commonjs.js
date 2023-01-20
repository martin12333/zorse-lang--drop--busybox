// adopted from: https://github.com/IvanGaravito/quickjs-require

import * as sys from "_drop:sys";

import assert from "assert";
import path from "path";

const modules = {};

class CJSModule {
  constructor(id) {
    this.id = id;
    this._failed = null;
    this._loaded = false;
    this.exports = {};
  }

  load() {
    const __file = this.id;
    const __dir = path.basename(this.id);
    const _require = require;

    let ctx = {
      exports: {},
      __drop: {
        __filename: __file,
        __dirname: __dir,
        __require: _require,
      },
    };

    // Prevents modules from changing exports
    Object.seal(ctx);

    const _mark = "@";
    let _loaderTemplate = `(function _loader (exports, require, module, __filename, __dirname) {${_mark}})(ctx.exports, _require, ctx, __file, __dir)`;

    let _script = sys.require(__file);
    assert.ok(typeof _script === "string" && _script.length > 0);

    _script = _loaderTemplate.replace(_mark, _script);
    eval(_script);

    this.exports = ctx.exports;
    this._loaded = true;
    return true;
  }
}

function _loadModule(fullPath) {
  if ([fullPath] in modules) {
    return modules[fullPath];
  }

  let _module = new CJSModule(fullPath);
  modules[fullPath] = _module;

  let _result = _module.load();
  assert.ok(_result === true);
  return _module;
}

function _lookupModule(p) {
  return sys.resolve(p);
}

export function require(path) {
  let _fullPath = _lookupModule(path);
  let _module = _loadModule(_fullPath);
  return _module.exports;
}
