<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Tree } from 'web-tree-sitter';
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import type { TreeSitter } from '$lib/treesitter/core';
	import { computeEdit, changedRanges, type ChangedRange } from '$lib/treesitter/inspect';
	import { makeBigSample } from '$lib/samples';

	let { ts }: { ts: TreeSitter } = $props();

	let code = $state(makeBigSample(200));
	let stats = $state<{ incMs: number; ranges: ChangedRange[]; edits: number } | null>(null);
	let fullMs = $state<number | null>(null);
	let coldMs = $state(0);
	let editor: ReturnType<typeof CodeEditor> | undefined = $state();

	// Non-reactive bookkeeping: the previous document and its tree, kept so the
	// next parse can reuse unchanged subtrees.
	let prevText = '';
	let prevTree: Tree | null = null;
	let editCount = 0;
	let fullTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const text = code;
		if (!prevTree) {
			const t0 = performance.now();
			prevTree = ts.parse('svelte', text);
			coldMs = performance.now() - t0;
			prevText = text;
		} else if (text !== prevText) {
			update(text);
		}
	});

	function update(text: string) {
		if (!prevTree) return;

		// 1. tell the old tree where the document changed
		prevTree.edit(computeEdit(prevText, text));

		// 2. incremental parse: reuses every untouched subtree — cheap enough
		//    to run on the keystroke itself
		const a = performance.now();
		const incTree = ts.parse('svelte', text, prevTree);
		const incMs = performance.now() - a;

		const ranges = changedRanges(prevTree, incTree);
		prevTree.delete();
		prevTree = incTree;
		prevText = text;
		editCount += 1;
		stats = { incMs, ranges, edits: editCount };

		// 3. the full-parse benchmark is expensive, so it waits until you stop
		//    typing — otherwise it would wreck the very latency it measures
		fullMs = null;
		clearTimeout(fullTimer);
		fullTimer = setTimeout(() => {
			const b = performance.now();
			const fullTree = ts.parse('svelte', text);
			fullMs = performance.now() - b;
			fullTree.delete();
		}, 350);
	}

	onDestroy(() => {
		clearTimeout(fullTimer);
		prevTree?.delete();
	});

	const lines = $derived(code.split('\n').length);
	const kb = $derived(Math.round(code.length / 1024));
	const speedup = $derived(stats && fullMs !== null && stats.incMs > 0 ? fullMs / stats.incMs : null);

	const escaped = $derived(
		code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
	);
</script>

<div class="demo split">
	<section class="panel">
		<div class="panel-head">
			<strong>big-page.svelte</strong>
			<span class="spacer"></span>
			<span>{lines} lines · {kb} KB · cold parse {coldMs.toFixed(1)} ms</span>
		</div>
		<CodeEditor bind:this={editor} bind:value={code} html={escaped} />
	</section>

	<section class="panel">
		<div class="panel-head">
			<strong>edit → re-parse</strong>
			<span class="spacer"></span>
			{#if stats}<span>{stats.edits} edits</span>{/if}
		</div>
		<div class="panel-body results">
			{#if stats}
				<div class="figures">
					<div class="figure accent">
						<span class="label">incremental re-parse</span>
						<span class="value">{stats.incMs.toFixed(2)}<small> ms</small></span>
						<span class="sub">with <code>tree.edit()</code> + old tree</span>
					</div>
					<div class="figure">
						<span class="label">full re-parse</span>
						{#if fullMs !== null}
							<span class="value">{fullMs.toFixed(1)}<small> ms</small></span>
						{:else}
							<span class="value dim">…</span>
						{/if}
						<span class="sub">same text, from scratch</span>
					</div>
					<div class="figure">
						<span class="label">speedup</span>
						{#if speedup}
							<span class="value">×{speedup >= 100 ? speedup.toFixed(0) : speedup.toFixed(1)}</span>
						{:else}
							<span class="value dim">…</span>
						{/if}
						<span class="sub">on this edit</span>
					</div>
				</div>

				<h3>changed subtrees ({stats.ranges.length})</h3>
				{#each stats.ranges.slice(0, 12) as range, i (i)}
					<button class="range" onclick={() => editor?.select(range.start, range.end)}>
						{range.startPos} → {range.endPos}
					</button>
				{:else}
					<p class="note">
						the edit stayed inside existing nodes — zero structural change to re-parse
					</p>
				{/each}
			{:else}
				<p class="note">Type anywhere in the {lines}-line document on the left.</p>
			{/if}

			<div class="explainer">
				<p>
					<code>tree.edit()</code> tells the parser where the text changed; the next parse then
					<strong>reuses every subtree it can prove unaffected</strong>. Cost tracks the size of
					the edit, not the size of the file — which is how tree-sitter keeps editors responsive
					on files far bigger than this one.
				</p>
				<p>
					It's the same mental model as Svelte itself: don't redo the world on every change —
					know precisely what changed, update just that. Fine-grained reactivity for the UI,
					incremental parsing for the text.
				</p>
				<p>
					(The incremental parse runs on every keystroke; the from-scratch benchmark would
					freeze typing, so it waits until you pause. Highlighting is off in this editor on
					purpose — we're timing the parser, nothing else.)
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	.results {
		padding: 1rem 1.1rem;
	}

	.figures {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.1rem;
	}

	.figure {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.7rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		background: var(--bg-inset);
	}

	.figure.accent {
		border-color: rgba(255, 62, 0, 0.5);
	}

	.figure.accent .value {
		color: var(--accent);
	}

	.label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.value {
		font: 700 1.7rem/1.1 var(--mono);
	}

	.value small {
		font-size: 0.9rem;
		font-weight: 400;
		color: var(--muted);
	}

	.value.dim {
		color: var(--muted);
	}

	.sub {
		font-size: 0.75rem;
		color: var(--muted);
	}

	h3 {
		margin: 0 0 0.3rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--muted);
	}

	.range {
		display: block;
		background: none;
		border: 0;
		color: #61afef;
		font: 12.5px/1.7 var(--mono);
		cursor: pointer;
		padding: 0 0.25rem;
		border-radius: 4px;
		text-align: left;
	}

	.range:hover {
		background: #ffffff10;
	}

	.note {
		color: var(--muted);
		font-size: 0.85rem;
	}

	.explainer {
		margin-top: 1.1rem;
		border-top: 1px solid var(--border-soft);
		padding-top: 0.9rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.explainer p {
		margin: 0 0 0.6rem;
	}

	.explainer strong {
		color: var(--text);
	}
</style>
