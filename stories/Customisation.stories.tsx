import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree, RootBlock } from '../src'
import { BasicBlock, BasicBlockWithChildren, BasicBlockWithCollapse, Placeholder } from './components'
import './main.css'

const meta = {
  title: 'BlockTree/Customisation',
  component: BlockTree,
} satisfies Meta<typeof BlockTree>

export default meta
type Story = StoryObj<typeof meta>

const basicList: RootBlock<string, string> = {
  key: 'root',
  children: [
    { key: '1', data: 'Drag me' },
    { key: '2', data: 'Or drag me' },
    { key: '3', data: 'Reorder us!' },
  ],
}

const nestedList: RootBlock<string, string> = {
  key: 'root',
  children: [
    {
      key: '1',
      data: 'Drag me',
      children: [
        { key: '2', data: 'Or drag me' },
        { key: '3', data: 'Reorder us!' },
      ],
    },
    { key: '4', data: 'Drag me' },
    { key: '5', data: 'Or drag me' },
    { key: '6', data: 'Reorder us!' },
  ],
}

const nestedListWithCollapse: RootBlock<string, { text: string; open: boolean }> = {
  key: 'root',
  children: [
    {
      key: '1',
      data: { text: 'Drag me', open: true },
      children: [
        { key: '2', data: { text: 'Or drag me', open: true } },
        { key: '3', data: { text: 'Reorder us!', open: true } },
      ],
    },
    { key: '4', data: { text: 'Drag me', open: true } },
    { key: '5', data: { text: 'Or drag me', open: true } },
    { key: '6', data: { text: 'Reorder us!', open: true } },
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
