import { describe, it, expect } from 'vitest'

import { ENGINE_VERSION } from '@geaac/engine'

describe('engine version', () => {
  it('is exposed as a non-empty string', () => {
    expect(typeof ENGINE_VERSION).toBe('string')
    expect(ENGINE_VERSION.length).toBeGreaterThan(0)
  })
})
