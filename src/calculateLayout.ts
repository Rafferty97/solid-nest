import { Item, ItemId, RootItemId } from './Item'
import { BlockMeasurements } from './measure'

export function calculateLayout<K>(
  items: Item<K>[],
  measureItem: (id: ItemId) => BlockMeasurements | undefined,
  opts: { defaultSpacing: number },
) {
  // finished blocks
  const output = new Map<ItemId, DOMRect>()

  // most recent block at level `index`
  const stack: {
    id: ItemId
    x: number
    y: number
    width: number
    spacing?: number
    marginBottom: number
  }[] = []

  // dimensions for the first child of the most recent block
  let nextX = 0
  let nextY = 0
  let nextWidth = measureItem(RootItemId)!.children.width

  let nextVisibleLevel = 0

  const flush = (level: number) => {
    while (stack.length > level) {
      const { id, x, y, width, marginBottom } = stack.pop()!
      nextY += marginBottom
      nextX = x
      nextWidth = width
      output.set(id, new DOMRect(x, y, width, nextY - y))
    }
  }

  for (const { id, kind, level, spacing } of items) {
    if (level > nextVisibleLevel) continue

    const { margin, inner: children } = measureItem(id) ?? {}

    // Check whether this is the first block in its parent
    const isFirst = stack.length <= level

    // Close prior blocks with no more children
    flush(level)

    // Add spacing
    if (!isFirst && kind !== 'placeholder') {
      nextY += stack[level - 1]?.spacing ?? opts.defaultSpacing
    }

    // Create new block
    stack[level] = {
      id,
      x: nextX,
      y: nextY,
      width: nextWidth,
      spacing,
      marginBottom: margin?.bottom ?? 0,
    }

    // Set dimensions for first child
    if (margin && (kind !== 'placeholder' || isFirst)) {
      nextY += margin.top
      nextX += margin.left
      nextWidth -= margin.left + margin.right
    }

    nextVisibleLevel = level + (children ? 1 : 0)
  }

  // Close remaining blocks
  flush(0)

  return output
}
