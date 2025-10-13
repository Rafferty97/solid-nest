import { childrenWrapperClass } from './styles'

export type BlockMeasurements = Readonly<{
  margin: Readonly<{
    top: number
    right: number
    bottom: number
    left: number
  }>
  container: DOMRect
  children: DOMRect
  childrenVisible: boolean
}>

export function measureBlocks<K>(root: K, blocks: Map<K, HTMLElement>): Map<K, BlockMeasurements> {
  const output = new Map()

  blocks.get(root)?.setAttribute('data-measuring', 'measuring')
  for (const [key, container] of blocks) {
    output.set(key, measureBlock(key, container))
  }
  blocks.get(root)?.removeAttribute('data-measuring')

  return output
}

function measureBlock<K>(key: K, block: HTMLElement): BlockMeasurements {
  const container = block.getBoundingClientRect()
  let children = block
    .querySelector(`.${childrenWrapperClass}[data-key=${JSON.stringify(key)}]`)
    ?.getBoundingClientRect()

  const childrenVisible = !!children && children.top < container.bottom && children.bottom > container.top
  children ??= container

  let margin = { top: container.height, right: 0, bottom: 0, left: 0 }
  if (childrenVisible) {
    margin = {
      top: children.top - container.top,
      right: container.right - children.right,
      bottom: container.bottom - children.bottom,
      left: children.left - container.left,
    }
  }

  return { margin, container, children, childrenVisible }
}

export function measureInnerBlocks<K>(blocks: Map<K, HTMLElement>): Map<K, DOMRect | undefined> {
  const output = new Map()
  for (const [key, container] of blocks) {
    output.set(key, container.getBoundingClientRect())
  }
  return output
}
