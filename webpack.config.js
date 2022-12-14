const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const OUT_DIR = path.resolve(__dirname, "dist");

/** @type {webpack.Configuration} */
const config = {
  devtool: false,
  mode: "production",
  entry: "./src/npm/lib.js",
  output: {
    path: OUT_DIR,
    library: {
      commonjs: "drop",
      amd: "drop",
      root: "DROP",
    },
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`,
    filename: "lib.js",
  },
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
  optimization: {
    nodeEnv: false,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
  externals: {
    fs: "fs",
    path: "path",
    crypto: "crypto",
    bufferExt: "buffer",
    consoleExt: "console",
    processExt: "process",
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: require.resolve("./src/npm/process.js"),
      console: "consoleExt",
      Buffer: ["bufferExt", "Buffer"],
    }),
    new CopyPlugin({
      patterns: [
        {
          context: "src/npm",
          from: "bin.js",
          to: OUT_DIR,
        },
        {
          context: "src/npm",
          from: "lib.d.ts",
          to: path.join(OUT_DIR, "index.d.ts"),
        },
        { from: "README.md", to: OUT_DIR },
        { from: "LICENSE", to: OUT_DIR },
        {
          from: "package.json",
          to: path.join(OUT_DIR, "package.json"),
          transform: (content) => {
            const packageJson = JSON.parse(content);
            packageJson.bin = "./bin.js";
            packageJson.main = "./lib.js";
            packageJson.types = "./index.d.ts";
            delete packageJson.devDependencies;
            delete packageJson.scripts;
            return JSON.stringify(packageJson, null, 2);
          },
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: [require.resolve("./out/web/dropbox.js"), require.resolve("./out/web/busybox.js")],
        loader: "string-replace-loader",
        options: {
          multiple: [
            {
              search: /if\s?\(e instanceof ExitStatus\)\s?return;/g,
              replace:
                "if (e instanceof ExitStatus || (e instanceof WebAssembly.RuntimeError && e.message === 'unreachable')) return;",
            },
          ],
        },
      },
    ],
  },
};

module.exports = config;
