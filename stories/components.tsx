import { Show } from 'solid-js'
import { BlockProps } from 'src'
import { CollapsableBlock, MyBlock } from './types'
import { BsGripVertical } from 'solid-icons/bs'

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

export const BasicBlock = (props: BlockProps<string, MyBlock>) => {
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

export const BasicBlockWithChildren = (props: BlockProps<string, MyBlock>) => {
  return (
    <div
      style={{
        border: '2px solid #ddd',
        padding: '0.75rem',
        'border-radius': '4px',
        background: props.selected ? '#e3f2fd' : 'white',
        cursor: 'grab',
        'touch-action': 'none',
      }}
      data-drag-handle
    >
      {props.block.data}
      <div style={{ margin: '0.75rem 0 0 0' }}>{props.children}</div>
    </div>
  )
}

export const BasicBlockWithCollapse = (
  props: BlockProps<string, CollapsableBlock> & { setOpen: (open: boolean) => void },
) => {
  return (
    <div
      style={{
        border: '2px solid #ddd',
        padding: '0.75rem',
        'border-radius': '4px',
        background: props.selected ? '#e3f2fd' : 'white',
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
          onClick={() => props.setOpen(!props.block.open)}
        >
          <svg
            style={{
              display: 'block',
              width: '1rem',
              transform: props.block.open ? 'rotate(90deg)' : '',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div>
          {props.block.text} ({props.key})
        </div>
      </div>
      <Show when={props.block.open}>
        <div style={{ margin: '0.75rem 0 0 0' }}>{props.children}</div>
      </Show>
    </div>
  )
}

export const BasicBlockWithDragHandle = (props: BlockProps<string, MyBlock>) => {
  return (
    <div
      style={{
        position: 'relative',
        border: '2px solid #ddd',
        padding: '1rem 1rem 1rem 2rem',
        'border-radius': '4px',
        background: props.selected ? '#e3f2fd' : 'white',
        'touch-action': 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '1rem',
          background: '#eee',
          cursor: 'grab',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
        data-drag-handle
      >
        <BsGripVertical style={{ color: '#888', 'pointer-events': 'none' }} />
      </div>
      {props.block.data}
    </div>
  )
}
