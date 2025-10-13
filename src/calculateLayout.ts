import { DEFAULT_SPACING } from './constants'
import { Item, ItemId, RootItemId } from './Item'
import { BlockMeasurements } from './measure'
import { VirtualTree } from './virtual-tree'

const ZeroMeasurement = { children: [], bottom: 0 }

export function calculateLayout<K>(
  tree: VirtualTree<K, any>,
  measureItem: (id: ItemId) => BlockMeasurements | undefined,
) {
  const output = new Map<ItemId, DOMRect>()

  let nextY = 0

  const inner = (item: Item<K, any>, x: number, width: number) => {
    const measure = measureItem(item.id) ?? ZeroMeasurement
    const y = nextY

    if (item.kind === 'block' && measure.children.length > 0) {
      const children = tree.children(item.id)
      const options = tree.options(item.block)
      const spacing = options.spacing ?? DEFAULT_SPACING

      let i = 0
      let m = { x: 0, y: 0, w: 0 }
      for (const child of children) {
        m = measure.children[i] ?? { ...m, y: spacing }
        if (child.kind === 'placeholder' && i > 0) {
          output.set(child.id, new DOMRect(x, nextY + m.y, width + m.w, 0))
        } else {
          nextY += m.y
          inner(child, x + m.x, width + m.w)
        }
        i += 1
      }
    }

    nextY += measure.bottom

    output.set(item.id, new DOMRect(x, y, width, nextY - y))
  }

  const root = measureItem(RootItemId)!
  const rootWidth = root.container.width - (root.children[0]?.w ?? 0)
  inner(tree.root, 0, rootWidth)

  return output
}
