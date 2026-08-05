// Framework-agnostic tree-sitter plumbing: no Vite/SvelteKit imports here, so
// it also runs in plain Node (see scripts/check.mjs). The browser entry point
// that fetches the WASM files lives in ./load.ts.
import { Parser, Query, type Language, type Tree } from 'web-tree-sitter';
import { SVELTE_HIGHLIGHTS, SVELTE_INJECTIONS, JS_HIGHLIGHTS, CSS_HIGHLIGHTS } from './queries';

export type LangName = 'svelte' | 'javascript' | 'css';

export interface TreeSitter {
	languages: Record<LangName, Language>;
	highlights: Record<LangName, Query>;
	injections: Query;
	/** Parse `code`, optionally reusing `oldTree` for incremental parsing. */
	parse(lang: LangName, code: string, oldTree?: Tree | null): Tree;
	/** Compile a user-supplied query against one of the loaded languages. */
	query(lang: LangName, source: string): Query;
}

/** Wire up a shared parser plus the app's compiled queries. */
export function createTreeSitter(languages: Record<LangName, Language>): TreeSitter {
	const parser = new Parser();
	return {
		languages,
		highlights: {
			svelte: new Query(languages.svelte, SVELTE_HIGHLIGHTS),
			javascript: new Query(languages.javascript, JS_HIGHLIGHTS),
			css: new Query(languages.css, CSS_HIGHLIGHTS)
		},
		injections: new Query(languages.svelte, SVELTE_INJECTIONS),
		parse(lang, code, oldTree) {
			parser.setLanguage(languages[lang]);
			const tree = parser.parse(code, oldTree ?? null);
			if (!tree) throw new Error('parse was cancelled');
			return tree;
		},
		query(lang, source) {
			return new Query(languages[lang], source);
		}
	};
}
