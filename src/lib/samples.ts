// Sample documents shown in the demos.

export const SAMPLE = `<script>
	let { name = 'world' } = $props();
	let count = $state(0);
	const double = $derived(count * 2);

	// try breaking the syntax — the parser recovers
	function greet() {
		console.log(\`hello \${name}\`);
	}
</script>

<h1 class="title">Hello {name}!</h1>

{#if count > 0}
	<p>{count} × 2 = {double}</p>
{:else}
	<p>Click the button</p>
{/if}

{#each ['svelte', 'tree-sitter'] as tool (tool)}
	<Badge label={tool} />
{/each}

<button onclick={() => count++}>
	clicked {count} times
</button>

<style>
	.title {
		color: #ff3e00;
		font-size: 2rem;
	}
</style>
`;

export const OUTLINE_SAMPLE = `<script>
	let { title, items = [], onselect, variant = 'list' } = $props();

	let selected = $state(null);
	let query = $state('');

	const filtered = $derived(items.filter((i) => i.label.includes(query)));
	const stats = $derived.by(() => {
		return { shown: filtered.length, total: items.length };
	});

	$effect(() => {
		console.log('selection changed:', selected);
	});

	function choose(item) {
		selected = item;
		onselect?.(item);
	}
</script>

{#snippet row(item)}
	<li class:active={item === selected}>
		<button onclick={() => choose(item)}>{item.label}</button>
	</li>
{/snippet}

<header>
	<h2>{title} · {stats.shown}/{stats.total}</h2>
	<SearchBox bind:value={query} placeholder="Filter…" />
</header>

{#if filtered.length === 0}
	<EmptyState message="No matches" />
{:else}
	<ul class={variant}>
		{#each filtered as item (item.id)}
			{@render row(item)}
		{/each}
	</ul>
{/if}

<style>
	li.active {
		outline: 2px solid #ff3e00;
	}
</style>
`;

export const DEFAULT_QUERY = `; queries are S-expressions matching tree shapes
(start_tag (tag_name) @tag)

; predicates refine matches — components are Capitalized
((tag_name) @component
	(#match? @component "^[A-Z]"))
`;

export const PRESET_QUERIES: { label: string; source: string }[] = [
	{
		label: 'tags & components',
		source: DEFAULT_QUERY
	},
	{
		label: 'event handlers',
		source: `; every attribute that starts with "on"
((attribute_name) @event
	(#match? @event "^on"))
`
	},
	{
		label: 'template expressions',
		source: `; every {expression}, condition, each-item …
(svelte_raw_text) @expression
`
	},
	{
		label: 'snippets & renders',
		source: `(snippet_start (snippet_name) @definition)
(render_tag) @usage
`
	},
	{
		label: 'headings with text',
		source: `; structural nesting: text inside h1–h6 only
((element
	(start_tag (tag_name) @_t)
	(text) @heading)
	(#match? @_t "^h[1-6]$"))
`
	}
];

/** A deliberately large document for the incremental-parsing demo. */
export function makeBigSample(sections = 400): string {
	const parts = [
		`<script>
	let items = $state([]);
	let selected = $state(null);

	function select(i) {
		selected = i;
	}
</script>
`
	];
	for (let i = 0; i < sections; i++) {
		parts.push(`<section id="row-${i}" class="row">
	<h2>Item ${i}</h2>
	{#if items[${i}]}
		<p>{items[${i}].label}</p>
	{:else}
		<p class="empty">nothing loaded yet</p>
	{/if}
	<button onclick={() => select(${i})}>select #${i}</button>
</section>
`);
	}
	parts.push(`<style>
	.row {
		padding: 1rem;
		border-bottom: 1px solid #333;
	}
	.empty {
		opacity: 0.5;
	}
</style>
`);
	return parts.join('\n');
}
