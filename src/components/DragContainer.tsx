import { JSX } from 'solid-js'
import { dragContainerClass } from 'src/styles'

export function DragContainer(props: { style: JSX.CSSProperties; children: JSX.Element }) {
  return (
    <div class={dragContainerClass} style={props.style}>
      {props.children}
    </div>
  )
}
