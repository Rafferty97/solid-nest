export type Vec2 = Readonly<{ x: number; y: number }>

export namespace Vec2 {
  export const Zero: Vec2 = { x: 0, y: 0 }
}

export type DragState<K> = {
  items: K[]
  offset: Vec2
  size: Vec2
  tags: string[]
}
