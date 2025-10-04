import { Accessor, createEffect, createSignal, onCleanup, untrack } from 'solid-js'
import { Item, ItemId, RootItemId } from './Item'
import { calculateTransitionStyles, AnimationState } from './calculateTransitionStyles'
import { measureBlocks, measureInnerBlocks } from './measure'

export function createAnimations<K, T>(
  input: Accessor<Item<K, T>[]>,
  itemElements: Map<ItemId, HTMLElement>,
  options: Accessor<{
    defaultSpacing: number
    transitionDuration: number
  }>,
) {
  const [items, setItems] = createSignal<Item<K, T>[]>([])
  const [styles, setStyles] = createSignal(new Map<ItemId, AnimationState>())
  const [animationState, setAnimationState] = createSignal<{
    step: number
    fn: Generator<number>
  }>()

  function* animate(prevItems: Item<K, T>[], nextItems: Item<K, T>[]) {
    const initRects = measureInnerBlocks(itemElements)

    // F. Before state measurement
    setStyles(new Map())
    yield 0
    const prevRects = measureBlocks(RootItemId, itemElements)

    // L. After state measurement
    setItems(nextItems)
    yield 0
    const nextRects = measureBlocks(RootItemId, itemElements)

    // I. Apply inverse styles
    const { invert, play } = calculateTransitionStyles(prevItems, nextItems, initRects, prevRects, nextRects, options())
    setStyles(invert)

    // P. Play animation
    yield 10
    setStyles(play)

    // Cleanup
    yield options().transitionDuration + 100
    setStyles(new Map())
  }

  const saveItems = () => untrack(input).map(item => ({ ...item }))

  let prevItems = saveItems()

  createEffect(() => {
    const nextItems = input().slice()
    const fn = animate(prevItems, nextItems)
    prevItems = saveItems()
    setAnimationState({ step: 0, fn })
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

  return { items, styles }
}
