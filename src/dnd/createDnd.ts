import { Accessor, batch, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { createEvent } from 'solid-events'
import { createDropzoneItem, Item, ItemId, RootItemId } from '../Item'
import { insertPlaceholders } from './insertPlaceholders'
import { DragState, Vec2 } from '../util/types'
import { measureBlock, measureBlocks } from 'src/measure'
import { getInsertionPoints } from './getInsertionPoints'
import { ReorderEvent } from 'src/events'

export function createDnd<K, T>(
  input: Accessor<Item<K, T>[]>,
  rootKey: Accessor<K>,
  options: Accessor<{ defaultSpacing: number; dragRadius: Vec2 }>,
  itemElements: Map<ItemId, HTMLElement>,
) {
  // Create events
  const [onStartDrag, startDrag] = createEvent<DragState<K>>()
  const [onReorderItems, reorderItems] = createEvent<ReorderEvent<K>>()

  // Create drag state
  const [dragState, setDragState] = createSignal<DragState<K>>()
  onStartDrag(state => setDragState(state))

  // Track mouse position
  const [mousePos, setMousePos] = createSignal<Vec2>({ x: 0, y: 0 })
  const updateMousePos = (ev: MouseEvent) => setMousePos({ x: ev.clientX, y: ev.clientY })

  onMount(() => {
    const onmove = updateMousePos
    const onup = () => {
      const drag = dragState()
      if (!drag) return

      const insert = insertion()

      batch(() => {
        if (insert) {
          reorderItems({ keys: drag.keys, place: insert.place })
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

  // Insert placeholders
  const itemsWithPlaceholders = createMemo(() => insertPlaceholders(rootKey(), input()))

  // Remove the dragged items, and insert placeholders
  const itemsWithoutDragged = createMemo(() => {
    const state = dragState()
    if (!state) {
      return itemsWithPlaceholders()
    }

    const input_ = itemsWithPlaceholders()
    const output: Item<K, T>[] = []

    let nextLevel: number | undefined
    for (const item of input_) {
      if (nextLevel != null && item.level > nextLevel) {
        continue
      }
      nextLevel = undefined

      if (item.key && state.keys.includes(item.key)) {
        nextLevel = item.level
        continue
      }

      output.push(item)
    }

    return output
  })

  // Calculate the possible insertion points
  const insertionPoints = createMemo(() => {
    const state = dragState()
    if (!state) return []

    const items = itemsWithoutDragged()
    const rects = measureBlocks(RootItemId, itemElements)

    return [...getInsertionPoints(items, state.tags, rects, options())]
  })

  // Calculate where the dragged item(s) should be inserted
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

  // Insert the dropzone
  const items = createMemo(() => {
    const input = itemsWithoutDragged()

    const state = dragState()
    const point = insertion()
    if (!state || !point) return input

    const index = input.findIndex(item => item.id === point.id)
    if (index < 0) return input

    const gap = createDropzoneItem(point.level, point.id, state.size.y)
    return [...input.slice(0, index), gap, ...input.slice(index)]
  })

  // Calculate position of drag container
  const dragPosition = createMemo(() => {
    const state = dragState()
    if (!state) return new DOMRect()

    const { x, y } = mousePos()
    return new DOMRect(x + state.offset.x, y + state.offset.y, state.size.x, state.size.y)
  })

  return {
    items,
    dragState,
    dragPosition,
    startDrag,
    onReorderItems,
  }
}
