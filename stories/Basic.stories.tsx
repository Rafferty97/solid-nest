import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree } from '../src'
import { BasicBlock, BasicBlockWithChildren, BasicBlockWithCollapse, Placeholder } from './components'
import { MyBlock, CollapsableBlock } from './types'
import { createUniqueId } from 'solid-js'
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
      data: 'Item 1',
      children: [
        { key: '2', data: 'Item 2', children: [] },
        { key: '3', data: 'Item 3', children: [] },
      ],
    },
    { key: '4', data: 'Item 4', children: [] },
    { key: '5', data: 'Item 5', children: [] },
    { key: '6', data: 'Item 6', children: [] },
  ],
}

const nestedListWithCollapse: CollapsableBlock = {
  key: 'root',
  text: '',
  children: [
    {
      key: '1',
      text: 'Item 1',
      open: true,
      children: [
        { key: '2', text: 'Item 2', children: [], open: true },
        { key: '3', text: 'Item 3', children: [], open: true },
      ],
    },
    { key: '4', text: 'Item 4', children: [], open: true },
    { key: '5', text: 'Item 5', children: [], open: true },
    { key: '6', text: 'Item 6', children: [], open: true },
  ],
  open: true,
}

export const BasicUsage: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>(structuredClone(basicList))

    const appendBlock = () =>
      props.onInsert({
        place: { parent: props.root.key, before: null },
        blocks: [{ key: createUniqueId(), data: 'New block' }],
      })

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} children={BasicBlock} />
        <div style={{ height: '12px' }} />
        <button onClick={appendBlock}>Add block</button>
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
