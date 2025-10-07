import { createUniqueId, type Component } from 'solid-js'
import { BlockTree, RootBlock, createBlockTree } from 'src'
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

  return (
    <div class={styles.container}>
      <BlockTree
        {...props}
        placeholder={() => <div class={styles.placeholder}>nothing here</div>}
        // transitionDuration={2500
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
