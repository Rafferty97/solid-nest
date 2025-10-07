import { JSX } from 'solid-js'
import { createDropzoneItemId, DropzoneItemId, isPlaceholderId, ItemId } from './Item'
import { BlockMeasurements } from './measure'
import { calculateLayout } from './calculateLayout'
import { Vec2 } from './util/types'
import { durationVar } from './styles'
import { VirtualTree } from './virtual-tree'

export interface AnimationState {
  size: Vec2
  deltaPos: Vec2
  deltaSize: Vec2
  transition: boolean
  level: number
}

export function calculateTransitionStyles<K>(
  prevTree: VirtualTree<K, unknown>,
  nextTree: VirtualTree<K, unknown>,
  initMeasures: Map<ItemId, DOMRect | undefined>,
  prevMeasures: Map<ItemId, BlockMeasurements>,
  nextMeasures: Map<ItemId, BlockMeasurements>,
  options: { defaultSpacing: number },
) {
  const prevRects = calculateLayout(prevTree, id => prevMeasures.get(id) ?? nextMeasures.get(id), options)
  const nextRects = calculateLayout(nextTree, id => nextMeasures.get(id) ?? prevMeasures.get(id), options)

  // Special treatment for gaps
  const [prevGap, nextGap] = [prevRects.get(DropzoneItemId), nextRects.get(DropzoneItemId)]
  if (!prevGap && nextGap) {
    const calcHeight = () => {
      const dropzone = nextTree.findItem(DropzoneItemId)
      const itemId = dropzone?.kind === 'gap' && dropzone.before
      if (!itemId) return 0
      const [prevItem, nextItem] = [prevRects.get(itemId), nextRects.get(itemId)]
      if (!prevItem || !nextItem) return 0
      const prop = isPlaceholderId(itemId) ? ('bottom' as const) : ('y' as const)
      return nextGap.height + (prevItem[prop] - nextItem[prop])
    }
    prevRects.set(DropzoneItemId, new DOMRect(nextGap.x, nextGap.y, nextGap.width, calcHeight()))
  }

  const invert = new Map<ItemId, AnimationState>()
  const play = new Map<ItemId, AnimationState>()
  const parents: Vec2[] = []
  const zeroAdjust = { x: 0, y: 0, width: 0, height: 0 }

  const prevLevels = new Map(prevTree.levels())

  for (const [id, level] of nextTree.levels()) {
    const prev = prevRects.get(id)
    const next = nextRects.get(id)
    if (!prev || !next) continue

    const size = { x: next.width, y: next.height }

    let adjust = zeroAdjust
    const a = initMeasures.get(id)
    const b = prevMeasures.get(id)?.inner
    if (a && b) {
      adjust = {
        x: a.x - b.x,
        y: a.y - b.y,
        width: a.width - b.width,
        height: a.height - b.height,
      }
    }

    const deltaPos = {
      x: prev.x - next.x + adjust.x,
      y: prev.y - next.y + adjust.y,
    }
    const deltaSize = {
      x: prev.width - next.width + adjust.width,
      y: prev.height - next.height + adjust.height,
    }

    const parent = parents[level - 1] ?? Vec2.Zero
    parents[level] = { ...deltaPos }
    deltaPos.x -= parent.x
    deltaPos.y -= parent.y

    const maxLevel = Math.max(prevLevels.get(id) ?? level, level)

    invert.set(id, { size, deltaPos, deltaSize, transition: false, level: maxLevel })
    play.set(id, { size, deltaPos: Vec2.Zero, deltaSize: Vec2.Zero, transition: true, level: maxLevel })
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
    transition: state.transition ? `transform var(${durationVar}), width var(${durationVar})` : '',
    transform: `translate(${state.deltaPos.x}px, ${state.deltaPos.y}px)`,
    width: `${state.size.x + state.deltaSize.x}px`,
    'box-sizing': 'border-box',
    'z-index': state.level.toString(),
  }
}

export function placeholderStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    transition: state.transition ? `width var(${durationVar})` : '',
    width: `${state.size.x + state.deltaSize.x}px`,
    'box-sizing': 'border-box',
  }
}

export function spacerStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    transition: state.transition ? `margin-top var(${durationVar})` : '',
    'margin-top': `${state.deltaSize.y}px`,
  }
}

export function dropzoneStyle(state?: AnimationState): JSX.CSSProperties {
  if (!state) return {}
  return {
    position: 'absolute',
    left: '0',
    top: '0',
    transition: state.transition
      ? `transform var(${durationVar}), width var(${durationVar}), height var(${durationVar})`
      : '',
    transform: `translate(${state.deltaPos.x}px, ${state.deltaPos.y}px)`,
    width: `${state.size.x + state.deltaSize.x}px`,
    height: `${Math.max(state.size.y + state.deltaSize.y, 0)}px`,
    'box-sizing': 'border-box',
  }
}
