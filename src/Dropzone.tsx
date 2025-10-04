import { JSX } from 'solid-js'

export function Dropzone(props: { style?: JSX.CSSProperties }) {
  return <div style={{ ...props.style, 'border-radius': '6px', background: 'rgba(0, 0, 0, 0.05)' }} />
}
