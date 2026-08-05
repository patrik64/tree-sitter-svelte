<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/tree', label: 'Tree' },
		{ href: '/highlight', label: 'Highlight' },
		{ href: '/query', label: 'Query' },
		{ href: '/outline', label: 'Outline' },
		{ href: '/incremental', label: 'Incremental' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header>
		<a class="brand" href="/">
			<span class="brand-svelte">svelte</span>
			<span class="brand-x">×</span>
			<span class="brand-ts">tree-sitter</span>
		</a>
		<nav>
			{#each links as link (link.href)}
				<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<span>
			built with SvelteKit · parsing by <code>web-tree-sitter</code> ·
			grammar: <code>@tree-sitter-grammars/tree-sitter-svelte</code>
		</span>
	</footer>
</div>

<style>
	.app {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		max-width: 1440px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	header {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--border-soft);
	}

	.brand {
		text-decoration: none;
		font-weight: 700;
		font-size: 1.05rem;
		display: flex;
		gap: 0.4rem;
		align-items: baseline;
	}

	.brand-svelte {
		color: var(--accent);
	}

	.brand-x {
		color: var(--muted);
		font-weight: 400;
	}

	.brand-ts {
		color: #98c379;
		font-family: var(--mono);
		font-size: 0.95rem;
	}

	nav {
		display: flex;
		gap: 0.25rem;
	}

	nav a {
		text-decoration: none;
		color: var(--muted);
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	nav a:hover {
		color: var(--text);
		background: #ffffff0d;
	}

	nav a[aria-current='page'] {
		color: var(--text);
		background: var(--accent-soft);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	footer {
		padding: 1rem 0 1.25rem;
		color: var(--muted);
		font-size: 0.78rem;
		border-top: 1px solid var(--border-soft);
		margin-top: 1rem;
	}
</style>
