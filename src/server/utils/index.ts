import { CancellationToken, Disposable, Position, Range } from 'vscode-languageserver';

interface IComparer<T> {
	readonly compare: (first: T, second: T) => number;
	readonly gt: (first: T, second: T) => boolean;
	readonly lt: (first: T, second: T) => boolean;
	readonly ge: (first: T, second: T) => boolean;
	readonly le: (first: T, second: T) => boolean;
	readonly eq: (first: T, second: T) => boolean;
	readonly ne: (first: T, second: T) => boolean;
}

export function createComparer<T>(compare: (first: T, second: T) => number): IComparer<T> {
	return Object.freeze<IComparer<T>>({
		compare,
		gt: (a, b) => compare(a, b) > 0,
		lt: (a, b) => compare(a, b) < 0,
		ge: (a, b) => compare(a, b) >= 0,
		le: (a, b) => compare(a, b) <= 0,
		eq: (a, b) => compare(a, b) == 0,
		ne: (a, b) => compare(a, b) != 0,
	});
}

export const positionComparer = createComparer<Position>((pos1, pos2) => {
	const lineDiff = pos1.line - pos2.line;
	if (lineDiff !== 0)
		return lineDiff;
	return pos1.character - pos2.character;
});

export function raceCancellation<T>(promise: Thenable<T>, token: CancellationToken): Promise<T | undefined>;
export function raceCancellation<T, R>(promise: Thenable<T>, token: CancellationToken, onCancelled: R): Promise<T | R>;
export async function raceCancellation<T, R>(work: Thenable<T>, token: CancellationToken, onCancelled?: R): Promise<T | R | undefined> {
	let disposable: Disposable | undefined;
	const cancelPromise = new Promise<R | undefined>(res => disposable = token.onCancellationRequested(() => res(onCancelled)));
	try {
		return await Promise.race([cancelPromise, work]);
	} finally {
		disposable?.dispose();
	}
}