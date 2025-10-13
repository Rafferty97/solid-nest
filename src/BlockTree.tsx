import { Accessor, Component, createMemo, For, JSX, onCleanup, onMount, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { BlockItem, Item, ItemId, RootItemId } from './Item'
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
import { createAnimations } from './createAnimations'
import {
  AnimationState,
  spacerStyle,
  innerStyle,
  outerStyle,
  dropzoneStyle,
  placeholderStyle,
} from './calculateTransitionStyles'
import { calculateSelectionMode, normaliseSelection, updateSelection } from './selection'
import { createDnd } from './dnd/createDnd'
import { notNull } from './util/notNull'
import { Dropzone } from './components/Dropzone'
import { blockClass, blockInnerClass, childrenWrapperClass, injectCSS, spacerClass, spacingVar } from './styles'
import { VirtualTree } from './virtual-tree'
import { DragContainer, DragContainerProps } from './components/DragContainer'
import { Placeholder } from './components/Placeholder'
import { DEFAULT_SPACING } from './constants'

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
  /** Whether the block's children are static, i.e. cannot be selected or modified. */
  static?: boolean
}

export type Selection<K> = { blocks?: K[]; place?: Place<K> }

export type BlockProps<K, T> = {
  key: K
  block: T
  selected: boolean
  dragging: boolean
  children: JSX.Element
}

export function BlockTree<K, T, R = T>(props: BlockTreeProps<K, T, R>) {
  const itemElements = new Map<ItemId, HTMLElement>()
  let topElement!: HTMLDivElement

  onMount(injectCSS)

  const options = createMemo(() => ({
    transitionDuration: props.transitionDuration ?? 200,
    dragRadius: { x: 1.2, y: 1.5 },
    multiselect: props.multiselect ?? true,
    dragThreshold: props.dragThreshold ?? 10,
  }))

  const blockMap = createMemo(() => {
    const output = new Map<K, T>()
    const insert = (block: T) => {
      output.set(props.getKey(block), block)
      props.getChildren?.(block)?.forEach(insert)
    }
    props.getChildren?.(props.root)?.forEach(insert)
    return output
  })

  const selectedBlocks = () => props.selection?.blocks ?? []

  const selectedPlace = createMemo(() => {
    const selection = props.selection
    if (selection?.place) {
      return selection.place
    }
    if (selection?.blocks) {
      const keys = new Set(selection.blocks)
      const process = (block: T | R): Place<K> | undefined => {
        const parent = props.getKey(block)
        const blocks = props.getChildren?.(block) ?? []

        let before: K | null = null
        for (let i = blocks.length - 1; i >= 0; i--) {
          const key = props.getKey(blocks[i]!)
          if (keys.has(key)) {
            return { parent, before }
          }
          const result = process(blocks[i]!)
          if (result) return result
          before = key
        }
        return undefined
      }
      return process(props.root)
    }
  })

  const inputTree = VirtualTree.create<K, T, R>(
    () => props.root,
    block => props.getKey(block),
    block => props.getChildren?.(block) ?? [],
    block => props.getOptions?.(block) ?? {},
  )

  const blocksToDrag = (key: K) => {
    const selection_ = selectedBlocks()
    return normaliseSelection(inputTree(), selection_.includes(key) ? selection_ : [key])
      .map(key => blockMap().get(key))
      .filter(notNull)
  }

  const dnd = createDnd(inputTree, options, itemElements, blocksToDrag, ev => props.onReorder?.(ev))
  const { treeWithDropzone, dragTree, dragState, dragPosition, onDragHandleClick } = dnd

  const { tree, styles } = createAnimations(treeWithDropzone, itemElements, options)

  const containerHeight = createMemo(() => {
    if (dragState() != null && props.fixedHeightWhileDragging) {
      const root = itemElements.get(RootItemId)!.getBoundingClientRect()
      return `${root.height}px`
    } else {
      return 'auto'
    }
  })

  const dragContainerStyle = createMemo(() => {
    const rect = dragPosition()

    return {
      position: 'fixed' as const,
      left: '0',
      top: '0',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: `translate(${rect.x}px, ${rect.y}px)`,
      'z-index': 10000,
    }
  })

  const handleDelete = (ev: KeyboardEvent) => {
    if (!selectedBlocks().length) return

    ev.preventDefault()
    props.onRemove?.({ keys: selectedBlocks().slice() })
  }

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Delete') {
      return handleDelete(ev)
    }
  }

  const handleCopy = (ev: ClipboardEvent) => {
    const keys = normaliseSelection(tree(), selectedBlocks())
    const data = ev.clipboardData
    if (!keys.length || !data) return

    ev.preventDefault()
    const blocks = keys.map(key => blockMap().get(key)).filter(notNull)
    props.onCopy?.({ blocks, data })
  }

  const handleCut = (ev: ClipboardEvent) => {
    const keys = normaliseSelection(tree(), selectedBlocks())
    const data = ev.clipboardData
    if (!keys.length || !data) return

    ev.preventDefault()
    const blocks = keys.map(key => blockMap().get(key)).filter(notNull)
    props.onCut?.({ blocks, data })
  }

  const handlePaste = (ev: ClipboardEvent) => {
    const place = selectedPlace()
    const data = ev.clipboardData
    if (!place || !data) return

    ev.preventDefault()
    props.onPaste?.({ place, data })
  }

  let removeClickHandler: (() => void) | undefined

  onMount(() => {
    const ondown = () => removeClickHandler?.()
    document.addEventListener('pointerdown', ondown, { capture: true })
    onCleanup(() => document.removeEventListener('pointerdown', ondown, { capture: true }))
  })

  const getSpacing = (block: T | R) => props.getOptions?.(block)?.spacing ?? DEFAULT_SPACING

  const renderItem = (
    item: Item<K, T>,
    tree: Accessor<VirtualTree<K, T, R>>,
    itemProps: { dragging?: boolean } = {},
    styles?: Accessor<Map<string, AnimationState>>,
  ) => {
    const handlePointerDown = (ev: PointerEvent) => {
      if (!ev.isPrimary) return
      if (item.kind !== 'block') return

      ev.preventDefault()
      ev.stopPropagation()

      const mode = calculateSelectionMode(ev, options().multiselect)
      const nextSelection = updateSelection(tree(), selectedBlocks(), item.key, mode)

      const select = () => {
        const { mode, keys } = nextSelection
        props.onSelectionChange?.({ kind: 'blocks', key: item.key, mode, blocks: keys })
        topElement.focus({ preventScroll: true })
      }

      if (nextSelection.onClick) {
        const handler = (ev: Event) => {
          ev.preventDefault()
          ev.stopPropagation()
          select()
        }
        ev.currentTarget?.addEventListener('click', handler, { once: true })
        removeClickHandler = () => ev.currentTarget?.removeEventListener('click', handler)
      } else {
        select()
      }

      if (ev.target instanceof HTMLElement && ev.currentTarget instanceof HTMLElement) {
        for (const el of ev.currentTarget.querySelectorAll('[data-drag-handle]')) {
          if (el.contains(ev.target)) {
            onDragHandleClick(ev, item.key)
            break
          }
        }
      }
    }

    return (
      <div
        class={blockClass}
        data-kind={item.kind}
        style={outerStyle(styles?.().get(item.id))}
        onPointerDown={handlePointerDown}
      >
        {item.kind === 'block' && (
          <div
            ref={el => itemElements.set(item.id, el)}
            class={blockInnerClass}
            style={{
              ...innerStyle(styles?.().get(item.id)),
              [spacingVar]: `${getSpacing(item.block)}px`,
            }}
          >
            <Dynamic
              component={props.children}
              key={item.key}
              block={item.block}
              selected={selectedBlocks().includes(item.key)}
              dragging={itemProps.dragging === true}
            >
              {renderItems(item, tree, styles)}
            </Dynamic>
          </div>
        )}
        {item.kind === 'placeholder' && (
          <div
            ref={el => itemElements.set(item.id, el)}
            class={blockInnerClass}
            style={placeholderStyle(styles?.().get(item.id))}
          >
            <Dynamic component={props.placeholder ?? Placeholder} parent={item.parent} />
          </div>
        )}
        {item.kind === 'gap' && (
          <div
            ref={el => itemElements.set(item.id, el)}
            class={blockInnerClass}
            style={{ 'z-index': 50, height: `${item.height}px`, ...dropzoneStyle(styles?.().get(item.id)) }}
          >
            <Dynamic component={props.dropzone ?? Dropzone} />
          </div>
        )}
      </div>
    )
  }

  const renderItems = (
    parent: BlockItem<K, T | R>,
    tree: Accessor<VirtualTree<K, T, R>>,
    styles?: Accessor<Map<string, AnimationState>>,
  ) => {
    const items = createMemo(() => tree().children(parent.id))
    if (props.getOptions?.(parent.block)?.static) {
      return (
        <For each={items().filter(i => i.kind === 'block')}>
          {item => (
            <div
              ref={el => itemElements.set(item.id, el)}
              style={{
                [spacingVar]: `${getSpacing(item.block)}px`,
              }}
            >
              {renderItems(item, tree, styles)}
            </div>
          )}
        </For>
      )
    } else {
      return (
        <div class={childrenWrapperClass} data-key={parent.id}>
          <For each={items()}>{item => renderItem(item, tree, {}, styles)}</For>
          <div class={spacerClass} style={spacerStyle(styles?.().get(parent.id))} />
        </div>
      )
    }
  }

  return (
    <div
      data-kind="root"
      class={blockClass}
      onFocusOut={ev => {
        if (ev.relatedTarget === topElement) return
        props.onSelectionChange?.({ kind: 'deselect' })
      }}
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
      style={{
        position: 'relative',
        height: containerHeight(),
        'box-sizing': 'border-box',
        ['--solidnest-duration']: `${options().transitionDuration}ms`,
      }}
    >
      <div
        ref={el => itemElements.set(RootItemId, el)}
        class={blockInnerClass}
        style={{
          ...innerStyle(styles().get(RootItemId)),
          [spacingVar]: `${getSpacing(props.root)}px`,
          position: 'static',
        }}
      >
        <div ref={topElement} tabIndex={-1} />
        {renderItems(tree().root, tree, styles)}
        {/* This element forces the container to adapt its height based on the spacer inside `renderItems` */}
        <div style={{ 'margin-top': '-1px', 'padding-bottom': '1px' }} />
      </div>
      {/* Drag ghost */}
      <Show when={dragTree()} keyed>
        {tree => {
          const blocks = tree
            .children(RootItemId)
            .map(item => (item.kind === 'block' ? blockMap().get(item.key) : null))
            .filter(notNull)
          const top = createMemo(() => {
            const state = dragState()
            return state && tree.findItemById(state.topItem)
          })
          return (
            <div style={dragContainerStyle()}>
              <Dynamic component={props.dragContainer ?? DragContainer} blocks={blocks}>
                <Show when={top()} keyed>
                  {top => renderItem(top, () => tree, { dragging: true })}
                </Show>
              </Dynamic>
            </div>
          )
        }}
      </Show>
    </div>
  )
}
