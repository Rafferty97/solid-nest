import { JSX, Index } from 'solid-js'
import { Item } from 'src/Item'

export type DragContainerProps<K, T> = {
  blocks: Item<K, T>[]
  children: JSX.Element
}

export function DragContainer(props: DragContainerProps<unknown, unknown>) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Index each={props.blocks.slice(0, 3)}>
        {(_, index) => (
          <div
            style={{
              position: 'absolute',
              left: `${6 * index}px`,
              top: `${6 * index}px`,
              width: '100%',
              'z-index': -index,
            }}
          >
            {props.children}
          </div>
        )}
      </Index>
    </div>
  )
}
