import { Accessor, createMemo } from 'solid-js'
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
  RootItemId,
} from './Item'
import { notNull } from './util/notNull'
import { BlockOptions } from './BlockTree'

interface VirtualTreeInit<K, T, R = T> {
  readonly root: BlockItem<K, R>
  readonly key: (block: T | R) => K
  readonly options: (block: T | R) => BlockOptions
}

export class VirtualTree<K, T, R = T> {
  readonly root: BlockItem<K, R>
  readonly key: (block: T | R) => K
  readonly options: (block: T | R) => BlockOptions
  private readonly _items: Map<ItemId, Item<K, T>>
  private readonly _childMap: Map<ItemId, ItemId[]>

  constructor(init: VirtualTreeInit<K, T, R>, items: Map<ItemId, Item<K, T>>, childMap: Map<ItemId, ItemId[]>) {
    this.root = init.root
    this.key = init.key
    this.options = init.options
    this._items = items
    this._childMap = childMap
  }

  static create<K, T, R = T>(
    getRoot: Accessor<R>,
    getKey: (block: T | R) => K,
    getChildren: (block: T | R) => T[],
    getOptions: (block: T | R) => BlockOptions,
  ): Accessor<VirtualTree<K, T, R>> {
    let cache = new Map<T, BlockItem<K, T>>()

    return createMemo(() => {
      const items = new Map<ItemId, Item<K, T>>()
      const childMap = new Map<ItemId, ItemId[]>()
      const nextCache = new Map<T, BlockItem<K, T>>()

      const process = (item: BlockItem<K, T | R>, children: T[]) => {
        const childIds: ItemId[] = []

        children.forEach(child => {
          const item = cache.get(child) ?? createBlockItem(child, getKey(child))
          items.set(item.id, item)
          childIds.push(item.id)
          nextCache.set(child, item)
          process(item, getChildren(child))
        })

        const placeholder = createPlaceholderItem(item.key)
        items.set(placeholder.id, placeholder)
        childIds.push(placeholder.id)

        childMap.set(item.id, childIds)
      }

      const root = getRoot()
      const rootItem = createRootItem(root, getKey(root))
      process(rootItem, getChildren(root))

      cache = nextCache

      const init: VirtualTreeInit<K, T, R> = {
        root: rootItem,
        key: getKey,
        options: getOptions,
      }

      return new VirtualTree(init, items, childMap)
    })
  }

  findItemById(id: ItemId): Item<K, T> | undefined {
    return this._items.get(id)
  }

  findParent(id: ItemId): ItemId | undefined {
    for (const [parentId, children] of this._childMap.entries()) {
      if (children.includes(id)) return parentId
    }
  }

  containsChildBlock(block: K, child: K): boolean {
    return this.containsChild(createBlockItemId(block, this.root.key), createBlockItemId(child, this.root.key))
  }

  containsChild(item: ItemId, other: ItemId): boolean {
    if (item === other) {
      return true
    }

    const children = this._childMap.get(item)
    if (!children) return false

    for (const child of children) {
      if (this.containsChild(child, other)) {
        return true
      }
    }
    return false
  }

  removeBlocks(keys: Iterable<K>): VirtualTree<K, T, R> {
    const ids = new Set<ItemId>()
    for (const key of keys) {
      ids.add(createBlockItemId(key))
    }
    return this.removeItems(ids)
  }

  removeItems(ids: Set<ItemId>): VirtualTree<K, T, R> {
    const childMap = new Map()
    for (const [id, children] of this._childMap) {
      const newChildren = children.filter(id => !ids.has(id))
      childMap.set(id, newChildren)
    }

    return new VirtualTree(this, this._items, childMap)
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

    return new VirtualTree(this, items, childMap)
  }

  extractBlocks(keys: Iterable<K>) {
    const childMap = new Map(this._childMap)
    const ids = []
    for (const key of keys) ids.push(createBlockItemId(key))
    childMap.set(this.root.id, ids)
    return new VirtualTree(this, this._items, childMap)
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
}
