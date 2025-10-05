<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-nest&background=tiles&project=%20" alt="solid-nest">
</p>

# solid-nest

[![npm version](https://img.shields.io/npm/v/solid-nest.svg?style=flat)](https://www.npmjs.com/package/solid-nest)
[![bundle size](https://img.shields.io/bundlephobia/minzip/solid-nest?style=flat)](https://bundlephobia.com/package/solid-nest)
[![license](https://img.shields.io/npm/l/solid-nest.svg?style=flat)](https://github.com/Rafferty97/solid-nest/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=flat&logo=pnpm)](https://pnpm.io/)

A powerful SolidJS library for building hierarchical block-based UIs with drag-and-drop, multi-selection, and smooth animations.

Care has been taken to ensure everything "just works" with minimal configuration or intervention.

## Features

- **Tiny bundle size** - Only ~5kB minified + gzipped!
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
          <p>{block.data}</p>
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

The `BlockTree` component accepts various props to configure its behaviour.

The only **required** props are `root` and `children`, though you'll almost certainly want to implement
most if not all of the event handlers too, otherwise the block tree won't be editable.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `root` | `RootBlock<K, T>` | *required* | The root block of the tree |
| `children` | `Component<BlockProps<K, T>>` | *required* | Render function for blocks |
| `selection` | `K[]` | | `[]` | Array of currently selected block keys |
| `onSelectionChange` | `EventHandler<SelectionEvent<K>>` | | Called when selection changes |
| `onInsert` | `EventHandler<InsertEvent<K, T>>` | | Called when blocks are inserted |
| `onReorder` | `EventHandler<ReorderEvent<K>>` | | Called when blocks are reordered |
| `onRemove` | `EventHandler<RemoveEvent<K>>` | | Called when blocks are removed |
| `defaultSpacing` | `number` | `12` | Default spacing between blocks (px) |
| `transitionDuration` | `number` | `200` | Animation duration (ms) |
| `fixedHeightWhileDragging` | `boolean` | `false` | Fix container height during drag operations |
| `multiselect` | `boolean` | `true` | Enable multi-selection |
| `dropzone` | `Component<{}>` | | Custom dropzone component |
| `placeholder` | `Component<{ parent: K }>` | | Custom placeholder component |

### Block Render Props

The `BlockTree` render function receives these props for each block:

| Prop | Type | Description |
|------|------|-------------|
| `key` | `K` | Block's unique key |
| `data` | `T` | Your custom data |
| `selected` | `boolean` | Whether block is currently selected |
| `dragging` | `boolean` | Whether block is being dragged |
| `startDrag` | `(ev: MouseEvent) => void` | Call this to initiate drag operation |
| `children` | `JSX.Element` | Rendered child blocks |

It's perfectly fine not to render the `children` in the render function, or only conditionally render it.
This will prevent the user from inserting any new child blocks via drag-and-drop, though any existing children
will remain unless programmatically removed.

## Events

The `BlockTree` component emits various kinds of events in response to drag-and-drop and other interactions.
Keep in mind that the state of the block tree won't actually update unless these events are listened to,
and the state is updated accordingly. In other words, `BlockTree` is a controlled component and state management
is left up to the consumer.

### Event handler

The `EventHandler` type referenced in the `BlockTree` props table is simply a callback function:

```ts
export type EventHandler<E> = (event: E) => void
```

### `SelectionEvent`

Fired when blocks are selected or deselected.

```tsx
type SelectionEvent = {
  key?: K              // The block that was clicked
  mode: SelectionMode  // The selection mode (explained below)
  before: K[]          // Keys selected before the event
  after: K[]           // Keys selected after the event
}
```

#### Selection modes

The `mode` property indicates how the selection was modified:

| Mode | Value | Trigger | Behavior |
|------|-------|---------|----------|
| **Set** | `'set'` | Click (no modifiers) | Selects the clicked block, deselects all others |
| **Toggle** | `'toggle'` | Cmd/Ctrl + Click | Toggles the clicked block's selection state |
| **Range** | `'range'` | Shift + Click | Selects all blocks between the first selected block and the clicked block (at the same nesting level) |
| **Deselect** | `'deselect'` | Focus lost | Deselects all blocks |

### `InsertEvent`

Fired when new blocks are inserted.

```tsx
type InsertEvent = {
  blocks: Block<K, T>[]  // Blocks being inserted
  place: {
    parent: K            // Parent block key
    before: K | null     // Insert before this key, or `null` for end
  }
}
```

### `ReorderEvent`

Fired when blocks are reordered via drag-and-drop:

```tsx
type ReorderEvent = {
  keys: K[]           // Keys of blocks being moved
  place: {
    parent: K         // Parent block key
    before: K | null  // Insert before this key, or `null` for end
  }
}
```

### `RemoveEvent`

Fired when blocks are removed (e.g., via the Delete key):

```tsx
type RemoveEvent = {
  keys: K[]  // Keys of blocks being removed
}
```

## State Management

The library is unopinionated about state management, but it does provide a utility function called `createBlockTree`
which creates a store for the block tree state and a set of event handlers that update this state,
which can be directly provided to a `BlockTree` like so:

```
import { createUniqueId } from 'solid-js'

const props = createBlockTree({ key: 'root', children: [] })

const appendBlock = () => {
  const key = createUniqueId()
  const block = { key, data: `Block ${key}` }
  props.onInsert({
    blocks: [block],
    place: { parent: 'root', before: null }
  })
}

return (
  <div>
    <BlockTree {...props}>
      {block => <BlockUI {...block} />}
    </BlockTree>
    <button onClick={appendBlock}>Add block</button>
  </div>
)
```

See [`createBlockTree.ts`](https://github.com/Rafferty97/solid-nest/blob/main/src/createBlockTree.ts) to get an idea
for how you might implement your own state management system or integrate your existing one with `solid-nest`.

## Tag-Based Constraints

Control which blocks can be nested where using tags. Every block can be assigned an optional `tag`,
and blocks can be configured to only accept child blocks with a given set of tags, with the `accepts` property.

*Note that blocks without a `tag` will be accepted by any parent block.*

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
  accepts: ['container', 'item'],  // Accepts 'container' and 'item' blocks
}
```

## Custom placeholder and dropzone

A placeholder is shown when a block has no children. By default, it just an empty `<div>` which takes up no space, but it can be changed to a custom component.
The component receives the `key` of the block it belongs to, allowing you to use different UIs for different blocks.

```tsx
const Placeholder = ({ parent }) => (
  <div class="empty-state">
    No items in {parent}
  </div>
)

<BlockTree root={root()} placeholder={Placeholder}>
  {/* ... */}
</BlockTree>
```

The dropzone visually shows where the currently dragged block(s) will be placed when the mouse is released.
By default, it is a semi-transparent black rectangle, but this too can be customised by providing a custom component.

*Note: You'll probably want to give this component a `height` of `100%` to ensure it fills the available space.*

```tsx
const Dropzone = () => (
  <div class="custom-dropzone" style={{ height: '100%' }}>
    Drop here
  </div>
)

<BlockTree root={root()} dropzone={Dropzone}>
  {/* ... */}
</BlockTree>
```

## Keyboard Shortcuts

The `BlockTree` component has built-in support for the following keyboard shortcuts:
- **Delete** - Remove selected blocks
- **Cmd/Ctrl + C** - Copy selected blocks (coming soon)
- **Cmd/Ctrl + V** - Paste blocks (coming soon)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
