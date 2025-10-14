import { children } from 'solid-js'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { BlockTree, createBlockTree } from '../src'
import { BasicBlock, BasicBlockWithChildren } from './components'
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

export const MultipleChildSlots: Story = {
  render: () => {
    const props = createBlockTree<MyBlock>({
      key: 'root',
      data: '',
      children: [
        {
          key: 'top',
          data: 'static children',
          children: [
            {
              key: 'a',
              data: '',
              children: [
                { key: '1', data: 'Item 1' },
                { key: '2', data: 'Item 2' },
                { key: '3', data: 'Item 3' },
              ],
            },
            {
              key: 'b',
              data: '',
              children: [
                { key: '4', data: 'Item 4' },
                { key: '5', data: 'Item 5' },
                { key: '6', data: 'Item 6' },
              ],
            },
          ],
        },
      ],
    })

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree
          {...props}
          getContainers={block => {
            if (block.key === 'top') {
              return [
                ...props.getContainers(block.children!.find(b => b.key === 'a')!),
                ...props.getContainers(block.children!.find(b => b.key === 'b')!),
              ]
            } else {
              return props.getContainers(block)
            }
          }}
          children={props => {
            if (props.key === 'top') {
              const resolved = children(() => props.children).toArray
              return (
                <BasicBlockWithChildren {...props}>
                  <p style={{ margin: '0', padding: '10px 0' }}>A</p>
                  {resolved()[0]}
                  <p style={{ margin: '0', padding: '10px 0' }}>B</p>
                  {resolved()[1]}
                </BasicBlockWithChildren>
              )
            }
            return BasicBlock(props)
          }}
        />
      </div>
    )
  },
}
