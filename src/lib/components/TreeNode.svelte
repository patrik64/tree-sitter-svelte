<script lang="ts">
	import type { DisplayNode } from '$lib/treesitter/inspect';
	import TreeNode from './TreeNode.svelte';

	interface Props {
		node: DisplayNode;
		namedOnly: boolean;
		/** ids of the nodes on the root→cursor path */
		path: ReadonlySet<number>;
		/** id of the deepest node at the cursor */
		cursorId: number | null;
		onHover: (node: DisplayNode | null) => void;
		onPick: (node: DisplayNode) => void;
	}

	let { node, namedOnly, path, cursorId, onHover, onPick }: Props = $props();

	const children = $derived(namedOnly ? node.children.filter((c) => c.named) : node.children);

	let row: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (node.id === cursorId) row?.scrollIntoView({ block: 'nearest' });
	});
</script>

<div class="tree-node">
	<button
		bind:this={row}
		class="row"
		class:onpath={path.has(node.id)}
		class:current={node.id === cursorId}
		onmouseenter={() => onHover(node)}
		onmouseleave={() => onHover(null)}
		onclick={() => onPick(node)}
	>
		{#if node.field}<span class="field">{node.field}:</span>{/if}
		{#if node.named}
			<span class="type" class:err={node.isError}>
				({node.type}{node.isMissing ? ' · MISSING' : ''})
			</span>
		{:else}
			<span class="anon">"{node.type}"</span>
		{/if}
		<span class="pos">{node.startPos}–{node.endPos}</span>
	</button>
	{#if children.length > 0}
		<div class="children">
			{#each children as child (child.id)}
				<TreeNode node={child} {namedOnly} {path} {cursorId} {onHover} {onPick} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.children {
		margin-left: 0.55rem;
		border-left: 1px solid var(--border-soft);
		padding-left: 0.65rem;
	}

	.row {
		display: flex;
		gap: 0.45rem;
		align-items: baseline;
		background: none;
		border: 0;
		border-radius: 4px;
		padding: 1px 6px;
		font: 12.5px/1.7 var(--mono);
		color: var(--text);
		cursor: pointer;
		text-align: left;
		white-space: nowrap;
	}

	.row:hover {
		background: #ffffff10;
	}

	.row.onpath {
		background: rgba(97, 175, 239, 0.1);
	}

	.row.current {
		background: var(--accent-soft);
		outline: 1px solid rgba(255, 62, 0, 0.45);
	}

	.field {
		color: #56b6c2;
	}

	.type {
		color: #61afef;
	}

	.type.err {
		color: #f47067;
		font-weight: 700;
	}

	.anon {
		color: var(--muted);
	}

	.pos {
		color: var(--muted);
		opacity: 0.65;
		font-size: 11px;
	}
</style>
