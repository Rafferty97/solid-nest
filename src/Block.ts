export type Block<K, T> = BlockOptions & {
  /**
   * Unique identifier of the block.
   * Identifiers must remain unique when converted to strings.
   */
  key: K
  /** The user-defined data associated with the block. */
  data: T
  /** The child blocks. */
  children?: Block<K, T>[]
}

export type RootBlock<K, T> = BlockOptions & {
  /**
   * Unique identifier of the block.
   * Identifiers must remain unique when converted to strings.
   */
  key: K
  /** The top-level blocks. */
  children: Block<K, T>[]
}

/** Configures how a block is rendered and interacts with other blocks. */
export type BlockOptions = {
  /** The spacing between child blocks, in pixels. */
  spacing?: number
  /**
   * The block's tag, used to determine which parent blocks it can be dragged into.
   * Blocks without a tag can be accepted by any parent.
   * */
  tag?: string
  /** The set of tags that this block accepts as children. */
  accepts?: string[]
}
