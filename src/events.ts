import { SelectionMode } from './selection'

export type EventHandler<E> = (event: E) => void

export type SelectionEvent<K> =
  | {
      /** Indicates that a block was clicked. */
      readonly kind: 'blocks'
      /** The key of the block that was selected. */
      readonly key: K
      /** The selection mode used. */
      readonly mode: SelectionMode
      /** The new set of selected blocks after this event is applied. */
      readonly blocks: K[]
      readonly place?: never
    }
  | {
      /** Indicates that a gap between blocks was clicked. */
      readonly kind: 'place'
      /** A place representing the gap that was clicked. */
      readonly place: Place<K>
      readonly blocks?: never
    }
  | {
      /** Indicates that something other than the block tree was clicked. */
      readonly kind: 'deselect'
      readonly place?: never
      readonly blocks?: never
    }

export type InsertEvent<K, T> = {
  /** The blocks being inserted. */
  blocks: T[]
  /** The place where the blocks will be inserted. */
  place: Place<K>
}

export type ReorderEvent<K> = {
  /** The keys of the blocks that are being moved. */
  keys: K[]
  /** The place where the blocks will be inserted. */
  place: Place<K>
}

export type Place<K> = {
  /** The new parent of the moved blocks. */
  parent: K
  /**
   * The block to insert the moved blocks before,
   * or `null` if they are to be inserted at the end.
   */
  before: K | null
}

export type RemoveEvent<K> = {
  /** The keys of the blocks that are being removed. */
  keys: K[]
}

export type CopyEvent<T> = {
  /** The blocks that are being copied. */
  blocks: T[]
  /** The clipboard data transfer object. */
  data: DataTransfer
}

export type CutEvent<T> = {
  /** The blocks that are being cut. */
  blocks: T[]
  /** The clipboard data transfer object. */
  data: DataTransfer
}

export type PasteEvent<K> = {
  /** The place where data is being pasted. */
  place: Place<K>
  /** The clipboard data transfer object. */
  data: DataTransfer
}
