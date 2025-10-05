import { type Component } from 'solid-js'
import { BlockTree, RootBlock } from 'src'
import { createTree } from './model'
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

  const model = createTree(root)

  let nextId = 0
  const appendBlock = () => {
    const block = {
      key: `block${nextId++}`,
      data: `Block ${nextId}`,
    }
    // const parent = 'root'
    const parent = root.children[0]?.key!
    model.onInsert({ blocks: [block], place: { parent, before: null } })
  }

  return (
    <div class={styles.container}>
      <BlockTree
        {...model}
        placeholder={() => <div class={styles.placeholder}>nothing here</div>}
        // transitionDuration={2500}
      >
        {block => (
          <div
            class={[styles.block, block.selected ? styles.selected : ''].join(' ')}
            style={block.style}
            draggable={true}
            onDragStart={block.startDrag}
          >
            <div>{block.data}</div>
            {block.children}
            <div>Footer</div>
          </div>
        )}
      </BlockTree>
      <button onClick={appendBlock}>Append block</button>
    </div>
  )
}

export default App
