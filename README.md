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

## Demo

A quick and dirty demo can be found here: https://alexanderrafferty.com/projects/solid-nest/

I plan to make a better suite of demos soon.

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
import { BlockTree, RootBlock, createBlockTree } from 'solid-nest'

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

  // This is a utility function that creates a store for the UI state
  // and the necessary event handlers to update it
  //
  // See the "State Management" section below
  const props = createBlockTree(root)

  return (
    <BlockTree {...props}>
      {/* Defines how each block in the tree should be rendered */}
      {block => (
        <div class="border rounded p-4">
          {/* Add data-drag-handle to elements that should initiate drag */}
          <div data-drag-handle class="cursor-grab">
            <p>{block.data}</p>
          </div>
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
Therefore, it does not need a `data` property.

```tsx
type RootBlock<K, T> = {
  key: K
  children?: Block<K, T>[]
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
| `selection` | `Selection<K>` | | Current selection |
| `onSelectionChange` | `EventHandler<SelectionEvent<K>>` | | Called when selection changes |
| `onInsert` | `EventHandler<InsertEvent<K, T>>` | | Called when blocks are inserted |
| `onReorder` | `EventHandler<ReorderEvent<K>>` | | Called when blocks are reordered |
| `onRemove` | `EventHandler<RemoveEvent<K>>` | | Called when blocks are removed |
| `onCopy` | `EventHandler<CopyEvent<K, T>>` | | Called when blocks are copied |
| `onCut` | `EventHandler<CutEvent<K, T>>` | | Called when blocks are cut |
| `onPaste` | `EventHandler<PasteEvent<K>>` | | Called when blocks are pasted |
| `defaultSpacing` | `number` | `12` | Default spacing between blocks (px) |
| `transitionDuration` | `number` | `200` | Animation duration (ms) |
| `dragThreshold` | `number` | `10` | Distance cursor must move (px) to start drag |
| `fixedHeightWhileDragging` | `boolean` | `false` | Fix container height during drag operations |
| `multiselect` | `boolean` | `true` | Enable multi-selection |
| `dropzone` | `Component<{}>` | | Custom dropzone component |
| `placeholder` | `Component<{ parent: K }>` | | Custom placeholder component |
| `dragContainer` | `Component<DragContainerProps<K, T>>` | | Custom drag container component |

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
| `data` | `T` | Your custom data |
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
{block => (
  <div data-drag-handle>
    <p>Some text</p>
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

### `CopyEvent`

Fired when blocks are copied (Cmd/Ctrl + C):

```tsx
type CopyEvent<K, T> = {
  blocks: Block<K, T>[]  // Blocks being copied
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
type CutEvent<K, T> = {
  blocks: Block<K, T>[]  // Blocks being cut
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

The library is unopinionated about state management, but it does provide a utility function called `createBlockTree`
which creates a store for the block tree state and a set of event handlers that update this state,
which can be directly provided to a `BlockTree` like so:

```tsx
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

**Note:** `createBlockTree` provides handlers for `onSelectionChange`, `onInsert`, `onReorder`, and `onRemove`.
If you need copy/cut/paste functionality, you'll need to implement those handlers separately.

### Additional Methods

The object returned by `createBlockTree` also includes these additional methods:

- **`toggleBlockSelected(key: K, selected: boolean)`** - Toggle a block's selection state
- **`selectBlock(key: K)`** - Select a specific block
- **`unselectBlock(key: K)`** - Unselect a specific block
- **`updateBlock(key: K, data: T)`** - Update a block's data
- **`setRoot`** - The raw `setStoreFunction`, allowing you to make arbitrary updates to the tree state

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
const DragContainer = (props: DragContainerProps<string, MyData>) => (
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
