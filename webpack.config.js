const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";
const outDirectory = path.resolve(__dirname, "dist");

const config = {
  devtool: false,
  entry: "./src/npm/lib.js",
  output: {
    path: outDirectory,
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
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: "build",
          from: "*.wasm",
          to: outDirectory,
        },
        {
          context: "src/npm",
          from: "bin.js",
          to: outDirectory,
        },
        { from: "README.md", to: outDirectory },
        { from: "LICENSE", to: outDirectory },
        {
          from: "package.json",
          to: path.join(outDirectory, "package.json"),
          transform: (content) => {
            const packageJson = JSON.parse(content);
            packageJson.bin = "./bin.js";
            packageJson.main = "./lib.js";
            delete packageJson.devDependencies;
            delete packageJson.scripts;
            return JSON.stringify(packageJson, null, 2);
          },
        },
      ],
    }),
  ],
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
