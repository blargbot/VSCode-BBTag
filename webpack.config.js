//@ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/** @typedef {import('webpack').Configuration} WebpackConfig **/

'use strict';

module.exports = /**@type WebpackConfig*/ {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: 'node', // extensions run in a node context
	node: {
		__dirname: false // leave the __dirname-behaviour intact
	},
	resolve: {
		mainFields: ['module', 'main'],
		extensions: ['.ts', '.js'] // support ts-files and js-files
	},
	entry: {
		client: './src/client/start.ts',
		server: './src/server/start.ts'
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				// configure TypeScript loader:
				// * enable sources maps for end-to-end source maps
				loader: 'ts-loader',
				options: {
					compilerOptions: {
						"sourceMap": true,
					}
				}
			}]
		}]
	},
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
	output: {
		// all output goes into `dist`.
		// packaging depends on that and this must always be like it
		filename: '[name].js',
		path: __dirname + '/out',
		libraryTarget: "commonjs",
	},
	// yes, really source maps
	devtool: 'source-map'
};