import { Accessor } from 'solid-js'
import { Block, BlockOptions } from './BlockTree'
import { RootBlock } from './Block'

export type Item<K, T = unknown> = RootItem<K> | BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemId = string & { readonly brand: unique symbol }

export type ItemBase = Readonly<{
  id: ItemId
  level: number
}>

export type RootItem<K> = ItemBase & BlockOptions & Readonly<{ kind: 'root'; key: K }>
export type BlockItem<K, T> = ItemBase & BlockOptions & Readonly<{ kind: 'block'; key: K; data: T }>
export type PlaceholderItem<K> = ItemBase & Readonly<{ kind: 'placeholder'; key?: never; parent: K; spacing?: never }>
export type GapItem = ItemBase & Readonly<{ kind: 'gap'; key?: never; before: ItemId; height: number; spacing?: never }>

export const RootItemId = 'root' as ItemId

export function createRootItem<K, T>(root: RootBlock<K, T>): RootItem<K> {
  return {
    id: RootItemId,
    level: 0,
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

export function createBlockItem<K, T>(block: Block<K, T>, level: Accessor<number>): BlockItem<K, T> {
  return {
    id: createBlockItemId(block.key),
    get level() {
      return level()
    },
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

export function createBlockItemId<K>(key: K): ItemId {
  return `b-${key}` as ItemId
}

export function createPlaceholderItem<K>(level: number, parent: K): PlaceholderItem<K> {
  return {
    id: `p-${parent}` as ItemId,
    level,
    kind: 'placeholder',
    parent,
  }
}

export function isPlaceholderId(id: ItemId): boolean {
  return id.startsWith('p-')
}

export function createDropzoneItem(level: number, before: ItemId, height: number): GapItem {
  return {
    id: `gap` as ItemId,
    level,
    kind: 'gap',
    before,
    height,
  }
}
