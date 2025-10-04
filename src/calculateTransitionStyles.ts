import { JSX } from 'solid-js'
import { isPlaceholderId, Item, ItemId } from './Item'
import { BlockMeasurements } from './measure'
import { calculateLayout } from './calculateLayout'
import { Vec2 } from './util/types'

export interface AnimationState {
  size: Vec2
  deltaPos: Vec2
  deltaSize: Vec2
  transition: boolean
}

export function calculateTransitionStyles<K>(
  prevItems: Item<K>[],
  nextItems: Item<K>[],
  prevMeasures: Map<ItemId, BlockMeasurements>,
  nextMeasures: Map<ItemId, BlockMeasurements>,
  options: { defaultSpacing: number },
) {
  const prevRects = calculateLayout(prevItems, id => prevMeasures.get(id) ?? nextMeasures.get(id), options)
  const nextRects = calculateLayout(nextItems, id => nextMeasures.get(id) ?? prevMeasures.get(id), options)

  // Special treatment for gaps
  const GapItemId = 'gap' as ItemId
  const [prevGap, nextGap] = [prevRects.get(GapItemId), nextRects.get(GapItemId)]
  if (!prevGap && nextGap) {
    const calcHeight = () => {
      const itemId = nextItems.find(item => item.kind === 'gap')?.before
      if (!itemId) return 0
      const [prevItem, nextItem] = [prevRects.get(itemId), nextRects.get(itemId)]
      if (!prevItem || !nextItem) return 0
      const prop = isPlaceholderId(itemId) ? ('bottom' as const) : ('y' as const)
      return nextGap.height + (prevItem[prop] - nextItem[prop])
    }
    prevRects.set(GapItemId, new DOMRect(nextGap.x, nextGap.y, nextGap.width, calcHeight()))
  }

  const invert = new Map<ItemId, AnimationState>()
  const play = new Map<ItemId, AnimationState>()
  const parentOffsets: Vec2[] = []

  for (const { id, level } of nextItems) {
    const prev = prevRects.get(id)
    const next = nextRects.get(id)
    if (!prev || !next) continue

    const offset = { x: prev.x - next.x, y: prev.y - next.y }
    const parentOffset = parentOffsets[level - 1] ?? Vec2.Zero
    parentOffsets[level] = offset

    const size = { x: next.width, y: next.height }
    const deltaPos = { x: offset.x - parentOffset.x, y: offset.y - parentOffset.y }
    const deltaSize = { x: prev.width - next.width, y: prev.height - next.height }

    invert.set(id, { size, deltaPos, deltaSize, transition: false })
    play.set(id, { size, deltaPos: Vec2.Zero, deltaSize: Vec2.Zero, transition: true })
  }

  return { invert, play }
}

export function outerStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    position: 'relative',
    width: `${state.size.x}px`,
    height: `${state.size.y}px`,
    'box-sizing': 'border-box',
  }
}

export function innerStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    transition: state.transition ? 'transform var(--bt-duration), width var(--bt-duration)' : '',
    transform: `translate(${state.deltaPos.x}px, ${state.deltaPos.y}px)`,
    width: `${state.size.x + state.deltaSize.x}px`,
    'box-sizing': 'border-box',
  }
}

export function footerStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    transition: state.transition ? `margin-top var(--bt-duration)` : '',
    'margin-top': `${state.deltaSize.y}px`,
  }
}

export function placeholderStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    transition: state.transition
      ? 'transform var(--bt-duration), width var(--bt-duration), height var(--bt-duration)'
      : '',
    transform: `translate(${state.deltaPos.x}px, ${state.deltaPos.y}px)`,
    width: `${state.size.x + state.deltaSize.x}px`,
    height: `${state.size.y + state.deltaSize.y}px`,
    'box-sizing': 'border-box',
  }
}
