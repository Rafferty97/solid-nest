export type BlockMeasurements = Readonly<{
  margin: Readonly<{
    top: number
    right: number
    bottom: number
    left: number
  }>
  outer: DOMRect
  inner?: DOMRect
  children: DOMRect
}>

export function measureBlocks<K>(root: K, blocks: Map<K, HTMLElement>): Map<K, BlockMeasurements> {
  const output = new Map()

  blocks.get(root)?.setAttribute('data-measuring', 'measuring')
  for (const [key, container] of blocks) {
    output.set(key, measureBlock(container))
  }
  blocks.get(root)?.removeAttribute('data-measuring')

  return output
}

export function measureBlock(block: HTMLElement): BlockMeasurements {
  const outer = block.getBoundingClientRect()
  let inner = block.querySelector('[data-children]')?.getBoundingClientRect()

  if (inner && (inner.top >= outer.bottom || inner.bottom <= outer.top)) {
    inner = undefined
  }

  let margin = { top: outer.height, right: 0, bottom: 0, left: 0 }
  if (inner) {
    margin = {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
    }
  }

  const children = inner ?? outer

  return { margin, outer, inner, children }
}
