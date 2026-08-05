// Validates that every query in src/lib/treesitter/queries.js compiles against
// the WASM grammars in static/wasm, and smoke-tests parsing + captures in Node.
// Run with: node scripts/check.mjs
import { Parser, Language, Query } from 'web-tree-sitter';
import { fileURLToPath } from 'node:url';
import {
	SVELTE_HIGHLIGHTS,
	SVELTE_INJECTIONS,
	JS_HIGHLIGHTS,
	CSS_HIGHLIGHTS,
	JS_OUTLINE,
	SVELTE_OUTLINE
} from '../src/lib/treesitter/queries.js';

await Parser.init();
const wasm = (name) => fileURLToPath(new URL(`../static/wasm/${name}.wasm`, import.meta.url));
const svelte = await Language.load(wasm('tree-sitter-svelte'));
const javascript = await Language.load(wasm('tree-sitter-javascript'));
const css = await Language.load(wasm('tree-sitter-css'));

let failed = false;

const queries = {};
const compile = (label, language, source) => {
	try {
		queries[label] = new Query(language, source);
		console.log(`ok   ${label}`);
	} catch (e) {
		failed = true;
		console.error(`FAIL ${label}: ${e.message}`);
	}
};

compile('SVELTE_HIGHLIGHTS', svelte, SVELTE_HIGHLIGHTS);
compile('SVELTE_INJECTIONS', svelte, SVELTE_INJECTIONS);
compile('SVELTE_OUTLINE', svelte, SVELTE_OUTLINE);
compile('JS_HIGHLIGHTS', javascript, JS_HIGHLIGHTS);
compile('JS_OUTLINE', javascript, JS_OUTLINE);
compile('CSS_HIGHLIGHTS', css, CSS_HIGHLIGHTS);

if (failed) process.exit(1);

// ---- smoke tests -----------------------------------------------------------
const parser = new Parser();
const parse = (language, code) => {
	parser.setLanguage(language);
	return parser.parse(code);
};

const svelteDoc = `<script>
	let { title = 'hi', items = [] } = $props();
	let count = $state(0);
	const double = $derived(count * 2);
	$effect(() => console.log(count));
	$effect.pre(() => {});
	function reset() { count = 0; }
</script>

{#snippet row(item)}
	<li>{item}</li>
{/snippet}

{#if count > 0}
	<Badge label={title} onclick={() => count++} />
{/if}

<style>
	.title { color: #ff3e00; font-size: 2rem; }
</style>
`;

const tree = parse(svelte, svelteDoc);
console.log('\nsvelte doc parses, hasError:', tree.rootNode.hasError);

const expect = (label, actual, min) => {
	const ok = actual >= min;
	if (!ok) failed = true;
	console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${actual}`);
};

expect('svelte highlight captures', queries.SVELTE_HIGHLIGHTS.captures(tree.rootNode).length, 10);

const injections = queries.SVELTE_INJECTIONS.captures(tree.rootNode);
expect('injection regions', injections.length, 3);

for (const capture of injections) {
	const language = capture.name === 'injection.css' ? css : javascript;
	const label = `${capture.name} @ ${capture.node.startIndex}`;
	const sub = parse(language, svelteDoc.slice(capture.node.startIndex, capture.node.endIndex));
	const q = capture.name === 'injection.css' ? queries.CSS_HIGHLIGHTS : queries.JS_HIGHLIGHTS;
	expect(`  ${label} captures`, q.captures(sub.rootNode).length, 1);
	sub.delete();
}

const scriptRegion = queries.SVELTE_OUTLINE.matches(tree.rootNode)
	.flatMap((m) => m.captures)
	.find((c) => c.name === 'script');
const jsTree = parse(
	javascript,
	svelteDoc.slice(scriptRegion.node.startIndex, scriptRegion.node.endIndex)
);
const outlineMatches = queries.JS_OUTLINE.matches(jsTree.rootNode);
const names = outlineMatches.flatMap((m) => m.captures.map((c) => c.name));
console.log('\noutline captures found:', [...new Set(names)].sort().join(', '));
for (const required of [
	'props.pattern',
	'state.name',
	'derived.name',
	'effect.call',
	'effect.kind',
	'function.name'
]) {
	expect(`outline has ${required}`, names.filter((n) => n === required).length, 1);
}

const snippetNames = queries.SVELTE_OUTLINE.matches(tree.rootNode)
	.flatMap((m) => m.captures)
	.filter((c) => c.name === 'snippet.name')
	.map((c) => c.node.text);
expect('snippet names', snippetNames.length, 1);
console.log('  snippets:', snippetNames.join(', '));

process.exit(failed ? 1 : 0);
