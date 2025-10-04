import { Accessor } from 'solid-js'
import { Block, BlockOptions } from './BlockTree'

export type Item<K, T = unknown> = BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemId = string & { readonly brand: unique symbol }

export type ItemBase = Readonly<{
  id: ItemId
  level: number
}>

export type BlockItem<K, T> = ItemBase &
  BlockOptions &
  Readonly<{
    kind: 'block'
    key: K
    data: T
  }>

export type PlaceholderItem<K> = ItemBase &
  Readonly<{
    kind: 'placeholder'
    parent: K
    spacing?: never
  }>

export type GapItem = ItemBase &
  Readonly<{
    kind: 'gap'
    before: ItemId
    height: number
    spacing?: never
  }>

export const RootItemId = 'root' as ItemId

export function createBlockItem<K, T>(block: Block<K, T>, level: Accessor<number>): BlockItem<K, T> {
  return {
    id: `b-${block.key}` as ItemId,
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

export function createGapItem(level: number, before: ItemId, height: number): GapItem {
  return {
    id: `gap` as ItemId,
    level,
    kind: 'gap',
    before,
    height,
  }
}
