<script lang="ts">
	import { loadTreeSitter } from '$lib/treesitter/load';
	import OutlineDemo from '$lib/demos/OutlineDemo.svelte';
</script>

<svelte:head>
	<title>Outline · svelte × tree-sitter</title>
</svelte:head>

<hgroup class="page-head">
	<h1>Component anatomy, extracted</h1>
	<p>
		One query on the Svelte tree finds the script and snippets; one query on the injected
		JavaScript tree finds runes — together they read a component like documentation.
	</p>
</hgroup>

{#await loadTreeSitter()}
	<div class="loading">loading WebAssembly parsers…</div>
{:then ts}
	<OutlineDemo {ts} />
{:catch error}
	<div class="loading">failed to load parsers: {error}</div>
{/await}
