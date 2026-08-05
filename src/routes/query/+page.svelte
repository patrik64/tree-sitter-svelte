<script lang="ts">
	import { loadTreeSitter } from '$lib/treesitter/load';
	import QueryPlayground from '$lib/demos/QueryPlayground.svelte';
</script>

<svelte:head>
	<title>Query · svelte × tree-sitter</title>
</svelte:head>

<hgroup class="page-head">
	<h1>CSS selectors, but for syntax</h1>
	<p>
		S-expression patterns match tree shapes; <code>@captures</code> pull out nodes and
		<code>#predicates</code> refine them. Live, against the code on the left.
	</p>
</hgroup>

{#await loadTreeSitter()}
	<div class="loading">loading WebAssembly parsers…</div>
{:then ts}
	<QueryPlayground {ts} />
{:catch error}
	<div class="loading">failed to load parsers: {error}</div>
{/await}
