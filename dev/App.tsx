import { createSignal, createUniqueId, type Component } from 'solid-js'
import { Block, BlockTree, CopyEvent, PasteEvent, RootBlock, createBlockTree } from 'src'
import styles from './App.module.css'

const App: Component = () => {
  const root: RootBlock<string, string> = {
    key: 'root',
    children: [
      {
        key: 'a',
        data: 'First',
      },
      {
        key: 'b',
        data: 'Second',
      },
      {
        key: 'c',
        data: 'Third',
      },
      {
        key: 'd',
        data: 'Fourth',
      },
    ],
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
          const [text, setText] = createSignal('')

          return (
            <div
              class={[styles.block, block.selected ? styles.selected : '', block.dragging ? styles.dragging : ''].join(
                ' ',
              )}
              data-drag-handle
            >
              <div class={styles.blockHeader}>
                <div>{block.data}</div>
                <input
                  type="checkbox"
                  checked={block.selected}
                  onPointerDown={ev => {
                    ev.preventDefault()
                    ev.stopPropagation()
                  }}
                  onChange={ev => props.toggleBlockSelected(block.key, ev.currentTarget.checked)}
                />
              </div>
              <input
                type="text"
                placeholder="Type something"
                onPointerDown={ev => ev.stopPropagation()}
                value={text()}
                onChange={ev => setText(ev.currentTarget.value)}
              />
              {block.children}
              <div>Footer</div>
            </div>
          )
        }}
      </BlockTree>
      <button style={{ 'margin-top': '20px' }} onClick={appendBlock}>
        Append block
      </button>
    </div>
  )
}

export default App
