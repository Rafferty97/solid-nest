import { Item, ItemId, RootItem, RootItemId } from './Item'
import { BlockMeasurements } from './measure'

const ZeroMeasurement = {
  margin: { left: 0, right: 0, top: 0, bottom: 0 },
  childrenVisible: false,
}

export function calculateLayout<K>(
  root: RootItem<K, unknown>,
  hidden: Set<K>,
  measureItem: (id: ItemId) => BlockMeasurements | undefined,
  opts: { skipHidden?: boolean; defaultSpacing: number },
) {
  const output = new Map<ItemId, DOMRect>()

  let nextY = 0

  const inner = (item: Item<K, unknown>, x: number, width: number, spacing: number, isFirst: boolean) => {
    if (item.kind === 'block' && hidden.has(item.key)) {
      return
    }

    const { margin, childrenVisible } = measureItem(item.id) ?? ZeroMeasurement

    if (!isFirst || item.kind !== 'placeholder') {
      nextY += spacing
    }

    const y = nextY

    if (item.kind !== 'placeholder' || isFirst) {
      nextY += margin.top
    }

    if ((childrenVisible || !opts.skipHidden) && (item.kind === 'root' || item.kind === 'block')) {
      const innerX = x + margin.left
      const innerWidth = width - (margin.left + margin.right)
      const innerSpacing = item.spacing ?? opts.defaultSpacing
      let isFirst = true

      for (const child of item.children) {
        inner(child, innerX, innerWidth, innerSpacing, isFirst)
        isFirst = false
      }
    }

    nextY += margin.bottom

    output.set(item.id, new DOMRect(x, y, width, nextY - y))
  }

  const rootWidth = measureItem(RootItemId)!.children.width
  inner(root, 0, rootWidth, 0, true)

  return output
}
