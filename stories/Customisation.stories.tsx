import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree } from '../src'
import { BasicBlock, BasicBlockWithChildren } from './components'
import { MyBlock } from './types'
import './main.css'

const meta = {
  title: 'BlockTree/Customisation',
  component: BlockTree,
} satisfies Meta<typeof BlockTree>

export default meta
type Story = StoryObj<typeof meta>

const basicList: MyBlock = {
  key: 'root',
  data: '',
  children: [
    { key: '1', data: 'Drag me' },
    { key: '2', data: 'Or drag me' },
    { key: '3', data: 'Reorder us!' },
  ],
}

export const CustomPlaceholder: Story = {
  render: () => {
    const props = createBlockTree(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree
          {...props}
          children={BasicBlockWithChildren}
          placeholder={() => (
            <div style={{ background: '#00f4', height: '3rem', border: '2px solid blue', 'border-radius': '4px' }} />
          )}
        />
      </div>
    )
  },
}

export const CustomDropzone: Story = {
  render: () => {
    const props = createBlockTree(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree
          {...props}
          children={BasicBlock}
          dropzone={() => <div style={{ background: 'red', height: '100%', opacity: 0.2, 'border-radius': '4px' }} />}
        />
      </div>
    )
  },
}

export const CustomDragContainer: Story = {
  render: () => {
    const props = createBlockTree(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree
          {...props}
          children={BasicBlock}
          dragContainer={props => (
            <div
              style={{
                background: 'white',
                border: '1px solid black',
                height: '100%',
                'border-radius': '4px',
                display: 'flex',
                'justify-content': 'center',
                'align-items': 'center',
                cursor: 'grabbing',
              }}
            >
              Dragging {props.blocks.length} block(s)
            </div>
          )}
        />
      </div>
    )
  },
}
