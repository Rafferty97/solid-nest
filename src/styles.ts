const PREFIX = 'solidnest'

export const blockClass = `${PREFIX}-block`
export const spacerClass = `${PREFIX}-spacer`

export const durationVar = `--${PREFIX}-duration`
export const spacingVar = `--${PREFIX}-spacing`

const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
  .${blockClass}[data-kind="container"] > .${blockClass} + .${blockClass} {
    margin-top: var(${spacingVar});
  }

  .${blockClass}[data-kind="container"] > .${blockClass} + .${blockClass}[data-kind='placeholder'] {
    display: none;
  }

  .${blockClass}[data-measuring] .${spacerClass} {
    display: none;
  }
`)

let adopted = false

export function injectCSS() {
  if (typeof document === 'undefined' || adopted) return
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet]
  adopted = true
}
