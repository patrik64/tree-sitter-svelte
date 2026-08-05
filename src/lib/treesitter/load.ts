// Browser-side loader: boots the tree-sitter WASM runtime and fetches the
// three grammar binaries from /static/wasm. Memoized — every page shares one
// runtime and one set of compiled queries.
import { Parser, Language } from 'web-tree-sitter';
import coreWasmUrl from 'web-tree-sitter/web-tree-sitter.wasm?url';
import { base } from '$app/paths';
import { createTreeSitter, type TreeSitter } from './core';

let instance: Promise<TreeSitter> | undefined;

export function loadTreeSitter(): Promise<TreeSitter> {
	instance ??= init();
	return instance;
}

async function init(): Promise<TreeSitter> {
	await Parser.init({ locateFile: () => coreWasmUrl });
	const grammar = (name: string) => Language.load(`${base}/wasm/tree-sitter-${name}.wasm`);
	const [svelte, javascript, css] = await Promise.all([
		grammar('svelte'),
		grammar('javascript'),
		grammar('css')
	]);
	return createTreeSitter({ svelte, javascript, css });
}
