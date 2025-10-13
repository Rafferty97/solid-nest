import { Accessor, createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js'
import { createBlockItemId, ItemId } from '../Item'
import { Vec2 } from '../util/types'
import { measureBlocks } from 'src/measure'
import { getInsertionPoints } from './getInsertionPoints'
import { EventHandler, ReorderEvent } from 'src/events'
import { VirtualTree } from 'src/virtual-tree'

export type DragState<K> = {
  keys: K[]
  topItem: ItemId
  offset: Vec2
  size: Vec2
  tags: string[]
}

type ClickedBlock<K> = {
  key: K
  pos: Vec2
}

export function createDnd<K, T>(
  input: Accessor<VirtualTree<K, T>>,
  options: Accessor<{ dragRadius: Vec2; dragThreshold: number }>,
  itemElements: Map<ItemId, HTMLElement>,
  getBlocksToDrag: (key: K) => T[],
  onReorder: EventHandler<ReorderEvent<K>>,
) {
  // Create drag state
  const [clickedBlock, setClickedBlock] = createSignal<ClickedBlock<K>>()
  const [dragState, setDragState] = createSignal<DragState<K>>()
  const [pointerPos, setPointerPos] = createSignal(Vec2.Zero)

  createEffect(() => {
    const state = clickedBlock()
    if (!state) return

    const onmove = (ev: MouseEvent) => {
      const tree = input()

      // Update pointer position
      setPointerPos({ x: ev.clientX, y: ev.clientY })

      // Determine whether to start dragging
      if (dragState()) return
      const dx = ev.clientX - state.pos.x
      const dy = ev.clientY - state.pos.y
      const threshold = Math.pow(options().dragThreshold, 2)
      if (dx * dx + dy * dy < threshold) return

      // Start dragging
      const { key, pos } = state

      const blocks = getBlocksToDrag(key)
      const topBlock = blocks.find(block => tree.containsChildBlock(tree.key(block), key))
      if (!topBlock) return

      const topItem = createBlockItemId(tree.key(topBlock))
      const topElem = itemElements.get(topItem)
      if (!topElem) return

      const topRect = topElem.getBoundingClientRect()

      const keys = blocks.map(tree.key)
      const offset = { x: topRect.x - pos.x, y: topRect.y - pos.y }
      const size = { x: topRect.width, y: topRect.height }
      const tags = new Set<string>()
      for (const block of blocks) {
        const { tag } = tree.options(block)
        if (tag) tags.add(tag)
      }

      setDragState({ keys, topItem, offset, size, tags: [...tags] })
    }

    const onup = () => {
      const drag = dragState()
      const insert = insertion()
      if (drag && insert) {
        onReorder({ keys: drag.keys, place: insert.place })
      }

      setClickedBlock(undefined)
      setDragState(undefined)
    }

    const oncancel = () => {
      setClickedBlock(undefined)
      setDragState(undefined)
    }

    document.addEventListener('pointermove', onmove, { passive: false })
    document.addEventListener('pointerup', onup)
    document.addEventListener('pointercancel', oncancel)

    onCleanup(() => {
      document.removeEventListener('pointermove', onmove)
      document.removeEventListener('pointerup', onup)
      document.removeEventListener('pointercancel', oncancel)
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

    const input = treeWithoutDragged()
    const rects = measureBlocks(input.root.id, itemElements)

    return getInsertionPoints(input, state.tags, rects)
  })

  // Calculate where the dragged item(s) should be inserted
  const insertion = createMemo(() => {
    const state = dragState()
    if (!state) return undefined

    const input = treeWithoutDragged()
    const root = itemElements.get(input.root.id)!.getBoundingClientRect()
    const points = insertionPoints()

    // Check horizontal bounds
    const mouseX = pointerPos().x + state.offset.x - root.left
    const radiusX = options().dragRadius.x * state.size.x
    if (mouseX < -radiusX || mouseX > radiusX) {
      return undefined
    }

    // Check vertical bounds
    const mouseY = pointerPos().y + state.offset.y - root.top
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

    const { x, y } = pointerPos()
    return new DOMRect(x + state.offset.x, y + state.offset.y, state.size.x, state.size.y)
  })

  // Visualise the dragged item(s)
  const dragTree = createMemo(() => {
    const state = dragState()
    return state && untrack(input).extractBlocks(state.keys)
  })

  // Handle point down event on drag handles
  const onDragHandleClick = (ev: PointerEvent, key: K) => {
    if (ev.button !== 0) return
    const pos = { x: ev.clientX, y: ev.clientY }
    setClickedBlock({ key, pos })
  }

  return {
    treeWithDropzone,
    dragTree,
    dragState,
    dragPosition,
    onDragHandleClick,
  }
}
