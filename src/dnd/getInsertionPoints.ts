import { calculateLayout } from '../calculateLayout'
import { Item, ItemId } from '../Item'
import { Place } from '../events'
import { BlockMeasurements } from '../measure'
import { VirtualTree } from 'src/virtual-tree'

export type InsertionPoint<K> = { id: ItemId; place: Place<K>; y: number }

export function getInsertionPoints<K, T, R>(
  tree: VirtualTree<K, T, R>,
  tags: string[],
  measures: Map<ItemId, BlockMeasurements>,
): InsertionPoint<K>[] {
  const output: InsertionPoint<K>[] = []

  const layout = calculateLayout(tree, id => measures.get(id))

  const childAccepts = (block: T | R) => {
    const options = tree.options(block)
    if (options.static) return false
    return !tags.find(tag => !options.accepts?.includes(tag))
  }

  const inner = (item: Item<K, T>, parent: K, accepts: boolean) => {
    const { id } = item

    if (accepts) {
      // Check there's a layout
      const rect = layout.get(item.id)
      if (!rect) return

      // Push the insertion point
      const place: Place<K> = {
        parent,
        before: item.kind === 'block' ? item.key : null,
      }
      const y = rect.top
      output.push({ id, place, y })
    }

    // Iterate children
    if (item.kind === 'block') {
      const accepts = childAccepts(item.block)
      for (const child of tree.children(item.id)) {
        inner(child, item.key, accepts)
      }
    }
  }

  const root = tree.root
  const accepts = childAccepts(root.block)
  for (const child of tree.children(root.id)) {
    inner(child, root.key, accepts)
  }

  return output
}
