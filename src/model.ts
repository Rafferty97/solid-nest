import { createStore, produce, SetStoreFunction } from 'solid-js/store'
import { Block, RootBlock } from './Block'
import { createSignal } from 'solid-js'
import { BlockTreeProps } from './BlockTree'

export type CreateTreeReturn<K, T> = Required<
  Pick<BlockTreeProps<K, T>, 'root' | 'selection' | 'onSelectionChange' | 'onInsert' | 'onReorder' | 'onRemove'>
> & {
  setRoot: SetStoreFunction<RootBlock<K, T>>
}

export function createTree<K, T>(init: RootBlock<K, T>): CreateTreeReturn<K, T> {
  const [root, setRoot] = createStore(init)
  const [selection, setSelection] = createSignal<K[]>([])

  return {
    root: root,

    setRoot: setRoot,

    get selection() {
      return selection()
    },

    onSelectionChange(event) {
      setSelection(event.after)
    },

    onInsert(event) {
      const { blocks, place } = event

      setRoot(
        produce(root => {
          // Insert blocks into new place
          const insert = (node: Block<K, T> | RootBlock<K, T>) => {
            if (node.key === place.parent) {
              node.children ??= []
              let index = place.before !== null ? node.children.findIndex(child => child.key === place.before) : -1
              if (index < 0) index = node.children.length
              node.children.splice(index, 0, ...blocks)
              return true
            }
            if (node.children) {
              for (const child of node.children) {
                const found = insert(child)
                if (found) return true
              }
              return false
            }
          }
          insert(root)

          return root
        }),
      )
    },

    onReorder(event) {
      const { keys, place } = event

      setRoot(
        produce(root => {
          const blocks: Block<K, T>[] = []

          // Remove blocks from tree
          const filterChildren = (node: Block<K, T> | RootBlock<K, T>) => {
            if (!node.children) return
            node.children = node.children.filter(child => {
              const selected = keys.includes(child.key)
              if (selected) blocks.push(child)
              return !selected
            })
            node.children.forEach(filterChildren)
          }
          filterChildren(root)

          // Insert blocks into new place
          const insert = (node: Block<K, T> | RootBlock<K, T>) => {
            if (node.key === place.parent) {
              node.children ??= []
              let index = place.before !== null ? node.children.findIndex(child => child.key === place.before) : -1
              if (index < 0) index = node.children.length
              node.children.splice(index, 0, ...blocks)
              return true
            }
            if (node.children) {
              for (const child of node.children) {
                const found = insert(child)
                if (found) return true
              }
              return false
            }
          }
          insert(root)

          return root
        }),
      )
    },

    onRemove(event) {
      const { keys } = event

      setRoot(
        produce(root => {
          const blocks: Block<K, T>[] = []

          // Remove blocks from tree
          const filterChildren = (node: Block<K, T> | RootBlock<K, T>) => {
            if (!node.children) return
            node.children = node.children.filter(child => {
              const selected = keys.includes(child.key)
              if (selected) blocks.push(child)
              return !selected
            })
            node.children.forEach(filterChildren)
          }
          filterChildren(root)
        }),
      )
    },
  }
}
