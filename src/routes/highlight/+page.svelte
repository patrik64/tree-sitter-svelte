<script lang="ts">
	import { loadTreeSitter } from '$lib/treesitter/load';
	import HighlightDemo from '$lib/demos/HighlightDemo.svelte';
</script>

<svelte:head>
	<title>Highlight · svelte × tree-sitter</title>
</svelte:head>

<hgroup class="page-head">
	<h1>Highlighting is a query</h1>
	<p>
		Three grammars cooperate on one file: Svelte owns the document, JavaScript and CSS are
		injected into <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> and every expression.
	</p>
</hgroup>

{#await loadTreeSitter()}
	<div class="loading">loading WebAssembly parsers…</div>
{:then ts}
	<HighlightDemo {ts} />
{:catch error}
	<div class="loading">failed to load parsers: {error}</div>
{/await}
