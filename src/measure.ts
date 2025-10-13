import { childrenWrapperClass } from './styles'

export type BlockMeasurements = Readonly<{
  container: DOMRect
  children: Readonly<{ x: number; y: number; w: number }>[]
  bottom: number
}>

export function measureBlocks<K>(root: K, blocks: Map<K, HTMLElement>): Map<K, BlockMeasurements> {
  const output = new Map()

  blocks.get(root)?.setAttribute('data-measuring', 'measuring')
  for (const [key, container] of blocks) {
    output.set(key, measureBlock(key, container))
  }
  blocks.get(root)?.removeAttribute('data-measuring')

  console.log(output)
  return output
}

function measureBlock<K>(key: K, block: HTMLElement): BlockMeasurements {
  const container = block.getBoundingClientRect()

  let y = container.y

  const children: BlockMeasurements['children'] = []
  for (const el of block.querySelectorAll(`.${childrenWrapperClass}[data-key=${JSON.stringify(key)}]`)) {
    const rect = el.getBoundingClientRect()
    children.push({
      x: rect.x - container.x,
      y: rect.top - y,
      w: rect.width - container.width,
    })
    y = rect.bottom
  }

  const bottom = container.bottom - y

  // const childrenVisible = !!children && children.top < container.bottom && children.bottom > container.top

  return { container, children, bottom }
}

export function measureInnerBlocks<K>(blocks: Map<K, HTMLElement>): Map<K, DOMRect | undefined> {
  const output = new Map()
  for (const [key, container] of blocks) {
    output.set(key, container.getBoundingClientRect())
  }
  return output
}
