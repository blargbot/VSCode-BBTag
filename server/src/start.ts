import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { Server } from './server';

const connection = createConnection(ProposedFeatures.all);
export const server = new Server(connection);
function* loadAll<T>(require: __WebpackModuleApi.RequireContext, filter: (module: unknown) => module is T): Generator<T> {
	for (const name of require.keys()) {
		const module = require(name);
		if (filter(module))
			yield module;
	}
}

function isPlugin(module: unknown): module is { init(server: Server): void } {
	return typeof module === 'object'
		&& module !== null
		&& typeof (module as Record<PropertyKey, unknown>)['init'] === 'function';
}

for (const plugin of loadAll(require.context('./plugins/', true, /\.ts$/), isPlugin))
	plugin.init(server);

connection.listen();
