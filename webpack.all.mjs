import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import { execSync } from "child_process";
import path from "path";
import webpack from "webpack";

// Build the BusyBox runtime with Emscripten (busybox)
execSync("bash build.sh", { stdio: "inherit" });

// Generate the bundled standard core modules (std)
execSync("npx webpack --config webpack.std.mjs", { stdio: "inherit" });

// Build the Drop runtime with Cargo (drop)
execSync("cargo build --release", { stdio: "inherit" });

const OUT_DIR = path.resolve("dist");
execSync(`rm -rf ${OUT_DIR}`);

/** @type {webpack.Configuration} */
const config = {
  devtool: false,
  mode: "production",
  entry: "./src/npm/index.ts",
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
    filename: "drop.js",
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
    wasi: "wasi",
    crypto: "crypto",
    bufferExt: "buffer",
    consoleExt: "console",
    processExt: "process",
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "index.d.ts", to: OUT_DIR, context: "src/npm" },
        { from: "bin.js", to: OUT_DIR, context: "src/npm" },
        { from: "README.md", to: OUT_DIR },
        { from: "LICENSE", to: OUT_DIR },
        {
          from: "package.json",
          to: path.join(OUT_DIR, "package.json"),
          transform: (content) => {
            const packageJson = JSON.parse(content);
            packageJson.bin = "./bin.js";
            packageJson.main = "./drop.js";
            packageJson.types = "./index.d.ts";
            delete packageJson.devDependencies;
            delete packageJson.scripts;
            return JSON.stringify(packageJson, null, 2);
          },
        },
      ],
    }),
    new webpack.ProvidePlugin({
      process: path.resolve("./src/npm/process.js"),
      console: "consoleExt",
      Buffer: ["bufferExt", "Buffer"],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /out\/web\/busybox\.js$/,
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
      {
        test: /\.wasm$/,
        loader: "url-loader",
        options: {
          mimetype: "delete/me",
          limit: 15 * 1024 * 1024,
          // this removes the "data:<whatever>;base64," from the output bundle
          generator: (content) => content.toString("base64"),
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
  },
};

export default config;
