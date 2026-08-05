<script lang="ts">
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	import type { TreeSitter } from '$lib/treesitter/core';
	import { renderHighlighted, svelteSpans } from '$lib/treesitter/highlight';
	import { SVELTE_HIGHLIGHTS, SVELTE_INJECTIONS } from '$lib/treesitter/queries';
	import { SAMPLE } from '$lib/samples';

	let { ts }: { ts: TreeSitter } = $props();

	let code = $state(SAMPLE);
	let injections = $state(true);

	const result = $derived.by(() => {
		const t0 = performance.now();
		const tree = ts.parse('svelte', code);
		const spans = svelteSpans(ts, code, tree, injections);
		const ms = performance.now() - t0;
		tree.delete();
		return { spans, ms };
	});

	const html = $derived(renderHighlighted(code, result.spans));

	const legend = $derived(
		[...new Set(result.spans.map((s) => s.cls))].sort()
	);
</script>

<div class="demo split">
	<section class="panel">
		<div class="panel-head">
			<strong>component.svelte</strong>
			<span class="spacer"></span>
			<span>highlighted in {result.ms.toFixed(1)} ms · {result.spans.length} captures</span>
		</div>
		<CodeEditor bind:value={code} {html} />
	</section>

	<section class="panel">
		<div class="panel-head">
			<strong>how it works</strong>
			<span class="spacer"></span>
			<label class="check">
				<input type="checkbox" bind:checked={injections} />
				language injections
			</label>
		</div>
		<div class="panel-body prose">
			<p>
				There is no highlighter here — only a parser and a <em>query</em>. The query below
				pattern-matches the tree and tags nodes with capture names like
				<code>@tag</code> or <code>@keyword</code>; each capture maps to a CSS class.
			</p>
			<p>
				One grammar can't know three languages, so the Svelte grammar marks
				<code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> and every
				<code>&#123;expression&#125;</code> as <strong>injection</strong> regions. Those slices get
				re-parsed with the JavaScript and CSS grammars and the captures are overlaid — the exact
				mechanism Zed, Neovim and Helix use to highlight <code>.svelte</code> files. Toggle it off
				above and watch the script body go grey.
			</p>
			<p>
				Bonus: runes like <code>$state</code> are plain identifiers to JavaScript, but one
				<code>#match?</code> predicate paints them Svelte-orange.
			</p>

			<h3>captures in this document</h3>
			<p class="chips">
				{#each legend as name (name)}
					<code class="tok-{name.split('.')[0].replace(/[^a-zA-Z0-9]+/g, '-')}">@{name}</code>
				{/each}
			</p>

			<details>
				<summary>highlights query (Svelte grammar)</summary>
				<pre>{SVELTE_HIGHLIGHTS.trim()}</pre>
			</details>
			<details>
				<summary>injections query</summary>
				<pre>{SVELTE_INJECTIONS.trim()}</pre>
			</details>
		</div>
	</section>
</div>

<p class="hint">
	Edit the code on the left — colors come straight from the live parse. Try typing half a tag or
	an unclosed brace: error recovery keeps the rest of the file colored.
</p>

<style>
	.prose {
		padding: 0.9rem 1.1rem;
		font-size: 0.88rem;
	}

	.prose p {
		margin: 0 0 0.75rem;
		color: var(--text);
	}

	.prose h3 {
		margin: 1.1rem 0 0.4rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.chips code {
		background: #ffffff0d;
		border: 1px solid var(--border-soft);
	}

	details {
		margin-top: 0.6rem;
		border: 1px solid var(--border-soft);
		border-radius: 8px;
		overflow: hidden;
	}

	summary {
		cursor: pointer;
		padding: 0.45rem 0.75rem;
		font-size: 0.82rem;
		color: var(--muted);
		user-select: none;
	}

	summary:hover {
		color: var(--text);
	}

	details pre {
		margin: 0;
		padding: 0.75rem;
		background: var(--bg-inset);
		font: 12px/1.6 var(--mono);
		overflow: auto;
		max-height: 300px;
	}
</style>
