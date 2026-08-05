<script lang="ts">
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import TreeNode from '$lib/components/TreeNode.svelte';
	import type { TreeSitter } from '$lib/treesitter/core';
	import {
		buildDisplayTree,
		countNodes,
		pathAtIndex,
		type DisplayNode
	} from '$lib/treesitter/inspect';
	import { renderHighlighted, svelteSpans } from '$lib/treesitter/highlight';
	import { SAMPLE } from '$lib/samples';

	let { ts }: { ts: TreeSitter } = $props();

	let code = $state(SAMPLE);
	let namedOnly = $state(true);
	let cursorIndex = $state(0);
	let hovered = $state<DisplayNode | null>(null);
	let editor: ReturnType<typeof CodeEditor> | undefined = $state();

	// The whole demo in one derivation: code is $state, the tree is $derived.
	const parsed = $derived.by(() => {
		const t0 = performance.now();
		const tree = ts.parse('svelte', code);
		const ms = performance.now() - t0;
		const spans = svelteSpans(ts, code, tree);
		const display = buildDisplayTree(tree.rootNode);
		const hasError = tree.rootNode.hasError;
		tree.delete();
		return { display, spans, ms, hasError, nodes: countNodes(display) };
	});

	const path = $derived(
		pathAtIndex(parsed.display, Math.max(0, Math.min(cursorIndex, code.length - 1)))
	);
	const pathIds = $derived(new Set(path.map((n) => n.id)));
	const current = $derived(path.at(-1) ?? null);

	const html = $derived(
		renderHighlighted(
			code,
			parsed.spans,
			hovered ? [{ start: hovered.start, end: hovered.end, cls: 'mark' }] : []
		)
	);
</script>

<div class="demo split">
	<section class="panel">
		<div class="panel-head">
			<strong>component.svelte</strong>
			<span class="spacer"></span>
			<span>parsed in {parsed.ms.toFixed(1)} ms</span>
			{#if parsed.hasError}
				<span class="badge err">syntax error — recovered</span>
			{:else}
				<span class="badge ok">no errors</span>
			{/if}
		</div>
		<CodeEditor bind:this={editor} bind:value={code} {html} onCursor={(i) => (cursorIndex = i)} />
	</section>

	<section class="panel">
		<div class="panel-head">
			<strong>syntax tree</strong>
			<span class="spacer"></span>
			<span>{parsed.nodes} nodes</span>
			<label class="check">
				<input type="checkbox" bind:checked={namedOnly} />
				named only
			</label>
		</div>
		<div class="panel-body tree">
			<TreeNode
				node={parsed.display}
				{namedOnly}
				path={pathIds}
				cursorId={current?.id ?? null}
				onHover={(n) => (hovered = n)}
				onPick={(n) => editor?.select(n.start, n.end)}
			/>
		</div>
	</section>
</div>

<p class="hint">
	Click into the code — the tree follows your cursor. Hover a tree node to light up its source;
	click it to select the range. Delete a closing tag and watch the parser recover instead of
	giving up.
</p>

<style>
	.tree {
		padding: 0.5rem 0.4rem;
	}
</style>
