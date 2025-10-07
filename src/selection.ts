import { createBlockItemId, Item } from './Item'
import { modifierKey } from './util/modifierKey'
import { notNull } from './util/notNull'
import { VirtualTree } from './virtual-tree'

export enum SelectionMode {
  /**
   * The default selection mode, which selects
   * the clicked block and deselects all others;
   * applied when no additional keys are pressed. */
  Set = 'set',
  /**
   * Toggles the selection state of the clicked block;
   * applied when the modifier key is pressed.
   */
  Toggle = 'toggle',
  /**
   * Selects all blocks between the most recently
   * selected block and the clicked block;
   * applied when the shift key is pressed.
   */
  Range = 'range',
  /** Deselects all blocks. */
  Deselect = 'deselect',
}

export function calculateSelectionMode(ev: MouseEvent, multiselect: boolean) {
  if (!multiselect) {
    return SelectionMode.Set
  }
  if (ev[modifierKey]) {
    return SelectionMode.Toggle
  }
  if (ev.shiftKey) {
    return SelectionMode.Range
  }
  return SelectionMode.Set
}

export type UpdateSelectReturn<K> = {
  mode: SelectionMode
  focus?: K[]
  click?: K[]
}

export function updateSelection<K>(
  tree: VirtualTree<K, unknown>,
  prev: K[],
  key: K,
  mode: SelectionMode,
): UpdateSelectReturn<K> {
  if (mode === SelectionMode.Set) {
    const next = [key]

    if (prev.includes(key)) {
      return { mode, focus: prev.slice(), click: next }
    } else {
      return { mode, focus: next }
    }
  }

  if (mode === SelectionMode.Toggle) {
    // Update the selection
    const keys = prev.slice()

    // Toggle the item
    const index = keys.indexOf(key)
    if (index < 0) {
      keys.push(key)
    } else {
      keys.splice(index, 1)
    }

    return { mode, focus: keys }
  }

  if (mode === SelectionMode.Range) {
    const first = prev[0]
    if (first == null) {
      return { mode, focus: [key] }
    }

    const parentId = tree.findParent(createBlockItemId(first))
    if (!parentId) {
      return { mode, focus: [key] }
    }

    const children = tree
      .children(parentId)
      .map(item => (item.kind === 'block' ? item.key : null))
      .filter(notNull)

    const i = children.indexOf(first)
    const j = children.indexOf(key)
    if (i < 0 || j < 0) {
      return { mode, focus: [key] }
    }

    const keys = children.slice(Math.min(i, j), Math.max(i, j) + 1)
    if (i > j) keys.reverse()

    return { mode, focus: keys }
  }

  return { mode, focus: [] }
}

export function normaliseSelection<K>(tree: VirtualTree<K, unknown>, keys: K[]): K[] {
  const childKeys = new Set<K>()

  const process = (item: Item<K, unknown>, insert = false) => {
    if (item.kind !== 'block') return
    if (insert) childKeys.add(item.key)
    insert ||= keys.includes(item.key)
    tree.children(item.id).forEach(child => process(child, insert))
  }

  tree.children(tree.root.id).forEach(child => process(child))

  return keys.filter(key => !childKeys.has(key))
}
