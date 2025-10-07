import { Block, BlockOptions } from './BlockTree'
import { RootBlock } from './Block'

export type ItemId = string & { readonly brand: unique symbol }

export type Item<K, T = unknown> = RootItem<K> | BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemKind = Item<any, any>['kind']

export type RootItem<K> = BlockOptions & Readonly<{ id: ItemId; kind: 'root'; key: K }>
export type BlockItem<K, T> = BlockOptions & Readonly<{ id: ItemId; kind: 'block'; key: K; data: T }>
export type PlaceholderItem<K> = Readonly<{ id: ItemId; kind: 'placeholder'; parent: K }>
export type GapItem = Readonly<{ id: ItemId; kind: 'gap'; before: ItemId; height: number }>

export const RootItemId = 'root' as ItemId
export const DropzoneItemId = 'gap' as ItemId

export function createRootItem<K, T>(root: RootBlock<K, T>): RootItem<K> {
  return {
    id: RootItemId,
    kind: 'root',
    key: root.key,
    get spacing() {
      return root.spacing
    },
    get tag() {
      return root.tag
    },
    get accepts() {
      return root.accepts
    },
  }
}

export function createBlockItem<K, T>(block: Block<K, T>): BlockItem<K, T> {
  return {
    id: createBlockItemId(block.key),
    kind: 'block',
    key: block.key,
    get data() {
      return block.data
    },
    get spacing() {
      return block.spacing
    },
    get tag() {
      return block.tag
    },
    get accepts() {
      return block.accepts ?? []
    },
  }
}

export function createBlockItemId<K>(key: K, rootKey?: K): ItemId {
  return key === rootKey ? RootItemId : (`b-${key}` as ItemId)
}

export function createPlaceholderItem<K>(parent: K): PlaceholderItem<K> {
  return {
    id: createPlaceholderItemId(parent),
    kind: 'placeholder',
    parent,
  }
}

export function createPlaceholderItemId<K>(parent: K): ItemId {
  return `p-${parent}` as ItemId
}

export function isPlaceholderId(id: ItemId): boolean {
  return id.startsWith('p-')
}

export function createDropzoneItem(before: ItemId, height: number): GapItem {
  return {
    id: createDropzoneItemId(),
    kind: 'gap',
    before,
    height,
  }
}

export function createDropzoneItemId(): ItemId {
  return `gap` as ItemId
}
