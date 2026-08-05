# svelte × tree-sitter

A SvelteKit playground showcasing [tree-sitter](https://tree-sitter.github.io/tree-sitter/) —
the incremental parsing library behind syntax highlighting and code navigation in Zed, Neovim,
Helix and GitHub.

The hook: this app **parses Svelte components, in a Svelte app, live on every keystroke**. The
parser is the C tree-sitter runtime compiled to WebAssembly (`web-tree-sitter`), loading the
community [`@tree-sitter-grammars/tree-sitter-svelte`](https://github.com/tree-sitter-grammars/tree-sitter-svelte)
grammar — the same grammar your editor uses for `.svelte` files. Everything runs client-side;
after the initial load there is no network at all.

## Run it

```sh
pnpm i
pnpm run dev        # http://localhost:5173
```

`pnpm run build` produces a fully static site in `build/` (adapter-static) — deployable to any
static host, or `npm run preview` to serve it locally.

## The demos

| Route          | What it shows                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/tree`        | Live parse-tree explorer. Cursor ↔ node mapping both ways, parse time per keystroke, error recovery with `ERROR` nodes. |
| `/highlight`   | Syntax highlighting driven purely by tree-sitter queries — including **language injections**: JS and CSS grammars re-parse `<script>`, `<style>` and `{expressions}`. Toggle injections off live. |
| `/query`       | Query playground: write S-expression queries with `@captures` and `#predicates` against the sample, see matches highlighted in the source. |
| `/outline`     | "Component anatomy": two queries extract props, `$state`, `$derived`, effects, functions, snippets and used components from any pasted component. |
| `/incremental` | A ~2,000-line document. Each keystroke does a `tree.edit()` + incremental re-parse (sub-millisecond) and compares it against a full re-parse (hundreds of ms). |

## How it's put together

```
src/lib/treesitter/
  queries.js     the tree-sitter queries (plain JS so Node scripts share them)
  core.ts        parser + compiled queries, framework-free
  load.ts        browser bootstrap: WASM runtime + the three grammars
  highlight.ts   captures → HTML spans (two layers: syntax colors + overlays)
  inspect.ts     tree snapshots for the UI, edit diffing, changed ranges
  outline.ts     the component-anatomy extractor
src/lib/components/
  CodeEditor     a textarea over a highlighted <pre> — no editor library
  TreeNode       recursive tree renderer
src/lib/demos/   one component per demo page
static/wasm/     tree-sitter-{svelte,javascript,css}.wasm (prebuilt, from npm)
scripts/
  explore.mjs    print the parse tree of any .svelte file in Node
  check.mjs      compiles every query against the grammars + smoke tests (npm run check:queries)
```

Svelte-side, each demo is the same shape: the document is `$state`, everything else —
tree, highlights, outline, stats — is `$derived`. Parsing is fast enough to be just another
reactive computation, which is kind of the whole talk.

### Where the WASM comes from

Grammars are written as `grammar.js`, compiled by the (Rust) tree-sitter CLI into a generated C
parser, then compiled with emscripten to a small `.wasm` side module. The three binaries in
`static/wasm/` are the prebuilt ones shipped in the npm packages
`@tree-sitter-grammars/tree-sitter-svelte`, `tree-sitter-javascript` and `tree-sitter-css`
(all MIT-licensed). The runtime (`web-tree-sitter`) loads them at startup — see
`src/lib/treesitter/load.ts`.

## demo cheat sheet

- **/tree** — delete a closing tag: the badge flips to "syntax error — recovered" and red
  `ERROR` nodes appear while the rest of the tree stays intact. This is why editors can
  highlight code you're mid-way through typing.
- **/highlight** — toggle "language injections" and the script body drops to plain grey:
  three grammars, one file. Runes are colored Svelte-orange by a single `#match?` predicate.
- **/query** — the presets are ordered as a mini-lesson: plain patterns → predicates →
  structural nesting.
- **/outline** — rename a prop or add a `$state` while people watch the anatomy panel.
- **/incremental** — hold down a key in the middle of the file; incremental stays sub-ms while
  the full parse takes ~700 ms. (Fun fact discovered building this: the Svelte grammar scales
  super-linearly with sibling count, which makes the incremental win even more dramatic.)
- Node bonus: `node scripts/explore.mjs src/routes/+page.svelte` — same grammar, no browser.
