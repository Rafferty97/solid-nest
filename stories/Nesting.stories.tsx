import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree } from '../src'
import { BasicBlockWithChildren } from './components'
import { MyBlock } from './types'
import './main.css'

const meta = {
  title: 'BlockTree/Nesting',
  component: BlockTree,
} satisfies Meta<typeof BlockTree>

export default meta
type Story = StoryObj<typeof meta>

const basicList: MyBlock = {
  key: 'root',
  data: '',
  children: [
    { key: '1', data: 'Group' },
    { key: '2', data: 'Group' },
    { key: '3', data: 'Item 1' },
    { key: '4', data: 'Item 2' },
    { key: '5', data: 'Item 3' },
  ],
}

export const NestingRules: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree
          {...props}
          getOptions={block => ({
            tag: block.data === 'Group' ? 'group' : 'block',
            accepts: block.key === 'root' ? ['group'] : block.data === 'Group' ? ['block'] : [],
          })}
          children={BasicBlockWithChildren}
        />
      </div>
    )
  },
}
