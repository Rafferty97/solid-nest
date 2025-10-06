/** A block in a `BlockTree`. */
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

/** The root block, which doesn't take a `data` property as its not actually rendered to the UI. */
export type RootBlock<K, T> = Omit<Block<K, T>, 'data'>

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

export function containsChild<K>(tree: Block<K, unknown>, id: K): boolean {
  return tree.key === id || tree.children?.find(child => containsChild(child, id)) != null
}
