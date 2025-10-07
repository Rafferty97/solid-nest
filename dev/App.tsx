import { createUniqueId, type Component } from 'solid-js'
import { Block, BlockTree, CopyEvent, PasteEvent, RootBlock, createBlockTree } from 'src'
import styles from './App.module.css'

const App: Component = () => {
  const root: RootBlock<string, string> = {
    key: 'root',
    children: [
      {
        key: 'a',
        data: 'First',
        tag: 'one',
        accepts: ['two'],
      },
      {
        key: 'b',
        data: 'Second',
        tag: 'one',
        accepts: ['two'],
      },
      {
        key: 'c',
        data: 'Third',
        tag: 'two',
        accepts: ['one'],
      },
      {
        key: 'd',
        data: 'Fourth',
        tag: 'two',
        accepts: ['one'],
      },
    ],
    accepts: ['one', 'two'],
  }

  const props = createBlockTree(root)

  const appendBlock = () => {
    const key = createUniqueId()
    const block = { key, data: `Block ${key}` }
    props.onInsert({
      blocks: [block],
      place: { parent: 'root', before: null },
    })
  }

  const onCopy = (ev: CopyEvent<string, string>) => {
    ev.data.setData('application/x-blocks', JSON.stringify(ev.blocks))
  }

  const onCut = (ev: CopyEvent<string, string>) => {
    ev.data.setData('application/x-blocks', JSON.stringify(ev.blocks))
    props.onRemove({ keys: ev.blocks.map(block => block.key) })
  }

  const onPaste = (ev: PasteEvent<string>) => {
    const place = ev.place
    const blocks = JSON.parse(ev.data.getData('application/x-blocks')) as Block<string, string>[]
    const process = (block: Block<string, string>) => {
      block.key = createUniqueId()
      block.children?.forEach(process)
    }
    blocks.forEach(process)
    props.onInsert({ blocks, place })
  }

  return (
    <div class={styles.container}>
      <BlockTree
        {...props}
        onCopy={onCopy}
        onCut={onCut}
        onPaste={onPaste}
        placeholder={() => <div class={styles.placeholder}>nothing here</div>}
      >
        {block => {
          // console.log('render block', block.key)
          return (
            <div
              class={[styles.block, block.selected ? styles.selected : '', block.dragging ? styles.dragging : ''].join(
                ' ',
              )}
              draggable={true}
              onDragStart={block.startDrag}
            >
              <div>{block.data}</div>
              {block.children}
              <div>Footer</div>
            </div>
          )
        }}
      </BlockTree>
      <button onClick={appendBlock}>Append block</button>
    </div>
  )
}

export default App
