import { Item, RootItem } from './Item'
import { modifierKey } from './util/modifierKey'

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
  root: RootItem<K, unknown>,
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

  // if (mode === SelectionMode.Range) {
  //   const first = prev[0]
  //   if (first == null) {
  //     return { mode, focus: [key] }
  //   }

  //   const items_ = items()
  //   const i = items_.findIndex(item => item.key === first)
  //   const j = items_.findIndex(item => item.key === key)
  //   if (!items_[i] || !items_[j] || items_[i].level !== items_[j].level) {
  //     return { mode, focus: prev.slice() }
  //   }

  //   const keys: K[] = []
  //   const level = items_[i].level
  //   for (let k = Math.min(i, j); k <= Math.max(i, j); k++) {
  //     const item = items_[k]
  //     if (item?.kind !== 'block' || item.level > level) continue
  //     if (item.level < level) {
  //       return { mode, focus: prev.slice() }
  //     }
  //     keys.push(item.key)
  //   }

  //   if (i > j) keys.reverse()

  //   return { mode, focus: keys }
  // }

  return { mode, focus: [] }
}

export function normaliseSelection<K>(root: RootItem<K, unknown>, keys: K[]): K[] {
  const childKeys = new Set<K>()

  const process = (item: Item<K, unknown>, insert = false) => {
    if (item.kind !== 'block') return
    if (insert) childKeys.add(item.key)
    insert ||= keys.includes(item.key)
    item.children.forEach(child => process(child, insert))
  }

  process(root)

  return keys.filter(key => !childKeys.has(key))
}
