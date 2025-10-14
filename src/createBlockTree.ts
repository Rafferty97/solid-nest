import { createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { Container, Place, Selection } from 'src'
import { SelectionEvent, InsertEvent, ReorderEvent, RemoveEvent } from 'src'

type Block<T> = { key: unknown; children?: T[] }

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
export function createBlockTree<T extends Block<T>>(init: T) {
  type K = T['key']

  const [tree, setTree] = createStore(init)
  const [selection, setSelection] = createSignal<Selection<K>>({})

  const root: Container<K, T> = {
    key: tree.key,
    getBlocks: () => tree.children ?? [],
    spacing: 12,
  }

  return {
    root,

    tree,
    setTree,

    get selection() {
      return selection()
    },
    setSelection,

    getKey(block: T): T['key'] {
      return block.key
    },

    getContainers(block: T): Container<K, T>[] {
      return block.children ? [{ key: block.key, getBlocks: () => block.children ?? [], spacing: 12 }] : []
    },

    onSelectionChange(event: SelectionEvent<K>) {
      setSelection(event)
    },

    onInsert(event: InsertEvent<K, T>) {
      setTree(produce(root => insertBlocks(root, event.blocks, event.place)))
    },

    onReorder(event: ReorderEvent<K>) {
      const moveBlocks = (root: T) => {
        const blocks: T[] = []
        removeBlocks(root, event.keys, blocks)
        insertBlocks(root, blocks, event.place)
      }
      setTree(produce(moveBlocks))
    },

    onRemove(event: RemoveEvent<K>) {
      setTree(produce(root => removeBlocks(root, event.keys)))
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

    updateBlock(key: K, updates: Partial<T>) {
      setTree(
        produce(root => {
          const block = findBlock(root, key)
          if (!block) return
          Object.assign(block, updates)
        }),
      )
    },
  }
}

/** Utility function to find a block in a tree with a given `key`. */
function findBlock<T extends Block<T>>(root: T, key: T['key']): T | undefined {
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
function removeBlocks<T extends Block<T>>(root: T, keys: T['key'][], collect?: T[]) {
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
function insertBlocks<T extends Block<T>>(root: T, blocks: T[], place: Place<T['key']>) {
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
