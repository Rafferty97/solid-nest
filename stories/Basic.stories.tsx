import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Block, BlockTree, createBlockTree, Root } from '../src'
import { BasicBlock, BasicBlockWithChildren, BasicBlockWithCollapse, Placeholder } from './components'
import './main.css'

const meta = {
  title: 'BlockTree/Getting Started',
  component: BlockTree,
} satisfies Meta<typeof BlockTree>

export default meta
type Story = StoryObj<typeof meta>

const basicList: Block<string, string> = {
  key: 'root',
  data: '',
  children: [
    { key: '1', data: 'Drag me' },
    { key: '2', data: 'Or drag me' },
    { key: '3', data: 'Reorder us!' },
  ],
}

// const nestedList: RootBlock<string, string> = {
//   key: 'root',
//   children: [
//     {
//       key: '1',
//       data: 'Drag me',
//       children: [
//         { key: '2', data: 'Or drag me' },
//         { key: '3', data: 'Reorder us!' },
//       ],
//     },
//     { key: '4', data: 'Drag me' },
//     { key: '5', data: 'Or drag me' },
//     { key: '6', data: 'Reorder us!' },
//   ],
// }

// const nestedListWithCollapse: RootBlock<string, { text: string; open: boolean }> = {
//   key: 'root',
//   children: [
//     {
//       key: '1',
//       data: { text: 'Drag me', open: true },
//       children: [
//         { key: '2', data: { text: 'Or drag me', open: true } },
//         { key: '3', data: { text: 'Reorder us!', open: true } },
//       ],
//     },
//     { key: '4', data: { text: 'Drag me', open: true } },
//     { key: '5', data: { text: 'Or drag me', open: true } },
//     { key: '6', data: { text: 'Reorder us!', open: true } },
//   ],
// }

export const BasicUsage: Story = {
  render: () => {
    const props = createBlockTree(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} children={BasicBlock} />
      </div>
    )
  },
}

export const SingleSelection: Story = {
  render: () => {
    const props = createBlockTree(structuredClone(basicList))

    return (
      <div style={{ 'max-width': '60ch' }}>
        <BlockTree {...props} multiselect={false} children={BasicBlock} />
      </div>
    )
  },
}

// export const NestedBlocks: Story = {
//   render: () => {
//     const props = createBlockTree(structuredClone(nestedList))

//     return (
//       <div style={{ 'max-width': '60ch' }}>
//         <BlockTree {...props} placeholder={Placeholder} children={BasicBlockWithChildren} />
//       </div>
//     )
//   },
// }

// export const CollapsableBlocks: Story = {
//   render: () => {
//     const props = createBlockTree(structuredClone(nestedListWithCollapse))

//     return (
//       <div style={{ 'max-width': '60ch' }}>
//         <BlockTree {...props} placeholder={Placeholder}>
//           {block => (
//             <BasicBlockWithCollapse
//               block={block}
//               setOpen={open => props.updateBlock(block.key, { ...block.block, open })}
//             />
//           )}
//         </BlockTree>
//       </div>
//     )
//   },
// }
