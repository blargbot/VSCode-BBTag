import { SubtagDetails, SubtagSignature, SubtagSignatureParameter } from './SubtagDetails';

export function stringifySignature(subtag: SubtagDetails, signature: SubtagSignature): string {
	const out = [];
	for (const param of signature.parameters) {
		out.push(stringifyParameter(param));
	}

	if (out.length > 0) {
		return `{${signature.subtagName || subtag.name};${out.join(';')}}`;
	} else {
		return `{${signature.subtagName || subtag.name}}`;
	}
}

function stringifyParameter(parameter: SubtagSignatureParameter): string {
	if ('nested' in parameter) {
		if (parameter.nested.length === 1) {
			return stringifyParameter(parameter.nested[0]) + '...';
		}
		return `(${parameter.nested.map(stringifyParameter).join(';')})...`;
	}
	return parameter.required ? `<${parameter.name}>` : `[${parameter.name}]`;
}