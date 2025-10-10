export type ItemId = string & { readonly brand: unique symbol }

export type Item<K, T = unknown> = BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemKind = Item<any, any>['kind']

export type BlockItem<K, T> = Readonly<{ id: ItemId; kind: 'block'; key: K; block: T }>
export type PlaceholderItem<K> = Readonly<{ id: ItemId; kind: 'placeholder'; parent: K }>
export type GapItem = Readonly<{ id: ItemId; kind: 'gap'; before: ItemId; height: number }>

export const RootItemId = 'root' as ItemId
export const DropzoneItemId = 'gap' as ItemId

export function createRootItem<K, T>(block: T, key: K): BlockItem<K, T> {
  return {
    id: RootItemId,
    kind: 'block',
    key,
    block,
  }
}

export function createBlockItem<K, T>(block: T, key: K): BlockItem<K, T> {
  return {
    id: createBlockItemId(key),
    kind: 'block',
    key,
    block,
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
