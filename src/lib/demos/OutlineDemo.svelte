<script lang="ts">
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import type { TreeSitter } from '$lib/treesitter/core';
	import { renderHighlighted, svelteSpans } from '$lib/treesitter/highlight';
	import { extractOutline, type OutlineItem } from '$lib/treesitter/outline';
	import { OUTLINE_SAMPLE } from '$lib/samples';

	let { ts }: { ts: TreeSitter } = $props();

	let code = $state(OUTLINE_SAMPLE);
	let hovered = $state<OutlineItem | null>(null);
	let editor: ReturnType<typeof CodeEditor> | undefined = $state();

	const outline = $derived(extractOutline(ts, code));

	const spans = $derived.by(() => {
		const tree = ts.parse('svelte', code);
		const spans = svelteSpans(ts, code, tree);
		tree.delete();
		return spans;
	});

	const html = $derived(
		renderHighlighted(
			code,
			spans,
			hovered ? [{ start: hovered.start, end: hovered.end, cls: 'mark' }] : []
		)
	);

	const sections = $derived(
		(
			[
				['props', outline.props],
				['state', outline.state],
				['derived', outline.derived],
				['effects', outline.effects],
				['functions', outline.functions],
				['snippets', outline.snippets],
				['components used', outline.components]
			] as [string, OutlineItem[]][]
		).filter(([, items]) => items.length > 0)
	);
</script>

<div class="demo split">
	<section class="panel">
		<div class="panel-head">
			<strong>ItemList.svelte</strong>
			<span class="spacer"></span>
			<span>edit me — the anatomy updates live</span>
		</div>
		<CodeEditor bind:this={editor} bind:value={code} {html} />
	</section>

	<section class="panel">
		<div class="panel-head">
			<strong>component anatomy</strong>
			<span class="spacer"></span>
			<span>extracted with two queries</span>
		</div>
		<div class="panel-body anatomy">
			{#each sections as [title, items] (title)}
				<section>
					<h3>{title} <span class="count">{items.length}</span></h3>
					{#each items as entry (entry.start)}
						<button
							class="item"
							onmouseenter={() => (hovered = entry)}
							onmouseleave={() => (hovered = null)}
							onclick={() => editor?.select(entry.start, entry.end)}
						>
							<span class="name">{entry.name}</span>
							{#if entry.detail}<span class="detail">{entry.detail}</span>{/if}
						</button>
					{/each}
				</section>
			{:else}
				<p class="empty">nothing recognized yet — add a script block with runes</p>
			{/each}
		</div>
	</section>
</div>

<p class="hint">
	Docs-from-code, structural lint rules, codemods, editor outlines — once the component is a
	queryable tree instead of a string, they're all one query away. Rename a prop or add a
	<code>$state</code> on the left and watch it appear.
</p>

<style>
	.anatomy {
		padding: 0.75rem 1rem;
	}

	.anatomy > section {
		margin-bottom: 0.9rem;
	}

	h3 {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--muted);
	}

	.count {
		color: var(--accent);
		font-family: var(--mono);
	}

	.item {
		display: flex;
		gap: 0.6rem;
		align-items: baseline;
		width: 100%;
		background: none;
		border: 0;
		border-radius: 5px;
		padding: 0.15rem 0.5rem;
		cursor: pointer;
		text-align: left;
	}

	.item:hover {
		background: var(--accent-soft);
	}

	.name {
		font: 600 13px var(--mono);
		color: #61afef;
	}

	.detail {
		font: 12px var(--mono);
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
