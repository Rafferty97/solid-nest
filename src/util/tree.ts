import { Accessor, createMemo, createSignal, Setter } from 'solid-js'
import { BlockItem, createBlockItem, createRootItem, Item, RootItem } from 'src/Item'
import { Block, RootBlock } from 'src/Block'

type CachedBlock<K, T> = {
  block: Block<K, T>
  item: BlockItem<K, T>
  setLevel: Setter<number>
}

export type FlattenTreeResult<K, T> = (BlockItem<K, T> | RootItem<K>)[]

export function flattenTree<K, T>(root: Accessor<RootBlock<K, T>>): Accessor<FlattenTreeResult<K, T>> {
  let blocks = new Map<K, CachedBlock<K, T>>()
  let nextBlocks = new Map<K, CachedBlock<K, T>>()

  const unroll = (block: Block<K, T>, out: Item<K, T>[], level: number) => {
    let cached = blocks.get(block.key)

    if (cached && cached.block === block) {
      cached.setLevel(level)
    } else {
      const [itemLevel, setItemLevel] = createSignal(level)
      const item = createBlockItem(block, itemLevel)
      cached = { block, item, setLevel: setItemLevel }
    }

    out.push(cached.item)
    nextBlocks.set(block.key, cached)

    if (!block.children) return
    for (const child of block.children) {
      unroll(child, out, level + 1)
    }
  }

  return createMemo(() => {
    const out: FlattenTreeResult<K, T> = []

    out.push(createRootItem(root()))
    for (const child of root().children) {
      unroll(child, out, 1)
    }

    blocks = nextBlocks
    nextBlocks = new Map()

    return out
  })
}
