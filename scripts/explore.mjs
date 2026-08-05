// Print the tree-sitter parse tree of a Svelte file — handy on a slide to show
// that the exact same WASM grammar also runs in Node.
//
// Usage: node scripts/explore.mjs [path/to/Component.svelte]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Parser, Language } from 'web-tree-sitter';

await Parser.init();
const svelte = await Language.load(
	fileURLToPath(new URL('../static/wasm/tree-sitter-svelte.wasm', import.meta.url))
);
const parser = new Parser();
parser.setLanguage(svelte);

const code = process.argv[2]
	? readFileSync(process.argv[2], 'utf8')
	: `<script>
	let count = $state(0);
</script>

{#if count > 0}
	<p>clicked {count} times</p>
{/if}

<button onclick={() => count++}>+1</button>
`;

const tree = parser.parse(code);

function print(cursor, indent = 0) {
	const node = cursor.currentNode;
	if (node.isNamed) {
		const field = cursor.currentFieldName ? `${cursor.currentFieldName}: ` : '';
		const pos = `${node.startPosition.row}:${node.startPosition.column}`;
		console.log(`${'  '.repeat(indent)}${field}(${node.type}) ${pos}`);
		indent += 1;
	}
	if (cursor.gotoFirstChild()) {
		do {
			print(cursor, indent);
		} while (cursor.gotoNextSibling());
		cursor.gotoParent();
	}
}

print(tree.rootNode.walk());
if (tree.rootNode.hasError) console.log('\n⚠ document contains syntax errors (recovered)');
