export type SelectionEvent<K> = {
  /** The key of the block that was selected/deselected. */
  readonly key?: K
  /** The selection mode used. */
  readonly mode: SelectionMode
  /** The set of selected blocks before the event fired. */
  readonly before: K[]
  /** The new set of selected blocks after this event is applied. */
  readonly after: K[]
}

export enum SelectionMode {
  /**
   * The default selection mode, which selects
   * the clicked block and deselects all others;
   * applied when no additional keys are pressed. */
  Set = 'set',
  /**
   * Toggles the selection state of the clicked block;
   * applied when the modifier key is pressed.
   */
  Toggle = 'toggle',
  /**
   * Selects all blocks between the most recently
   * selected block and the clicked block;
   * applied when the shift key is pressed.
   */
  Range = 'range',
  /** Deselects all blocks. */
  Deselect = 'deselect',
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
