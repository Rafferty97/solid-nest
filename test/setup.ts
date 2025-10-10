import '@testing-library/jest-dom/vitest'

// Mock adoptedStyleSheets property on Document and ShadowRoot
Object.defineProperty(Document.prototype, 'adoptedStyleSheets', {
  get() {
    return this._adoptedStyleSheets || []
  },
  set(styleSheets) {
    this._adoptedStyleSheets = styleSheets
  },
  configurable: true,
})

Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
  get() {
    return this._adoptedStyleSheets || []
  },
  set(styleSheets) {
    this._adoptedStyleSheets = styleSheets
  },
  configurable: true,
})

// Mock CSSStyleSheet constructor
global.CSSStyleSheet = class CSSStyleSheet {
  cssRules: any[] = []
  rules: any[] = []
  ownerRule: any = null
  ownerNode: any = null
  parentStyleSheet: any = null
  href: string | null = null
  title = ''
  media: any = {
    mediaText: '',
    length: 0,
    item: () => null,
    deleteMedium: () => {},
    appendMedium: () => {},
  }
  disabled = false
  type = 'text/css'

  constructor() {}

  replaceSync() {
    return
  }

  replace() {
    return Promise.resolve(this)
  }

  insertRule() {
    return 0
  }

  deleteRule() {}

  addRule() {
    return -1
  }

  removeRule() {}
} as any
