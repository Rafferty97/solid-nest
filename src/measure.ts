import { blockInnerClass, childrenWrapperClass } from './styles'

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
  childrenVisible: boolean
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
  const inner = block.querySelector(`:scope > .${blockInnerClass}`)?.getBoundingClientRect()
  let children = block.querySelector(`:scope .${childrenWrapperClass}`)?.getBoundingClientRect()

  const childrenVisible = !!children && children.top < outer.bottom && children.bottom > outer.top
  children ??= outer

  let margin = { top: outer.height, right: 0, bottom: 0, left: 0 }
  if (childrenVisible) {
    margin = {
      top: children.top - outer.top,
      right: outer.right - children.right,
      bottom: outer.bottom - children.bottom,
      left: children.left - outer.left,
    }
  }

  return { margin, outer, inner, children, childrenVisible }
}

export function measureInnerBlocks<K>(blocks: Map<K, HTMLElement>): Map<K, DOMRect | undefined> {
  const output = new Map()
  for (const [key, container] of blocks) {
    output.set(key, measureInner(container))
  }
  return output
}

export function measureInner(block: HTMLElement): DOMRect | undefined {
  return block.querySelector(`:scope > .${blockInnerClass}`)?.getBoundingClientRect()
}
