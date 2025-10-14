import { Item, ItemId } from './Item'
import { BlockMeasurements } from './measure'
import { VirtualTree } from './virtual-tree'

const ZeroMeasurement = { children: [], bottom: 0 }
const ZeroOffset = { x: 0, y: 0, w: 0 }

export function calculateLayout<K>(
  tree: VirtualTree<K, any>,
  measureItem: (id: ItemId) => BlockMeasurements | undefined,
) {
  const output = new Map<ItemId, DOMRect>()

  let nextY = 0

  const inner = (item: Item<K, any>, x: number, width: number) => {
    const measure = measureItem(item.id) ?? ZeroMeasurement
    const y = nextY

    if (item.kind === 'container') {
      const children = tree.children(item.id)
      let first = true

      for (const child of children) {
        if (!first) {
          if (child.kind === 'placeholder') {
            output.set(child.id, new DOMRect(x, nextY + item.spacing, width, 0))
            break
          } else {
            nextY += item.spacing
          }
        }
        inner(child, x, width)
        first = false
      }
    }

    if (item.kind === 'block') {
      const children = tree.children(item.id)

      for (const offset of measure.children) {
        const child = children.find(c => c.id === offset.id)
        if (!child) continue
        nextY += offset.y
        inner(child, x + offset.x, width + offset.w)
      }

      nextY += measure.bottom
    }

    if (item.kind === 'placeholder') {
      nextY += measure.bottom
    }

    if (item.kind === 'gap') {
      nextY += measure.bottom
    }

    output.set(item.id, new DOMRect(x, y, width, nextY - y))
  }

  const root = measureItem(tree.root.id)!
  inner(tree.root, 0, root.container.width)

  return output
}
