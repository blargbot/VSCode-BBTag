export interface SubtagDetails {
	readonly name: string;
	readonly category: SubtagType;
	readonly signatures: readonly SubtagSignature[];
	readonly deprecated: boolean | string;
	readonly staff: boolean;
	readonly aliases: readonly string[];
	readonly description: string | undefined;
}


export enum SubtagType {
	SIMPLE = 1,
	MISC,
	ARRAY,
	JSON,
	MATH,
	LOOPS,
	BOT,
	MESSAGE,
	CHANNEL,
	THREAD,
	USER,
	ROLE,
	GUILD
}

export interface SubtagSignature {
	readonly subtagName?: string;
	readonly parameters: readonly SubtagSignatureParameter[];
	readonly description: string;
	readonly exampleCode: string;
	readonly exampleIn?: string;
	readonly exampleOut: string;
}

export type SubtagSignatureParameter =
	| SubtagSignatureValueParameter
	| SubtagSignatureParameterGroup

export type SubtagSignatureValueParameter =
	| OptionalSubtagSignatureParameter
	| RequiredSubtagSignatureParameter

export interface OptionalSubtagSignatureParameter {
	readonly name: string;
	readonly required: false;
	readonly autoResolve: boolean;
	readonly defaultValue: string;
	readonly maxLength: number;
}

export interface RequiredSubtagSignatureParameter {
	readonly name: string;
	readonly required: true;
	readonly autoResolve: boolean;
	readonly defaultValue: string;
	readonly maxLength: number;
}

export interface SubtagSignatureParameterGroup {
	readonly minRepeats: number;
	readonly nested: readonly RequiredSubtagSignatureParameter[];
}