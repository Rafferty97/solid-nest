import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js'
import { ItemId, RootItemId } from './Item'
import { calculateTransitionStyles, AnimationState } from './calculateTransitionStyles'
import { measureBlocks, measureInnerBlocks } from './measure'
import { VirtualTree } from './virtual-tree'

export function createAnimations<K, T>(
  input: Accessor<VirtualTree<K, T>>,
  itemElements: Map<ItemId, HTMLElement>,
  options: Accessor<{ transitionDuration: number }>,
) {
  const [tree, setTree] = createSignal(input())
  const [styles, setStyles] = createSignal(new Map<ItemId, AnimationState>())
  const [animationState, setAnimationState] = createSignal<{
    step: number
    fn: Generator<number>
  }>()

  function* animate(prev: VirtualTree<K, T>, next: VirtualTree<K, T>) {
    const initRects = measureInnerBlocks(itemElements)

    // F. Before state measurement
    setStyles(new Map())
    yield 0
    const prevRects = measureBlocks(RootItemId, itemElements)

    // L. After state measurement
    setTree(next)
    yield 0
    const nextRects = measureBlocks(RootItemId, itemElements)

    // I. Apply inverse styles
    const { invert, play } = calculateTransitionStyles(prev, next, initRects, prevRects, nextRects)
    setStyles(invert)

    // P. Play animation
    yield 10
    setStyles(play)

    // Cleanup
    yield options().transitionDuration + 100
    setStyles(new Map())
  }

  let prevTree = tree()
  createEffect(() => {
    const nextTree = input()
    setAnimationState({ step: 0, fn: animate(prevTree, nextTree) })
    prevTree = nextTree
  })

  createEffect(() => {
    const state = animationState()
    if (!state) return

    const result = state.fn.next()
    if (result.done) {
      setAnimationState(undefined)
      return
    }

    const next = { step: state.step + 1, fn: state.fn }
    if (result.value > 0) {
      const timer = setTimeout(() => setAnimationState(next), result.value)
      onCleanup(() => clearTimeout(timer))
    } else {
      setAnimationState(next)
    }
  })

  return { tree, styles }
}
