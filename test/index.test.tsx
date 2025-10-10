import { describe, it } from 'vitest'
import { isServer, render, renderToString } from 'solid-js/web'
import { BlockTree } from 'src'

describe('BlockTree', () => {
  it('can be instantiated', () => {
    const App = () => {
      return <BlockTree root={{ key: 'root' }}>{() => <div />}</BlockTree>
    }

    if (isServer) {
      renderToString(App)
    } else {
      render(App, document.body)
    }
  })
})
