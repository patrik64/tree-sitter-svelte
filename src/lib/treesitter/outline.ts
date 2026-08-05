// The "component anatomy" extractor: queries the Svelte tree for template
// facts, then re-parses the <script> with the JavaScript grammar and queries
// it for runes — props, state, derived values, effects.
import type { Node, Query } from 'web-tree-sitter';
import type { TreeSitter } from './core';
import { JS_OUTLINE, SVELTE_OUTLINE } from './queries';

export interface OutlineItem {
	name: string;
	detail?: string;
	start: number;
	end: number;
}

export interface Outline {
	props: OutlineItem[];
	state: OutlineItem[];
	derived: OutlineItem[];
	effects: OutlineItem[];
	functions: OutlineItem[];
	snippets: OutlineItem[];
	components: OutlineItem[];
}

const trim = (s: string, max = 40) => {
	const flat = s.replace(/\s+/g, ' ').trim();
	return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
};

const stripParens = (s: string) => s.replace(/^\(/, '').replace(/\)$/, '');

export function extractOutline(ts: TreeSitter, code: string): Outline {
	const outline: Outline = {
		props: [],
		state: [],
		derived: [],
		effects: [],
		functions: [],
		snippets: [],
		components: []
	};

	const svelteTree = ts.parse('svelte', code);
	let svelteQuery: Query | null = null;
	let jsQuery: Query | null = null;
	try {
		svelteQuery = ts.query('svelte', SVELTE_OUTLINE);
		jsQuery = ts.query('javascript', JS_OUTLINE);

		let script: { start: number; end: number } | null = null;
		const seenComponents = new Set<string>();

		for (const match of svelteQuery.matches(svelteTree.rootNode)) {
			const caps = Object.fromEntries(match.captures.map((c) => [c.name, c.node]));
			if (caps.script && !script) {
				script = { start: caps.script.startIndex, end: caps.script.endIndex };
			}
			if (caps.component && !seenComponents.has(caps.component.text)) {
				seenComponents.add(caps.component.text);
				outline.components.push(item(caps.component));
			}
			if (caps['snippet.name']) {
				outline.snippets.push({
					...item(caps['snippet.name']),
					detail: caps['snippet.params'] ? `(${trim(caps['snippet.params'].text)})` : undefined
				});
			}
		}

		if (script) {
			const source = code.slice(script.start, script.end);
			const jsTree = ts.parse('javascript', source);
			const at = (node: Node): OutlineItem => ({
				name: node.text,
				start: node.startIndex + script.start,
				end: node.endIndex + script.start
			});

			for (const match of jsQuery.matches(jsTree.rootNode)) {
				const caps = Object.fromEntries(match.captures.map((c) => [c.name, c.node]));
				if (caps['props.pattern']) {
					outline.props.push(...propsFromPattern(caps['props.pattern'], script.start));
				} else if (caps['state.name']) {
					outline.state.push({
						...at(caps['state.name']),
						detail: `= ${trim(stripParens(caps['state.args'].text))}`
					});
				} else if (caps['derived.name']) {
					outline.derived.push({
						...at(caps['derived.name']),
						detail: `← ${trim(stripParens(caps['derived.args'].text))}`
					});
				} else if (caps['effect.call']) {
					outline.effects.push({
						...at(caps['effect.call']),
						name: caps['effect.kind'] ? `$effect.${caps['effect.kind'].text}` : '$effect'
					});
				} else if (caps['function.name']) {
					outline.functions.push(at(caps['function.name']));
				}
			}
			jsTree.delete();
		}
	} finally {
		svelteQuery?.delete();
		jsQuery?.delete();
		svelteTree.delete();
	}
	return outline;
}

function item(node: Node): OutlineItem {
	return { name: node.text, start: node.startIndex, end: node.endIndex };
}

/** Walk `let { title, items = [], ...rest } = $props()` destructuring. */
function propsFromPattern(pattern: Node, offset: number): OutlineItem[] {
	const props: OutlineItem[] = [];
	for (const child of pattern.namedChildren) {
		if (!child) continue;
		const base = {
			start: child.startIndex + offset,
			end: child.endIndex + offset
		};
		switch (child.type) {
			case 'shorthand_property_identifier_pattern':
				props.push({ ...base, name: child.text });
				break;
			case 'object_assignment_pattern': {
				const left = child.childForFieldName('left');
				const right = child.childForFieldName('right');
				props.push({
					...base,
					name: left?.text ?? child.text,
					detail: right ? `= ${trim(right.text)}` : undefined
				});
				break;
			}
			case 'pair_pattern': {
				const key = child.childForFieldName('key');
				const value = child.childForFieldName('value');
				props.push({
					...base,
					name: key?.text ?? child.text,
					detail: value ? `→ ${trim(value.text)}` : undefined
				});
				break;
			}
			case 'rest_pattern':
				props.push({ ...base, name: child.text });
				break;
		}
	}
	return props;
}
