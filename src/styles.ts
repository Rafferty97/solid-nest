const PREFIX = 'solidnest'

export const blockClass = `${PREFIX}-block`
export const blockInnerClass = `${PREFIX}-block-inner`
export const childrenWrapperClass = `${PREFIX}-children`
export const spacerClass = `${PREFIX}-spacer`

export const durationVar = `--${PREFIX}-duration`
export const spacingVar = `--${PREFIX}-spacing`

const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
  .${childrenWrapperClass} > .${blockClass} + .${blockClass} {
    margin-top: var(${spacingVar});
  }

  .${childrenWrapperClass} > .${blockClass} + .${blockClass}[data-kind='placeholder'] {
    margin-top: 0;
  }

  .${blockClass} + .${blockClass}[data-kind='placeholder'] {
    display: none;
  }

  .${blockClass}[data-measuring] .${childrenWrapperClass} > .${spacerClass} {
    display: none;
  }
`)

let adopted = false

export function injectCSS() {
  if (typeof document === 'undefined' || adopted) return
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet]
  adopted = true
}
