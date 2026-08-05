// Turns query captures into styled HTML. Two independent layers:
//   - spans: syntax colors from highlight queries  → class "tok-…"
//   - marks: transient overlays (hover, captures)  → class "mk-…"
import type { Query, Tree } from 'web-tree-sitter';
import type { TreeSitter } from './core';

export interface Span {
	start: number;
	end: number;
	cls: string;
}

const escapeHtml = (s: string) =>
	s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const cssName = (capture: string) => capture.replace(/[^a-zA-Z0-9]+/g, '-');

/** Run a highlight query over a tree; `offset` shifts indexes for injections. */
export function captureSpans(query: Query, tree: Tree, offset = 0): Span[] {
	return query
		.captures(tree.rootNode)
		.filter((c) => !c.name.startsWith('_') && c.node.endIndex > c.node.startIndex)
		.map((c) => ({
			start: c.node.startIndex + offset,
			end: c.node.endIndex + offset,
			cls: c.name
		}));
}

/**
 * Highlight a whole Svelte document. With `injections` enabled the raw_text
 * regions (script, style, {expressions}) are re-parsed with the JavaScript and
 * CSS grammars and their captures overlaid — the same mechanism editors like
 * Zed and Neovim use for .svelte files.
 */
export function svelteSpans(ts: TreeSitter, code: string, tree: Tree, injections = true): Span[] {
	const spans = captureSpans(ts.highlights.svelte, tree);
	if (!injections) return spans;

	for (const capture of ts.injections.captures(tree.rootNode)) {
		const lang = capture.name === 'injection.css' ? 'css' : 'javascript';
		const { startIndex, endIndex } = capture.node;
		if (endIndex <= startIndex) continue;
		const subTree = ts.parse(lang, code.slice(startIndex, endIndex));
		spans.push(...captureSpans(ts.highlights[lang], subTree, startIndex));
		subTree.delete();
	}
	return spans;
}

/**
 * Render `code` to HTML. Per-character class resolution: spans are applied
 * outermost-first so that nested (more specific) captures win.
 */
export function renderHighlighted(code: string, spans: Span[], marks: Span[] = []): string {
	const tok = new Array<string | null>(code.length).fill(null);
	const sorted = [...spans].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
	for (const s of sorted) {
		const end = Math.min(s.end, code.length);
		for (let i = Math.max(s.start, 0); i < end; i++) tok[i] = s.cls;
	}

	const mk = new Array<string | null>(code.length).fill(null);
	for (const m of marks) {
		const end = Math.min(m.end, code.length);
		for (let i = Math.max(m.start, 0); i < end; i++) mk[i] = m.cls;
	}

	let out = '';
	let i = 0;
	while (i < code.length) {
		const t = tok[i];
		const m = mk[i];
		let j = i + 1;
		while (j < code.length && tok[j] === t && mk[j] === m) j++;
		const text = escapeHtml(code.slice(i, j));
		if (t || m) {
			const classes: string[] = [];
			if (t) {
				// "tag.component" → "tok-tag tok-tag-component" so the base color
				// applies and the specific one can override it.
				const root = t.split('.')[0];
				classes.push(`tok-${cssName(root)}`);
				if (root !== t) classes.push(`tok-${cssName(t)}`);
			}
			if (m) classes.push(`mk-${cssName(m)}`);
			out += `<span class="${classes.join(' ')}">${text}</span>`;
		} else {
			out += text;
		}
		i = j;
	}
	return out;
}
