import { calculateLayout } from './calculateLayout'
import { Item, ItemId, RootItem } from './Item'
import { Place } from './events'
import { BlockMeasurements } from './measure'

export function* getInsertionPoints<K, T>(
  items: Item<K, T>[],
  tags: string[],
  measures: Map<ItemId, BlockMeasurements>,
  options: { defaultSpacing: number },
) {
  const layout = calculateLayout(items, id => measures.get(id), { ...options, skipHidden: true })

  const iter = items[Symbol.iterator]()
  const root = iter.next().value as RootItem<K>
  const stack = [{ key: root.key, accepts: root.accepts }]

  for (const item of iter) {
    const { id, level } = item

    // Push to stack for child items
    if (item.kind === 'block') {
      stack[level] = { key: item.key, accepts: item.accepts }
    }

    // Check there's a layout
    const rect = layout.get(item.id)
    if (!rect) continue

    // Check that this items's parent accepts the dragged item(s)
    const parent = stack[level - 1]!
    if (tags.find(tag => !parent.accepts.includes(tag))) {
      continue
    }

    // Yield the insertion point
    const place: Place<K> = {
      parent: parent.key,
      before: item.kind === 'block' ? item.key : null,
    }
    const y = rect.top
    yield { id, place, level, y }
  }
}
