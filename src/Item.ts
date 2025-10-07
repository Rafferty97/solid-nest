import { createMemo, mapArray } from 'solid-js'
import { Block, BlockOptions } from './BlockTree'
import { RootBlock } from './Block'

export type ItemId = string & { readonly brand: unique symbol }

export type Item<K, T = unknown> = RootItem<K, T> | BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemKind = Item<any, any>['kind']

export type BlockItem<K, T> = BlockOptions &
  Readonly<{
    id: ItemId
    kind: 'block'
    key: K
    data: T
    children: Item<K, T>[]
  }>

export type RootItem<K, T> = BlockOptions &
  Readonly<{
    id: ItemId
    kind: 'root'
    key: K
    children: Item<K, T>[]
  }>

export type PlaceholderItem<K> = Readonly<{
  id: ItemId
  kind: 'placeholder'
  parent: K
  key?: never
  children?: never
}>

export type GapItem = Readonly<{
  id: ItemId
  kind: 'gap'
  before: ItemId
  height: number
  key?: never
  children?: never
}>

export const RootItemId = 'root' as ItemId
export const DropzoneItemId = 'gap' as ItemId

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

// export function findBlockItem<K, T>(root: RootItem<K, T> | BlockItem<K, T>, key: K): BlockItem<K, T> | undefined {
//   if (root.kind === 'block' && root.key === key) {
//     return root
//   }
//   for (const child of root.children) {
//     const result = findBlockItem(child, key)
//     if (result) return result
//   }
//   return undefined
// }
