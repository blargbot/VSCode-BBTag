import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { Server } from './server';
import * as fs from 'fs';
import path = require('path');

const connection = createConnection(ProposedFeatures.all);
export const server = new Server(connection);
for (const file of fs.readdirSync(path.join(__dirname, 'plugins'))) {
	if (path.extname(file) !== '.js')
		continue;

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(path.join(__dirname, 'plugins', file));
	if (typeof module === 'object' && module !== null && typeof module['init'] === 'function')
		module.init(server);
}
connection.listen();
