import { calculateLayout } from '../calculateLayout'
import { Item, ItemId, RootItem } from '../Item'
import { Place } from '../events'
import { BlockMeasurements } from '../measure'

export type InsertionPoint<K> = { id: ItemId; place: Place<K>; y: number }

export function getInsertionPoints<K, T>(
  root: RootItem<K, T>,
  selected: Set<K>,
  tags: string[],
  measures: Map<ItemId, BlockMeasurements>,
  options: { defaultSpacing: number },
): InsertionPoint<K>[] {
  const output: InsertionPoint<K>[] = []

  const layout = calculateLayout(root, selected, id => measures.get(id), { ...options, skipHidden: true })

  const inner = (item: Item<K, T>, parent: K) => {
    const { id } = item
    if (item.kind === 'block' && selected.has(item.key)) {
      return
    }

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

    // Iterate children
    if (item.kind === 'block' && tags.find(tag => !item.accepts?.includes(tag))) {
      for (const child of item.children) {
        inner(child, item.key)
      }
    }
  }

  if (tags.find(tag => !root.accepts?.includes(tag))) {
    for (const child of root.children) {
      inner(child, root.key)
    }
  }

  return output
}
