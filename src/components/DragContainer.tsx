import { JSX, Index } from 'solid-js'

export type DragContainerProps<T> = {
  blocks: T[]
  children: JSX.Element
}

export function DragContainer(props: DragContainerProps<unknown>) {
  return (
    <div style={{ position: 'absolute', left: '0', right: '0', top: '0', bottom: '0' }}>
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
