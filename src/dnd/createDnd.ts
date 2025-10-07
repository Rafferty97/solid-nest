import { Accessor, batch, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { createBlockItemId, ItemId, RootItem, RootItemId } from '../Item'
import { Vec2 } from '../util/types'
import { notNull } from 'src/util/notNull'
import { measureBlock, measureBlocks } from 'src/measure'
import { getInsertionPoints } from './getInsertionPoints'
import { EventHandler, ReorderEvent } from 'src/events'
import { Block, containsChild } from 'src/Block'
import { VirtualTree } from 'src/virtual-tree'

export type DragState<K> = {
  keys: K[]
  top: K
  offset: Vec2
  size: Vec2
  tags: string[]
}

export function createDnd<K, T>(
  input: Accessor<VirtualTree<K, T>>,
  options: Accessor<{ defaultSpacing: number; dragRadius: Vec2 }>,
  itemElements: Map<ItemId, HTMLElement>,
  onReorder: EventHandler<ReorderEvent<K>>,
) {
  // Create drag state
  const [dragState, setDragState] = createSignal<DragState<K>>()

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
          onReorder({ keys: drag.keys, place: insert.place })
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

  // Remove the selected blocks
  const treeWithoutDragged = createMemo(() => {
    const state = dragState()
    if (!state) return input()
    return input().removeBlocks(state.keys)
  })

  // Calculate the possible insertion points
  const insertionPoints = createMemo(() => {
    const state = dragState()
    if (!state) return []

    const rects = measureBlocks(RootItemId, itemElements)

    return getInsertionPoints(treeWithoutDragged(), state.tags, rects, options())
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
  const treeWithDropzone = createMemo(() => {
    const input = treeWithoutDragged()

    const state = dragState()
    const point = insertion()
    if (!state || !point) return input

    return treeWithoutDragged().insertDropzone(point.place, state.size.y)
  })

  // Calculate position of drag container
  const dragPosition = createMemo(() => {
    const state = dragState()
    if (!state) return new DOMRect()

    const { x, y } = mousePos()
    return new DOMRect(x + state.offset.x, y + state.offset.y, state.size.x, state.size.y)
  })

  // Handle drag start events
  const startDrag = (ev: MouseEvent, key: K, blocks: Block<K, T>[]) => {
    ev.preventDefault()
    ev.stopPropagation()

    const keys = blocks.map(block => block.key)

    const top = blocks.find(block => containsChild(block, key))?.key
    if (!top) return

    const element = itemElements.get(createBlockItemId(top))
    if (!element) return

    const rect = measureBlock(element).outer
    const offset = { x: rect.left - ev.clientX, y: rect.top - ev.clientY }
    const size = { x: rect.width, y: rect.height }

    const tags = [...new Set(blocks.map(block => block.tag).filter(notNull))]

    setDragState({ keys, top, offset, size, tags })
  }

  return {
    treeWithDropzone,
    dragState,
    dragPosition,
    startDrag,
  }
}
