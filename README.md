<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-nest&background=tiles&project=%20" alt="solid-nest">
</p>

# solid-nest

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

A powerful SolidJS library for building hierarchical block-based UIs with drag-and-drop, multi-selection, and smooth animations.

Care has been taken to ensure everything "just works" with minimal configuration or intervention.

## Features

- **Drag-and-drop** - Intuitive block reordering with visual feedback
- **Unlimited nesting** - Create deeply nested hierarchies
- **Multi-selection** - Select and move multiple blocks at once
- **Smooth animations** - Performant transitions powered by SolidJS
- **Copy and paste** - Duplicate blocks with keyboard shortcuts
- **Headless UI** - Bring your own styles and components
- **Tag-based constraints** - Control which blocks can be nested where

## Installation

```bash
npm i solid-nest
# or
yarn add solid-nest
# or
pnpm add solid-nest
```

## Quick Start

```tsx
import { BlockTree, RootBlock } from 'solid-nest'
import { createTree } from './model' // See "State Management" below

function App() {
  // Define your block structure
  const root: RootBlock<string, string> = {
    key: 'root',
    children: [
      { key: 'a', data: 'First block' },
      { key: 'b', data: 'Second block' },
      { key: 'c', data: 'Third block' },
    ],
  }

  // Create a model to manage state
  const model = createTree(root)

  return (
    <BlockTree {...model}>
      {block => (
        <div
          class="border rounded p-4"
          draggable={true}
          onDragStart={block.startDrag}
        >
          <p>{block.data}<p>
          <div class="mt-4">
            {block.children}
          </div>
        </div>
      )}
    </BlockTree>
  )
}
```

## Core Concepts

### BlockTree

The `BlockTree` is the primary component exposed by this library, and is used as follows:

```tsx
<BlockTree
  // The only required prop - the root block of the tree
  root={root}
  // The currently selected blocks
  selection={['key1', 'key2']}
  // Various event handlers; because this is a controlled component,
  // the state of the tree won't update unless these are handled
  onSelectionChange={event => {}}
  onInsert={event => {}}
  onReorder={event => {}}
  onRemove={event => {}}
  // ...various additional configuration props, documented below
>
  {/* A function to render each block in the tree */}
  {block => <YourBlockComponent {...block} />}
</BlockTree>
```

### Blocks

Blocks are the fundamental building units of your tree. The essential properties are:
- **`key`** - A unique identifier (must be unique when converted to string)
- **`data`** - Your custom data of any type
- **`children`** - Optional array of nested blocks

In addition, there are several optional properties offering further customisation:
- **`tag`** - Optional tag for drag-and-drop constraints
- **`accepts`** - Array of tags this block accepts as children
- **`spacing`** - Custom spacing between children (in pixels)

```tsx
type Block<K, T> = {
  // Core properties
  key: K
  data: T
  children?: Block<K, T>[]

  // Additional configuration
  tag?: string
  accepts?: string[]
  spacing?: number
}
```

### Root Block

The root block is the top-level container, and is not actually rendered in the UI.
Therefore, it does not need a `data` property, though `children` is required (or else nothing would render).

```tsx
type RootBlock<K, T> = {
  key: K
  children: Block<K, T>[]
  tag?: string
  accepts?: string[]
  spacing?: number
}
```

## API Reference

### BlockTree Props

The `BlockTree` component accepts various props to configure its behaviour:

*FIXME: Change this to a table*

```tsx
<BlockTree
  root={root}                          // Required: Root block
  selection={['key1', 'key2']}         // Optional: Selected block keys
  onSelectionChange={event => {}}      // Optional: Selection change handler
  onInsert={event => {}}               // Optional: Block insertion handler
  onReorder={event => {}}              // Optional: Block reorder handler
  onRemove={event => {}}               // Optional: Block removal handler
  dropzone={DropzoneComponent}         // Optional: Custom dropzone
  placeholder={PlaceholderComponent}   // Optional: Custom placeholder
  defaultSpacing={12}                  // Optional: Default spacing (px)
  transitionDuration={200}             // Optional: Animation duration (ms)
  fixedHeightWhileDragging={false}     // Optional: Fix height during drag
  multiselect={true}                   // Optional: Enable multi-selection
>
  {block => <YourBlockComponent {...block} />}
</BlockTree>
```

### Block Render Props

The `BlockTree` render function receives these props for each block:

*FIXME: Change this to a table*

```tsx
{
  key: K                              // Block's unique key
  data: T                             // Your custom data
  selected: boolean                   // Whether block is selected
  dragging: boolean                   // Whether block is being dragged
  style?: JSX.CSSProperties           // Computed animation styles
  children: JSX.Element               // Rendered child blocks
  startDrag: (ev: MouseEvent) => void // Call to initiate drag
}
```

## Events

### SelectionEvent

Fired when blocks are selected or deselected:

```tsx
type SelectionEvent = {
  key?: K              // The block that triggered the event
  mode: SelectionMode  // 'set' | 'toggle' | 'range' | 'deselect'
  before: K[]          // Keys selected before the event
  after: K[]           // Keys selected after the event
}
```

### InsertEvent

Fired when new blocks are inserted:

```tsx
type InsertEvent = {
  blocks: Block<K, T>[]  // Blocks being inserted
  place: {
    parent: K            // Parent block key
    before: K | null     // Insert before this key, or null for end
  }
}
```

### ReorderEvent

Fired when blocks are reordered via drag-and-drop:

```tsx
type ReorderEvent = {
  keys: K[]     // Keys of blocks being moved
  place: {
    parent: K   // New parent block key
    before: K | null
  }
}
```

### RemoveEvent

Fired when blocks are removed (e.g., via the Delete key):

```tsx
type RemoveEvent = {
  keys: K[]  // Keys of blocks being removed
}
```

## State Management

The library is unopinionated about state management. Here's a reference implementation using SolidJS stores:

*FIXME: Expand the code below into a full working example, but refactor out common logic to keep it as terse as possible. Simplify it if at all possible without sacrificing the educational benefit of it*

```tsx
import { createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

export function createTree<K, T>(init: RootBlock<K, T>) {
  const [root, setRoot] = createStore(init)
  const [selection, setSelection] = createSignal<K[]>([])

  return {
    root,
    selection: () => selection(),
    
    onSelectionChange(event) {
      setSelection(event.after)
    },

    onInsert(event) {
      setRoot(produce(root => {
        // Find parent and insert blocks
        const insert = (node: Block<K, T> | RootBlock<K, T>) => {
          if (node.key === event.place.parent) {
            node.children ??= []
            const index = event.place.before !== null
              ? node.children.findIndex(c => c.key === event.place.before)
              : -1
            node.children.splice(
              index < 0 ? node.children.length : index,
              0,
              ...event.blocks
            )
            return true
          }
          return node.children?.some(insert) ?? false
        }
        insert(root)
      }))
    },

    onReorder(event) {
      setRoot(produce(root => {
        const blocks: Block<K, T>[] = []
        
        // Remove blocks from current location
        const remove = (node: Block<K, T> | RootBlock<K, T>) => {
          if (!node.children) return
          node.children = node.children.filter(child => {
            if (event.keys.includes(child.key)) {
              blocks.push(child)
              return false
            }
            return true
          })
          node.children.forEach(remove)
        }
        remove(root)
        
        // Insert at new location (same logic as onInsert)
        // ... (see full implementation in dev/model.ts)
      }))
    },

    onRemove(event) {
      setRoot(produce(root => {
        const remove = (node: Block<K, T> | RootBlock<K, T>) => {
          if (!node.children) return
          node.children = node.children.filter(
            child => !event.keys.includes(child.key)
          )
          node.children.forEach(remove)
        }
        remove(root)
      }))
    },
  }
}
```

## Tag-Based Constraints

Control which blocks can be nested where using tags:

```tsx
const root: RootBlock<string, string> = {
  key: 'root',
  children: [
    {
      key: 'container',
      data: 'Container',
      tag: 'container',
      accepts: ['item'],  // Only accepts 'item' blocks
    },
    {
      key: 'item1',
      data: 'Item',
      tag: 'item',
      accepts: [],  // Accepts no children
    },
  ],
  accepts: ['container', 'item'],
}
```

## Custom Placeholder

A placeholder is shown when a block has no children. By default, it just an empty `<div>` which takes up no space, but it can be changed to a custom component.
The component recieves the `key` of the block it belongs to, allowing you to use different UIs for different blocks.

```tsx
<BlockTree
  {...model}
  placeholder={({ parent }) => (
    <div class="empty-state">
      No items in {parent}
    </div>
  )}
>
  {/* ... */}
</BlockTree>
```

## Custom Dropzone

The dropzone visually shows where the currently dragged block(s) will be placed when the mouse is released.
By default, it is a semi-transparent black rectangle, but this too can be customised by providing a custom component.

*Note: You'll probably want to give this component a `height` of `100%` to ensure it fills the available space.*

```tsx
<BlockTree
  {...model}
  dropzone={() => (
    <div class="custom-dropzone">
      Drop here
    </div>
  )}
>
  {/* ... */}
</BlockTree>
```

### Keyboard Shortcuts

Built-in keyboard/mouse support:

- **Click** - Select block (deselects others)
- **Cmd/Ctrl + Click** - Toggle block selection
- **Shift + Click** - Select range of blocks
- **Delete** - Remove selected blocks
- **Cmd/Ctrl + C** - Copy selected blocks (coming soon)
- **Cmd/Ctrl + V** - Paste blocks (coming soon)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
