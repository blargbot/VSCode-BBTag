import fetch from 'node-fetch';
import { DidChangeConfigurationNotification, DidChangeConfigurationParams, DocumentUri, InitializeParams, InitializeResult, ServerCapabilities, TextDocumentChangeEvent, TextDocuments, TextDocumentSyncKind, _Connection } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BBString } from './bbtag/BBString';
import { SubtagDetails } from './bbtag/SubtagDetails';
import { SubtagDetailsLookup } from './bbtag/SubtagDetailsLookup';
import { Cache } from './Cache';

export interface ServerConfiguration {
	readonly maxNumberOfProblems: number;
}

export class Server {
	public readonly connection: _Connection;
	public readonly documents: TextDocuments<TextDocument>;

	readonly #capabilities: ServerCapabilities;
	readonly #subtagCache: Cache<SubtagDetailsLookup>;
	readonly #bbtagCache: Map<DocumentUri, BBString> = new Map();
	readonly #documentConfig: Map<DocumentUri, Thenable<ServerConfiguration>> = new Map();
	#globalConfig: ServerConfiguration = {
		maxNumberOfProblems: 1000
	};
	#hasConfigurationCapability = false;
	#hasWorkspaceFolderCapability = false;
	#hasDiagnosticRelatedInformationCapability = false;

	public constructor(connection: _Connection) {
		this.connection = connection;
		this.documents = new TextDocuments(TextDocument);
		this.#capabilities = {};
		this.#subtagCache = new Cache<SubtagDetailsLookup>(async () => new SubtagDetailsLookup(await (await fetch('https://blargbot.xyz/api/subtags')).json()), 300000);

		this.connection.onInitialize(this.#initialize.bind(this));
		this.connection.onInitialized(this.#initialized.bind(this));
		this.connection.onDidChangeConfiguration(this.#refreshConfiguration.bind(this));
		this.documents.onDidClose(this.#clearDocumentSettings.bind(this));
		this.documents.onDidClose(this.#clearBBTagCache.bind(this));
		this.documents.onDidChangeContent(this.#clearBBTagCache.bind(this));
		this.documents.listen(this.connection);
	}

	public addCapability<K extends keyof ServerCapabilities>(type: K, value: Exclude<ServerCapabilities[K], null | undefined>): this {
		const current = this.#capabilities[type];
		if (current !== undefined && JSON.stringify(current) != JSON.stringify(value))
			throw new Error('Conflicting capabilities specified');

		this.#capabilities[type] = value;
		return this;
	}

	public getSubtags(): Thenable<SubtagDetailsLookup> {
		return this.#subtagCache.get();
	}

	public getBBTag(uri: DocumentUri): BBString {
		let result = this.#bbtagCache.get(uri);
		if (result === undefined)
			this.#bbtagCache.set(uri, result = this.#getBBTag(uri));

		return result;
	}

	#getBBTag(uri: DocumentUri): BBString {
		const document = this.documents.get(uri);
		if (document === undefined)
			throw new Error('Document not found');

		return BBString.parseDocument(document);
	}

	public getConfiguration(uri: DocumentUri): Thenable<ServerConfiguration> {
		if (!this.#hasConfigurationCapability)
			return Promise.resolve(this.#globalConfig);

		let result = this.#documentConfig.get(uri);
		if (result === undefined) {
			this.#documentConfig.set(uri, result = this.connection.workspace.getConfiguration({
				scopeUri: uri,
				section: 'bbtag'
			}));
		}

		return result;
	}

	#initialize(params: InitializeParams): InitializeResult {
		const clientCapabilities = params.capabilities;

		this.#hasConfigurationCapability = clientCapabilities.workspace?.configuration ?? false;
		this.#hasWorkspaceFolderCapability = clientCapabilities.workspace?.workspaceFolders ?? false;
		this.#hasDiagnosticRelatedInformationCapability = clientCapabilities.textDocument?.publishDiagnostics?.relatedInformation ?? false;

		this.#capabilities.textDocumentSync = TextDocumentSyncKind.Incremental;
		if (this.#hasWorkspaceFolderCapability) {
			this.#capabilities.workspace = {
				workspaceFolders: {
					supported: true
				}
			};
		}
		return {
			capabilities: this.#capabilities
		};
	}

	#initialized(): void {
		if (this.#hasConfigurationCapability) {
			// Register for all configuration changes.
			this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
		}
	}

	#refreshConfiguration(change: DidChangeConfigurationParams): void {
		if (this.#hasConfigurationCapability) {
			this.#documentConfig.clear();
		} else {
			this.#globalConfig = change.settings.bbtag ?? this.#globalConfig;
		}
	}

	#clearDocumentSettings(change: TextDocumentChangeEvent<TextDocument>): void {
		this.#documentConfig.delete(change.document.uri);
	}

	#clearBBTagCache(change: TextDocumentChangeEvent<TextDocument>): void {
		this.#bbtagCache.delete(change.document.uri);
	}
}