import { calculateLayout } from '../calculateLayout'
import { Item, ItemId } from '../Item'
import { Place } from '../events'
import { BlockMeasurements } from '../measure'
import { VirtualTree } from 'src/virtual-tree'

export type InsertionPoint<K> = { id: ItemId; place: Place<K>; y: number }

export function getInsertionPoints<K, T>(
  tree: VirtualTree<K, T>,
  tags: string[],
  measures: Map<ItemId, BlockMeasurements>,
  options: { defaultSpacing: number },
): InsertionPoint<K>[] {
  const output: InsertionPoint<K>[] = []

  const layout = calculateLayout(tree, id => measures.get(id), { ...options, skipHidden: true })

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
      const accepts = !tags.find(tag => !item.accepts?.includes(tag))
      for (const child of item.children) {
        inner(child, item.key, accepts)
      }
    }
  }

  const root = tree.root
  const accepts = !tags.find(tag => !root.accepts?.includes(tag))
  for (const child of root.children) {
    inner(child, root.key, accepts)
  }

  return output
}
