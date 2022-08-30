export class Cache<T> {
	readonly #getter: () => T | Thenable<T>;
	readonly #durationMs: number;

	#result: Thenable<T> | undefined;
	#lastLoad: number;
	#loading: boolean;

	public constructor(getter: () => T | Thenable<T>, durationMs: number) {
		this.#getter = getter;
		this.#durationMs = durationMs;
		this.#lastLoad = Number.MIN_VALUE;
		this.#loading = false;
	}

	public get(): Thenable<T> {
		if (!this.#loading && this.#lastLoad + this.#durationMs < Date.now())
			return this.#result = this.#get();
		return this.#result ??= this.#get();
	}

	public clear(): void {
		this.#result = undefined;
	}

	async #get(): Promise<T> {
		this.#loading = true;
		try {
			const result = await this.#getter();
			this.#lastLoad = Date.now();
			return result;
		} catch (err: unknown) {
			this.#result = undefined;
			throw err;
		} finally {
			this.#loading = false;
		}
	}

}