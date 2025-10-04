import { isServer } from 'solid-js/web'
import { describe, expect, it } from 'vitest'

describe('environment', () => {
  it('runs on client', () => {
    expect(typeof window).toBe('object')
    expect(isServer).toBe(false)
  })
})
