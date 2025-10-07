import { Accessor, Component, createMemo, For, JSX, onMount, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Block, BlockOptions, RootBlock } from './Block'
import { createRootItem, Item, ItemId, RootItemId } from './Item'
import { EventHandler, InsertEvent, RemoveEvent, ReorderEvent, SelectionEvent } from './events'
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
import {
  calculateSelectionMode,
  normaliseSelection,
  SelectionMode,
  updateSelection,
  UpdateSelectReturn,
} from './selection'
import { createDnd } from './dnd/createDnd'
import { notNull } from './util/notNull'
import { Dropzone } from './components/Dropzone'
import { DragContainer } from './components/DragContainer'
import { blockClass, blockInnerClass, childrenWrapperClass, injectCSS, spacerClass, spacingVar } from './styles'
import { VirtualTree } from './virtual-tree'

export type BlockTreeProps<K, T> = {
  /** The root block. */
  root: RootBlock<K, T>
  /** The set of blocks that are currently selected, in the order they were selected. */
  selection?: K[]
  /** Fired when a block is selected or deselected. */
  onSelectionChange?: (event: SelectionEvent<K>) => void
  /** Fired when blocks are inserted. */
  onInsert?: EventHandler<InsertEvent<K, T>>
  /** Fired when blocks are reordered. */
  onReorder?: EventHandler<ReorderEvent<K>>
  /** Fired when blocks are removed. */
  onRemove?: EventHandler<RemoveEvent<K>>
  /** Optional custom dropzone component. */
  dropzone?: Component<{}>
  /** Optional custom placeholder component. */
  placeholder?: Component<{ parent: K }>
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

export interface BlockProps<K, T> {
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

  const selection = () => props.selection ?? []

  const root = createMemo(() => createRootItem(props.root))
  const inputTree = createMemo(() => VirtualTree.create(root()))

  const dnd = createDnd(inputTree, options, itemElements, ev => props.onReorder?.(ev))
  const { treeWithDropzone, dragState, dragPosition, startDrag } = dnd

  const { tree, styles } = createAnimations(treeWithDropzone, itemElements, options)

  const renderItem = (
    item: Item<K, T>,
    styles: Accessor<Map<string, AnimationState>> | undefined,
    itemProps: { dragging?: boolean } = {},
  ) => {
    const onStartDrag = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      const keys = normaliseSelection(root(), selection())
      const blocks = keys.map(key => blockMap().get(key)).filter(notNull)
      startDrag(ev, item.key, blocks)
    }

    const placeholder = props.placeholder ?? (() => <div />)
    const dropzone = props.dropzone ?? Dropzone

    let newSelection: UpdateSelectReturn<K> | undefined

    const handleBlockMouseDown = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      ev.stopPropagation()
      const mode = calculateSelectionMode(ev, options().multiselect)
      newSelection = updateSelection(root(), props.selection ?? [], item.key, mode)
    }

    const selectionUpdateHandler = (event: 'focus' | 'click') => (ev: Event) => {
      if (item.kind !== 'block') return

      ev.stopPropagation()

      const ids = newSelection?.[event]
      if (!newSelection || !ids) return

      props.onSelectionChange?.({
        key: item.key,
        mode: newSelection.mode,
        before: selection().slice(),
        after: ids,
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
              selected={selection().includes(item.key)}
              dragging={itemProps.dragging === true}
              startDrag={onStartDrag}
            >
              {renderItems(
                () => item.children,
                () => spacerStyle(styles?.().get(item.id)),
                styles,
              )}
            </Dynamic>
          </div>
        )}
        {item.kind === 'placeholder' && (
          <div class={blockInnerClass} style={placeholderStyle(styles?.().get(item.id))}>
            <Dynamic component={placeholder} parent={item.parent} />
          </div>
        )}
        {item.kind === 'gap' && (
          <div
            class={blockInnerClass}
            style={{ 'z-index': 50, height: `${item.height}px`, ...dropzoneStyle(styles?.().get(item.id)) }}
          >
            <Dynamic component={dropzone} />
          </div>
        )}
      </div>
    )
  }

  const renderItems = (
    items: Accessor<Item<K, T>[]>,
    spacerStyle: Accessor<JSX.CSSProperties | undefined> | undefined,
    childStyles: Accessor<Map<string, AnimationState>> | undefined,
  ) => {
    return (
      <div class={childrenWrapperClass}>
        <For each={items()}>{item => renderItem(item, childStyles)}</For>
        <div class={spacerClass} style={spacerStyle?.()} />
      </div>
    )
  }

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

  const containerHeight = createMemo(() => {
    if (dragState() != null && props.fixedHeightWhileDragging) {
      const root = measureBlock(itemElements.get(RootItemId)!)
      return `${root.outer.height}px`
    } else {
      return 'auto'
    }
  })

  const handleDelete = (ev: KeyboardEvent) => {
    if (!selection().length) return

    ev.preventDefault()
    props.onRemove?.({ keys: selection().slice() })
  }

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Delete') {
      return handleDelete(ev)
    }
  }

  const handleCopy = (ev: ClipboardEvent) => {
    if (!selection().length) return
    ev.preventDefault()
    // todo
  }

  const handlePaste = (_ev: ClipboardEvent) => {
    // todo
  }

  return (
    <div
      ref={el => itemElements.set(RootItemId, el)}
      class={blockClass}
      data-kind="root"
      onFocusOut={ev => {
        if (ev.relatedTarget === topElement) return
        props.onSelectionChange?.({
          before: selection().slice(),
          after: [],
          mode: SelectionMode.Deselect,
        })
      }}
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
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
        {renderItems(
          () => tree().root.children,
          () => spacerStyle(styles().get(RootItemId)),
          styles,
        )}
        {/* This element forces the container to adapt its height based on the spacer inside `renderItems` */}
        <div style={{ 'margin-top': '-1px', 'padding-bottom': '1px' }} />
      </div>
      {/* Drag ghost */}
      <Show when={dragState()} keyed>
        {state => {
          // const firstItem = createMemo(() => findBlockItem(inputTree(), state.top))
          return (
            <DragContainer style={dragContainerStyle()}>
              {/* <Show when={firstItem()} keyed>
                {item => renderItem(item, undefined, { dragging: true })}
                </Show> */}
              <div class="bg-red-500 h-full" />
            </DragContainer>
          )
        }}
      </Show>
    </div>
  )
}

export type { Block, BlockOptions }
