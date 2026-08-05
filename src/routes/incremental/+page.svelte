<script lang="ts">
	import { loadTreeSitter } from '$lib/treesitter/load';
	import IncrementalDemo from '$lib/demos/IncrementalDemo.svelte';
</script>

<svelte:head>
	<title>Incremental · svelte × tree-sitter</title>
</svelte:head>

<hgroup class="page-head">
	<h1>Parse only what changed</h1>
	<p>
		tree-sitter's superpower: after an edit, the old tree is recycled and only the affected
		subtrees are re-parsed. Svelte thinking, applied to parsing.
	</p>
</hgroup>

{#await loadTreeSitter()}
	<div class="loading">loading WebAssembly parsers…</div>
{:then ts}
	<IncrementalDemo {ts} />
{:catch error}
	<div class="loading">failed to load parsers: {error}</div>
{/await}
