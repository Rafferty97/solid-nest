import { Accessor, Component, createMemo, For, JSX, onMount, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Block, BlockOptions, RootBlock } from './Block'
import { Item, ItemId, RootItemId } from './Item'
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
import { measureBlock } from './measure'
import { createAnimations } from './createAnimations'
import {
  AnimationState,
  spacerStyle,
  innerStyle,
  outerStyle,
  dropzoneStyle,
  placeholderStyle,
} from './calculateTransitionStyles'
import { calculateSelectionMode, normaliseSelection, updateSelection, UpdateSelectReturn } from './selection'
import { createDnd } from './dnd/createDnd'
import { notNull } from './util/notNull'
import { Dropzone } from './components/Dropzone'
import { blockClass, blockInnerClass, childrenWrapperClass, injectCSS, spacerClass, spacingVar } from './styles'
import { VirtualTree } from './virtual-tree'
import { DragContainer, DragContainerProps } from './components/DragContainer'
import { Placeholder } from './components/Placeholder'

export type BlockTreeProps<K, T> = {
  /** The root block. */
  root: RootBlock<K, T>
  /**
   * The current selection, which can be either:
   * - A set of blocks, in the order they were selected
   * - An insertion point between blocks
   */
  /** The set of blocks that are currently selected, in the order they were selected. */
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
  onCopy?: EventHandler<CopyEvent<K, T>>
  /** Fired when blocks are cut. */
  onCut?: EventHandler<CutEvent<K, T>>
  /** Fired when blocks are pasted. */
  onPaste?: EventHandler<PasteEvent<K>>
  /** Optional custom dropzone component. */
  dropzone?: Component<{}>
  /** Optional custom placeholder component. */
  placeholder?: Component<{ parent: K }>
  /** Optional custom drag container component. */
  dragContainer?: Component<DragContainerProps<K, T>>
  /** Default spacing between sibling blocks, in pixels. */
  defaultSpacing?: number
  /** Duration of transition animations, in milliseconds. */
  transitionDuration?: number
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

export type Selection<K> = { blocks?: K[]; place?: Place<K> }

export type BlockProps<K, T> = {
  key: K
  data: T
  selected: boolean
  dragging: boolean
  children: JSX.Element
  startDrag: (ev: MouseEvent) => void
}

export function BlockTree<K, T>(props: BlockTreeProps<K, T>) {
  const itemElements = new Map<ItemId, HTMLElement>()
  let topElement!: HTMLDivElement

  onMount(injectCSS)

  const options = createMemo(() => ({
    transitionDuration: props.transitionDuration ?? 200,
    defaultSpacing: props.defaultSpacing ?? 12,
    dragRadius: { x: 1.2, y: 1.5 },
    multiselect: props.multiselect ?? true,
  }))

  const blockMap = createMemo(() => {
    const output = new Map<K, Block<K, T>>()
    const insert = (node: Block<K, T>) => {
      output.set(node.key, node)
      node.children?.forEach(insert)
    }
    props.root.children?.forEach(insert)
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
      const process = (parent: K, blocks: Block<K, T>[]): Place<K> | undefined => {
        let before: K | null = null
        for (let i = blocks.length - 1; i >= 0; i--) {
          const { key, children } = blocks[i]!
          if (keys.has(key)) {
            return { parent, before }
          }
          if (children) {
            const result = process(key, children)
            if (result) return result
          }
          before = key
        }
        return undefined
      }
      return process(props.root.key, props.root.children ?? [])
    }
  })

  const inputTree = createMemo(() => VirtualTree.create(props.root))

  const dnd = createDnd(inputTree, options, itemElements, ev => props.onReorder?.(ev))
  const { treeWithDropzone, dragTree, dragState, dragPosition, startDrag } = dnd

  const { tree, styles } = createAnimations(treeWithDropzone, itemElements, options)

  const containerHeight = createMemo(() => {
    if (dragState() != null && props.fixedHeightWhileDragging) {
      const root = measureBlock(itemElements.get(RootItemId)!)
      return `${root.outer.height}px`
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

  const renderItem = (
    item: Item<K, T>,
    tree: Accessor<VirtualTree<K, T>>,
    itemProps: { dragging?: boolean } = {},
    styles?: Accessor<Map<string, AnimationState>>,
  ) => {
    const onStartDrag = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      const keys = normaliseSelection(tree(), selectedBlocks())
      const blocks = keys.map(key => blockMap().get(key)).filter(notNull)
      startDrag(ev, item.key, blocks)
    }

    let newSelection: UpdateSelectReturn<K> | undefined

    const handleBlockMouseDown = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      ev.stopPropagation()
      const mode = calculateSelectionMode(ev, options().multiselect)
      newSelection = updateSelection(tree(), selectedBlocks(), item.key, mode)
    }

    const selectionUpdateHandler = (event: 'focus' | 'click') => (ev: Event) => {
      if (item.kind !== 'block') return

      ev.stopPropagation()

      const ids = newSelection?.[event]
      if (!newSelection || !ids) return

      props.onSelectionChange?.({
        kind: 'blocks',
        key: item.key,
        mode: newSelection.mode,
        blocks: ids,
      })
      setTimeout(() => topElement.focus({ preventScroll: true }), 0)
    }

    return (
      <div
        ref={el => itemElements.set(item.id, el)}
        class={blockClass}
        data-kind={item.kind}
        style={outerStyle(styles?.().get(item.id))}
        onMouseDown={handleBlockMouseDown}
        onFocus={selectionUpdateHandler('focus')}
        onClick={selectionUpdateHandler('click')}
        tabIndex={item.kind === 'block' ? -1 : undefined}
      >
        {item.kind === 'block' && (
          <div
            class={blockInnerClass}
            style={{
              ...innerStyle(styles?.().get(item.id)),
              [spacingVar]: `${item.spacing ?? options().defaultSpacing}px`,
            }}
          >
            <Dynamic
              component={props.children}
              key={item.key}
              data={item.data}
              selected={selectedBlocks().includes(item.key)}
              dragging={itemProps.dragging === true}
              startDrag={onStartDrag}
            >
              {renderItems(item.id, tree, styles)}
            </Dynamic>
          </div>
        )}
        {item.kind === 'placeholder' && (
          <div class={blockInnerClass} style={placeholderStyle(styles?.().get(item.id))}>
            <Dynamic component={props.placeholder ?? Placeholder} parent={item.parent} />
          </div>
        )}
        {item.kind === 'gap' && (
          <div
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
    parent: ItemId,
    tree: Accessor<VirtualTree<K, T>>,
    styles?: Accessor<Map<string, AnimationState>>,
  ) => {
    const items = createMemo(() => tree().children(parent))
    return (
      <div class={childrenWrapperClass}>
        <For each={items()}>{item => renderItem(item, tree, {}, styles)}</For>
        <div class={spacerClass} style={spacerStyle(styles?.().get(parent))} />
      </div>
    )
  }

  return (
    <div
      ref={el => itemElements.set(RootItemId, el)}
      class={blockClass}
      data-kind="root"
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
        class={blockInnerClass}
        style={{
          ...innerStyle(styles().get(RootItemId)),
          [spacingVar]: `${props.root.spacing ?? options().defaultSpacing}px`,
          position: 'static',
        }}
      >
        <div ref={topElement} tabIndex={-1} />
        {renderItems(RootItemId, tree, styles)}
        {/* This element forces the container to adapt its height based on the spacer inside `renderItems` */}
        <div style={{ 'margin-top': '-1px', 'padding-bottom': '1px' }} />
      </div>
      {/* Drag ghost */}
      <Show when={dragTree()} keyed>
        {tree => {
          const blocks = tree.children(RootItemId)
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

export type { Block, BlockOptions }
