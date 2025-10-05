import { Accessor } from 'solid-js'
import { Item } from './Item'

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

export type UpdateSelectReturn<K> = {
  mode: SelectionMode
  focus?: K[]
  click?: K[]
}

export function updateSelection<K>(
  items: Accessor<Item<K, unknown>[]>,
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

    const items_ = items()
    const i = items_.findIndex(item => item.key === first)
    const j = items_.findIndex(item => item.key === key)
    if (i < 0 || j < 0) {
      return { mode, focus: prev.slice() }
    }

    const range = items_.slice(Math.min(i, j), Math.max(i, j) + 1).filter(item => item.kind === 'block')
    const level = range[0]!.level
    if (range.find(item => item.level !== level)) {
      return { mode, focus: prev.slice() }
    }

    const keys = range.map(item => item.key)
    if (i > j) keys.reverse()

    return { mode, focus: keys }
  }

  return { mode, focus: [] }
}

export function normaliseSelection<K>(items: Accessor<Item<K, unknown>[]>, keys: K[]): K[] {
  keys = keys.slice()

  let lastItem: Item<K> | undefined
  for (const item of items()) {
    if (item.kind !== 'block') continue

    if (lastItem && item.level <= lastItem.level) {
      lastItem = undefined
    }

    const index = keys.indexOf(item.key)
    if (index < 0) continue

    if (lastItem) {
      keys.splice(index, 1)
    } else {
      lastItem = item
    }
  }

  return keys
}
