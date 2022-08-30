//@ts-check
/* eslint-disable @typescript-eslint/no-var-requires */

'use strict';

const withDefaults = require('../shared.webpack.config');
const path = require('path');

module.exports = withDefaults({
	context: path.join(__dirname),
	entry: {
		extension: './src/start.ts',
	},
	resolve: {
		symlinks: false
	},
	output: {
		filename: 'start.js',
		path: path.join(__dirname, 'out')
	}
});