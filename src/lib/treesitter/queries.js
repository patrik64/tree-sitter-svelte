// Tree-sitter queries used by the app. Queries are S-expressions that pattern-
// match against the syntax tree; `@name` captures the matched node. Captures
// starting with `_` are helpers for predicates and are not used for styling.

/** Highlights for the Svelte grammar (@tree-sitter-grammars/tree-sitter-svelte). */
export const SVELTE_HIGHLIGHTS = `
; ---- elements & attributes ----
(tag_name) @tag
(attribute_name) @attribute
(attribute_value) @string
(erroneous_end_tag_name) @error
(comment) @comment

; Svelte components are capitalized
((tag_name) @tag.component
	(#match? @tag.component "^[A-Z]"))

; directives like bind:value, on:click, class:active, use:action
((attribute_name) @attribute.directive
	(#match? @attribute.directive "^(bind|on|use|class|style|transition|in|out|animate|let):"))

; ---- svelte template blocks ----
(snippet_name) @function

[
	"if"
	"else"
	"each"
	"await"
	"then"
	"catch"
	"as"
	"key"
	"snippet"
	"html"
	"render"
	"debug"
	"const"
] @keyword

[
	"{"
	"}"
] @punctuation.bracket

[
	"<"
	">"
	"</"
	"/>"
] @tag.delimiter

[
	"#"
	":"
	"/"
	"@"
] @tag.delimiter

"=" @operator
`;

/** Where other languages live inside a Svelte document. */
export const SVELTE_INJECTIONS = `
(script_element (raw_text) @injection.js)
(style_element (raw_text) @injection.css)

; every {expression}, block condition, each item, snippet params …
(svelte_raw_text) @injection.js
`;

/** Highlights for JavaScript. Order matters: generic captures first, specific last. */
export const JS_HIGHLIGHTS = `
(identifier) @variable
(property_identifier) @property
(shorthand_property_identifier) @property
(shorthand_property_identifier_pattern) @property

(call_expression function: (identifier) @function)
(call_expression function: (member_expression property: (property_identifier) @function))
(function_declaration name: (identifier) @function)
(method_definition name: (property_identifier) @function)

(string) @string
(template_string) @string
(regex) @string
(number) @number
(comment) @comment

[
	(true)
	(false)
	(null)
	(undefined)
] @constant

(this) @variable.builtin

[
	"const" "let" "var" "function" "return"
	"if" "else" "for" "while" "do" "switch" "case" "break" "continue"
	"new" "class" "extends" "static" "get" "set"
	"import" "from" "export" "default"
	"async" "await" "yield"
	"typeof" "instanceof" "of" "in" "delete" "void"
	"try" "catch" "finally" "throw"
] @keyword

[
	"=" "=>" "==" "===" "!=" "!==" "<" ">" "<=" ">="
	"+" "-" "*" "/" "%" "**"
	"&&" "||" "??" "!" "..." (optional_chain)
	"+=" "-=" "*=" "/=" "++" "--"
] @operator

[";" "," "."] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket

; Svelte 5 runes — plain identifiers to JavaScript, special to us
((identifier) @function.rune
	(#match? @function.rune "^\\\\$(state|derived|effect|props|bindable|inspect|host)$"))
((member_expression object: (identifier) @function.rune)
	(#match? @function.rune "^\\\\$(state|derived|effect|inspect)$"))
`;

/** Highlights for CSS. */
export const CSS_HIGHLIGHTS = `
(comment) @comment
(tag_name) @tag
(class_name) @type
(id_name) @constant
(property_name) @property
(feature_name) @property
(plain_value) @constant
(string_value) @string
(color_value) @number
(integer_value) @number
(float_value) @number
(unit) @number
(important) @keyword
(at_keyword) @keyword
(pseudo_class_selector (class_name) @attribute)
["{" "}" "(" ")"] @punctuation.bracket
[":" ";" ","] @punctuation.delimiter
`;

/** Extracts the component's public shape from the <script> (JavaScript) tree. */
export const JS_OUTLINE = `
; let { title, items = [] } = $props()
((variable_declarator
	name: (object_pattern) @props.pattern
	value: (call_expression function: (identifier) @_fn))
	(#eq? @_fn "$props"))

; let count = $state(0)
((variable_declarator
	name: (identifier) @state.name
	value: (call_expression
		function: (identifier) @_fn
		arguments: (arguments) @state.args))
	(#eq? @_fn "$state"))

; let big = $state.raw(...)
((variable_declarator
	name: (identifier) @state.name
	value: (call_expression
		function: (member_expression object: (identifier) @_fn)
		arguments: (arguments) @state.args))
	(#eq? @_fn "$state"))

; const double = $derived(count * 2)
((variable_declarator
	name: (identifier) @derived.name
	value: (call_expression
		function: (identifier) @_fn
		arguments: (arguments) @derived.args))
	(#eq? @_fn "$derived"))

; const total = $derived.by(() => ...)
((variable_declarator
	name: (identifier) @derived.name
	value: (call_expression
		function: (member_expression object: (identifier) @_fn)
		arguments: (arguments) @derived.args))
	(#eq? @_fn "$derived"))

; $effect(() => ...)
((call_expression
	function: (identifier) @_fn) @effect.call
	(#eq? @_fn "$effect"))

; $effect.pre(() => ...)
((call_expression
	function: (member_expression
		object: (identifier) @_fn
		property: (property_identifier) @effect.kind)) @effect.call
	(#eq? @_fn "$effect"))

(function_declaration name: (identifier) @function.name)
`;

/** Extracts template-level facts from the Svelte tree. */
export const SVELTE_OUTLINE = `
((tag_name) @component
	(#match? @component "^[A-Z]"))

(snippet_start
	(snippet_name) @snippet.name
	(svelte_raw_text)? @snippet.params)

(script_element (raw_text) @script)
`;
