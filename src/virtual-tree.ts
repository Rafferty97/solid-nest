import { Accessor, createMemo } from 'solid-js'
import { Place } from './events'
import {
  BlockItem,
  ContainerItem,
  createBlockItem,
  createBlockItemId,
  createContainerItem,
  createContainerItemId,
  createDropzoneItem,
  createPlaceholderItem,
  createPlaceholderItemId,
  Item,
  ItemId,
} from './Item'
import { notNull } from './util/notNull'
import { BlockOptions, Container } from './BlockTree'

interface VirtualTreeInit<K, T> {
  readonly root: ContainerItem<K>
  readonly key: (block: T) => K
  readonly options: (block: T) => BlockOptions
  readonly containers: (block: T) => Container<K, T>[]
}

export class VirtualTree<K, T> {
  readonly root: ContainerItem<K>
  readonly key: (block: T) => K
  readonly options: (block: T) => BlockOptions
  readonly containers: (block: T) => Container<K, T>[]
  private readonly _items: Map<ItemId, Item<K, T>>
  private readonly _childMap: Map<ItemId, ItemId[]>

  constructor(init: VirtualTreeInit<K, T>, items: Map<ItemId, Item<K, T>>, childMap: Map<ItemId, ItemId[]>) {
    this.root = init.root
    this.key = init.key
    this.options = init.options
    this.containers = init.containers
    this._items = items
    this._childMap = childMap
  }

  static create<K, T>(
    getRoot: Accessor<Container<K, T>>,
    getKey: (block: T) => K,
    getOptions: (block: T) => BlockOptions,
    getContainers: (block: T) => Container<K, T>[],
  ): Accessor<VirtualTree<K, T>> {
    let blockCache = new Map<T, BlockItem<K, T>>()
    let containerCache = new Map<Container<K, T>, ContainerItem<K>>()

    return createMemo(() => {
      const items = new Map<ItemId, Item<K, T>>()
      const childMap = new Map<ItemId, ItemId[]>()
      const nextCache = new Map<T, BlockItem<K, T>>()
      const nextCache2 = new Map<Container<K, T>, ContainerItem<K>>()

      const processBlock = (block: T) => {
        const item = blockCache.get(block) ?? createBlockItem(block, getKey(block), getContainers(block))
        nextCache.set(block, item)
        items.set(item.id, item)

        const childIds: ItemId[] = []
        childMap.set(item.id, childIds)

        for (const container of item.containers) {
          childIds.push(processContainer(container).id)
        }

        return item
      }

      const processContainer = (container: Container<K, T>) => {
        const item = containerCache.get(container) ?? createContainerItem(container)
        nextCache2.set(container, item)
        items.set(item.id, item)

        const childIds: ItemId[] = []
        childMap.set(item.id, childIds)

        for (const block of container.getBlocks()) {
          childIds.push(processBlock(block).id)
        }

        const placeholder = createPlaceholderItem(item.key)
        items.set(placeholder.id, placeholder)
        childIds.push(placeholder.id)

        return item
      }

      const root = processContainer(getRoot())

      blockCache = nextCache
      containerCache = nextCache2

      const init: VirtualTreeInit<K, T> = {
        root,
        key: getKey,
        options: getOptions,
        containers: getContainers,
      }

      return new VirtualTree(init, items, childMap)
    })
  }

  findBlock(key: K): T | undefined {
    const item = this._items.get(createBlockItemId(key))
    return item?.kind === 'block' ? item.block : undefined
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
    return this.containsChild(createBlockItemId(block), createBlockItemId(child))
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

    return new VirtualTree(this, this._items, childMap)
  }

  insertDropzone(place: Place<K>, height: number) {
    const parent = createContainerItemId(place.parent)
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
    const stack = [[this.root.id, 0 as number] as const]

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
