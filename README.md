<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-nest&background=tiles&project=%20" alt="solid-nest">
</p>

# solid-nest

[![npm version](https://img.shields.io/npm/v/solid-nest.svg?style=flat)](https://www.npmjs.com/package/solid-nest)
[![bundle size](https://img.shields.io/bundlephobia/minzip/solid-nest?style=flat)](https://bundlephobia.com/package/solid-nest)
[![license](https://img.shields.io/npm/l/solid-nest.svg?style=flat)](https://github.com/Rafferty97/solid-nest/blob/main/LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=flat&logo=pnpm)](https://pnpm.io/)

A powerful SolidJS library for building hierarchical block-based UIs with drag-and-drop, multi-selection, and *smooth* animations.

Care has been taken to ensure everything "just works" with minimal configuration or intervention.

__Demo:__ https://alexanderrafferty.com/projects/solid-nest/

## Features

- **Tiny bundle size** - Only ~6kB minified + gzipped!
- **Drag-and-drop** - Intuitive block reordering with visual feedback
- **Unlimited nesting** - Create deeply nested hierarchies
- **Multi-selection** - Select and move multiple blocks at once
- **Copy/paste** - Supports copy, cut and paste callbacks
- **Smooth animations** - Performant transitions with no jank
- **(Nearly) Headless UI** - Bring your own styles and components*
- **Tag-based constraints** - Control which blocks can be nested where
- **Mobile support** - Supports both mouse and touch events

_*Some minor styling is provided for convenience, but it's easy to override_

### Roadmap

Some features I plan to add in the future include:
- Rectangular selection

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
import { BlockTree, createBlockTree } from 'solid-nest'

type MyBlock = {
  id: string
  text: string
  children?: MyBlock[]
}

function App() {
  // Define your block structure
  const root: MyBlock = {
    id: 'root',
    text: 'Root',
    children: [
      { id: 'a', text: 'First block' },
      { id: 'b', text: 'Second block' },
      { id: 'c', text: 'Third block' },
    ],
  }

  return (
    <BlockTree
      root={root}
      getKey={block => block.id}
      getChildren={block => block.children}
    >
      {/* Defines how each block in the tree should be rendered */}
      {props => (
        <div class="border rounded p-4">
          {/* Add data-drag-handle to elements that should initiate drag */}
          <div data-drag-handle class="cursor-grab">
            <p>{props.block.text}</p>
          </div>
          <div class="mt-4">
            {props.children}
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
  // The root block of the tree
  root={root}
  // Functions to extract data from blocks
  getKey={block => block.id}
  getChildren={block => block.children}
  getOptions={block => ({ spacing: 16, tag: 'item' })}
  // The currently selected blocks
  selection={{ blocks: ['key1', 'key2'] }}
  // Various event handlers; because this is a controlled component,
  // the state of the tree won't update unless these are handled
  onSelectionChange={event => {}}
  onInsert={event => {}}
  onReorder={event => {}}
  onRemove={event => {}}
  // ...various additional events and configuration props, documented below
>
  {/* A function to render each block in the tree */}
  {props => <YourBlockComponent {...props} />}
</BlockTree>
```

### Blocks

Blocks are the fundamental building units of your tree. `BlockTree` doesn't require your blocks to have a specific shape. Instead, you provide functions to extract the necessary information:

- **`getKey`** - Function that returns a unique identifier for each block
- **`getChildren`** - Function that returns the child blocks (optional)
- **`getOptions`** - Function that returns configuration options (optional)

Your block type can be any shape you want:

```tsx
type MyBlock = {
  id: string
  text: string
  children?: MyBlock[]
}

<BlockTree
  root={root}
  getKey={block => block.id}
  getChildren={block => block.children}
>
  {/* ... */}
</BlockTree>
```

Notably, child blocks don't have to be physically nested inside their parent blocks. For example, blocks might simply store the keys of its children,
but instead rely on the `getChildren` function to fetch the child blocks from somewhere else.

### Block Options

The `getOptions` function can return configuration for each block:

```tsx
type BlockOptions = {
  spacing?: number    // Spacing between children (in pixels)
  tag?: string        // Tag for drag-and-drop constraints
  accepts?: string[]  // Array of tags this block accepts as children
}
```

Example:

```tsx
<BlockTree
  root={root}
  getKey={block => block.id}
  getChildren={block => block.children}
  getOptions={block => ({
    spacing: block.type === 'container' ? 20 : 12,
    tag: block.type,
    accepts: block.type === 'container' ? ['item'] : []
  })}
>
  {/* ... */}
</BlockTree>
```

## API Reference

### BlockTree Props

The `BlockTree` component accepts various props to configure its behaviour.

The only **required** props are `root` and `children`, though you'll almost certainly want to implement
most if not all of the event handlers too, otherwise the block tree won't be editable.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `root` | `R` | *required* | The root block of the tree |
| `children` | `Component<BlockProps<K, T>>` | *required* | Render function for blocks |
| `getKey` | `(block: T \| R) => K` | *required* | Function to get a block's unique key |
| `getChildren` | `(block: T \| R) => T[] \| null \| undefined` | | Function to get a block's children |
| `getOptions` | `(block: T \| R) => BlockOptions \| null \| undefined` | | Function to get a block's options |
| `selection` | `Selection<K>` | | Current selection |
| `onSelectionChange` | `(event: SelectionEvent<K>) => void` | | Called when selection changes |
| `onInsert` | `EventHandler<InsertEvent<K, T>>` | | Called when blocks are inserted |
| `onReorder` | `EventHandler<ReorderEvent<K>>` | | Called when blocks are reordered |
| `onRemove` | `EventHandler<RemoveEvent<K>>` | | Called when blocks are removed |
| `onCopy` | `EventHandler<CopyEvent<T>>` | | Called when blocks are copied |
| `onCut` | `EventHandler<CutEvent<T>>` | | Called when blocks are cut |
| `onPaste` | `EventHandler<PasteEvent<K>>` | | Called when blocks are pasted |
| `transitionDuration` | `number` | `200` | Animation duration (ms) |
| `dragThreshold` | `number` | `10` | Distance cursor must move (px) to start drag |
| `fixedHeightWhileDragging` | `boolean` | `false` | Fix container height during drag operations |
| `multiselect` | `boolean` | `true` | Enable multi-selection |
| `dropzone` | `Component<{}>` | | Custom dropzone component |
| `placeholder` | `Component<{ parent: K }>` | | Custom placeholder component |
| `dragContainer` | `Component<DragContainerProps<T>>` | | Custom drag container component |

### Selections

A `Selection` can either be:
- A set of blocks (when `blocks` has a value)
- A place between blocks, like an insertion cursor (when `place` has a value)
- Empty (when neither property has a value)

It is not valid for both properties to have a value at the same time.

```ts
type Selection<K> = {
  blocks?: K[]
  place?: Place<K>
}
```

### Block Render Props

The `BlockTree` render function receives these props for each block:

| Prop | Type | Description |
|------|------|-------------|
| `key` | `K` | Block's unique key |
| `block` | `T` | The block data |
| `selected` | `boolean` | Whether block is currently selected |
| `dragging` | `boolean` | Whether block is being dragged |
| `children` | `JSX.Element` | Rendered child blocks |

It's perfectly fine not to render the `children` in the render function, or only conditionally render it.
This will prevent the user from inserting any new child blocks via drag-and-drop, though any existing children
will remain unless programmatically removed.

### Making blocks draggable

To make an element draggable, add the `data-drag-handle` attribute to it. When a user clicks and drags an element with this attribute, it will initiate a drag operation for the block. The entire block can be made draggable by adding this attribute to the root element.

If there are any elements inside the block that should be able to take focus, like `input` elements, ensure you add an event handler for the `onPointerDown` event that calls `event.stopPropagation`, otherwise focus will be immediately lost and the block itself will become selected.

```tsx
{props => (
  <div data-drag-handle>
    <p>{props.block.text}</p>
    <input onPointerDown={ev => ev.stopPropagation()} />
  </div>
)}
```

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

Fired when blocks are selected or deselected. This is a discriminated union with three possible variants:

```tsx
type SelectionEvent<K> =
  | {
      kind: 'blocks'     // A block was clicked
      key: K             // The block that was clicked
      mode: SelectionMode // The selection mode (explained below)
      blocks: K[]        // The new set of selected blocks
    }
  | {
      kind: 'place'      // A gap between blocks was clicked
      place: Place<K>    // The insertion point that was clicked
    }
  | {
      kind: 'deselect'   // Focus was lost from the block tree
    }
```

#### Selection modes

The `mode` property indicates how the selection was modified when a block was clicked:

| Mode | Value | Trigger | Behavior |
|------|-------|---------|----------|
| **Set** | `'set'` | Click (no modifiers) | Selects the clicked block, deselects all others |
| **Toggle** | `'toggle'` | Cmd/Ctrl + Click | Toggles the clicked block's selection state |
| **Range** | `'range'` | Shift + Click | Selects all blocks between the first selected block and the clicked block (at the same nesting level) |

### `InsertEvent`

Fired when new blocks are inserted.

```tsx
type InsertEvent<K, T> = {
  blocks: T[]          // Blocks being inserted
  place: {
    parent: K          // Parent block key
    before: K | null   // Insert before this key, or `null` for end
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

### `CopyEvent`

Fired when blocks are copied (Cmd/Ctrl + C):

```tsx
type CopyEvent<T> = {
  blocks: T[]            // Blocks being copied
  data: DataTransfer     // Clipboard data transfer object
}
```

You can use the `data` object to set clipboard data in any format you need:

```tsx
onCopy={(event) => {
  const json = JSON.stringify(event.blocks)
  event.data.setData('application/json', json)
  event.data.setData('text/plain', `Copied ${event.blocks.length} blocks`)
}}
```

### `CutEvent`

Fired when blocks are cut (Cmd/Ctrl + X):

```tsx
type CutEvent<T> = {
  blocks: T[]            // Blocks being cut
  data: DataTransfer     // Clipboard data transfer object
}
```

Similar to `CopyEvent`, but typically you'll also want to remove the blocks after cutting.

### `PasteEvent`

Fired when data is pasted (Cmd/Ctrl + V):

```tsx
type PasteEvent<K> = {
  place: Place<K>     // Where the data should be pasted
  data: DataTransfer  // Clipboard data transfer object
}
```

You'll need to parse the clipboard data and insert the blocks:

```tsx
onPaste={(event) => {
  const json = event.data.getData('application/json')
  if (json) {
    const blocks = JSON.parse(json)
    // Insert blocks at `event.place`
  }
}}
```

## State Management

`BlockTree` is a controlled component, meaning you're responsible for managing the state of your blocks. The component provides event handlers that tell you when changes occur, but you need to update your state accordingly.

Here's a basic example of managing state manually:

```tsx
import { createSignal } from 'solid-js'
import { BlockTree } from 'solid-nest'

type MyBlock = {
  id: string
  text: string
  children?: MyBlock[]
}

function App() {
  const [root, setRoot] = createSignal<MyBlock>({
    id: 'root',
    text: 'Root',
    children: []
  })
  
  const [selection, setSelection] = createSignal<{ blocks?: string[] }>({})

  const handleReorder = (event: ReorderEvent<string>) => {
    // Update your state to reflect the reordering
    // Implementation depends on your state structure
  }

  return (
    <BlockTree
      root={root()}
      getKey={block => block.id}
      getChildren={block => block.children}
      selection={selection()}
      onSelectionChange={event => {
        if (event.kind === 'blocks') {
          setSelection({ blocks: event.blocks })
        } else if (event.kind === 'deselect') {
          setSelection({})
        }
      }}
      onReorder={handleReorder}
    >
      {props => (
        <div data-drag-handle>
          {props.block.text}
          <div>{props.children}</div>
        </div>
      )}
    </BlockTree>
  )
}
```

For more complex state management needs, you may want to use SolidJS stores or integrate with your existing state management solution. See the [examples in the repository](https://github.com/Rafferty97/solid-nest/tree/main/stories) for more detailed implementations.

## Tag-Based Constraints

Control which blocks can be nested where using tags. Tags are configured via the `getOptions` function.

*Note that blocks without a `tag` will be accepted by any parent block.*

```tsx
type MyBlock = {
  id: string
  type: 'container' | 'item'
  text: string
  children?: MyBlock[]
}

const root: MyBlock = {
  id: 'root',
  type: 'container',
  text: 'Root',
  children: [
    {
      id: 'container',
      type: 'container',
      text: 'Container',
      children: [],
    },
    {
      id: 'item1',
      type: 'item',
      text: 'Item',
    },
  ],
}

<BlockTree
  root={root}
  getKey={block => block.id}
  getChildren={block => block.children}
  getOptions={block => ({
    tag: block.type,
    accepts: block.type === 'container' ? ['item'] : []
  })}
>
  {/* ... */}
</BlockTree>
```

## Custom components

To further customise the look and feel of a `BlockTree`, the following components can be replaced with a custom implementation:
- `Placeholder` - Shown when a block has no children
- `Dropzone` - Shows where the dragged block(s) will be moved to when the mouse is released
- `DragContainer` - Wraps the dragged component

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

The drag container wraps the dragged block(s) during a drag operation. By default, it creates a stacked visual effect when multiple blocks are selected, showing up to 3 blocks with a slight offset to indicate multiple items are being dragged. The component receives the blocks being dragged and the rendered children.

```tsx
const DragContainer = (props: DragContainerProps<MyBlock>) => (
  <div class="custom-drag-container">
    {props.children}
    <Show when={props.blocks.length > 1}>
      <span class="badge">{props.blocks.length} items</span>
    </Show>
  </div>
)

<BlockTree root={root()} dragContainer={DragContainer}>
  {/* ... */}
</BlockTree>
```

## Keyboard Shortcuts

The `BlockTree` component has built-in support for the following keyboard shortcuts:
- **Delete** - Remove selected blocks
- **Cmd/Ctrl + C** - Copy selected blocks
- **Cmd/Ctrl + X** - Cut selected blocks
- **Cmd/Ctrl + V** - Paste blocks

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
