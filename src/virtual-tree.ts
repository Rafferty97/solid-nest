import { Place } from './events'
import {
  createBlockItemId,
  createDropzoneItem,
  createPlaceholderItemId,
  Item,
  ItemId,
  RootItem,
  RootItemId,
} from './Item'
import { notNull } from './util/notNull'

export class VirtualTree<K, T> {
  private readonly _items: Map<ItemId, Item<K, T>>
  private readonly _childMap: Map<ItemId, ItemId[]>

  constructor(items: Map<ItemId, Item<K, T>>, childMap: Map<ItemId, ItemId[]>) {
    this._items = items
    this._childMap = childMap
  }

  static create<K, T>(root: RootItem<K, T>): VirtualTree<K, T> {
    const items = new Map<ItemId, Item<K, T>>()
    const childMap = new Map<ItemId, ItemId[]>()

    const process = (item: Item<K, T>) => {
      items.set(item.id, item)
      if (item.children) {
        const childIds = item.children.map(child => child.id)
        childMap.set(item.id, childIds)
        item.children.forEach(process)
      }
    }
    process(root)

    return new VirtualTree(items, childMap)
  }

  get root(): RootItem<K, T> {
    return this.mapItem(RootItemId) as RootItem<K, T>
  }

  findItem(id: ItemId): Item<K, T> | undefined {
    return this._items.get(id)
  }

  removeBlocks(keys: Iterable<K>): VirtualTree<K, T> {
    const ids = new Set<ItemId>()
    for (const key of keys) {
      ids.add(createBlockItemId(key))
    }
    return this.removeItems(ids)
  }

  removeItems(ids: Set<ItemId>): VirtualTree<K, T> {
    const childMap = new Map()
    for (const [id, children] of this._childMap) {
      const newChildren = children.filter(id => !ids.has(id))
      childMap.set(id, newChildren)
    }

    return new VirtualTree(this._items, childMap)
  }

  insertDropzone(place: Place<K>, height: number) {
    const parent = createBlockItemId(place.parent, this.root.key)
    const before = place.before ? createBlockItemId(place.before) : createPlaceholderItemId(place.parent)
    const dropzone = createDropzoneItem(before, height)

    // Create the dropzone
    const items = new Map(this._items)
    items.set(dropzone.id, dropzone)

    // Insert into parent
    const childMap = new Map(this._childMap)
    const children = childMap.get(parent)?.slice() ?? []
    const index = children.indexOf(before)
    children.splice(index, 0, dropzone.id)
    childMap.set(parent, children)

    return new VirtualTree(items, childMap)

    // FIXME: Use `insertItems`
  }

  insertItems(ids: ItemId[], place: Place<K>) {
    const parent = createBlockItemId(place.parent, this.root.key)
    const before = place.before ? createBlockItemId(place.before) : createPlaceholderItemId(place.parent)

    // Insert into parent
    const childMap = new Map(this._childMap)
    const children = childMap.get(parent)?.slice() ?? []
    const index = children.indexOf(before)
    children.splice(index, 0, ...ids)
    childMap.set(parent, children)

    return new VirtualTree(this._items, childMap)
  }

  *levels() {
    const stack = [[RootItemId, 0 as number] as const]

    while (stack.length > 0) {
      const item = stack.pop()!
      yield item

      const children = this._childMap.get(item[0])
      if (!children) continue

      const level = item[1] + 1
      stack.push(...children.map(id => [id, level] as const))
    }
  }

  private mapItem(id: ItemId): Item<K, T> | undefined {
    const item = this._items.get(id)
    if (!item) return undefined

    if (item.kind !== 'root' && item.kind !== 'block') {
      return item
    }

    let children: Item<K, T>[] | undefined
    const getChildren = () =>
      this._childMap
        .get(item.id)
        ?.map(id => this.mapItem(id))
        .filter(notNull) ?? []

    return {
      ...item,
      get children() {
        children ??= getChildren()
        return children
      },
    }
  }
}
