import { Accessor, createMemo, createSignal, Setter } from 'solid-js'
import { Block, RootBlock } from 'src/Block'
import { BlockItem, createBlockItem } from 'src/Item'

type CachedBlock<K, T> = {
  block: Block<K, T>
  item: BlockItem<K, T>
  setLevel: Setter<number>
}

export function flattenTree<K, T>(block: Accessor<RootBlock<K, T>>): Accessor<BlockItem<K, T>[]> {
  let blocks = new Map<K, CachedBlock<K, T>>()
  let nextBlocks = new Map<K, CachedBlock<K, T>>()

  const unroll = (block: Block<K, T>, out: BlockItem<K, T>[], level: number) => {
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
    const out: BlockItem<K, T>[] = []

    for (const child of block().children ?? []) {
      unroll(child, out, 0)
    }

    blocks = nextBlocks
    nextBlocks = new Map()

    return out
  })
}
