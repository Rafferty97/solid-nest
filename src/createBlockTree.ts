import { createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { Block, Place, RootBlock, SelectionEvent } from 'src'
import { InsertEvent, ReorderEvent, RemoveEvent } from 'src'

/**
 * Creates a Solid.JS store to back the state of a `BlockTree`, including the current selection,
 * returning a set of props that can be provided directly to a `BlockTree`, like so:
 *
 * ```
 * const treeProps = createBlockTree({ key: 'root', children: [] })
 *
 * return (
 *   <BlockTree {...treeProps}>
 *     {block => <BlockUI {...block} />}
 *   </BlockTree>
 * )
 * ```
 *
 * This is a convenience utility for getting started quickly. A real application would probably prefer
 * to implement its own state management.
 */
export function createBlockTree<K, T>(init: RootBlock<K, T>) {
  const [root, setRoot] = createStore(init)
  const [selection, setSelection] = createSignal<K[]>([])

  return {
    root,

    get selection() {
      return selection()
    },

    onSelectionChange(event: SelectionEvent<K>) {
      setSelection(event.after)
    },

    onInsert(event: InsertEvent<K, T>) {
      setRoot(produce(root => insertBlocks(root, event.blocks, event.place)))
    },

    onReorder(event: ReorderEvent<K>) {
      const moveBlocks = (root: RootBlock<K, T>) => {
        const blocks: Block<K, T>[] = []
        removeBlocks(root, event.keys, blocks)
        insertBlocks(root, blocks, event.place)
      }
      setRoot(produce(moveBlocks))
    },

    onRemove(event: RemoveEvent<K>) {
      setRoot(produce(root => removeBlocks(root, event.keys)))
    },
  }
}

/** Utility function to find a block in a tree with a given `key`. */
export function findBlock<K, T>(root: RootBlock<K, T>, key: K): RootBlock<K, T> | undefined {
  if (root.key === key) {
    return root
  }

  for (const child of root.children ?? []) {
    const result = findBlock(child, key)
    if (result) return result
  }
  return undefined
}

/**
 * Removes blocks with the given set of `keys`,
 * optionally accumulating them into the `collect` array. */
export function removeBlocks<K, T>(root: RootBlock<K, T>, keys: K[], collect?: Block<K, T>[]) {
  root.children = root.children?.filter(child => {
    if (!keys.includes(child.key)) {
      removeBlocks(child, keys, collect)
      return true
    }
    collect?.push(child)
    return false
  })
}
/** Inserts `blocks` into the tree at the specified `place`. */
export function insertBlocks<K, T>(root: RootBlock<K, T>, blocks: Block<K, T>[], place: Place<K>) {
  const parent = findBlock(root, place.parent)
  if (!parent) return

  parent.children ??= []
  if (place.before !== null) {
    const index = parent.children.findIndex(child => child.key === place.before)
    parent.children.splice(index, 0, ...blocks)
  } else {
    parent.children.push(...blocks)
  }
}
