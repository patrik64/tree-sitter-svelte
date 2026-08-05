<script lang="ts">
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import type { TreeSitter } from '$lib/treesitter/core';
	import { renderHighlighted, svelteSpans, type Span } from '$lib/treesitter/highlight';
	import { DEFAULT_QUERY, PRESET_QUERIES, SAMPLE } from '$lib/samples';

	let { ts }: { ts: TreeSitter } = $props();

	let code = $state(SAMPLE);
	let source = $state(DEFAULT_QUERY);
	let hoveredRow = $state<number | null>(null);
	let editor: ReturnType<typeof CodeEditor> | undefined = $state();

	interface CaptureRow {
		name: string;
		type: string;
		text: string;
		start: number;
		end: number;
		pos: string;
	}

	const result = $derived.by(() => {
		let query = null;
		let tree = null;
		try {
			query = ts.query('svelte', source);
			tree = ts.parse('svelte', code);
			const captures: CaptureRow[] = query
				.captures(tree.rootNode)
				.filter((c) => !c.name.startsWith('_'))
				.map((c) => ({
					name: c.name,
					type: c.node.type,
					text: c.node.text,
					start: c.node.startIndex,
					end: c.node.endIndex,
					pos: `${c.node.startPosition.row}:${c.node.startPosition.column}`
				}));
			return { captures, error: null };
		} catch (e) {
			return { captures: [], error: e instanceof Error ? e.message : String(e) };
		} finally {
			tree?.delete();
			query?.delete();
		}
	});

	const captureNames = $derived([...new Set(result.captures.map((c) => c.name))]);

	const syntaxSpans = $derived.by(() => {
		const tree = ts.parse('svelte', code);
		const spans = svelteSpans(ts, code, tree);
		tree.delete();
		return spans;
	});

	const marks = $derived.by(() => {
		const marks: Span[] = result.captures.map((c) => ({
			start: c.start,
			end: c.end,
			cls: `cap-${captureNames.indexOf(c.name) % 6}`
		}));
		const hovered = hoveredRow === null ? undefined : result.captures[hoveredRow];
		if (hovered) marks.push({ start: hovered.start, end: hovered.end, cls: 'mark' });
		return marks;
	});

	const html = $derived(renderHighlighted(code, syntaxSpans, marks));

	const shorten = (s: string, max = 32) => {
		const flat = s.replace(/\s+/g, ' ').trim();
		return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
	};
</script>

<div class="demo layout">
	<section class="panel">
		<div class="panel-head">
			<strong>component.svelte</strong>
			<span class="spacer"></span>
			<span>{result.captures.length} captures</span>
		</div>
		<CodeEditor bind:this={editor} bind:value={code} {html} />
	</section>

	<div class="right">
		<section class="panel query-panel">
			<div class="panel-head">
				<strong>query</strong>
				<span class="spacer"></span>
				{#each PRESET_QUERIES as preset (preset.label)}
					<button class="preset" onclick={() => (source = preset.source)}>{preset.label}</button>
				{/each}
			</div>
			<textarea
				class="query-input"
				bind:value={source}
				spellcheck="false"
				aria-label="tree-sitter query"
			></textarea>
			{#if result.error}
				<div class="qerror">{result.error}</div>
			{/if}
		</section>

		<section class="panel captures-panel">
			<div class="panel-head">
				<strong>captures</strong>
				<span class="spacer"></span>
				<span>hover to locate · click to select</span>
			</div>
			<div class="panel-body">
				{#each result.captures as capture, i (i)}
					<button
						class="cap-row"
						onmouseenter={() => (hoveredRow = i)}
						onmouseleave={() => (hoveredRow = null)}
						onclick={() => editor?.select(capture.start, capture.end)}
					>
						<span class="cap-badge cap-badge-{captureNames.indexOf(capture.name) % 6}">
							@{capture.name}
						</span>
						<span class="cap-type">({capture.type})</span>
						<span class="cap-text">{shorten(capture.text)}</span>
						<span class="cap-pos">{capture.pos}</span>
					</button>
				{:else}
					{#if !result.error}
						<p class="empty">no matches — edit the query or the code</p>
					{/if}
				{/each}
			</div>
		</section>
	</div>
</div>

<p class="hint">
	Queries are how everything downstream consumes the tree: highlighting, folding, symbol outlines,
	structural search. Same idea as CSS selectors — but for syntax.
</p>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.right {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: 0;
	}

	.query-panel {
		flex: 0 0 auto;
	}

	.captures-panel {
		flex: 1;
	}

	.query-input {
		border: 0;
		outline: none;
		resize: none;
		background: var(--bg-inset);
		color: #98c379;
		font: 13px/1.6 var(--mono);
		padding: 12px 14px;
		min-height: 150px;
		tab-size: 2;
		white-space: pre;
	}

	.qerror {
		padding: 0.5rem 0.85rem;
		background: rgba(244, 112, 103, 0.12);
		color: #f47067;
		font: 12px/1.5 var(--mono);
		border-top: 1px solid rgba(244, 112, 103, 0.3);
		white-space: pre-wrap;
	}

	.preset {
		background: none;
		border: 1px solid var(--border);
		border-radius: 99px;
		color: var(--muted);
		font-size: 0.72rem;
		padding: 0.1rem 0.55rem;
		cursor: pointer;
	}

	.preset:hover {
		color: var(--text);
		border-color: var(--muted);
	}

	.cap-row {
		display: flex;
		gap: 0.6rem;
		align-items: baseline;
		width: 100%;
		background: none;
		border: 0;
		border-bottom: 1px solid var(--border-soft);
		padding: 0.35rem 0.85rem;
		cursor: pointer;
		text-align: left;
	}

	.cap-row:hover {
		background: #ffffff0a;
	}

	.cap-type {
		font: 12px var(--mono);
		color: #61afef;
	}

	.cap-text {
		font: 12px var(--mono);
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.cap-pos {
		font: 11px var(--mono);
		color: var(--muted);
	}

	.empty {
		color: var(--muted);
		padding: 1rem;
		font-size: 0.85rem;
	}
</style>
