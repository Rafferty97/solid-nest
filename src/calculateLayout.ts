import { DEFAULT_SPACING } from './constants'
import { Item, ItemId, RootItemId } from './Item'
import { BlockMeasurements } from './measure'
import { VirtualTree } from './virtual-tree'

const ZeroMeasurement = {
  margin: { left: 0, right: 0, top: 0, bottom: 0 },
  childrenVisible: false,
}

export function calculateLayout<K>(
  tree: VirtualTree<K, any>,
  measureItem: (id: ItemId) => BlockMeasurements | undefined,
  opts: { skipHidden?: boolean } = {},
) {
  const output = new Map<ItemId, DOMRect>()

  let nextY = 0

  const inner = (item: Item<K, any>, x: number, width: number, spacing: number, isFirst: boolean) => {
    const { margin, childrenVisible } = measureItem(item.id) ?? ZeroMeasurement

    if (!isFirst && item.kind !== 'placeholder') {
      nextY += spacing
    }

    const y = nextY

    if (item.kind !== 'placeholder' || isFirst) {
      nextY += margin.top
    }

    if (item.kind === 'block' && (childrenVisible || !opts.skipHidden)) {
      const children = tree.children(item.id)

      const innerX = x + margin.left
      const innerWidth = width - (margin.left + margin.right)
      const innerSpacing = tree.options(item.block).spacing ?? DEFAULT_SPACING

      let isFirst = true
      for (const child of children) {
        inner(child, innerX, innerWidth, innerSpacing, isFirst)
        isFirst = false
      }
    }

    nextY += margin.bottom

    output.set(item.id, new DOMRect(x, y, width, nextY - y))
  }

  const rootWidth = measureItem(RootItemId)!.children.width
  inner(tree.root, 0, rootWidth, 0, true)

  return output
}
