<script lang="ts">
	// A textarea with a highlighted <pre> behind it. The textarea's text is
	// transparent (only the caret shows); the backdrop renders the same text
	// with tree-sitter-driven <span>s. No editor library required.
	interface Props {
		value: string;
		html: string;
		onCursor?: (index: number) => void;
		label?: string;
	}

	let { value = $bindable(), html, onCursor, label = 'code editor' }: Props = $props();

	let textarea: HTMLTextAreaElement | undefined = $state();
	let backdrop: HTMLElement | undefined = $state();

	/** Select a character range and scroll it into view (used by tree/outline). */
	export function select(start: number, end: number) {
		if (!textarea) return;
		textarea.focus();
		textarea.setSelectionRange(start, end);
		const line = value.slice(0, start).split('\n').length - 1;
		const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
		textarea.scrollTop = Math.max(0, line * lineHeight - textarea.clientHeight / 2);
		syncScroll();
		onCursor?.(start);
	}

	function syncScroll() {
		if (!backdrop || !textarea) return;
		backdrop.scrollTop = textarea.scrollTop;
		backdrop.scrollLeft = textarea.scrollLeft;
	}

	function report() {
		if (onCursor && textarea) onCursor(textarea.selectionStart);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Tab' && textarea) {
			event.preventDefault();
			const { selectionStart, selectionEnd } = textarea;
			textarea.setRangeText('\t', selectionStart, selectionEnd, 'end');
			value = textarea.value;
			report();
		}
	}
</script>

<div class="editor">
	<pre class="backdrop" bind:this={backdrop} aria-hidden="true"><code>{@html html}{'\n'}</code></pre>
	<textarea
		bind:this={textarea}
		bind:value
		spellcheck="false"
		autocomplete="off"
		autocapitalize="off"
		wrap="off"
		aria-label={label}
		onscroll={syncScroll}
		oninput={report}
		onclick={report}
		onkeyup={report}
		{onkeydown}
	></textarea>
</div>

<style>
	.editor {
		position: relative;
		flex: 1;
		min-height: 0;
		background: var(--bg-inset);
	}

	.backdrop,
	textarea {
		position: absolute;
		inset: 0;
		margin: 0;
		border: 0;
		padding: 14px 16px;
		font: 13.5px/1.65 var(--mono);
		tab-size: 2;
		white-space: pre;
		background: transparent;
		color: var(--text);
	}

	.backdrop {
		overflow: hidden;
		pointer-events: none;
	}

	.backdrop code {
		font: inherit;
		background: none;
		padding: 0;
	}

	textarea {
		overflow: auto;
		color: transparent;
		caret-color: #ffffff;
		resize: none;
		outline: none;
	}

	textarea::selection {
		background: rgba(97, 175, 239, 0.3);
		color: transparent;
	}
</style>
