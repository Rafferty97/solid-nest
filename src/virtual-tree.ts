import { Block, RootBlock } from './Block'
import { Place } from './events'
import {
  BlockItem,
  createBlockItem,
  createBlockItemId,
  createDropzoneItem,
  createPlaceholderItem,
  createPlaceholderItemId,
  createRootItem,
  Item,
  ItemId,
  RootItem,
  RootItemId,
} from './Item'
import { notNull } from './util/notNull'

export class VirtualTree<K, T> {
  readonly root: RootItem<K>
  private readonly _items: Map<ItemId, Item<K, T>>
  private readonly _childMap: Map<ItemId, ItemId[]>

  constructor(root: RootItem<K>, items: Map<ItemId, Item<K, T>>, childMap: Map<ItemId, ItemId[]>) {
    this.root = root
    this._items = items
    this._childMap = childMap
  }

  static create<K, T>(root: RootBlock<K, T>): VirtualTree<K, T> {
    const items = new Map<ItemId, Item<K, T>>()
    const childMap = new Map<ItemId, ItemId[]>()

    const process = (item: RootItem<K> | BlockItem<K, T>, children?: Block<K, T>[]) => {
      items.set(item.id, item)

      children?.forEach(child => process(createBlockItem(child), child.children))

      const placeholder = createPlaceholderItem(item.key)
      items.set(placeholder.id, placeholder)

      const childIds = children?.map(child => createBlockItemId(child.key)) ?? []
      childIds.push(placeholder.id)
      childMap.set(item.id, childIds)
    }

    const rootItem = createRootItem(root)
    process(rootItem, root.children)

    return new VirtualTree(rootItem, items, childMap)
  }

  findItemById(id: ItemId): Item<K, T> | undefined {
    return this._items.get(id)
  }

  findParent(id: ItemId): ItemId | undefined {
    for (const [parentId, children] of this._childMap.entries()) {
      if (children.includes(id)) return parentId
    }
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

    return new VirtualTree(this.root, this._items, childMap)
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

    return new VirtualTree(this.root, items, childMap)

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

    return new VirtualTree(this.root, this._items, childMap)
  }

  extractBlocks(keys: Iterable<K>) {
    const childMap = new Map(this._childMap)
    const ids = []
    for (const key of keys) ids.push(createBlockItemId(key))
    childMap.set(this.root.id, ids)
    return new VirtualTree(this.root, this._items, childMap)
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

  children(id: ItemId): Item<K, T>[] {
    const childIds = this._childMap.get(id)
    return childIds?.map(id => this._items.get(id)).filter(notNull) ?? []
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
