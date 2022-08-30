import { SubtagDetails } from './SubtagDetails';
import Fuse from 'fuse.js';

export class SubtagDetailsLookup {
	readonly #fuzzy: Fuse<SubtagDetails>;
	readonly #exact: Map<string, SubtagDetails>;
	readonly #list: readonly SubtagDetails[];

	public constructor(subtagDetails: Record<string, SubtagDetails>) {
		this.#list = Object.values(subtagDetails);
		this.#exact = new Map(Object.entries(subtagDetails).map(x => [x[0].toLowerCase(), x[1]]));
		for (const subtag of this.#list)
			for (const alias of subtag.aliases.map(a => a.toLowerCase()))
				if (!this.#exact.has(alias))
					this.#exact.set(alias, subtag);

		this.#fuzzy = new Fuse(this.#list, {
			isCaseSensitive: false,
			includeScore: true,
			includeMatches: true,
			shouldSort: true,
			keys: [
				{ name: 'name', getFn(d) { return d.name; } },
				{ name: 'aliases', getFn(d) { return d.aliases; } }
			]
		});
	}

	public all(): readonly SubtagDetails[] {
		return this.#list;
	}

	public get(name: string): SubtagDetails | undefined {
		return this.#exact.get(name.toLowerCase());
	}

	public * find(name: string): Generator<{ term: string, value: SubtagDetails }> {
		for (const result of this.#fuzzy.search(name)) {
			const terms = result.matches?.map(x => x.value).filter((v): v is string => v !== undefined) ?? [result.item.name];
			for (const term of terms)
				yield { term, value: result.item };
		}
	}
}