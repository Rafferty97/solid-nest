import { JSX } from 'solid-js'
import { Item, ItemId } from './Item'
import { BlockMeasurements } from './measure'
import { calculateLayout } from './calculateLayout'

export interface ItemStyles {
  outer: JSX.CSSProperties
  inner: JSX.CSSProperties
  footer: JSX.CSSProperties
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

  const invert = new Map<string, ItemStyles>()
  const play = new Map<string, ItemStyles>()
  const parentOffsets: (readonly [number, number])[] = []

  for (const { id, level } of nextItems) {
    const prev = prevRects.get(id)
    const next = nextRects.get(id)
    if (!prev || !next) continue

    const offset = [prev.left - next.left, prev.top - next.top] as const
    const parentOffset = parentOffsets[level - 1] ?? [0, 0]
    parentOffsets[level] = offset

    const outer: JSX.CSSProperties = {
      position: 'relative',
      width: `${next.width}px`,
      height: `${next.height}px`,
      'box-sizing': 'border-box',
    }

    const innerFrom: JSX.CSSProperties = {
      position: 'absolute',
      left: '0',
      top: '0',
      transform: `translate(${offset[0] - parentOffset[0]}px, ${offset[1] - parentOffset[1]}px)`,
      width: `${prev.width}px`,
      transition: undefined,
      'box-sizing': 'border-box',
    }

    const innerTo: JSX.CSSProperties = {
      position: 'absolute',
      left: '0',
      top: '0',
      transform: '',
      width: `${next.width}px`,
      transition: 'transform var(--bt-duration), width var(--bt-duration)',
      'box-sizing': 'border-box',
    }

    const footerFrom: JSX.CSSProperties = {
      transition: undefined,
      'margin-top': `${prev.height - next.height}px`,
    }

    const footerTo: JSX.CSSProperties = {
      transition: 'var(--bt-duration)',
      'margin-top': '0px',
    }

    invert.set(id, { outer, inner: innerFrom, footer: footerFrom })
    play.set(id, { outer, inner: innerTo, footer: footerTo })
  }

  return { invert, play }
}
