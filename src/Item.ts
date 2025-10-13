import { Container } from './BlockTree'

export type ItemId = string & { readonly brand: unique symbol }

export type Item<K, T = unknown> = ContainerItem<K> | BlockItem<K, T> | PlaceholderItem<K> | GapItem

export type ItemKind = Item<any, any>['kind']

export type ContainerItem<K> = Readonly<{ id: ItemId; kind: 'container'; key: K; spacing: number; accepts: string[] }>
export type BlockItem<K, T> = Readonly<{ id: ItemId; kind: 'block'; key: K; block: T }>
export type PlaceholderItem<K> = Readonly<{ id: ItemId; kind: 'placeholder'; parent: K }>
export type GapItem = Readonly<{ id: ItemId; kind: 'gap'; before: ItemId; height: number }>

export const DropzoneItemId = 'gap' as ItemId

export function createContainerItem<K>(container: Container<K, unknown>): ContainerItem<K> {
  return {
    id: `c-${container.key}` as ItemId,
    kind: 'container',
    key: container.key,
    spacing: container.spacing ?? 0,
    accepts: container.accepts ?? [],
  }
}

export function createContainerItemId<K>(key: K): ItemId {
  return `c-${key}` as ItemId
}

export function createBlockItem<K, T>(block: T, key: K): BlockItem<K, T> {
  return {
    id: createBlockItemId(key),
    kind: 'block',
    key,
    block,
  }
}

export function createBlockItemId<K>(key: K): ItemId {
  return `b-${key}` as ItemId
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
