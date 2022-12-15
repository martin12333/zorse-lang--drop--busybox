module.exports =
  typeof window !== "undefined" || typeof postMessage !== "undefined"
    ? {
        on: () => {},
        env: {},
        argv: [],
        platform: "linux",
        exit(status) {
          // if (status !== 0) throw new Error(`exit code: ${status}`);
          // in browser we don't want to exit...
        },
        binding(name) {
          if (name === "constants") return require("constants-browserify");
          throw new Error(`process.binding("${name}") is not supported`);
        },
      }
    : require("processExt");
