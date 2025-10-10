import { Show } from 'solid-js'
import { Block, BlockProps } from 'src'

export const Placeholder = () => {
  return (
    <div
      style={{
        padding: '0.75rem',
        'font-size': '0.85rem',
        color: '#444',
        'text-align': 'center',
        border: '1px dashed #bbb',
      }}
    >
      Drag some blocks onto me
    </div>
  )
}

export const BasicBlock = (props: BlockProps<string, Block<string, string>>) => {
  return (
    <div
      style={{
        border: '2px solid #ddd',
        padding: '1rem',
        'border-radius': '4px',
        background: props.selected ? '#e3f2fd' : 'white',
        cursor: 'grab',
        'touch-action': 'none',
      }}
      data-drag-handle
    >
      {props.block.data}
    </div>
  )
}

export const BasicBlockWithChildren = (block: BlockProps<string, string>) => {
  return (
    <div
      style={{
        border: '2px solid #ddd',
        padding: '0.75rem',
        'border-radius': '4px',
        background: block.selected ? '#e3f2fd' : 'white',
        cursor: 'grab',
        'touch-action': 'none',
      }}
      data-drag-handle
    >
      {block.block}
      <div style={{ margin: '0.75rem 0 0 0' }}>{block.children}</div>
    </div>
  )
}

export const BasicBlockWithCollapse = (props: {
  block: BlockProps<string, { text: string; open: boolean }>
  setOpen: (open: boolean) => void
}) => {
  return (
    <div
      style={{
        border: '2px solid #ddd',
        padding: '0.75rem',
        'border-radius': '4px',
        background: props.block.selected ? '#e3f2fd' : 'white',
        cursor: 'grab',
        'touch-action': 'none',
      }}
      data-drag-handle
    >
      <div style={{ display: 'flex', 'align-items': 'center' }}>
        <div
          style={{
            cursor: 'pointer',
            padding: '0.25rem',
            margin: '-0.25rem',
            'margin-inline-end': '0.5ch',
          }}
          onPointerDown={ev => ev.stopPropagation()}
          onClick={() => props.setOpen(!props.block.block.open)}
        >
          <svg
            style={{
              display: 'block',
              width: '1rem',
              transform: props.block.block.open ? 'rotate(90deg)' : '',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div>{props.block.block.text}</div>
      </div>
      <Show when={props.block.block.open}>
        <div style={{ margin: '0.75rem 0 0 0' }}>{props.block.children}</div>
      </Show>
    </div>
  )
}
