import { createPlaceholderItem, Item } from './Item'

export function insertPlaceholders<K, T>(root: K, input: Item<K, T>[]): Item<K, T>[] {
  const output: typeof input = []
  const stack = [root]

  for (let index = 0; index < input.length; index++) {
    const item = input[index]!
    const nextItem = input[index + 1]

    output.push(item)

    if (item.kind === 'block') {
      stack[item.level] = item.key
    }

    for (let level = item.level + (item.kind === 'block' ? 1 : 0); level > (nextItem?.level ?? 0); level--) {
      output.push(createPlaceholderItem(level, stack[level - 1]!))
    }
  }

  return output
}
