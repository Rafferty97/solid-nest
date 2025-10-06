import { Item, RootItem } from './Item'

export function flattenTree<K, T, U>(
  root: RootItem<K, T>,
  transform: (item: Item<K, T>, level: number) => U | undefined,
): U[] {
  const output: U[] = []

  const process = (item: Item<K, T>, level: number) => {
    const mapped = transform(item, level)
    if (mapped) output.push(mapped)
    root.children.forEach(child => process(child, level + 1))
  }

  process(root, 0)

  return output
}

// { id: ItemId; level: number; kind: ItemKind; spacing: number }
// const spacing = item.spacing ?? defaultSpacing
// output.push({ id: item.id, kind: item.kind, level, spacing })
