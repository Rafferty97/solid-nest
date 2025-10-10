import { createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { Place, Root, Selection, SelectionEvent } from 'src'
import { InsertEvent, ReorderEvent, RemoveEvent } from 'src'

export type Block<K, T> = {
  key: K
  data: T
  children?: Block<K, T>[]
}

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
export function createBlockTree<K, T>(init: Block<K, T>) {
  const [root, setRoot] = createStore(init)
  const [selection, setSelection] = createSignal<Selection<K>>({})

  return {
    get root() {
      return {
        key: root.key,
        children: root.children ?? [],
      }
    },
    setRoot,

    getKey(block: Block<K, T>) {
      return block.key
    },

    getChildren(block: Block<K, T>) {
      return block.children
    },

    get selection() {
      return selection()
    },
    setSelection,

    onSelectionChange(event: SelectionEvent<K>) {
      setSelection(event)
    },

    onInsert(event: InsertEvent<K, T>) {
      setRoot(produce(root => insertBlocks(root, event.blocks, event.place)))
    },

    onReorder(event: ReorderEvent<K>) {
      const moveBlocks = (root: Block<K, T>) => {
        const blocks: Block<K, T>[] = []
        removeBlocks(root, event.keys, blocks)
        insertBlocks(root, blocks, event.place)
      }
      setRoot(produce(moveBlocks))
    },

    onRemove(event: RemoveEvent<K>) {
      setRoot(produce(root => removeBlocks(root, event.keys)))
    },

    toggleBlockSelected(key: K, selected: boolean) {
      const prev = selection()
      if (!prev.blocks) {
        setSelection({ blocks: selected ? [key] : [] })
      } else {
        const blocks = prev.blocks.filter(k => k !== key)
        if (selected) {
          blocks.push(key)
        }
        setSelection({ blocks })
      }
    },

    selectBlock(key: K) {
      this.toggleBlockSelected(key, true)
    },

    unselectBlock(key: K) {
      this.toggleBlockSelected(key, false)
    },

    updateBlock(key: K, data: T) {
      setRoot(
        produce(root => {
          const block = findBlock(root, key)
          if (block && 'data' in block) {
            block.data = data
          }
        }),
      )
    },
  }
}

/** Utility function to find a block in a tree with a given `key`. */
function findBlock<K, T>(root: Block<K, T>, key: K): Block<K, T> | undefined {
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
function removeBlocks<K, T>(root: Block<K, T>, keys: K[], collect?: Block<K, T>[]) {
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
function insertBlocks<K, T>(root: Block<K, T>, blocks: Block<K, T>[], place: Place<K>) {
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
