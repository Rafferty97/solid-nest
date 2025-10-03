export function getModifierKey() {
  const isMac = navigator.platform.startsWith('Mac') || navigator.platform === 'iPhone'
  return isMac ? ('metaKey' as const) : ('ctrlKey' as const)
}

export const modifierKey = getModifierKey()
