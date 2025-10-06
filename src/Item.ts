import { createMemo, mapArray } from 'solid-js'
import { Block, BlockOptions } from './BlockTree'
import { RootBlock } from './Block'

export type ItemId = string & { readonly brand: unique symbol }

export type Item<K, T = unknown> = RootItem<K, T> | BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemKind = Item<any, any>['kind']

export type RootItem<K, T> = BlockOptions &
  Readonly<{
    id: ItemId
    kind: 'root'
    key: K
    children: Item<K, T>[]
  }>

export type BlockItem<K, T> = BlockOptions &
  Readonly<{
    id: ItemId
    kind: 'block'
    key: K
    data: T
    children: Item<K, T>[]
  }>

export type PlaceholderItem<K> = Readonly<{
  id: ItemId
  kind: 'placeholder'
  key?: never
  parent: K
  spacing?: never
}>

export type GapItem = Readonly<{
  id: ItemId
  kind: 'gap'
  key?: never
  before: ItemId
  height: number
  spacing?: never
}>

export const RootItemId = 'root' as ItemId

export function createRootItem<K, T>(root: RootBlock<K, T>): RootItem<K, T> {
  const childBlocks = mapArray(
    () => root.children ?? [],
    child => createBlockItem(child),
  )
  const placeholder = createPlaceholderItem(root.key)
  const children = createMemo(() => [...childBlocks(), placeholder])

  return {
    id: RootItemId,
    kind: 'root',
    key: root.key,
    get children() {
      return children()
    },
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
  const childBlocks = mapArray(
    () => block.children ?? [],
    child => createBlockItem(child),
  )
  const placeholder = createPlaceholderItem(block.key)
  const children = createMemo(() => [...childBlocks(), placeholder])

  return {
    id: createBlockItemId(block.key),
    kind: 'block',
    key: block.key,
    get data() {
      return block.data
    },
    get children() {
      return children()
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

export function createPlaceholderItem<K>(parent: K): PlaceholderItem<K> {
  return {
    id: `p-${parent}` as ItemId,
    kind: 'placeholder',
    parent,
  }
}

export function isPlaceholderId(id: ItemId): boolean {
  return id.startsWith('p-')
}

export function createDropzoneItem(before: ItemId, height: number): GapItem {
  return {
    id: `gap` as ItemId,
    kind: 'gap',
    before,
    height,
  }
}

export function findBlockItem<K, T>(root: RootItem<K, T> | BlockItem<K, T>, key: K): BlockItem<K, T> | undefined {
  if (root.kind === 'block' && root.key === key) {
    return root
  }
  for (const child of root.children) {
    const result = findBlockItem(child, key)
    if (result) return result
  }
  return undefined
}
