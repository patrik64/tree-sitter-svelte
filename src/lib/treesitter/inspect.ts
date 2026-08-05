// Snapshots a web-tree-sitter tree into plain objects the UI can render.
// (Tree nodes live in WASM memory; copying them out keeps the Svelte side
// simple and lets us delete() trees as soon as we're done with them.)
import { Edit, type Node, type Tree } from 'web-tree-sitter';

export interface DisplayNode {
	id: number;
	type: string;
	/** Field name this node occupies in its parent, e.g. "condition". */
	field: string | null;
	named: boolean;
	start: number;
	end: number;
	startPos: string;
	endPos: string;
	isError: boolean;
	isMissing: boolean;
	children: DisplayNode[];
}

export function buildDisplayTree(root: Node): DisplayNode {
	const cursor = root.walk();

	function build(): DisplayNode {
		const n = cursor.currentNode;
		const d: DisplayNode = {
			id: n.id,
			type: n.type,
			field: cursor.currentFieldName ?? null,
			named: n.isNamed,
			start: n.startIndex,
			end: n.endIndex,
			startPos: `${n.startPosition.row}:${n.startPosition.column}`,
			endPos: `${n.endPosition.row}:${n.endPosition.column}`,
			isError: n.isError || n.type === 'ERROR',
			isMissing: n.isMissing,
			children: []
		};
		if (cursor.gotoFirstChild()) {
			do {
				d.children.push(build());
			} while (cursor.gotoNextSibling());
			cursor.gotoParent();
		}
		return d;
	}

	const result = build();
	cursor.delete();
	return result;
}

export function countNodes(node: DisplayNode): number {
	return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

/** Root-to-leaf chain of nodes containing the given character index. */
export function pathAtIndex(root: DisplayNode, index: number): DisplayNode[] {
	const path: DisplayNode[] = [];
	let current: DisplayNode | undefined = root;
	while (current) {
		path.push(current);
		const named: DisplayNode | undefined = current.children.find(
			(c) => c.named && c.start <= index && index < c.end
		);
		current = named ?? current.children.find((c) => c.start <= index && index < c.end);
	}
	return path;
}

/** Single-edit diff between two versions of a document, for Tree.edit(). */
export function computeEdit(oldText: string, newText: string) {
	let start = 0;
	while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
		start++;
	}
	let oldEnd = oldText.length;
	let newEnd = newText.length;
	while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
		oldEnd--;
		newEnd--;
	}
	return new Edit({
		startIndex: start,
		oldEndIndex: oldEnd,
		newEndIndex: newEnd,
		startPosition: position(oldText, start),
		oldEndPosition: position(oldText, oldEnd),
		newEndPosition: position(newText, newEnd)
	});
}

function position(text: string, index: number) {
	let row = 0;
	let lineStart = 0;
	for (let i = 0; i < index; i++) {
		if (text.charCodeAt(i) === 10) {
			row++;
			lineStart = i + 1;
		}
	}
	return { row, column: index - lineStart };
}

export interface ChangedRange {
	start: number;
	end: number;
	startPos: string;
	endPos: string;
}

export function changedRanges(oldTree: Tree, newTree: Tree): ChangedRange[] {
	return oldTree.getChangedRanges(newTree).map((r) => ({
		start: r.startIndex,
		end: r.endIndex,
		startPos: `${r.startPosition.row}:${r.startPosition.column}`,
		endPos: `${r.endPosition.row}:${r.endPosition.column}`
	}));
}
