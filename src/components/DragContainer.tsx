import { JSX } from 'solid-js'

export function DragContainer(props: { style: JSX.CSSProperties; children: JSX.Element }) {
  return (
    <div class="bt-ghost-container" style={props.style}>
      {props.children}
    </div>
  )
}
