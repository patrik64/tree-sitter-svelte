<script lang="ts">
	const demos = [
		{
			href: '/tree',
			title: 'Every keystroke, a tree',
			text: 'Type Svelte, watch the syntax tree rebuild live. Cursor ↔ node mapping, error recovery included.'
		},
		{
			href: '/highlight',
			title: 'Highlighting is a query',
			text: 'No regex highlighter — captures from the grammar drive the colors, with JS and CSS injected inside.'
		},
		{
			href: '/query',
			title: 'CSS selectors for syntax',
			text: 'Write S-expression queries against the tree and see every capture light up in the source.'
		},
		{
			href: '/outline',
			title: 'Component anatomy',
			text: 'Props, $state, $derived, snippets — extracted from any component with two queries.'
		},
		{
			href: '/incremental',
			title: 'Parse only what changed',
			text: 'Edit a 2,000-line file and compare an incremental re-parse against a full one.'
		}
	];
</script>

<svelte:head>
	<title>svelte × tree-sitter</title>
	<meta
		name="description"
		content="A SvelteKit playground that parses Svelte components with tree-sitter, live in the browser via WebAssembly."
	/>
</svelte:head>

<section class="hero">
	<h1><span class="orange">Parsing Svelte,</span> in Svelte.</h1>
	<p class="lede">
		tree-sitter is the incremental parsing library behind syntax highlighting and code navigation
		in Zed, Neovim, Helix and GitHub. This app runs it as WebAssembly inside SvelteKit — parsing
		Svelte components with the community Svelte grammar, on every keystroke, entirely in your
		browser.
	</p>
	<div class="cta">
		<a class="button primary" href="/tree">start with the tree →</a>
		<a class="button" href="https://tree-sitter.github.io/tree-sitter/">tree-sitter docs</a>
	</div>
</section>

<section class="cards">
	{#each demos as demo (demo.href)}
		<a class="card" href={demo.href}>
			<h3>{demo.title}</h3>
			<p>{demo.text}</p>
		</a>
	{/each}
</section>

<section class="columns">
	<div>
		<h2>How a grammar reaches the browser</h2>
		<ol class="pipeline">
			<li>
				<code>grammar.js</code>
				<span>the Svelte grammar — a parser described in JavaScript</span>
			</li>
			<li>
				<code>tree-sitter generate</code>
				<span>the Rust CLI turns it into a generated C parser</span>
			</li>
			<li>
				<code>parser.c → .wasm</code>
				<span>compiled with emscripten into a ~45 KB module</span>
			</li>
			<li>
				<code>web-tree-sitter</code>
				<span>loads it at runtime, next to your Svelte code</span>
			</li>
		</ol>
		<p class="fine">
			Three grammars are loaded here — <code>svelte</code>, <code>javascript</code> and
			<code>css</code> — about 1&nbsp;MB of WASM in total, then zero network after that.
		</p>
	</div>
	<div>
		<h2>Why this pairing works</h2>
		<ul class="reasons">
			<li>
				<strong>Same philosophy.</strong> Svelte updates only the DOM that changed; tree-sitter
				re-parses only the code that changed. Fine-grained invalidation, both sides.
			</li>
			<li>
				<strong>Your editor already does this.</strong> When Zed, Neovim or Helix highlight a
				<code>.svelte</code> file, they use the very grammar running on these pages.
			</li>
			<li>
				<strong>Runes fit perfectly.</strong> In every demo the document is
				<code>$state</code> and the tree is <code>$derived</code> — parse, highlight and outline
				just fall out of reactivity.
			</li>
		</ul>
	</div>
</section>

<style>
	.hero {
		padding: 3.5rem 0 2rem;
		max-width: 62rem;
	}

	h1 {
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		margin: 0 0 1rem;
		letter-spacing: -0.02em;
	}

	.orange {
		color: var(--accent);
	}

	.lede {
		font-size: 1.08rem;
		color: var(--muted);
		max-width: 58ch;
		margin: 0 0 1.5rem;
	}

	.cta {
		display: flex;
		gap: 0.75rem;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.9rem;
		margin: 1.5rem 0 2.5rem;
	}

	.card {
		display: block;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1rem 1.1rem;
		text-decoration: none;
		background: var(--bg-raised);
		transition:
			border-color 0.15s,
			transform 0.15s;
	}

	.card:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.card h3 {
		margin: 0 0 0.35rem;
		font-size: 1rem;
	}

	.card p {
		margin: 0;
		font-size: 0.84rem;
		color: var(--muted);
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 2.5rem;
		padding-bottom: 2rem;
	}

	h2 {
		font-size: 1.15rem;
		margin: 0 0 0.8rem;
	}

	.pipeline {
		list-style: none;
		counter-reset: step;
		margin: 0;
		padding: 0;
	}

	.pipeline li {
		counter-increment: step;
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0 0.5rem 2.2rem;
		position: relative;
	}

	.pipeline li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0.65rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		font: 700 0.8rem/1.5rem var(--mono);
		text-align: center;
	}

	.pipeline code {
		align-self: flex-start;
	}

	.pipeline span {
		color: var(--muted);
		font-size: 0.85rem;
	}

	.reasons {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.reasons li {
		margin-bottom: 0.9rem;
		color: var(--muted);
		font-size: 0.92rem;
	}

	.reasons strong {
		color: var(--text);
		display: block;
	}

	.fine {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
