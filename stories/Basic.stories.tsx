import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree } from '../src'
import { BasicBlock, BasicBlockWithChildren, BasicBlockWithCollapse, Placeholder } from './components'
import { MyBlock, CollapsableBlock } from './types'
import './main.css'

const meta = {
  title: 'BlockTree/Getting Started',
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

const nestedList: MyBlock = {
  key: 'root',
  data: '',
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

const nestedListWithCollapse: CollapsableBlock = {
  key: 'root',
  text: '',
  open: true,
  children: [
    {
      key: '1',
      text: 'Drag me',
      open: true,
      children: [
        { key: '2', text: 'Or drag me', open: true },
        { key: '3', text: 'Reorder us!', open: true },
      ],
    },
    { key: '4', text: 'Drag me', open: true },
    { key: '5', text: 'Or drag me', open: true },
    { key: '6', text: 'Reorder us!', open: true },
  ],
}

export const BasicUsage: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} children={BasicBlock} />
      </div>
    )
  },
}

export const SingleSelection: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} multiselect={false} children={BasicBlock} />
      </div>
    )
  },
}

export const NestedBlocks: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>(structuredClone(nestedList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} placeholder={Placeholder} children={BasicBlockWithChildren} />
      </div>
    )
  },
}

export const CollapsableBlocks: Story = {
  render: () => {
    const props = createBlockTree<CollapsableBlock>(structuredClone(nestedListWithCollapse))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} placeholder={Placeholder}>
          {block => (
            <BasicBlockWithCollapse
              {...block}
              setOpen={open => props.updateBlock(block.key, { ...block.block, open })}
            />
          )}
        </BlockTree>
      </div>
    )
  },
}
