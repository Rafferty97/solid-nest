import { describe, expect, it } from 'vitest'
import { isServer } from 'solid-js/web'

describe('environment', () => {
  it('runs on server', () => {
    expect(typeof window).toBe('undefined')
    expect(isServer).toBe(true)
  })
})
