import { Component, createMemo, JSX, splitProps } from 'solid-js'
import {
  CopyEvent,
  CutEvent,
  EventHandler,
  InsertEvent,
  PasteEvent,
  Place,
  RemoveEvent,
  ReorderEvent,
  SelectionEvent,
} from './events'
import { DragContainerProps } from './components/DragContainer'
import { BlockTree as AdvancedBlockTree, Container } from './BlockTree'

export type BlockTreeProps<K, T, R = T> = {
  /** The root block. */
  root: R
  /** Gets the key of a block. */
  getKey: (block: T | R) => K
  /** Gets the child blocks of a block. */
  getChildren?: (block: T | R) => T[] | null | undefined
  /** Gets the configuration options for a block. */
  getOptions?: (block: T | R) => BlockOptions | null | undefined
  /**
   * The current selection, which can be either:
   * - A set of blocks, in the order they were selected
   * - An insertion point between blocks
   */
  selection?: Selection<K>
  /** Fired when a block is selected or deselected. */
  onSelectionChange?: (event: SelectionEvent<K>) => void
  /** Fired when blocks are inserted. */
  onInsert?: EventHandler<InsertEvent<K, T>>
  /** Fired when blocks are reordered. */
  onReorder?: EventHandler<ReorderEvent<K>>
  /** Fired when blocks are removed. */
  onRemove?: EventHandler<RemoveEvent<K>>
  /** Fired when blocks are copied. */
  onCopy?: EventHandler<CopyEvent<T>>
  /** Fired when blocks are cut. */
  onCut?: EventHandler<CutEvent<T>>
  /** Fired when blocks are pasted. */
  onPaste?: EventHandler<PasteEvent<K>>
  /** Optional custom dropzone component. */
  dropzone?: Component<{}>
  /** Optional custom placeholder component. */
  placeholder?: Component<{ parent: K }>
  /** Optional custom drag container component. */
  dragContainer?: Component<DragContainerProps<T>>
  /** Duration of transition animations, in milliseconds. */
  transitionDuration?: number
  /** Distance the cursor must move, in pixels, for a drag to be detected. */
  dragThreshold?: number
  /**
   * Forces the container to maintain a fixed height while dragging is in progress;
   * useful for preventing odd behaviour when the component is inside a scrollable element.
   */
  fixedHeightWhileDragging?: boolean
  /** Whether to allow mutliple blocks to be selected at once; defaults to `true`. */
  multiselect?: boolean
  /** Component used to render blocks. */
  children: Component<BlockProps<K, T>>
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

export type Selection<K> = { blocks?: K[]; place?: Place<K> }

export type BlockProps<K, T> = {
  key: K
  block: T
  selected: boolean
  dragging: boolean
  children: JSX.Element
}

export function BlockTree<K, T>(props: BlockTreeProps<K, T>) {
  const [ownProps, rest] = splitProps(props, ['root', 'getChildren'])

  const container = (block: T): Container<K, T> => {
    return {
      key: props.getKey(block),
      get spacing() {
        return props.getOptions?.(block)?.spacing ?? 12
      },
      get accepts() {
        return props.getOptions?.(block)?.accepts
      },
      getBlocks() {
        return ownProps.getChildren?.(block) ?? []
      },
    }
  }

  const root = createMemo(() => container(props.root))

  return <AdvancedBlockTree root={root()} getContainers={block => [container(block)]} {...rest} />
}
