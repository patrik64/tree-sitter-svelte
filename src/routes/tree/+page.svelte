<script lang="ts">
	import { loadTreeSitter } from '$lib/treesitter/load';
	import TreeExplorer from '$lib/demos/TreeExplorer.svelte';
</script>

<svelte:head>
	<title>Tree · svelte × tree-sitter</title>
</svelte:head>

<hgroup class="page-head">
	<h1>Every keystroke, a tree</h1>
	<p>
		The document is <code>$state</code>, the syntax tree is <code>$derived</code> — parsing is
		fast enough to just be another reactive computation.
	</p>
</hgroup>

{#await loadTreeSitter()}
	<div class="loading">loading WebAssembly parsers…</div>
{:then ts}
	<TreeExplorer {ts} />
{:catch error}
	<div class="loading">failed to load parsers: {error}</div>
{/await}
