export type MyBlock = {
  key: string
  data: string
  children?: MyBlock[]
}

export type CollapsableBlock = {
  key: string
  text: string
  open: boolean
  children?: CollapsableBlock[]
}
