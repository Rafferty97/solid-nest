export type Vec2 = Readonly<{ x: number; y: number }>

export type DragState<K> = {
  items: K[]
  offset: Vec2
  size: Vec2
  tags: string[]
}
