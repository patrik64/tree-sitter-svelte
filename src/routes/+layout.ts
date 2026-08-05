// Everything runs in the browser: the parsers are WebAssembly modules that
// need `WebAssembly` and `fetch`, so we skip SSR and prerender static shells.
export const ssr = false;
export const prerender = true;
