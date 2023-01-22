import TerserPlugin from "terser-webpack-plugin";
import path from "path";
import webpack from "webpack";

const ALL_PACKAGES = ["crypto", "memfs", "zlib", "uvu", "chai"];

const createConfig = (name) => {
	/** @type {webpack.Configuration} */
	const cryptoConfig = {
		mode: "production",
		entry: `./src/modules_js/${name}.js.in`,
		devtool: false,
		target: "web",
		experiments: {
			outputModule: true,
		},
		output: {
			path: path.resolve("src/modules_js"),
			filename: `${name}.js`,
			library: {
				type: "module",
			},
		},
		externals: {
			"safer-buffer": "buffer",
			"safe-buffer": "buffer",
			...[
				"assert",
				"buffer",
				"events",
				"fs",
				"os",
				"path",
				"process",
				"punycode",
				"querystring",
				"readline",
				"stream",
				"string_decoder",
				"timers",
				"tty",
				"url",
				"util",
			]
				.concat(ALL_PACKAGES.filter((p) => p !== name))
				.reduce((acc, curr) => ((acc[curr] = curr), acc), {}),
		},
		performance: {
			hints: false,
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
		plugins: [
			new webpack.ProgressPlugin(),
			new webpack.ProvidePlugin({
				Buffer: ["buffer", "Buffer"],
				process: "process",
			}),
		],
		resolve: {
			extensions: [".js", ".js.in"],
			fallback: {
				"safer-buffer": "buffer",
				"safe-buffer": "buffer",
				child_process: false,
				net: false,
			},
		},
	};
	return cryptoConfig;
};

export default ALL_PACKAGES.map(createConfig);
