import {
  Accessor,
  batch,
  Component,
  createMemo,
  createSignal,
  For,
  JSX,
  mapArray,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { DragState, Vec2 } from './util/types'
import { modifierKey } from './util/modifierKey'
import { flattenTree } from './util/tree'
import { Block, BlockOptions, RootBlock } from './Block'
import { createGapItem, Item, ItemId, RootItemId } from './Item'
import { InsertEvent, RemoveEvent, ReorderEvent, SelectionEvent, SelectionMode } from './events'
import { measureBlock, measureBlocks } from './measure'
import { insertPlaceholders } from './insertPlaceholders'
import { getInsertionPoints } from './getInsertionPoints'
import { createAnimations } from './createAnimations'
import { ItemStyles } from './calculateTransitionStyles'
import { notNull } from './util/notNull'
import './BlockTree.css'

export type BlockTreeProps<K, T> = {
  /** The root block. */
  root: RootBlock<K, T>
  /** The set of blocks that are currently selected, in the order they were selected. */
  selection?: K[]
  /** Fired when a block is selected or deselected. */
  onSelectionChange?: (event: SelectionEvent<K>) => void
  /** Fired when blocks are inserted. */
  onInsert?: (event: InsertEvent<K, T>) => void
  /** Fired when blocks are reordered. */
  onReorder?: (event: ReorderEvent<K>) => void
  /** Fired when blocks are removed. */
  onRemove?: (event: RemoveEvent<K>) => void
  /** Optional custom dropzone component. */
  dropzone?: Component<{ height: number; style?: JSX.CSSProperties; footer?: JSX.CSSProperties }>
  /** Optional custom placeholder component. */
  placeholder?: Component<{ parent: K }>
  /** Component used to render blocks. */
  children: Component<BlockProps<K, T>>
  /** Default spacing between sibling blocks, in pixels. */
  defaultSpacing?: number
  /** Duration of transition animations, in milliseconds. */
  transitionDuration?: number
}

export interface BlockProps<K, T> {
  key: K
  data: T
  selected: boolean
  dragging: boolean
  style?: JSX.CSSProperties | string
  children: JSX.Element
  startDrag: (ev: MouseEvent) => void
}

export function BlockTree<K, T>(props: BlockTreeProps<K, T>) {
  const itemElements = new Map<ItemId, HTMLElement>()
  let topElement!: HTMLDivElement

  const options = createMemo(() => ({
    transitionDuration: props.transitionDuration ?? 200,
    defaultSpacing: props.defaultSpacing ?? 12,
    dragRadius: { x: 1.2, y: 1.5 },
  }))

  const [dragState, setDragState] = createSignal<DragState<K>>()
  const [mousePos, setMousePos] = createSignal<Vec2>({ x: 0, y: 0 })
  const updateMousePos = (ev: MouseEvent) => setMousePos({ x: ev.clientX, y: ev.clientY })

  const blockMap = createMemo(() => {
    const output = new Map<K, Block<K, T>>()
    const insert = (node: Block<K, T>) => {
      output.set(node.key, node)
      node.children?.forEach(insert)
    }
    props.root.children.forEach(insert)
    return output
  })

  const blockItems = flattenTree(() => props.root)

  const itemsWithoutDragged = createMemo(() => {
    const input = blockItems()
    const output: Item<K, T>[] = []

    const state = dragState()
    if (!state) {
      return insertPlaceholders(props.root.key, input)
    }

    let nextLevel: number | undefined
    for (const item of input) {
      if (nextLevel != null && item.level > nextLevel) {
        continue
      }
      nextLevel = undefined

      if (state.items.includes(item.key)) {
        nextLevel = item.level
        continue
      }

      output.push(item)
    }

    return insertPlaceholders(props.root.key, output)
  })

  const insertionPoints = createMemo(() => {
    const state = dragState()
    if (!state) return []

    const items = itemsWithoutDragged()
    const rects = measureBlocks(RootItemId, itemElements)

    return [...getInsertionPoints(props.root, items, state.tags, rects, options())]
  })

  const insertion = createMemo(() => {
    const state = dragState()
    if (!state) return undefined

    const root = measureBlock(itemElements.get(RootItemId)!).children
    const points = insertionPoints()

    // Check horizontal bounds
    const mouseX = mousePos().x + state.offset.x - root.left
    const radiusX = options().dragRadius.x * state.size.x
    if (mouseX < -radiusX || mouseX > radiusX) {
      return undefined
    }

    // Check vertical bounds
    const mouseY = mousePos().y + state.offset.y - root.top
    const radiusY = options().dragRadius.y * state.size.y
    for (let i = 0; i < points.length; i++) {
      const point = points[i]!
      const nextY = points[i + 1]?.y ?? Infinity
      const minY = point.y - radiusY
      const maxY = Math.min(point.y + radiusY, 0.5 * (point.y + nextY))

      if (mouseY > minY && mouseY < maxY) {
        return point
      }
    }

    return undefined
  })

  const itemsWithGap = createMemo(() => {
    const input = itemsWithoutDragged()

    const state = dragState()
    const point = insertion()
    if (!state || !point) return input

    const index = input.findIndex(item => item.id === point.id)
    if (index < 0) return input

    const gap = createGapItem(point.level, point.id, state.size.y)
    return [...input.slice(0, index), gap, ...input.slice(index)]
  })

  const { items, styles } = createAnimations(itemsWithGap, itemElements, options)

  onMount(() => {
    const onmove = updateMousePos
    const onup = (_ev: MouseEvent) => {
      const drag = dragState()
      if (!drag) return

      const insert = insertion()

      batch(() => {
        if (insert) {
          props.onReorder?.({ keys: drag.items, place: insert.place })
        }
        setDragState(undefined)
      })
    }

    document.addEventListener('mousemove', onmove)
    document.addEventListener('mouseup', onup)

    onCleanup(() => {
      document.removeEventListener('mousemove', onmove)
      document.removeEventListener('mouseup', onup)
    })
  })

  const selection = () => props.selection ?? []

  const updateSelection = (key: K, mode: SelectionMode) => {
    if (mode === SelectionMode.Set) {
      const prev = selection().slice()
      const next = [key]

      if (prev.includes(key)) {
        return { mode, focus: prev, click: next }
      } else {
        return { mode, focus: next }
      }
    }

    if (mode === SelectionMode.Toggle) {
      // Update the selection
      const keys = selection().slice()

      // Toggle the item
      const index = keys.indexOf(key)
      if (index < 0) {
        keys.push(key)
      } else {
        keys.splice(index, 1)
      }

      // Normalise
      let lastItem: Item<K> | undefined
      for (const item of items()) {
        if (item.kind !== 'block') continue

        if (lastItem && item.level <= lastItem.level) {
          lastItem = undefined
        }

        const index = keys.indexOf(item.key)
        if (index < 0) continue

        if (lastItem) {
          keys.splice(index)
        } else {
          lastItem = item
        }
      }

      return { mode, focus: keys }
    }

    // FIXME
    return { mode, focus: selection().slice() }
  }

  const renderItem = (
    item: Item<K, T>,
    children: Accessor<Item<K, T>[]>,
    styles: Accessor<Map<string, ItemStyles>> | undefined,
    itemProps: { dragging?: boolean } = {},
  ) => {
    const startDrag = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      ev.preventDefault()
      ev.stopPropagation()

      const element = itemElements.get(item.id)
      if (!element) return

      const rect = measureBlock(element).outer
      const items = selection().slice()
      if (!items.includes(item.key)) items.push(item.key)
      const tags = [...new Set(items.map(key => blockMap().get(key)?.tag).filter(notNull))]

      setDragState({
        items,
        offset: { x: rect.left - ev.clientX, y: rect.top - ev.clientY },
        size: { x: rect.width, y: rect.height },
        tags: [...tags],
      })
      updateMousePos(ev)
    }

    const placeholder = props.placeholder ?? (() => <div />)

    const defaultDropzone = (props: { height: number; style?: JSX.CSSProperties; footer?: JSX.CSSProperties }) => {
      return (
        <div
          style={{
            'border-radius': '4px',
            background: 'rgba(0, 0, 0, 0.05)',
            'z-index': 50,
            ...props.style,
          }}
        >
          <div style={{ height: `${props.height}px` }} />
          <div style={props.footer} />
        </div>
      )
    }
    const dropzone = props.dropzone ?? defaultDropzone

    let newSelection: ReturnType<typeof updateSelection> | undefined

    const handleBlockMouseDown = (ev: MouseEvent) => {
      if (item.kind !== 'block') return

      ev.stopPropagation()
      const mode = ev[modifierKey] ? SelectionMode.Toggle : ev.shiftKey ? SelectionMode.Range : SelectionMode.Set
      newSelection = updateSelection(item.key, mode)
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
        data-kind={item.kind}
        style={styles?.().get(item.id)?.outer}
        onMouseDown={handleBlockMouseDown}
        onFocus={selectionUpdateHandler('focus')}
        onClick={selectionUpdateHandler('click')}
        tabIndex={item.kind === 'block' ? -1 : undefined}
      >
        {item.kind === 'block' && (
          <Dynamic
            component={props.children}
            key={item.key}
            data={item.data}
            selected={selection().includes(item.key)}
            dragging={itemProps.dragging === true}
            style={{
              ...styles?.().get(item.id)?.inner,
              '--bt-spacing': `${item.spacing ?? options().defaultSpacing}px`,
            }}
            startDrag={startDrag}
          >
            {renderItems(children, () => styles?.().get(item.id)?.footer, styles)}
          </Dynamic>
        )}
        {item.kind === 'placeholder' && <Dynamic component={placeholder} parent={item.parent} />}
        {item.kind === 'gap' && (
          <Dynamic
            component={dropzone}
            height={item.height}
            style={styles?.().get(item.id)?.inner}
            footer={styles?.().get(item.id)?.footer}
          />
        )}
      </div>
    )
  }

  const getChildren = (item: Item<K>, index: Accessor<number>, items: Accessor<Item<K, T>[]>) => {
    const level = item.level
    const sliced = items().slice(index() + 1)
    const count = sliced.findIndex(item => item.level <= level)
    return sliced.slice(0, count < 0 ? undefined : count)
  }

  const renderItems = (
    items: Accessor<Item<K, T>[]>,
    footer: Accessor<JSX.CSSProperties | undefined> | undefined,
    childStyles: Accessor<Map<string, ItemStyles>> | undefined,
  ) => {
    const mappedItems = mapArray(items, (item, index) => {
      const children = () => getChildren(item, index, items)
      return { item, children }
    })

    const rootItems = createMemo(() => mappedItems().filter(({ item }) => item.level === items()[0]?.level))

    return (
      <div data-children>
        <For each={rootItems()}>{({ item, children }) => renderItem(item, children, childStyles)}</For>
        <div data-kind="spacer" style={footer?.()} />
      </div>
    )
  }

  const ghostContainerStyle = createMemo(() => {
    const state = dragState()
    if (!state) {
      return {}
    }

    const { x: mouseX, y: mouseY } = mousePos()

    return {
      position: 'fixed' as const,
      left: '0',
      top: '0',
      width: `${state.size.x}px`,
      height: `${state.size.y}px`,
      transform: `translate(${mouseX + state.offset.x}px, ${mouseY + state.offset.y}px)`,
    }
  })

  const containerHeight = createMemo(() => {
    if (dragState() != null) {
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
        '--bt-spacing': `${options().defaultSpacing}px`,
        '--bt-duration': `${options().transitionDuration}ms`,
      }}
    >
      <div ref={topElement} tabIndex={-1} />
      {renderItems(items, undefined, styles)}
      <Show when={dragState()} keyed>
        {state => {
          const items = createMemo(() => insertPlaceholders(props.root.key, blockItems()))
          const index = createMemo(() =>
            items().findIndex(item => item.kind === 'block' && state.items.includes(item.key)),
          )
          const firstItem = createMemo(() => items()[index()])
          const children = createMemo(() => {
            const item = firstItem()
            if (!item) return []
            return getChildren(item, index, items)
          })

          return (
            <div class="bt-ghost-container" style={ghostContainerStyle()}>
              <Show when={firstItem()} keyed>
                {item => renderItem(item, children, undefined, { dragging: true })}
              </Show>
            </div>
          )
        }}
      </Show>
    </div>
  )
}

export type { Block, BlockOptions }
